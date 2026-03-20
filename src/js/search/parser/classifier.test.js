import { describe, it, expect } from 'vitest';
import { classifyTokens } from './classifier.js';

describe('classifyTokens', () => {
  describe('term classification', () => {
    it('should classify "michaelmas" as term', () => {
      const result = classifyTokens(['michaelmas']);
      expect(result[0].type).toBe('term');
      expect(result[0].value).toBe('michaelmas');
      expect(result[0].confidence).toBe(1.0);
    });

    it('should classify aliases: mich, mt', () => {
      expect(classifyTokens(['mich'])[0]).toMatchObject({ type: 'term', value: 'michaelmas' });
      expect(classifyTokens(['mt'])[0]).toMatchObject({ type: 'term', value: 'michaelmas' });
    });

    it('should classify "hilary" and "trinity"', () => {
      expect(classifyTokens(['hilary'])[0]).toMatchObject({ type: 'term', value: 'hilary' });
      expect(classifyTokens(['trinity'])[0]).toMatchObject({ type: 'term', value: 'trinity' });
    });

    it('should fuzzy match "michealmas" to michaelmas', () => {
      const result = classifyTokens(['michealmas']);
      expect(result[0].type).toBe('term');
      expect(result[0].value).toBe('michaelmas');
      expect(result[0].confidence).toBeLessThan(1.0);
      expect(result[0].confidence).toBeGreaterThan(0.5);
    });

    it('should fuzzy match "trinty" to trinity', () => {
      const result = classifyTokens(['trinty']);
      expect(result[0].type).toBe('term');
      expect(result[0].value).toBe('trinity');
    });

    it('should fuzzy match "hilry" to hilary', () => {
      const result = classifyTokens(['hilry']);
      expect(result[0].type).toBe('term');
      expect(result[0].value).toBe('hilary');
    });
  });

  describe('term-year compound classification', () => {
    it('should classify "mt25" as term-year', () => {
      const result = classifyTokens(['mt25']);
      expect(result[0].type).toBe('term-year');
      expect(result[0].value).toEqual({ term: 'michaelmas', year: '2025-26' });
    });

    it('should classify "ht26" as term-year', () => {
      const result = classifyTokens(['ht26']);
      expect(result[0].type).toBe('term-year');
      expect(result[0].value).toEqual({ term: 'hilary', year: '2025-26' });
    });

    it('should classify "tt24" as term-year', () => {
      const result = classifyTokens(['tt24']);
      expect(result[0].type).toBe('term-year');
      expect(result[0].value).toEqual({ term: 'trinity', year: '2023-24' });
    });
  });

  describe('week classification', () => {
    it('should classify "week" as week with null value', () => {
      const result = classifyTokens(['week']);
      expect(result[0]).toMatchObject({ type: 'week', value: null });
    });

    it('should classify "wk" as week with null value', () => {
      const result = classifyTokens(['wk']);
      expect(result[0]).toMatchObject({ type: 'week', value: null });
    });

    it('should classify "w5" as week with value 5', () => {
      const result = classifyTokens(['w5']);
      expect(result[0]).toMatchObject({ type: 'week', value: 5 });
    });

    it('should classify "wk3" as week with value 3', () => {
      const result = classifyTokens(['wk3']);
      expect(result[0]).toMatchObject({ type: 'week', value: 3 });
    });

    it('should classify "week5" as week with value 5', () => {
      const result = classifyTokens(['week5']);
      expect(result[0]).toMatchObject({ type: 'week', value: 5 });
    });

    it('should reject week numbers > 12', () => {
      const result = classifyTokens(['w15']);
      expect(result[0].type).toBe('unknown');
    });
  });

  describe('day classification', () => {
    it('should classify "tuesday" as day 2', () => {
      const result = classifyTokens(['tuesday']);
      expect(result[0]).toMatchObject({ type: 'day', value: 2 });
    });

    it('should classify "fri" as day 5', () => {
      const result = classifyTokens(['fri']);
      expect(result[0]).toMatchObject({ type: 'day', value: 5 });
    });

    it('should classify "sun" as day 0', () => {
      const result = classifyTokens(['sun']);
      expect(result[0]).toMatchObject({ type: 'day', value: 0 });
    });

    it('should fuzzy match "wedensday" to wednesday', () => {
      const result = classifyTokens(['wedensday']);
      expect(result[0].type).toBe('day');
      expect(result[0].value).toBe(3);
    });
  });

  describe('year classification', () => {
    it('should classify "2025" as year', () => {
      const result = classifyTokens(['2025']);
      expect(result[0]).toMatchObject({ type: 'year', value: '2025' });
    });

    it('should classify "2024-25" as year', () => {
      const result = classifyTokens(['2024-25']);
      expect(result[0]).toMatchObject({ type: 'year', value: '2024-25' });
    });
  });

  describe('month classification', () => {
    it('should classify "march" as month 3', () => {
      const result = classifyTokens(['march']);
      expect(result[0]).toMatchObject({ type: 'month', value: 3 });
    });

    it('should classify "jan" as month 1', () => {
      const result = classifyTokens(['jan']);
      expect(result[0]).toMatchObject({ type: 'month', value: 1 });
    });

    it('should fuzzy match "novmber" to november', () => {
      const result = classifyTokens(['novmber']);
      expect(result[0].type).toBe('month');
      expect(result[0].value).toBe(11);
    });
  });

  describe('date format classification', () => {
    it('should classify "25/03/2027" as date-slash', () => {
      const result = classifyTokens(['25/03/2027']);
      expect(result[0].type).toBe('date-slash');
      expect(result[0].value).toEqual({ day: 25, month: 3, year: 2027 });
    });

    it('should classify "2027-03-25" as date-iso', () => {
      const result = classifyTokens(['2027-03-25']);
      expect(result[0].type).toBe('date-iso');
      expect(result[0].value).toEqual({ year: 2027, month: 3, day: 25 });
    });
  });

  describe('relative keywords', () => {
    it('should classify "today" as relative', () => {
      expect(classifyTokens(['today'])[0]).toMatchObject({ type: 'relative', value: 'today' });
    });

    it('should classify "tomorrow" as relative', () => {
      expect(classifyTokens(['tomorrow'])[0]).toMatchObject({ type: 'relative', value: 'tomorrow' });
    });

    it('should classify "next" as relative', () => {
      expect(classifyTokens(['next'])[0]).toMatchObject({ type: 'relative', value: 'next' });
    });
  });

  describe('noise words', () => {
    it('should classify "the", "of", "in" as noise', () => {
      const result = classifyTokens(['the', 'of', 'in']);
      expect(result.every(t => t.type === 'noise')).toBe(true);
    });
  });

  describe('question words', () => {
    it('should classify "when" as question', () => {
      expect(classifyTokens(['when'])[0]).toMatchObject({ type: 'question', value: 'when' });
    });

    it('should classify "what\'s" as question', () => {
      expect(classifyTokens(["what's"])[0]).toMatchObject({ type: 'question', value: "what's" });
    });
  });

  describe('disambiguation pass', () => {
    it('should classify bare "5" as week-number when term present but no week', () => {
      const result = classifyTokens(['michaelmas', '5', '2025']);
      const five = result.find(t => t.raw === '5');
      expect(five.type).toBe('week-number');
      expect(five.value).toBe(5);
    });

    it('should classify bare "25" as day-number when month present', () => {
      const result = classifyTokens(['25', 'march', '2027']);
      const twentyFive = result.find(t => t.raw === '25');
      expect(twentyFive.type).toBe('day-number');
      expect(twentyFive.value).toBe(25);
    });

    it('should classify "5th" as week-number when term present', () => {
      const result = classifyTokens(['michaelmas', '5th', 'week', '2025']);
      const fifth = result.find(t => t.raw === '5th');
      expect(fifth.type).toBe('week-number');
      expect(fifth.value).toBe(5);
    });

    it('should leave ambiguous number as unknown when no context', () => {
      const result = classifyTokens(['5']);
      expect(result[0].type).toBe('unknown');
    });
  });
});
