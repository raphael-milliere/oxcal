import { findClosestMatch } from './fuzzyMatch.js';
import {
  TERM_NAMES, FUZZY_TERM_CANDIDATES,
  DAY_NAMES, FUZZY_DAY_CANDIDATES,
  MONTH_NAMES, FUZZY_MONTH_CANDIDATES,
  WEEK_KEYWORDS, RELATIVE_KEYWORDS, QUESTION_KEYWORDS, NOISE_WORDS,
  TERM_YEAR_PATTERN, WEEK_COMPOUND_PATTERN,
  ACADEMIC_YEAR_PATTERN, CALENDAR_YEAR_PATTERN,
  DATE_SLASH_PATTERN, ISO_DATE_PATTERN, ORDINAL_PATTERN
} from './patterns.js';

/**
 * @typedef {{ raw: string, type: string, value: any, confidence: number }} ClassifiedToken
 */

/**
 * Classify an array of tokens into entity types.
 * Two-pass: unambiguous first, then disambiguate numbers by context.
 * @param {string[]} tokens
 * @returns {ClassifiedToken[]}
 */
export function classifyTokens(tokens) {
  // First pass: classify unambiguous tokens
  const classified = tokens.map(token => classifyUnambiguous(token));

  // Second pass: disambiguate numbers based on context
  disambiguateNumbers(classified);

  return classified;
}

/**
 * First pass: classify a single token without context
 */
function classifyUnambiguous(token) {
  // ISO date: 2027-03-25 (must check before academic year)
  const isoMatch = token.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    return {
      raw: token, type: 'date-iso', confidence: 1.0,
      value: { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]), day: parseInt(isoMatch[3]) }
    };
  }

  // Date slash: 25/03/2027
  const slashMatch = token.match(DATE_SLASH_PATTERN);
  if (slashMatch) {
    return {
      raw: token, type: 'date-slash', confidence: 1.0,
      value: { day: parseInt(slashMatch[1]), month: parseInt(slashMatch[2]), year: parseInt(slashMatch[3]) }
    };
  }

  // Academic year: 2024-25
  const acadMatch = token.match(ACADEMIC_YEAR_PATTERN);
  if (acadMatch) {
    return { raw: token, type: 'year', value: token, confidence: 1.0 };
  }

  // Term-year compound: mt25, ht26, tt24
  const termYearMatch = token.match(TERM_YEAR_PATTERN);
  if (termYearMatch) {
    const termMap = { mt: 'michaelmas', ht: 'hilary', tt: 'trinity' };
    const term = termMap[termYearMatch[1]];
    const calYear = parseInt('20' + termYearMatch[2]);
    const year = term === 'michaelmas'
      ? `${calYear}-${(calYear + 1).toString().slice(-2)}`
      : `${calYear - 1}-${calYear.toString().slice(-2)}`;
    return { raw: token, type: 'term-year', value: { term, year }, confidence: 1.0 };
  }

  // Week compound: w5, wk3, week5
  const weekCompMatch = token.match(WEEK_COMPOUND_PATTERN);
  if (weekCompMatch) {
    const num = parseInt(weekCompMatch[1]);
    if (num >= 0 && num <= 12) {
      return { raw: token, type: 'week', value: num, confidence: 1.0 };
    }
    return { raw: token, type: 'unknown', value: token, confidence: 0 };
  }

  // Bare week keywords: "week", "wk"
  if (WEEK_KEYWORDS.includes(token)) {
    return { raw: token, type: 'week', value: null, confidence: 1.0 };
  }

  // Term exact match (includes short aliases)
  if (TERM_NAMES[token] !== undefined) {
    return { raw: token, type: 'term', value: TERM_NAMES[token], confidence: 1.0 };
  }

  // Day exact match
  if (DAY_NAMES[token] !== undefined) {
    return { raw: token, type: 'day', value: DAY_NAMES[token], confidence: 1.0 };
  }

  // Month exact match
  if (MONTH_NAMES[token] !== undefined) {
    return { raw: token, type: 'month', value: MONTH_NAMES[token], confidence: 1.0 };
  }

  // Relative keywords
  if (RELATIVE_KEYWORDS.includes(token)) {
    return { raw: token, type: 'relative', value: token, confidence: 1.0 };
  }

  // Question keywords
  if (QUESTION_KEYWORDS.includes(token)) {
    return { raw: token, type: 'question', value: token, confidence: 1.0 };
  }

  // Noise words
  if (NOISE_WORDS.has(token)) {
    return { raw: token, type: 'noise', value: null, confidence: 1.0 };
  }

  // Calendar year: 2025
  if (CALENDAR_YEAR_PATTERN.test(token)) {
    return { raw: token, type: 'year', value: token, confidence: 1.0 };
  }

  // Fuzzy matching for tokens >= 4 chars
  if (token.length >= 4) {
    // Try terms
    const termFuzzy = findClosestMatch(token, FUZZY_TERM_CANDIDATES);
    if (termFuzzy) {
      return { raw: token, type: 'term', value: termFuzzy.match, confidence: termFuzzy.confidence };
    }

    // Try days
    const dayFuzzy = findClosestMatch(token, FUZZY_DAY_CANDIDATES);
    if (dayFuzzy) {
      return { raw: token, type: 'day', value: DAY_NAMES[dayFuzzy.match], confidence: dayFuzzy.confidence };
    }

    // Try months
    const monthFuzzy = findClosestMatch(token, FUZZY_MONTH_CANDIDATES);
    if (monthFuzzy) {
      return { raw: token, type: 'month', value: MONTH_NAMES[monthFuzzy.match], confidence: monthFuzzy.confidence };
    }
  }

  return { raw: token, type: 'unknown', value: token, confidence: 0 };
}

/**
 * Second pass: disambiguate unknown number tokens based on context.
 * Mutates the classified array in place.
 */
function disambiguateNumbers(classified) {
  const hasMonth = classified.some(t => t.type === 'month');
  const hasTerm = classified.some(t => t.type === 'term' || t.type === 'term-year');
  const hasWeekKeyword = classified.some(t => t.type === 'week' && t.value === null);
  const hasWeekValue = classified.some(t => t.type === 'week' && t.value !== null);

  for (const token of classified) {
    if (token.type !== 'unknown') continue;

    // Strip ordinal suffix to get the number
    const ordMatch = token.raw.match(ORDINAL_PATTERN);
    const numStr = ordMatch ? ordMatch[1] : token.raw;
    const num = parseInt(numStr);

    if (isNaN(num)) continue;

    // If month present, number 1-31 -> day-number
    if (hasMonth && num >= 1 && num <= 31) {
      token.type = 'day-number';
      token.value = num;
      token.confidence = 1.0;
      continue;
    }

    // If term or week keyword present but no week value, number 0-12 -> week-number
    if ((hasTerm || hasWeekKeyword) && !hasWeekValue && num >= 0 && num <= 12) {
      token.type = 'week-number';
      token.value = num;
      token.confidence = 1.0;
      continue;
    }
  }
}
