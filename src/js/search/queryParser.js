/**
 * Natural language query parser for Oxford term dates.
 * Thin orchestrator over the tokenize → classify → resolve → defaults pipeline.
 */

import { tokenize } from './parser/tokenizer.js';
import { classifyTokens } from './parser/classifier.js';
import { resolveIntent } from './parser/intentResolver.js';
import { applyDefaults } from './parser/defaultResolver.js';
import { getCurrentContext, guessTerm, guessAcademicYear } from './parser/context.js';
import { getLoadedTermData } from '../data/termService.js';

// Lazy context cache — recomputed when term data might have changed
let _cachedContext = null;
let _contextTimestamp = 0;
const CONTEXT_TTL_MS = 60000; // recompute every minute

// Optional override for testing (avoids coupling tests to termService)
let _termDataOverride = null;

/**
 * Set term data override (for testing only)
 * @param {Object} data
 */
export function setTermData(data) {
  _termDataOverride = data;
  _cachedContext = null;
}

/**
 * Get current context, with caching
 */
function getContext() {
  const now = Date.now();
  if (!_cachedContext || (now - _contextTimestamp) > CONTEXT_TTL_MS) {
    const termData = _termDataOverride || getLoadedTermData();
    if (termData) {
      _cachedContext = getCurrentContext(termData);
    } else {
      // Term data not loaded yet — use heuristic fallback
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      _cachedContext = {
        today,
        currentTerm: guessTerm(today),
        currentWeek: null,
        currentAcademicYear: guessAcademicYear(today),
        inTerm: false
      };
    }
    _contextTimestamp = now;
  }
  return _cachedContext;
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
 * Reset context cache (for testing)
 */
export function _resetContextCache() {
  _cachedContext = null;
  _contextTimestamp = 0;
}
