import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { parseQuery, setTermData, _resetContextCache } from './queryParser.js';

// Mock term data for context resolution
const mockTermData = {
  terms: [
    {
      year: '2024-25',
      michaelmas: {
        week0: { start: '2024-10-06', end: '2024-10-12' },
        week1: { start: '2024-10-13', end: '2024-10-19' },
        week5: { start: '2024-11-10', end: '2024-11-16' },
        week8: { start: '2024-12-01', end: '2024-12-07' }
      },
      hilary: {
        week0: { start: '2025-01-12', end: '2025-01-18' },
        week1: { start: '2025-01-19', end: '2025-01-25' },
        week3: { start: '2025-02-02', end: '2025-02-08' },
        week5: { start: '2025-02-16', end: '2025-02-22' },
        week8: { start: '2025-03-09', end: '2025-03-15' }
      },
      trinity: {
        week1: { start: '2025-04-27', end: '2025-05-03' },
        week5: { start: '2025-05-25', end: '2025-05-31' },
        week8: { start: '2025-06-15', end: '2025-06-21' }
      }
    },
    {
      year: '2025-26',
      michaelmas: {
        week1: { start: '2025-10-12', end: '2025-10-18' },
        week5: { start: '2025-11-09', end: '2025-11-15' }
      }
    }
  ]
};

// Fix current date for predictable tests
function mockDate(isoString) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
  _resetContextCache();
}

afterEach(() => {
  vi.useRealTimers();
  _resetContextCache();
});

describe('NL Parser Integration', () => {
  beforeAll(() => {
    setTermData(mockTermData);
  });

  describe('flexible word order', () => {
    it('should parse "2025 michaelmas week 5"', () => {
      const result = parseQuery('2025 michaelmas week 5');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
      expect(result.year).toBe('2025-26');
    });

    it('should parse "week 5 of michaelmas 2025"', () => {
      const result = parseQuery('week 5 of michaelmas 2025');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(5);
    });

    it('should parse "michaelmas 5th week 2025"', () => {
      const result = parseQuery('michaelmas 5th week 2025');
      expect(result.type).toBe('term-week');
      expect(result.week).toBe(5);
    });
  });

  describe('typo tolerance', () => {
    it('should parse "trinty week 3 2025"', () => {
      const result = parseQuery('trinty week 3 2025');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(3);
    });

    it('should parse "michealmas wk 5 2026"', () => {
      const result = parseQuery('michealmas wk 5 2026');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('michaelmas');
    });

    it('should parse "hilry week 2 2025"', () => {
      const result = parseQuery('hilry week 2 2025');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('hilary');
    });
  });

  describe('partial queries with defaults', () => {
    it('should parse "week 5" with defaults', () => {
      mockDate('2025-02-05');  // During Hilary
      setTermData(mockTermData);
      const result = parseQuery('week 5');
      expect(result.type).toBe('term-week');
      expect(result.week).toBe(5);
      expect(result.assumed).toBeDefined();
    });

    it('should parse "michaelmas 2025" as term-info defaulting to week 1', () => {
      const result = parseQuery('michaelmas 2025');
      expect(result.type).toBe('term-info');
      expect(result.term).toBe('michaelmas');
      expect(result.week).toBe(1);
    });

    it('should parse "tuesday week 3" with defaults', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('tuesday week 3');
      expect(result.type).toBe('day-term-week');
      expect(result.dayOfWeek).toBe(2);
      expect(result.week).toBe(3);
    });
  });

  describe('relative queries', () => {
    it('should parse "today"', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('today');
      expect(result.type).toBe('date');
      expect(result.date).toBe('2025-02-05');
    });

    it('should parse "tomorrow"', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('tomorrow');
      expect(result.type).toBe('date');
      expect(result.date).toBe('2025-02-06');
    });

    it('should parse "this week"', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('this week');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('hilary');
    });

    it('should parse "next term"', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('next term');
      expect(result.type).toBe('term-week');
      expect(result.term).toBe('trinity');
      expect(result.week).toBe(1);
    });
  });

  describe('conversational queries', () => {
    it('should parse "when does hilary start"', () => {
      const result = parseQuery('when does hilary start');
      expect(result.type).toBe('term-info');
      expect(result.term).toBe('hilary');
      expect(result.variant).toBe('start');
    });

    it('should parse "when does trinity end"', () => {
      const result = parseQuery('when does trinity end');
      expect(result.type).toBe('term-info');
      expect(result.variant).toBe('end');
    });

    it('should parse "what week is it"', () => {
      mockDate('2025-02-05');
      setTermData(mockTermData);
      const result = parseQuery('what week is it');
      expect(result.type).toBe('date');
    });
  });

  describe('date queries (backward compat)', () => {
    it('should parse "25 March 2027"', () => {
      const result = parseQuery('25 March 2027');
      expect(result.type).toBe('date');
      expect(result.date).toBe('2027-03-25');
    });

    it('should parse "2027-03-25"', () => {
      const result = parseQuery('2027-03-25');
      expect(result.type).toBe('date');
      expect(result.date).toBe('2027-03-25');
    });

    it('should parse "25/03/2027"', () => {
      const result = parseQuery('25/03/2027');
      expect(result.type).toBe('date');
      expect(result.date).toBe('2027-03-25');
    });
  });

  describe('error handling', () => {
    it('should return helpful error for unrecognized input', () => {
      const result = parseQuery('xyzzy blarg');
      expect(result.type).toBe('invalid');
      expect(result.error).toBeDefined();
    });

    it('should handle empty string', () => {
      const result = parseQuery('');
      expect(result.type).toBe('invalid');
    });
  });
});
