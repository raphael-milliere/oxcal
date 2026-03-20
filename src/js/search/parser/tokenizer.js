/**
 * Tokenize a natural language input string.
 * Normalizes, splits on whitespace, preserves compound tokens.
 * @param {string} input
 * @returns {string[]}
 */
export function tokenize(input) {
  if (!input || typeof input !== 'string') return [];

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  // Split on whitespace
  const raw = trimmed.split(/\s+/);

  // Normalize each token: strip trailing punctuation (except needed chars)
  return raw.map(token => {
    // Strip trailing ?, !, , (but keep / and - which are part of dates/years)
    return token.replace(/[?,!]+$/, '');
  }).filter(token => token.length > 0);
}
