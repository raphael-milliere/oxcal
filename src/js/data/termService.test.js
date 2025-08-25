import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadTermsData,
  getYearData,
  getTermData,
  getWeekData,
  findTermWeekForDate,
  getAvailableYears,
  getCurrentAcademicYear,
  getFullTermDates
} from './termService.js';

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
            week1: { start: "2025-01-19", end: "2025-01-25" },
            week8: { start: "2025-03-09", end: "2025-03-15" }
          },
          trinity: {
            week1: { start: "2025-04-27", end: "2025-05-03" },
            week8: { start: "2025-06-15", end: "2025-06-21" }
          }
        },
        {
          year: "2025-26",
          michaelmas: {
            week1: { start: "2025-10-12", end: "2025-10-18" }
          }
        }
      ]
    };
    return {
      ok: true,
      json: async () => mockData
    };
  }
  throw new Error('Not found');
};

describe('termService', () => {
  beforeAll(async () => {
    await loadTermsData();
  });

  describe('loadTermsData', () => {
    it('should load terms data successfully', async () => {
      const data = await loadTermsData();
      expect(data).toBeDefined();
      expect(data.terms).toBeInstanceOf(Array);
      expect(data.terms.length).toBeGreaterThan(0);
    });

    it('should cache loaded data', async () => {
      const data1 = await loadTermsData();
      const data2 = await loadTermsData();
      expect(data1).toBe(data2);
    });
  });

  describe('getYearData', () => {
    it('should return year data for valid year', () => {
      const yearData = getYearData('2024-25');
      expect(yearData).toBeDefined();
      expect(yearData.year).toBe('2024-25');
      expect(yearData.michaelmas).toBeDefined();
    });

    it('should return null for invalid year', () => {
      const yearData = getYearData('2030-31');
      expect(yearData).toBeNull();
    });
  });

  describe('getTermData', () => {
    it('should return term data for valid term', () => {
      const termData = getTermData('2024-25', 'michaelmas');
      expect(termData).toBeDefined();
      expect(termData.week1).toBeDefined();
    });

    it('should handle case-insensitive term names', () => {
      const termData1 = getTermData('2024-25', 'Michaelmas');
      const termData2 = getTermData('2024-25', 'MICHAELMAS');
      expect(termData1).toBeDefined();
      expect(termData2).toBeDefined();
      expect(termData1).toEqual(termData2);
    });

    it('should return null for invalid term', () => {
      const termData = getTermData('2024-25', 'summer');
      expect(termData).toBeNull();
    });
  });

  describe('getWeekData', () => {
    it('should return week data for valid week', () => {
      const weekData = getWeekData('2024-25', 'michaelmas', 1);
      expect(weekData).toBeDefined();
      expect(weekData.start).toBe('2024-10-13');
      expect(weekData.end).toBe('2024-10-19');
    });

    it('should return week 0 data', () => {
      const weekData = getWeekData('2024-25', 'michaelmas', 0);
      expect(weekData).toBeDefined();
      expect(weekData.start).toBe('2024-10-06');
    });

    it('should return null for invalid week number', () => {
      const weekData = getWeekData('2024-25', 'michaelmas', 13);
      expect(weekData).toBeNull();
    });
  });

  describe('findTermWeekForDate', () => {
    it('should find correct term and week for date', () => {
      const result = findTermWeekForDate('2024-10-15');
      expect(result).toBeDefined();
      expect(result.year).toBe('2024-25');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(1);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-10-15');
      const result = findTermWeekForDate(date);
      expect(result).toBeDefined();
      expect(result.week).toBe(1);
    });

    it('should return null for date outside term', () => {
      const result = findTermWeekForDate('2024-07-15');
      expect(result).toBeNull();
    });

    it('should find week 0', () => {
      const result = findTermWeekForDate('2024-10-08');
      expect(result).toBeDefined();
      expect(result.week).toBe(0);
    });
  });

  describe('getAvailableYears', () => {
    it('should return list of available years', () => {
      const years = getAvailableYears();
      expect(years).toBeInstanceOf(Array);
      expect(years).toContain('2024-25');
      expect(years).toContain('2025-26');
    });
  });

  describe('getFullTermDates', () => {
    it('should return Full Term date range', () => {
      const dates = getFullTermDates('2024-25', 'michaelmas');
      expect(dates).toBeDefined();
      expect(dates.start).toBe('2024-10-13');
      expect(dates.end).toBe('2024-12-07');
    });

    it('should return null if weeks missing', () => {
      const dates = getFullTermDates('2025-26', 'hilary');
      expect(dates).toBeNull();
    });
  });
});