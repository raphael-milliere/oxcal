import { describe, it, expect, beforeAll } from 'vitest';
import { parseQuery } from './queryParser.js';
import { search } from './searchEngine.js';
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
            week2: { start: "2025-10-19", end: "2025-10-25" },
            week3: { start: "2025-10-26", end: "2025-11-01" },
            week4: { start: "2025-11-02", end: "2025-11-08" },
            week5: { start: "2025-11-09", end: "2025-11-15" },
            week6: { start: "2025-11-16", end: "2025-11-22" },
            week7: { start: "2025-11-23", end: "2025-11-29" },
            week8: { start: "2025-11-30", end: "2025-12-06" }
          },
          hilary: {
            week0: { start: "2026-01-11", end: "2026-01-17" },
            week1: { start: "2026-01-18", end: "2026-01-24" },
            week2: { start: "2026-01-25", end: "2026-01-31" },
            week3: { start: "2026-02-01", end: "2026-02-07" },
            week4: { start: "2026-02-08", end: "2026-02-14" },
            week5: { start: "2026-02-15", end: "2026-02-21" },
            week6: { start: "2026-02-22", end: "2026-02-28" },
            week7: { start: "2026-03-01", end: "2026-03-07" },
            week8: { start: "2026-03-08", end: "2026-03-14" }
          },
          trinity: {
            week0: { start: "2026-04-19", end: "2026-04-25" },
            week1: { start: "2026-04-26", end: "2026-05-02" },
            week2: { start: "2026-05-03", end: "2026-05-09" },
            week3: { start: "2026-05-10", end: "2026-05-16" },
            week4: { start: "2026-05-17", end: "2026-05-23" },
            week5: { start: "2026-05-24", end: "2026-05-30" },
            week6: { start: "2026-05-31", end: "2026-06-06" },
            week7: { start: "2026-06-07", end: "2026-06-13" },
            week8: { start: "2026-06-14", end: "2026-06-20" }
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

describe('Search Aliases', () => {
  beforeAll(async () => {
    await loadTermsData();
  });

  describe('Term aliases', () => {
    it('should expand MT to Michaelmas', () => {
      const result = search('w5 MT 2025');
      expect(result.success).toBe(true);
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
      expect(result.year).toBe('2025-26');
    });

    it('should expand HT to Hilary', () => {
      const result = search('w3 HT 2026');
      expect(result.success).toBe(true);
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(3);
      expect(result.year).toBe('2025-26');
    });

    it('should expand TT to Trinity', () => {
      const result = search('w2 TT 2025');
      expect(result.success).toBe(true);
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(2);
      expect(result.year).toBe('2024-25');
    });
    
    it('should be case-insensitive for term aliases', () => {
      const result1 = search('mt 2025 w5');
      const result2 = search('Mt 2025 w5');
      const result3 = search('MT 2025 w5');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.term).toBe('michaelmas');
      expect(result2.term).toBe('michaelmas');
      expect(result3.term).toBe('michaelmas');
    });
  });

  describe('Year-specific term aliases', () => {
    it('should expand MT25 to Michaelmas 2025', () => {
      const result = search('w3 MT25');
      expect(result.success).toBe(true);
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(3);
      expect(result.year).toBe('2025-26');
    });

    it('should expand HT26 to Hilary 2026', () => {
      const result = search('w1 HT26');
      expect(result.success).toBe(true);
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(1);
      expect(result.year).toBe('2025-26');
    });

    it('should expand TT25 to Trinity 2025', () => {
      const result = search('w7 TT25');
      expect(result.success).toBe(true);
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(7);
      expect(result.year).toBe('2024-25');
    });
    
    it('should be case-insensitive for year-specific aliases', () => {
      const result1 = search('mt25 w3');
      const result2 = search('MT25 w3');
      const result3 = search('Mt25 w3');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.year).toBe('2025-26');
      expect(result2.year).toBe('2025-26');
      expect(result3.year).toBe('2025-26');
    });
  });

  describe('Week aliases', () => {
    it('should expand w0 to Week 0', () => {
      const result = search('w0 michaelmas 2025');
      expect(result.success).toBe(true);
      expect(result.week).toBe(0);
      expect(result.startDate).toBe('2025-10-05');
    });

    it('should expand w5 to Week 5', () => {
      const result = search('w5 hilary 2026');
      expect(result.success).toBe(true);
      expect(result.week).toBe(5);
      expect(result.term).toBe('hilary');
    });

    it('should expand w8 to Week 8', () => {
      const result = search('w8 trinity 2025');
      expect(result.success).toBe(true);
      expect(result.week).toBe(8);
      expect(result.endDate).toBe('2025-06-21');
    });

    it('should be case-insensitive for week aliases', () => {
      const result1 = search('W3 michaelmas 2025');
      const result2 = search('w3 michaelmas 2025');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.week).toBe(3);
      expect(result2.week).toBe(3);
    });
  });

  describe('Day aliases', () => {
    it('should expand Mon to Monday', () => {
      const result = search('Mon w3 michaelmas 2025');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.dayOfWeek).toBe(1);
      expect(result.date).toBe('2025-10-27'); // Monday of week 3
    });

    it('should expand Tue to Tuesday', () => {
      const result = search('tue w1 hilary 2026');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(2);
      expect(result.date).toBe('2026-01-20'); // Tuesday of week 1
    });

    it('should expand Wed to Wednesday', () => {
      const result = search('wed w2 trinity 2025');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(3);
      expect(result.date).toBe('2025-05-07'); // Wednesday of week 2
    });

    it('should expand Thu to Thursday', () => {
      const result = search('thu w4 michaelmas 2025');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(4);
      expect(result.date).toBe('2025-11-06'); // Thursday of week 4
    });

    it('should expand Fri to Friday', () => {
      const result = search('fri w5 hilary 2025');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(5);
      expect(result.date).toBe('2025-02-21'); // Friday of week 5
    });

    it('should expand Sat to Saturday', () => {
      const result = search('sat w6 trinity 2026');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(6);
      expect(result.date).toBe('2026-06-06'); // Saturday of week 6
    });

    it('should expand Sun to Sunday', () => {
      const result = search('sun w0 michaelmas 2024');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(0);
      expect(result.date).toBe('2024-10-06'); // Sunday of week 0
    });

    it('should be case-insensitive for day aliases', () => {
      const result1 = search('MON w3 michaelmas 2025');
      const result2 = search('mon w3 michaelmas 2025');
      const result3 = search('Mon w3 michaelmas 2025');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.dayOfWeek).toBe(1);
      expect(result2.dayOfWeek).toBe(1);
      expect(result3.dayOfWeek).toBe(1);
    });
  });

  describe('Complex alias combinations', () => {
    it('should handle mon w3 mt25', () => {
      const result = search('mon w3 mt25');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.dayOfWeek).toBe(1);
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(3);
      expect(result.year).toBe('2025-26');
      expect(result.date).toBe('2025-10-27');
    });

    it('should handle tue w0 ht26', () => {
      const result = search('tue w0 ht26');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(2);
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(0);
      expect(result.year).toBe('2025-26');
      expect(result.date).toBe('2026-01-13');
    });

    it('should handle W8 TT25 (uppercase)', () => {
      const result = search('W8 TT25');
      expect(result.success).toBe(true);
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(8);
      expect(result.year).toBe('2024-25');
    });

    it('should handle fri W5 MT24', () => {
      const result = search('fri W5 MT24');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(5);
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
      expect(result.year).toBe('2024-25');
      expect(result.date).toBe('2024-11-15');
    });

    it('should handle mixed case SUN w2 Ht26', () => {
      const result = search('SUN w2 Ht26');
      expect(result.success).toBe(true);
      expect(result.dayOfWeek).toBe(0);
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(2);
      expect(result.year).toBe('2025-26');
      expect(result.date).toBe('2026-01-25');
    });

    it('should handle all aliases together: wed w4 tt25', () => {
      const result = search('wed w4 tt25');
      expect(result.success).toBe(true);
      expect(result.type).toBe('single-date');
      expect(result.dayOfWeek).toBe(3);
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(4);
      expect(result.year).toBe('2024-25');
      expect(result.date).toBe('2025-05-21');
    });
  });
});