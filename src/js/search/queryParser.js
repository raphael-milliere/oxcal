/**
 * Natural language query parser for Oxford term dates.
 * Thin orchestrator over the tokenize → classify → resolve → defaults pipeline.
 */

import { tokenize } from './parser/tokenizer.js';
import { classifyTokens } from './parser/classifier.js';
import { resolveIntent } from './parser/intentResolver.js';
import { applyDefaults } from './parser/defaultResolver.js';
import { getCurrentContext } from './parser/context.js';

// Lazy context cache — recomputed when term data might have changed
let _cachedContext = null;
let _contextTimestamp = 0;
const CONTEXT_TTL_MS = 60000; // recompute every minute

/**
 * Get current context, with caching
 * @param {Object} [termData] - Optional term data override (for testing)
 */
function getContext(termData) {
  const now = Date.now();
  if (!_cachedContext || (now - _contextTimestamp) > CONTEXT_TTL_MS) {
    if (termData) {
      _cachedContext = getCurrentContext(termData);
    } else {
      try {
        _cachedContext = getCurrentContext(getTermDataSync());
      } catch {
        // If term data isn't loaded yet, use a minimal fallback context
        _cachedContext = getFallbackContext();
      }
    }
    _contextTimestamp = now;
  }
  return _cachedContext;
}

function getFallbackContext() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  let currentTerm, academicYear;

  if (month >= 10 || month <= 1) {
    currentTerm = 'michaelmas';
    academicYear = month >= 10 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  } else if (month >= 2 && month <= 4) {
    currentTerm = 'hilary';
    academicYear = `${year - 1}-${year.toString().slice(-2)}`;
  } else {
    currentTerm = 'trinity';
    academicYear = `${year - 1}-${year.toString().slice(-2)}`;
  }

  return { today, currentTerm, currentWeek: null, currentAcademicYear: academicYear, inTerm: false };
}

// We need synchronous access to term data
let _termDataRef = null;

function getTermDataSync() {
  if (_termDataRef) return _termDataRef;
  throw new Error('Term data not available');
}

/**
 * Set term data reference (called by search module after load)
 * @param {Object} data
 */
export function setTermData(data) {
  _termDataRef = data;
  _cachedContext = null;  // invalidate cache
}

/**
 * Parse a natural language query into a structured search request
 * @param {string} query - User input query
 * @returns {Object} Parsed query object with type and parameters
 */
export function parseQuery(query) {
  if (!query || typeof query !== 'string') {
    return { type: 'invalid', error: 'Empty or invalid query' };
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { type: 'invalid', error: 'Empty or invalid query' };
  }

  const classified = classifyTokens(tokens);
  const intent = resolveIntent(classified);

  // If intent resolver produced a validation error, return it directly
  if (intent.intent === 'invalid' && intent.error) {
    return { type: 'invalid', error: intent.error };
  }

  const context = getContext();
  const result = applyDefaults(intent, context);

  return result;
}

/**
 * Extract search suggestions from partial query (backward-compatible wrapper)
 * @param {string} query - Partial query string
 * @returns {Array} Array of suggestion strings
 */
export function getSuggestions(query) {
  if (!query) return [];
  if (query.length === 1 && query.toLowerCase() !== 'w') return [];

  const suggestions = [];
  const normalized = query.toLowerCase().trim();

  // Term name suggestions
  const terms = ['Michaelmas', 'Hilary', 'Trinity'];
  terms.forEach(term => {
    if (term.toLowerCase().startsWith(normalized)) {
      suggestions.push(term);
    }
  });

  // Week suggestions
  if (normalized === 'w') {
    suggestions.push('Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 5');
  } else if (normalized === 'we') {
    suggestions.push('Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 5 Michaelmas 2025');
  } else if (normalized.startsWith('week')) {
    for (let i = 0; i <= 5; i++) {
      suggestions.push(`Week ${i}`);
    }
  }

  // Example patterns for short queries
  if (normalized.length <= 3 && normalized.length >= 2 && suggestions.length < 5) {
    const examples = [
      'Week 5 Michaelmas 2025',
      'Tuesday Week 2 Trinity 2025',
      '25 March 2025'
    ];
    examples.forEach(ex => {
      if (!suggestions.includes(ex)) suggestions.push(ex);
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Reset context cache (for testing)
 */
export function _resetContextCache() {
  _cachedContext = null;
  _contextTimestamp = 0;
}
