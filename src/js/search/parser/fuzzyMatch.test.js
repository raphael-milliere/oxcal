import { describe, it, expect } from 'vitest';
import { levenshtein, findClosestMatch } from './fuzzyMatch.js';

describe('levenshtein', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('should return length of other string when one is empty', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('should handle single character difference', () => {
    expect(levenshtein('cat', 'car')).toBe(1);
  });

  it('should handle insertion', () => {
    expect(levenshtein('cat', 'cats')).toBe(1);
  });

  it('should handle deletion', () => {
    expect(levenshtein('cats', 'cat')).toBe(1);
  });

  it('should handle transposition as 2 operations', () => {
    expect(levenshtein('ab', 'ba')).toBe(2);
  });

  it('should compute correct distance for real typos', () => {
    expect(levenshtein('michaelmas', 'michealmas')).toBe(2); // transposed 'ae' -> 'ea'
    expect(levenshtein('trinity', 'trinty')).toBe(1);        // missing 'i'
    expect(levenshtein('hilary', 'hilry')).toBe(1);           // missing 'a'
    expect(levenshtein('wednesday', 'wedensday')).toBe(2);
  });
});

describe('findClosestMatch', () => {
  const candidates = ['michaelmas', 'hilary', 'trinity'];

  it('should return exact match with confidence 1.0', () => {
    const result = findClosestMatch('michaelmas', candidates);
    expect(result).toEqual({ match: 'michaelmas', distance: 0, confidence: 1.0 });
  });

  it('should find closest match for typo within threshold', () => {
    const result = findClosestMatch('trinty', candidates);
    expect(result.match).toBe('trinity');
    expect(result.distance).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.confidence).toBeLessThan(1.0);
  });

  it('should find michaelmas for michealmas (distance 2)', () => {
    const result = findClosestMatch('michealmas', candidates);
    expect(result.match).toBe('michaelmas');
    expect(result.distance).toBe(2);
  });

  it('should return null when no match within threshold', () => {
    const result = findClosestMatch('elephant', candidates);
    expect(result).toBeNull();
  });

  it('should return null for short tokens (< 4 chars)', () => {
    const result = findClosestMatch('mt', candidates);
    expect(result).toBeNull();
  });

  it('should enforce threshold: max 1 for 4-5 char words', () => {
    // "hilar" (5 chars) -> "hilary" distance 1: should match
    const result1 = findClosestMatch('hilar', ['hilary']);
    expect(result1).not.toBeNull();

    // "hxlry" (5 chars) -> "hilary" distance 3: should NOT match
    const result2 = findClosestMatch('hxlry', ['hilary']);
    expect(result2).toBeNull();
  });

  it('should enforce threshold: max 2 for 6-8 char words', () => {
    // "triniti" (7 chars) -> "trinity" distance 1: should match
    const result = findClosestMatch('triniti', ['trinity']);
    expect(result).not.toBeNull();
  });

  it('should enforce threshold: max 3 for 9+ char words', () => {
    // "michealms" (9 chars) -> "michaelmas" distance 3: should match
    const result = findClosestMatch('michealms', ['michaelmas']);
    expect(result).not.toBeNull();
  });
});
