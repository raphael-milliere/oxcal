/**
 * Compute the current context from today's date and term data.
 * Used by the default resolver to fill missing entities.
 * @param {Object} termData - Loaded terms data (same shape as terms.json)
 * @returns {{ today: Date, currentTerm: string, currentWeek: number|null, currentAcademicYear: string, inTerm: boolean }}
 */
export function getCurrentContext(termData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Try to find which term/week we're in
  for (const yearData of termData.terms) {
    for (const termName of ['michaelmas', 'hilary', 'trinity']) {
      const term = yearData[termName];
      if (!term) continue;

      for (let w = 0; w <= 12; w++) {
        const week = term[`week${w}`];
        if (!week) continue;

        const start = parseDate(week.start);
        const end = parseDate(week.end);
        end.setHours(23, 59, 59, 999);

        if (today >= start && today <= end) {
          return {
            today,
            currentTerm: termName,
            currentWeek: w,
            currentAcademicYear: yearData.year,
            inTerm: true
          };
        }
      }
    }
  }

  // Not in term — find nearest upcoming term
  let nearestTerm = null;
  let nearestYear = null;
  let nearestStart = null;

  for (const yearData of termData.terms) {
    for (const termName of ['michaelmas', 'hilary', 'trinity']) {
      const term = yearData[termName];
      if (!term) continue;

      // Find the earliest week start for this term
      const week0 = term.week0 || term.week1;
      if (!week0) continue;

      const start = parseDate(week0.start);
      if (start > today && (nearestStart === null || start < nearestStart)) {
        nearestTerm = termName;
        nearestYear = yearData.year;
        nearestStart = start;
      }
    }
  }

  // Determine academic year: if we found an upcoming term use that year,
  // otherwise fall back to heuristic based on month
  const academicYear = nearestYear || guessAcademicYear(today);

  return {
    today,
    currentTerm: nearestTerm || guessTerm(today),
    currentWeek: null,
    currentAcademicYear: academicYear,
    inTerm: false
  };
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function guessAcademicYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 7) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

function guessTerm(date) {
  const month = date.getMonth() + 1;
  if (month >= 10 || month <= 1) return 'michaelmas';
  if (month >= 2 && month <= 4) return 'hilary';
  return 'trinity';
}
