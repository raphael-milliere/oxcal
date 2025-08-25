import { describe, it, expect, beforeAll, vi } from 'vitest';
import { 
  generateSuggestions, 
  formatSuggestionsForDisplay,
  getSuggestionHTML 
} from './suggestions.js';
import { loadTermsData } from '../data/termService.js';

// Mock fetch for testing
global.fetch = async (url) => {
  if (url === '/terms.json') {
    const mockData = {
      terms: [
        {
          year: "2024-25",
          michaelmas: { week1: { start: "2024-10-13", end: "2024-10-19" } },
          hilary: { week1: { start: "2025-01-19", end: "2025-01-25" } },
          trinity: { week1: { start: "2025-04-27", end: "2025-05-03" } }
        },
        {
          year: "2025-26",
          michaelmas: { week1: { start: "2025-10-12", end: "2025-10-18" } }
        }
      ]
    };
    return {
      ok: true,
      json: async () => mockData
    };
  }
  throw new Error(`Unexpected fetch URL: ${url}`);
};

// Mock current date for consistent testing
const OriginalDate = Date;
const mockDate = new OriginalDate('2024-11-15');
vi.spyOn(global, 'Date').mockImplementation(function(...args) {
  if (args.length === 0) {
    return mockDate;
  }
  return new OriginalDate(...args);
});

describe('generateSuggestions', () => {
  beforeAll(async () => {
    await loadTermsData();
  });
  
  describe('default suggestions', () => {
    it('should return default suggestions for empty input', () => {
      const suggestions = generateSuggestions('');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe('example');
    });
    
    it('should return default suggestions for short input', () => {
      const suggestions = generateSuggestions('a');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBe('example');
    });
  });
  
  describe('term suggestions', () => {
    it('should suggest Michaelmas for "mich"', () => {
      const suggestions = generateSuggestions('mich');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Michaelmas'))).toBe(true);
    });
    
    it('should suggest Hilary for "hil"', () => {
      const suggestions = generateSuggestions('hil');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Hilary'))).toBe(true);
    });
    
    it('should suggest Trinity for "trin"', () => {
      const suggestions = generateSuggestions('trin');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Trinity'))).toBe(true);
    });
    
    it('should include current academic year in term suggestions', () => {
      const suggestions = generateSuggestions('mich');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('2024-25'))).toBe(true);
    });
  });
  
  describe('week suggestions', () => {
    it('should suggest weeks for "week"', () => {
      const suggestions = generateSuggestions('week');
      expect(suggestions.length).toBeGreaterThan(0);
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.startsWith('Week'))).toBe(true);
    });
    
    it('should suggest weeks for "w"', () => {
      const suggestions = generateSuggestions('w');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.startsWith('Week'))).toBe(true);
    });
    
    it('should suggest specific week number', () => {
      const suggestions = generateSuggestions('week 5');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Week 5'))).toBe(true);
    });
    
    it('should include all terms for specific week', () => {
      const suggestions = generateSuggestions('week 3');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Michaelmas'))).toBe(true);
      expect(texts.some(t => t.includes('Hilary'))).toBe(true);
      expect(texts.some(t => t.includes('Trinity'))).toBe(true);
    });
  });
  
  describe('day suggestions', () => {
    it('should suggest days for "mon"', () => {
      const suggestions = generateSuggestions('mon');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Monday'))).toBe(true);
    });
    
    it('should suggest days for "tue"', () => {
      const suggestions = generateSuggestions('tue');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Tuesday'))).toBe(true);
    });
    
    it('should include week context for day suggestions', () => {
      const suggestions = generateSuggestions('friday');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('Week'))).toBe(true);
    });
  });
  
  describe('date suggestions', () => {
    it('should suggest months for day numbers', () => {
      const suggestions = generateSuggestions('25');
      expect(suggestions.length).toBeGreaterThan(0);
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => /\d+ \w+ \d{4}/.test(t))).toBe(true);
    });
    
    it('should suggest dates for month names', () => {
      const suggestions = generateSuggestions('jan');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('January'))).toBe(true);
    });
    
    it('should include current year in date suggestions', () => {
      const suggestions = generateSuggestions('march');
      const texts = suggestions.map(s => s.text);
      expect(texts.some(t => t.includes('2024'))).toBe(true);
    });
  });
  
  describe('options', () => {
    it('should respect maxSuggestions option', () => {
      const suggestions = generateSuggestions('w', { maxSuggestions: 3 });
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
    
    it('should default to 8 max suggestions', () => {
      const suggestions = generateSuggestions('w');
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });
  
  describe('duplicate removal', () => {
    it('should remove duplicate suggestions', () => {
      const suggestions = generateSuggestions('week 1');
      const texts = suggestions.map(s => s.text);
      const unique = [...new Set(texts)];
      expect(texts.length).toBe(unique.length);
    });
  });
});

describe('formatSuggestionsForDisplay', () => {
  it('should extract text from suggestions', () => {
    const suggestions = [
      { text: 'Week 5 Michaelmas', type: 'week', description: 'Week 5' },
      { text: '25 March 2025', type: 'date', description: 'Date' }
    ];
    
    const formatted = formatSuggestionsForDisplay(suggestions);
    expect(formatted).toEqual(['Week 5 Michaelmas', '25 March 2025']);
  });
  
  it('should handle empty array', () => {
    const formatted = formatSuggestionsForDisplay([]);
    expect(formatted).toEqual([]);
  });
});

describe('getSuggestionHTML', () => {
  it('should generate HTML for suggestion', () => {
    const suggestion = {
      text: 'Week 5 Michaelmas 2024-25',
      type: 'week',
      description: 'Fifth week of Michaelmas term'
    };
    
    const html = getSuggestionHTML(suggestion);
    expect(html).toContain('suggestion-item');
    expect(html).toContain('data-type="week"');
    expect(html).toContain('Week 5 Michaelmas 2024-25');
    expect(html).toContain('Fifth week of Michaelmas term');
  });
  
  it('should include all required classes', () => {
    const suggestion = {
      text: 'Test',
      type: 'example',
      description: 'Test description'
    };
    
    const html = getSuggestionHTML(suggestion);
    expect(html).toContain('suggestion-text');
    expect(html).toContain('suggestion-description');
  });
});