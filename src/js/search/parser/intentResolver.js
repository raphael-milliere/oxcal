import { CONVERSATIONAL_PATTERNS } from './patterns.js';

/**
 * Resolve intent from classified tokens.
 * @param {import('./classifier.js').ClassifiedToken[]} tokens
 * @returns {{ intent: string, entities: Object, missing: string[], variant?: string }}
 */
export function resolveIntent(tokens) {
  if (!tokens || tokens.length === 0) {
    return { intent: 'invalid', entities: {}, missing: [] };
  }

  const entities = extractEntities(tokens);
  const rawWords = tokens.map(t => t.raw);

  // Validate: if a week keyword is present with a number > 12, reject
  const weekValidation = validateWeekNumber(tokens);
  if (weekValidation) return weekValidation;

  // Check conversational patterns first (they can override intent)
  const conversational = matchConversationalPattern(tokens, entities, rawWords);
  if (conversational) {
    return conversational;
  }

  // Check for relative queries
  const relativeResult = resolveRelative(tokens, entities);
  if (relativeResult) return relativeResult;

  // Check for date formats (ISO, slash)
  if (entities.dateIso || entities.dateSlash) {
    return { intent: 'date', entities, missing: [] };
  }

  // Entity-based resolution
  const has = (key) => entities[key] !== undefined && entities[key] !== null;

  const hasDayOfWeek = has('dayOfWeek');
  const hasWeek = has('week');
  const hasTerm = has('term');
  const hasYear = has('year');
  const hasMonth = has('month');
  const hasDayNumber = has('dayNumber');

  // Date: month + day-number (+ optional year)
  if (hasMonth && hasDayNumber) {
    const missing = [];
    if (!hasYear) missing.push('year');
    return { intent: 'date', entities, missing };
  }

  // Day-term-week: day + week + term (+ optional year)
  if (hasDayOfWeek && hasWeek) {
    const missing = [];
    if (!hasTerm) missing.push('term');
    if (!hasYear) missing.push('year');
    return { intent: 'day-term-week', entities, missing };
  }

  // Term-week: week + term (+ optional year)
  if (hasWeek) {
    const missing = [];
    if (!hasTerm) missing.push('term');
    if (!hasYear) missing.push('year');
    return { intent: 'term-week', entities, missing };
  }

  // Term-info: term (+ optional year, no week)
  if (hasTerm) {
    const missing = [];
    if (!hasYear) missing.push('year');
    return { intent: 'term-info', entities, missing };
  }

  return { intent: 'invalid', entities, missing: [] };
}

/**
 * Validate week number: if a 'week' keyword is present alongside an unknown
 * number > 12, return an error intent. Handles "Week 13 Michaelmas 2026".
 */
function validateWeekNumber(tokens) {
  const hasWeekKeyword = tokens.some(t => t.type === 'week' && t.value === null);
  if (!hasWeekKeyword) return null;

  for (const token of tokens) {
    if (token.type === 'unknown') {
      const num = parseInt(token.raw);
      if (!isNaN(num) && num > 12) {
        return {
          intent: 'invalid',
          entities: {},
          missing: [],
          error: 'Week number must be between 0 and 12'
        };
      }
    }
  }
  return null;
}

/**
 * Extract entities from classified tokens into a flat object
 */
function extractEntities(tokens) {
  const entities = {};

  for (const token of tokens) {
    switch (token.type) {
      case 'term':
        entities.term = token.value;
        break;
      case 'term-year':
        entities.term = token.value.term;
        entities.year = token.value.year;
        break;
      case 'week':
        if (token.value !== null) {
          entities.week = token.value;
        }
        break;
      case 'week-number':
        entities.week = token.value;
        break;
      case 'day':
        entities.dayOfWeek = token.value;
        break;
      case 'year':
        entities.year = token.value;
        break;
      case 'month':
        entities.month = token.value;
        break;
      case 'day-number':
        entities.dayNumber = token.value;
        break;
      case 'date-iso':
        entities.dateIso = token.value;
        break;
      case 'date-slash':
        entities.dateSlash = token.value;
        break;
      case 'relative':
        entities.relative = token.value;
        break;
    }
  }

  return entities;
}

/**
 * Resolve relative query patterns like "next week", "this term", "today"
 */
function resolveRelative(tokens, entities) {
  if (!entities.relative) return null;

  const rel = entities.relative;
  const rawWords = tokens.map(t => t.raw);

  // Standalone: today, tomorrow, yesterday
  if (['today', 'tomorrow', 'yesterday'].includes(rel)) {
    return { intent: 'relative', entities: { relative: rel }, missing: [] };
  }

  // Compound: this/next/last + week/term
  const hasWeekToken = tokens.some(t => t.type === 'week' || t.raw === 'week');
  const hasTermToken = rawWords.includes('term') || tokens.some(t => t.type === 'term');

  if (rel === 'this' || rel === 'next' || rel === 'last' || rel === 'current') {
    if (hasWeekToken) {
      return { intent: 'relative', entities: { relative: `${rel}-week` }, missing: [] };
    }
    if (hasTermToken) {
      return { intent: 'relative', entities: { relative: `${rel}-term` }, missing: [] };
    }
  }

  return null;
}

/**
 * Match against curated conversational patterns
 */
function matchConversationalPattern(tokens, entities, rawWords) {
  const hasQuestion = tokens.some(t => t.type === 'question');
  if (!hasQuestion) return null;

  // "when does {term} start/end"
  if (rawWords.includes('when') && entities.term) {
    if (rawWords.includes('start') || rawWords.includes('begin')) {
      return {
        intent: 'term-info',
        entities: { term: entities.term, year: entities.year },
        missing: entities.year ? [] : ['year'],
        variant: 'start'
      };
    }
    if (rawWords.includes('end') || rawWords.includes('finish')) {
      return {
        intent: 'term-info',
        entities: { term: entities.term, year: entities.year },
        missing: entities.year ? [] : ['year'],
        variant: 'end'
      };
    }
  }

  // "what week is it" / "what week are we in"
  const hasWeekToken = tokens.some(t => t.type === 'week');
  if ((rawWords.includes('what') || rawWords.includes("what's")) && hasWeekToken) {
    // Only if no other meaningful entities (otherwise it's a normal query)
    if (!entities.term && !entities.dayOfWeek && !entities.month) {
      return { intent: 'relative', entities: { relative: 'today' }, missing: [] };
    }
  }

  return null;
}
