import { describe, it, expect } from 'vitest';
import { applyDefaults } from './defaultResolver.js';

const mockContext = {
  today: new Date(2025, 1, 5),  // Feb 5, 2025
  currentTerm: 'hilary',
  currentWeek: 3,
  currentAcademicYear: '2024-25',
  inTerm: true
};

describe('applyDefaults', () => {
  describe('term-week defaults', () => {
    it('should fill missing year from context', () => {
      const intent = {
        intent: 'term-week',
        entities: { term: 'hilary', week: 5 },
        missing: ['year']
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-week');
      expect(result.year).toBe('2024-25');
      expect(result.assumed).toContain('year');
    });

    it('should fill missing term and year from context', () => {
      const intent = {
        intent: 'term-week',
        entities: { week: 5 },
        missing: ['term', 'year']
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.term).toBe('hilary');
      expect(result.year).toBe('2024-25');
      expect(result.assumed).toContain('term');
      expect(result.assumed).toContain('year');
    });

    it('should convert calendar year to academic year', () => {
      const intent = {
        intent: 'term-week',
        entities: { term: 'hilary', week: 5, year: '2025' },
        missing: []
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.year).toBe('2024-25');
    });
  });

  describe('term-info defaults', () => {
    it('should default to week 1 for plain term-info', () => {
      const intent = {
        intent: 'term-info',
        entities: { term: 'michaelmas', year: '2025' },
        missing: []
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-info');
      expect(result.week).toBe(1);
    });

    it('should preserve variant for conversational queries', () => {
      const intent = {
        intent: 'term-info',
        entities: { term: 'hilary', year: '2025' },
        missing: [],
        variant: 'start'
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.variant).toBe('start');
    });
  });

  describe('date defaults', () => {
    it('should construct date from month + day-number + year', () => {
      const intent = {
        intent: 'date',
        entities: { month: 3, dayNumber: 25, year: '2027' },
        missing: []
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('date');
      expect(result.date).toBe('2027-03-25');
    });

    it('should handle date-iso entity', () => {
      const intent = {
        intent: 'date',
        entities: { dateIso: { year: 2027, month: 3, day: 25 } },
        missing: []
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.date).toBe('2027-03-25');
    });

    it('should handle date-slash entity', () => {
      const intent = {
        intent: 'date',
        entities: { dateSlash: { day: 25, month: 3, year: 2027 } },
        missing: []
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.date).toBe('2027-03-25');
    });

    it('should default missing year to current calendar year', () => {
      const intent = {
        intent: 'date',
        entities: { month: 3, dayNumber: 25 },
        missing: ['year']
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.date).toMatch(/^\d{4}-03-25$/);
      expect(result.assumed).toContain('year');
    });
  });

  describe('relative query resolution', () => {
    it('should resolve "today" to a date query', () => {
      const intent = { intent: 'relative', entities: { relative: 'today' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('date');
      expect(result.date).toBe('2025-02-05');
    });

    it('should resolve "tomorrow" to date + 1', () => {
      const intent = { intent: 'relative', entities: { relative: 'tomorrow' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('date');
      expect(result.date).toBe('2025-02-06');
    });

    it('should resolve "this-week" to current term and week', () => {
      const intent = { intent: 'relative', entities: { relative: 'this-week' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('hilary');
      expect(result.week).toBe(3);
    });

    it('should resolve "next-week" to current week + 1', () => {
      const intent = { intent: 'relative', entities: { relative: 'next-week' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-week');
      expect(result.week).toBe(4);
    });

    it('should resolve "last-week" to current week - 1', () => {
      const intent = { intent: 'relative', entities: { relative: 'last-week' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-week');
      expect(result.week).toBe(2);
    });

    it('should resolve "next-term" to next term week 1', () => {
      const intent = { intent: 'relative', entities: { relative: 'next-term' }, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(1);
    });
  });

  describe('day-term-week defaults', () => {
    it('should fill missing term and year', () => {
      const intent = {
        intent: 'day-term-week',
        entities: { dayOfWeek: 2, week: 3 },
        missing: ['term', 'year']
      };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('day-term-week');
      expect(result.dayOfWeek).toBe(2);
      expect(result.term).toBe('hilary');
      expect(result.year).toBe('2024-25');
    });
  });

  describe('error reporting', () => {
    it('should return invalid with helpful error for unresolvable queries', () => {
      const intent = { intent: 'invalid', entities: {}, missing: [] };
      const result = applyDefaults(intent, mockContext);
      expect(result.type).toBe('invalid');
      expect(result.error).toBeDefined();
    });
  });
});
