import { describe, it, expect } from 'vitest';
import { resolveIntent } from './intentResolver.js';

// Helper to build classified tokens
function ct(type, value, raw = '') {
  return { raw: raw || String(value), type, value, confidence: 1.0 };
}

describe('resolveIntent', () => {
  describe('entity-based resolution', () => {
    it('should resolve day + week + term + year as day-term-week', () => {
      const tokens = [
        ct('day', 2, 'tuesday'),
        ct('week', 5),
        ct('term', 'michaelmas'),
        ct('year', '2025')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('day-term-week');
      expect(result.entities.dayOfWeek).toBe(2);
      expect(result.entities.week).toBe(5);
      expect(result.entities.term).toBe('michaelmas');
      expect(result.missing).toEqual([]);
    });

    it('should resolve week + term + year as term-week', () => {
      const tokens = [
        ct('week', 5),
        ct('term', 'hilary'),
        ct('year', '2025')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-week');
      expect(result.entities.week).toBe(5);
    });

    it('should resolve term + year (no week) as term-info', () => {
      const tokens = [
        ct('term', 'michaelmas'),
        ct('year', '2025')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-info');
      expect(result.missing).toEqual([]);
    });

    it('should resolve month + day-number + year as date', () => {
      const tokens = [
        ct('day-number', 25, '25'),
        ct('month', 3, 'march'),
        ct('year', '2027')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('date');
    });

    it('should resolve week only with missing term and year', () => {
      const tokens = [ct('week', 5)];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-week');
      expect(result.missing).toContain('term');
      expect(result.missing).toContain('year');
    });

    it('should resolve term only with missing year', () => {
      const tokens = [ct('term', 'hilary')];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-info');
      expect(result.missing).toContain('year');
    });

    it('should resolve day + week (no term/year) as day-term-week needing defaults', () => {
      const tokens = [
        ct('day', 2, 'tuesday'),
        ct('week', 3)
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('day-term-week');
      expect(result.missing).toContain('term');
      expect(result.missing).toContain('year');
    });

    it('should extract term-year compound into separate entities', () => {
      const tokens = [
        ct('week', 5),
        ct('term-year', { term: 'michaelmas', year: '2025-26' }, 'mt25')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-week');
      expect(result.entities.term).toBe('michaelmas');
      expect(result.entities.year).toBe('2025-26');
    });

    it('should handle week keyword + separate week-number', () => {
      const tokens = [
        ct('week', null, 'week'),
        ct('week-number', 5, '5'),
        ct('term', 'michaelmas'),
        ct('year', '2025')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-week');
      expect(result.entities.week).toBe(5);
    });

    it('should handle date-iso token', () => {
      const tokens = [
        ct('date-iso', { year: 2027, month: 3, day: 25 }, '2027-03-25')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('date');
    });

    it('should handle date-slash token', () => {
      const tokens = [
        ct('date-slash', { day: 25, month: 3, year: 2027 }, '25/03/2027')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('date');
    });
  });

  describe('relative queries', () => {
    it('should resolve "today" as relative', () => {
      const tokens = [ct('relative', 'today')];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('today');
    });

    it('should resolve "next" + "term" as relative', () => {
      const tokens = [
        ct('relative', 'next'),
        ct('noise', null, 'term')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('next-term');
    });

    it('should resolve "this" + "week" as relative', () => {
      const tokens = [
        ct('relative', 'this'),
        ct('week', null, 'week')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('this-week');
    });

    it('should resolve "next week" as relative', () => {
      const tokens = [
        ct('relative', 'next'),
        ct('week', null, 'week')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('next-week');
    });

    it('should resolve "last week" as relative', () => {
      const tokens = [
        ct('relative', 'last'),
        ct('week', null, 'week')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('last-week');
    });
  });

  describe('conversational patterns', () => {
    it('should resolve "when does hilary start" as term-info with start variant', () => {
      const tokens = [
        ct('question', 'when'),
        ct('noise', null, 'does'),
        ct('term', 'hilary'),
        ct('unknown', 'start', 'start')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-info');
      expect(result.variant).toBe('start');
      expect(result.entities.term).toBe('hilary');
    });

    it('should resolve "when does trinity end" as term-info with end variant', () => {
      const tokens = [
        ct('question', 'when'),
        ct('noise', null, 'does'),
        ct('term', 'trinity'),
        ct('unknown', 'end', 'end')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('term-info');
      expect(result.variant).toBe('end');
    });

    it('should resolve "what week is it" as relative today', () => {
      const tokens = [
        ct('question', 'what'),
        ct('week', null, 'week'),
        ct('question', 'is'),
        ct('noise', null, 'it')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('relative');
      expect(result.entities.relative).toBe('today');
    });
  });

  describe('week number validation', () => {
    it('should reject week > 12 with specific error when week keyword present', () => {
      const tokens = [
        ct('week', null, 'week'),
        ct('unknown', '13', '13'),
        ct('term', 'michaelmas'),
        ct('year', '2026')
      ];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('invalid');
      expect(result.error).toContain('Week number must be between 0 and 12');
    });
  });

  describe('unresolvable queries', () => {
    it('should return invalid for all-unknown tokens', () => {
      const tokens = [ct('unknown', 'blah'), ct('unknown', 'foo')];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('invalid');
    });

    it('should return invalid for empty token array', () => {
      const result = resolveIntent([]);
      expect(result.intent).toBe('invalid');
    });

    it('should return invalid for noise-only tokens', () => {
      const tokens = [ct('noise', null, 'the'), ct('noise', null, 'of')];
      const result = resolveIntent(tokens);
      expect(result.intent).toBe('invalid');
    });
  });
});
