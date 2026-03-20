import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenizer.js';

describe('tokenize', () => {
  describe('basic splitting', () => {
    it('should split on whitespace', () => {
      expect(tokenize('week 5 michaelmas')).toEqual(['week', '5', 'michaelmas']);
    });

    it('should collapse multiple spaces', () => {
      expect(tokenize('week   5   michaelmas')).toEqual(['week', '5', 'michaelmas']);
    });

    it('should handle tabs', () => {
      expect(tokenize('week\t5')).toEqual(['week', '5']);
    });

    it('should trim leading/trailing whitespace', () => {
      expect(tokenize('  week 5  ')).toEqual(['week', '5']);
    });
  });

  describe('normalization', () => {
    it('should lowercase all tokens', () => {
      expect(tokenize('Week MICHAELMAS')).toEqual(['week', 'michaelmas']);
    });

    it('should strip trailing question marks', () => {
      expect(tokenize('when does hilary start?')).toEqual(['when', 'does', 'hilary', 'start']);
    });

    it('should strip trailing exclamation marks', () => {
      expect(tokenize('today!')).toEqual(['today']);
    });

    it('should strip trailing commas', () => {
      expect(tokenize('March 25, 2027')).toEqual(['march', '25', '2027']);
    });

    it('should handle apostrophes in contractions', () => {
      expect(tokenize("what's the date")).toEqual(["what's", 'the', 'date']);
    });
  });

  describe('compound token preservation', () => {
    it('should preserve w5 as single token', () => {
      expect(tokenize('w5 michaelmas')).toEqual(['w5', 'michaelmas']);
    });

    it('should preserve mt25 as single token', () => {
      expect(tokenize('w3 mt25')).toEqual(['w3', 'mt25']);
    });

    it('should preserve academic year 2024-25', () => {
      expect(tokenize('hilary 2024-25')).toEqual(['hilary', '2024-25']);
    });

    it('should preserve ISO date 2027-03-25', () => {
      expect(tokenize('2027-03-25')).toEqual(['2027-03-25']);
    });

    it('should preserve UK date 25/03/2027', () => {
      expect(tokenize('25/03/2027')).toEqual(['25/03/2027']);
    });

    it('should preserve wk3 as single token', () => {
      expect(tokenize('wk3 hilary')).toEqual(['wk3', 'hilary']);
    });

    it('should preserve ordinals like 5th', () => {
      expect(tokenize('5th week')).toEqual(['5th', 'week']);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should return empty array for null', () => {
      expect(tokenize(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(tokenize(undefined)).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      expect(tokenize('   ')).toEqual([]);
    });

    it('should handle single token', () => {
      expect(tokenize('today')).toEqual(['today']);
    });
  });
});
