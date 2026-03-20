/**
 * Compute Levenshtein distance between two strings
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Get max allowed Levenshtein distance based on word length
 * @param {number} length
 * @returns {number}
 */
function getThreshold(length) {
  if (length <= 3) return 0;  // too short for fuzzy
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  return 3;
}

/**
 * Find the closest match for a token among candidates
 * @param {string} token - Input token (already lowercased)
 * @param {string[]} candidates - Array of candidate strings
 * @returns {{ match: string, distance: number, confidence: number } | null}
 */
export function findClosestMatch(token, candidates) {
  if (token.length < 4) return null;

  const threshold = getThreshold(token.length);
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshtein(token, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  if (bestMatch !== null && bestDistance <= threshold) {
    const maxLen = Math.max(token.length, bestMatch.length);
    const confidence = bestDistance === 0 ? 1.0 : Math.max(0.5, 1 - (bestDistance / maxLen));
    return { match: bestMatch, distance: bestDistance, confidence };
  }

  return null;
}
