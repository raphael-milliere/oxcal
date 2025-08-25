import { describe, it, expect } from 'vitest';
import { parseQuery, getSuggestions } from './queryParser.js';

describe('parseQuery', () => {
  describe('term week queries', () => {
    it('should parse "Week 5 Michaelmas 2026"', () => {
      const result = parseQuery('Week 5 Michaelmas 2026');
      expect(result).toEqual({
        type: 'term-week',
        term: 'michaelmas',
        week: 5,
        year: '2026-27'
      });
    });
    
    it('should parse "michaelmas week 3 2025"', () => {
      const result = parseQuery('michaelmas week 3 2025');
      expect(result).toEqual({
        type: 'term-week',
        term: 'michaelmas',
        week: 3,
        year: '2025-26'
      });
    });
    
    it('should parse abbreviated terms "mich wk 5 2026"', () => {
      const result = parseQuery('mich wk 5 2026');
      expect(result).toEqual({
        type: 'term-week',
        term: 'michaelmas',
        week: 5,
        year: '2026-27'
      });
    });
    
    it('should parse "hilary week 2 2025"', () => {
      const result = parseQuery('hilary week 2 2025');
      expect(result).toEqual({
        type: 'term-week',
        term: 'hilary',
        week: 2,
        year: '2024-25'
      });
    });
    
    it('should parse "Trinity 2025 Week 8"', () => {
      const result = parseQuery('Trinity 2025 Week 8');
      expect(result).toEqual({
        type: 'term-week',
        term: 'trinity',
        week: 8,
        year: '2024-25'
      });
    });
    
    it('should parse with academic year format "Week 0 HT 2024-25"', () => {
      const result = parseQuery('Week 0 HT 2024-25');
      expect(result).toEqual({
        type: 'term-week',
        term: 'hilary',
        week: 0,
        year: '2024-25'
      });
    });
    
    it('should reject invalid week numbers', () => {
      const result = parseQuery('Week 13 Michaelmas 2026');
      expect(result.type).toBe('invalid');
      expect(result.error).toContain('Week number must be between 0 and 12');
    });
  });
  
  describe('date queries', () => {
    it('should parse "25 March 2027"', () => {
      const result = parseQuery('25 March 2027');
      expect(result).toEqual({
        type: 'date',
        date: '2027-03-25'
      });
    });
    
    it('should parse "March 25, 2027"', () => {
      const result = parseQuery('March 25, 2027');
      expect(result).toEqual({
        type: 'date',
        date: '2027-03-25'
      });
    });
    
    it('should parse ISO format "2027-03-25"', () => {
      const result = parseQuery('2027-03-25');
      expect(result).toEqual({
        type: 'date',
        date: '2027-03-25'
      });
    });
    
    it('should parse UK format "25/03/2027"', () => {
      const result = parseQuery('25/03/2027');
      expect(result).toEqual({
        type: 'date',
        date: '2027-03-25'
      });
    });
    
    it('should parse abbreviated months "1 Jan 2025"', () => {
      const result = parseQuery('1 Jan 2025');
      expect(result).toEqual({
        type: 'date',
        date: '2025-01-01'
      });
    });
    
    it('should reject invalid dates', () => {
      const result = parseQuery('32 March 2027');
      expect(result.type).toBe('invalid');
    });
  });
  
  describe('day of week in term week queries', () => {
    it('should parse "Tuesday Week 2 Trinity 2025"', () => {
      const result = parseQuery('Tuesday Week 2 Trinity 2025');
      expect(result).toEqual({
        type: 'day-term-week',
        dayOfWeek: 2,
        term: 'trinity',
        week: 2,
        year: '2024-25'
      });
    });
    
    it('should parse "Monday week 1 Michaelmas 2026"', () => {
      const result = parseQuery('Monday week 1 Michaelmas 2026');
      expect(result).toEqual({
        type: 'day-term-week',
        dayOfWeek: 1,
        term: 'michaelmas',
        week: 1,
        year: '2026-27'
      });
    });
    
    it('should parse abbreviated days "Fri Week 5 HT 2025"', () => {
      const result = parseQuery('Fri Week 5 HT 2025');
      expect(result).toEqual({
        type: 'day-term-week',
        dayOfWeek: 5,
        term: 'hilary',
        week: 5,
        year: '2024-25'
      });
    });
    
    it('should parse "Sunday Week 0 Michaelmas 2025"', () => {
      const result = parseQuery('Sunday Week 0 Michaelmas 2025');
      expect(result).toEqual({
        type: 'day-term-week',
        dayOfWeek: 0,
        term: 'michaelmas',
        week: 0,
        year: '2025-26'
      });
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty query', () => {
      const result = parseQuery('');
      expect(result.type).toBe('invalid');
      expect(result.error).toContain('Empty');
    });
    
    it('should handle null query', () => {
      const result = parseQuery(null);
      expect(result.type).toBe('invalid');
      expect(result.error).toContain('invalid');
    });
    
    it('should handle unrecognized query', () => {
      const result = parseQuery('something random');
      expect(result.type).toBe('invalid');
      expect(result.error).toContain('Could not parse');
    });
    
    it('should be case insensitive', () => {
      const result1 = parseQuery('WEEK 5 MICHAELMAS 2026');
      const result2 = parseQuery('week 5 michaelmas 2026');
      expect(result1).toEqual(result2);
    });
    
    it('should handle extra whitespace', () => {
      const result = parseQuery('  Week   5   Michaelmas   2026  ');
      expect(result.type).toBe('term-week');
      expect(result.week).toBe(5);
    });
  });
});

describe('getSuggestions', () => {
  it('should suggest term names', () => {
    const suggestions = getSuggestions('mich');
    expect(suggestions).toContain('Michaelmas');
  });
  
  it('should suggest term names for "hil"', () => {
    const suggestions = getSuggestions('hil');
    expect(suggestions).toContain('Hilary');
  });
  
  it('should suggest week patterns', () => {
    const suggestions = getSuggestions('w');
    expect(suggestions).toContain('Week 0');
    expect(suggestions).toContain('Week 5');
  });
  
  it('should provide example queries for short input', () => {
    const suggestions = getSuggestions('we');
    expect(suggestions).toContain('Week 5 Michaelmas 2025');
  });
  
  it('should return empty array for very short query', () => {
    const suggestions = getSuggestions('a');
    expect(suggestions).toEqual([]);
  });
  
  it('should return empty array for empty query', () => {
    const suggestions = getSuggestions('');
    expect(suggestions).toEqual([]);
  });
  
  it('should limit suggestions to 5', () => {
    const suggestions = getSuggestions('w');
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});