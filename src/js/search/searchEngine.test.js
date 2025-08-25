import { describe, it, expect, beforeAll } from 'vitest';
import { search, searchMultiple, getResultSummary } from './searchEngine.js';
import { loadTermsData } from '../data/termService.js';

// Mock fetch for testing
global.fetch = async (url) => {
  if (url === '/terms.json') {
    const mockData = {
      terms: [
        {
          year: "2024-25",
          michaelmas: {
            week0: { start: "2024-10-06", end: "2024-10-12" },
            week1: { start: "2024-10-13", end: "2024-10-19" },
            week2: { start: "2024-10-20", end: "2024-10-26" },
            week3: { start: "2024-10-27", end: "2024-11-02" },
            week4: { start: "2024-11-03", end: "2024-11-09" },
            week5: { start: "2024-11-10", end: "2024-11-16" },
            week6: { start: "2024-11-17", end: "2024-11-23" },
            week7: { start: "2024-11-24", end: "2024-11-30" },
            week8: { start: "2024-12-01", end: "2024-12-07" }
          },
          hilary: {
            week0: { start: "2025-01-12", end: "2025-01-18" },
            week1: { start: "2025-01-19", end: "2025-01-25" },
            week2: { start: "2025-01-26", end: "2025-02-01" },
            week3: { start: "2025-02-02", end: "2025-02-08" },
            week4: { start: "2025-02-09", end: "2025-02-15" },
            week5: { start: "2025-02-16", end: "2025-02-22" },
            week6: { start: "2025-02-23", end: "2025-03-01" },
            week7: { start: "2025-03-02", end: "2025-03-08" },
            week8: { start: "2025-03-09", end: "2025-03-15" }
          },
          trinity: {
            week0: { start: "2025-04-20", end: "2025-04-26" },
            week1: { start: "2025-04-27", end: "2025-05-03" },
            week2: { start: "2025-05-04", end: "2025-05-10" },
            week3: { start: "2025-05-11", end: "2025-05-17" },
            week4: { start: "2025-05-18", end: "2025-05-24" },
            week5: { start: "2025-05-25", end: "2025-05-31" },
            week6: { start: "2025-06-01", end: "2025-06-07" },
            week7: { start: "2025-06-08", end: "2025-06-14" },
            week8: { start: "2025-06-15", end: "2025-06-21" }
          }
        },
        {
          year: "2025-26",
          michaelmas: {
            week0: { start: "2025-10-05", end: "2025-10-11" },
            week1: { start: "2025-10-12", end: "2025-10-18" },
            week5: { start: "2025-11-09", end: "2025-11-15" }
          }
        },
        {
          year: "2026-27",
          michaelmas: {
            week5: { start: "2026-11-08", end: "2026-11-14" }
          }
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

describe('search', () => {
  beforeAll(async () => {
    await loadTermsData();
  });
  
  describe('term week searches', () => {
    it('should find Week 5 Michaelmas 2026', () => {
      const result = search('Week 5 Michaelmas 2026');
      expect(result.success).toBe(true);
      expect(result.type).toBe('week-range');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
      expect(result.year).toBe('2026-27');
      expect(result.startDate).toBe('2026-11-08');
      expect(result.endDate).toBe('2026-11-14');
      expect(result.dates).toHaveLength(7);
    });
    
    it('should find Trinity Week 2 2025', () => {
      const result = search('Trinity Week 2 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('week-range');
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(2);
      expect(result.year).toBe('2024-25');
      expect(result.startDate).toBe('2025-05-04');
      expect(result.endDate).toBe('2025-05-10');
    });
    
    it('should find Week 0 Hilary 2025', () => {
      const result = search('Week 0 Hilary 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('week-range');
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(0);
      expect(result.startDate).toBe('2025-01-12');
    });
    
    it('should handle missing week data', () => {
      const result = search('Week 9 Michaelmas 2026');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
  
  describe('date searches', () => {
    it('should identify term week for 25 March 2025', () => {
      const result = search('25 March 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-03-25');
      expect(result.detailText).toBe('Outside term time');
    });
    
    it('should identify term week for 15 November 2025', () => {
      const result = search('15 November 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-11-15');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
      expect(result.year).toBe('2025-26');
    });
    
    it('should handle dates in term time', () => {
      const result = search('20 January 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(1);
      expect(result.year).toBe('2024-25');
    });
  });
  
  describe('day of week in term week searches', () => {
    it('should find Tuesday Week 2 Trinity 2025', () => {
      const result = search('Tuesday Week 2 Trinity 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-05-06');
      expect(result.dayOfWeek).toBe(2);
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(2);
    });
    
    it('should find Monday Week 1 Michaelmas 2025', () => {
      const result = search('Monday Week 1 Michaelmas 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-10-13');
      expect(result.dayOfWeek).toBe(1);
    });
    
    it('should find Sunday Week 0 Hilary 2025', () => {
      const result = search('Sunday Week 0 Hilary 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-01-12');
      expect(result.dayOfWeek).toBe(0);
    });
    
    it('should find Friday Week 5 Hilary 2025', () => {
      const result = search('Friday Week 5 Hilary 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.date).toBe('2025-02-21');
      expect(result.dayOfWeek).toBe(5);
    });
  });
  
  describe('error handling', () => {
    it('should handle invalid queries', () => {
      const result = search('something invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should handle empty queries', () => {
      const result = search('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty');
    });
    
    it('should handle non-existent weeks', () => {
      const result = search('Week 10 Trinity 2030');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

describe('searchMultiple', () => {
  beforeAll(async () => {
    await loadTermsData();
  });
  
  it('should execute multiple searches', () => {
    const queries = [
      'Week 5 Michaelmas 2026',
      '25 March 2025',
      'Tuesday Week 2 Trinity 2025'
    ];
    
    const results = searchMultiple(queries);
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
  });
  
  it('should handle mixed valid and invalid queries', () => {
    const queries = [
      'Week 5 Michaelmas 2026',
      'invalid query',
      '25 March 2025'
    ];
    
    const results = searchMultiple(queries);
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
});

describe('getResultSummary', () => {
  beforeAll(async () => {
    await loadTermsData();
  });
  
  it('should summarize week range results', () => {
    const result = search('Week 5 Michaelmas 2026');
    const summary = getResultSummary(result);
    expect(summary).toContain('Michaelmas Term 2026-27, Week 5');
  });
  
  it('should summarize single date results', () => {
    const result = search('25 March 2025');
    const summary = getResultSummary(result);
    expect(summary).toContain('Tuesday, 25 March 2025');
    expect(summary).toContain('Outside term time');
  });
  
  it('should summarize error results', () => {
    const result = search('invalid query');
    const summary = getResultSummary(result);
    expect(summary).toContain('Error:');
  });
});