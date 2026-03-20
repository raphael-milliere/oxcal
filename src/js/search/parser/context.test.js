import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCurrentContext } from './context.js';

// Helper to mock Date
function mockDate(isoString) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
}

afterEach(() => {
  vi.useRealTimers();
});

// Minimal term data for testing
const mockTermData = {
  terms: [
    {
      year: '2024-25',
      michaelmas: {
        week0: { start: '2024-10-06', end: '2024-10-12' },
        week1: { start: '2024-10-13', end: '2024-10-19' },
        week8: { start: '2024-12-01', end: '2024-12-07' }
      },
      hilary: {
        week0: { start: '2025-01-12', end: '2025-01-18' },
        week1: { start: '2025-01-19', end: '2025-01-25' },
        week3: { start: '2025-02-02', end: '2025-02-08' },
        week8: { start: '2025-03-09', end: '2025-03-15' }
      },
      trinity: {
        week0: { start: '2025-04-20', end: '2025-04-26' },
        week1: { start: '2025-04-27', end: '2025-05-03' },
        week8: { start: '2025-06-15', end: '2025-06-21' }
      }
    },
    {
      year: '2025-26',
      michaelmas: {
        week0: { start: '2025-10-05', end: '2025-10-11' },
        week1: { start: '2025-10-12', end: '2025-10-18' },
        week8: { start: '2025-11-30', end: '2025-12-06' }
      }
    }
  ]
};

describe('getCurrentContext', () => {
  it('should identify current term when in Hilary week 3', () => {
    mockDate('2025-02-05');  // Wednesday of Hilary Week 3
    const ctx = getCurrentContext(mockTermData);
    expect(ctx.currentTerm).toBe('hilary');
    expect(ctx.currentWeek).toBe(3);
    expect(ctx.currentAcademicYear).toBe('2024-25');
    expect(ctx.inTerm).toBe(true);
  });

  it('should identify nearest upcoming term when in vacation', () => {
    mockDate('2025-04-01');  // Between Hilary and Trinity
    const ctx = getCurrentContext(mockTermData);
    expect(ctx.inTerm).toBe(false);
    expect(ctx.currentTerm).toBe('trinity');
    expect(ctx.currentWeek).toBeNull();
    expect(ctx.currentAcademicYear).toBe('2024-25');
  });

  it('should identify Michaelmas when in October', () => {
    mockDate('2025-10-15');  // In Michaelmas week 1
    const ctx = getCurrentContext(mockTermData);
    expect(ctx.currentTerm).toBe('michaelmas');
    expect(ctx.inTerm).toBe(true);
    expect(ctx.currentAcademicYear).toBe('2025-26');
  });

  it('should always have today as a Date', () => {
    mockDate('2025-06-01');
    const ctx = getCurrentContext(mockTermData);
    expect(ctx.today).toBeInstanceOf(Date);
  });
});
