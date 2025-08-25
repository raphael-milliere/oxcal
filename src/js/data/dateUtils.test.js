import { describe, it, expect } from 'vitest';
import {
  parseISODate,
  toISODateString,
  daysBetween,
  isDateInRange,
  getDayName,
  getShortDayName,
  getMonthName,
  getShortMonthName,
  formatDate,
  addDays,
  getWeekStart,
  getWeekEnd,
  isSameDay,
  getToday
} from './dateUtils.js';

describe('dateUtils', () => {
  describe('parseISODate', () => {
    it('should parse ISO date string correctly', () => {
      const date = parseISODate('2024-10-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(date.getDate()).toBe(15);
    });
  });

  describe('toISODateString', () => {
    it('should format date to ISO string', () => {
      const date = new Date(2024, 9, 15); // October 15, 2024
      expect(toISODateString(date)).toBe('2024-10-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(toISODateString(date)).toBe('2024-01-05');
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const days = daysBetween('2024-10-15', '2024-10-20');
      expect(days).toBe(5);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2024-10-15');
      const date2 = new Date('2024-10-20');
      expect(daysBetween(date1, date2)).toBe(5);
    });

    it('should return positive value regardless of order', () => {
      expect(daysBetween('2024-10-20', '2024-10-15')).toBe(5);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date in range', () => {
      expect(isDateInRange('2024-10-15', '2024-10-10', '2024-10-20')).toBe(true);
    });

    it('should return true for dates on boundaries', () => {
      expect(isDateInRange('2024-10-10', '2024-10-10', '2024-10-20')).toBe(true);
      expect(isDateInRange('2024-10-20', '2024-10-10', '2024-10-20')).toBe(true);
    });

    it('should return false for date outside range', () => {
      expect(isDateInRange('2024-10-25', '2024-10-10', '2024-10-20')).toBe(false);
    });
  });

  describe('getDayName', () => {
    it('should return correct day name', () => {
      expect(getDayName('2024-10-15')).toBe('Tuesday');
      expect(getDayName('2024-10-13')).toBe('Sunday');
      expect(getDayName('2024-10-19')).toBe('Saturday');
    });
  });

  describe('getShortDayName', () => {
    it('should return correct short day name', () => {
      expect(getShortDayName('2024-10-15')).toBe('Tue');
      expect(getShortDayName('2024-10-13')).toBe('Sun');
      expect(getShortDayName('2024-10-19')).toBe('Sat');
    });
  });

  describe('getMonthName', () => {
    it('should return correct month name', () => {
      expect(getMonthName('2024-01-15')).toBe('January');
      expect(getMonthName('2024-10-15')).toBe('October');
      expect(getMonthName('2024-12-15')).toBe('December');
    });
  });

  describe('getShortMonthName', () => {
    it('should return correct short month name', () => {
      expect(getShortMonthName('2024-01-15')).toBe('Jan');
      expect(getShortMonthName('2024-10-15')).toBe('Oct');
      expect(getShortMonthName('2024-12-15')).toBe('Dec');
    });
  });

  describe('formatDate', () => {
    it('should format date in full format', () => {
      expect(formatDate('2024-10-15', 'full')).toBe('Tuesday, 15 October 2024');
    });

    it('should format date in short format', () => {
      expect(formatDate('2024-10-15', 'short')).toBe('Tue 15 Oct 2024');
    });

    it('should format date in month-day format', () => {
      expect(formatDate('2024-10-15', 'month-day')).toBe('15 October');
    });

    it('should format date in day-month format', () => {
      expect(formatDate('2024-10-15', 'day-month')).toBe('15 Oct');
    });

    it('should default to ISO format', () => {
      expect(formatDate('2024-10-15', 'unknown')).toBe('2024-10-15');
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const result = addDays('2024-10-15', 5);
      expect(toISODateString(result)).toBe('2024-10-20');
    });

    it('should subtract negative days', () => {
      const result = addDays('2024-10-15', -5);
      expect(toISODateString(result)).toBe('2024-10-10');
    });

    it('should handle month boundaries', () => {
      const result = addDays('2024-10-30', 5);
      expect(toISODateString(result)).toBe('2024-11-04');
    });
  });

  describe('getWeekStart', () => {
    it('should return Sunday of the week', () => {
      const result = getWeekStart('2024-10-15'); // Tuesday
      expect(toISODateString(result)).toBe('2024-10-13'); // Sunday
    });

    it('should return same date if already Sunday', () => {
      const result = getWeekStart('2024-10-13'); // Sunday
      expect(toISODateString(result)).toBe('2024-10-13');
    });
  });

  describe('getWeekEnd', () => {
    it('should return Saturday of the week', () => {
      const result = getWeekEnd('2024-10-15'); // Tuesday
      expect(toISODateString(result)).toBe('2024-10-19'); // Saturday
    });

    it('should return same date if already Saturday', () => {
      const result = getWeekEnd('2024-10-19'); // Saturday
      expect(toISODateString(result)).toBe('2024-10-19');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      expect(isSameDay('2024-10-15', '2024-10-15')).toBe(true);
    });

    it('should return false for different days', () => {
      expect(isSameDay('2024-10-15', '2024-10-16')).toBe(false);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2024-10-15T10:00:00');
      const date2 = new Date('2024-10-15T15:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });
  });

  describe('getToday', () => {
    it('should return today at midnight', () => {
      const today = getToday();
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
      expect(today.getMilliseconds()).toBe(0);
    });
  });
});