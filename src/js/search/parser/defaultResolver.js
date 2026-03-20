const TERM_ORDER = ['michaelmas', 'hilary', 'trinity'];

/**
 * Apply defaults to fill missing entities, and format into ParsedQuery.
 * @param {{ intent: string, entities: Object, missing: string[], variant?: string }} intent
 * @param {{ today: Date, currentTerm: string, currentWeek: number|null, currentAcademicYear: string, inTerm: boolean }} context
 * @returns {Object} ParsedQuery compatible with searchEngine.js
 */
export function applyDefaults(intent, context) {
  const { entities, missing } = intent;
  const assumed = [];

  switch (intent.intent) {
    case 'term-week':
      return resolveTermWeek(entities, missing, assumed, context);

    case 'day-term-week':
      return resolveDayTermWeek(entities, missing, assumed, context);

    case 'term-info':
      return resolveTermInfo(entities, missing, assumed, context, intent.variant);

    case 'date':
      return resolveDate(entities, missing, assumed, context);

    case 'relative':
      return resolveRelative(entities, context);

    case 'invalid':
    default:
      return buildError(entities);
  }
}

function resolveTermWeek(entities, missing, assumed, context) {
  let { term, week, year } = entities;

  if (missing.includes('term')) {
    term = context.currentTerm;
    assumed.push('term');
  }

  if (missing.includes('year') && !year) {
    year = context.currentAcademicYear;
    assumed.push('year');
  }

  year = normalizeAcademicYear(year, term);

  return {
    type: 'term-week',
    term,
    week,
    year,
    ...(assumed.length > 0 ? { assumed } : {})
  };
}

function resolveDayTermWeek(entities, missing, assumed, context) {
  let { dayOfWeek, week, term, year } = entities;

  if (missing.includes('term')) {
    term = context.currentTerm;
    assumed.push('term');
  }

  if (missing.includes('year') && !year) {
    year = context.currentAcademicYear;
    assumed.push('year');
  }

  year = normalizeAcademicYear(year, term);

  return {
    type: 'day-term-week',
    dayOfWeek,
    term,
    week,
    year,
    ...(assumed.length > 0 ? { assumed } : {})
  };
}

function resolveTermInfo(entities, missing, assumed, context, variant) {
  let { term, year } = entities;

  if (missing.includes('year') && !year) {
    year = context.currentAcademicYear;
    assumed.push('year');
  }

  year = normalizeAcademicYear(year, term);

  return {
    type: 'term-info',
    term,
    week: 1,
    year,
    ...(variant ? { variant } : {}),
    ...(assumed.length > 0 ? { assumed } : {})
  };
}

function resolveDate(entities, missing, assumed, context) {
  let date;

  if (entities.dateIso) {
    const { year, month, day } = entities.dateIso;
    date = formatDateStr(year, month, day);
  } else if (entities.dateSlash) {
    const { day, month, year } = entities.dateSlash;
    date = formatDateStr(year, month, day);
  } else {
    const month = entities.month;
    const day = entities.dayNumber;
    let year;

    if (missing.includes('year') || !entities.year) {
      year = context.today.getFullYear();
      assumed.push('year');
    } else {
      year = parseInt(entities.year);
    }

    date = formatDateStr(year, month, day);
  }

  return {
    type: 'date',
    date,
    ...(assumed.length > 0 ? { assumed } : {})
  };
}

function resolveRelative(entities, context) {
  const rel = entities.relative;

  switch (rel) {
    case 'today': {
      const d = context.today;
      return { type: 'date', date: toISO(d) };
    }
    case 'tomorrow': {
      const d = new Date(context.today);
      d.setDate(d.getDate() + 1);
      return { type: 'date', date: toISO(d) };
    }
    case 'yesterday': {
      const d = new Date(context.today);
      d.setDate(d.getDate() - 1);
      return { type: 'date', date: toISO(d) };
    }
    case 'this-week':
    case 'current-week':
      return {
        type: 'term-week',
        term: context.currentTerm,
        week: context.currentWeek ?? 1,
        year: context.currentAcademicYear
      };
    case 'next-week':
      return {
        type: 'term-week',
        term: context.currentTerm,
        week: (context.currentWeek ?? 0) + 1,
        year: context.currentAcademicYear
      };
    case 'last-week':
      return {
        type: 'term-week',
        term: context.currentTerm,
        week: Math.max(0, (context.currentWeek ?? 1) - 1),
        year: context.currentAcademicYear
      };
    case 'next-term': {
      const idx = TERM_ORDER.indexOf(context.currentTerm);
      const nextIdx = (idx + 1) % 3;
      const nextTerm = TERM_ORDER[nextIdx];
      // If wrapping from trinity to michaelmas, advance the academic year
      let year = context.currentAcademicYear;
      if (nextIdx === 0 && idx === 2) {
        year = advanceAcademicYear(year);
      }
      return { type: 'term-week', term: nextTerm, week: 1, year };
    }
    default:
      return buildError(entities);
  }
}

function buildError(entities) {
  const understood = {};
  for (const [k, v] of Object.entries(entities)) {
    if (v !== undefined && v !== null) understood[k] = v;
  }
  const hasAnything = Object.keys(understood).length > 0;

  return {
    type: 'invalid',
    error: hasAnything
      ? "Could not fully parse query. Try something like 'Week 5 Michaelmas 2025'"
      : "Could not parse query",
    ...(hasAnything ? { understood } : {})
  };
}

/**
 * Normalize a calendar year string to academic year format.
 * "2025" + "hilary" -> "2024-25"
 * "2025" + "michaelmas" -> "2025-26"
 * "2024-25" -> "2024-25" (already academic year)
 */
function normalizeAcademicYear(year, term) {
  if (!year) return year;
  if (String(year).includes('-')) return year;  // already academic year

  const y = parseInt(year);
  if (isNaN(y)) return year;

  if (term === 'michaelmas') {
    return `${y}-${(y + 1).toString().slice(-2)}`;
  } else {
    return `${y - 1}-${y.toString().slice(-2)}`;
  }
}

function advanceAcademicYear(year) {
  const parts = year.split('-');
  const start = parseInt(parts[0]) + 1;
  return `${start}-${(start + 1).toString().slice(-2)}`;
}

function formatDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
