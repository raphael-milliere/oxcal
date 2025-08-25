/**
 * Natural language query parser for Oxford term dates
 */

/**
 * Parse a natural language query into a structured search request
 * @param {string} query - User input query
 * @returns {Object} Parsed query object with type and parameters
 */
export function parseQuery(query) {
  if (!query || typeof query !== 'string') {
    return { type: 'invalid', error: 'Empty or invalid query' };
  }
  
  const normalizedQuery = query.trim().toLowerCase();
  
  // Try to parse as term week query
  const termWeekResult = parseTermWeekQuery(normalizedQuery);
  if (termWeekResult.type !== 'invalid') {
    return termWeekResult;
  }
  
  // Try to parse as a date
  const dateResult = parseDateQuery(normalizedQuery);
  if (dateResult.type !== 'invalid') {
    return dateResult;
  }
  
  // Try to parse as day of week in term week
  const dayWeekResult = parseDayWeekQuery(normalizedQuery);
  if (dayWeekResult.type !== 'invalid') {
    return dayWeekResult;
  }
  
  return { type: 'invalid', error: 'Could not parse query' };
}

/**
 * Parse term week queries like "Week 5 Michaelmas 2026"
 * @param {string} query - Normalized query string
 * @returns {Object} Parsed result
 */
function parseTermWeekQuery(query) {
  // Patterns to match:
  // - week 5 michaelmas 2026
  // - michaelmas week 5 2026
  // - mich wk 5 2026
  // - trinity 2025 week 3
  // - trinity 2025 week 8  
  // - w5 hilary 2025
  
  const termNames = {
    'michaelmas': 'michaelmas',
    'mich': 'michaelmas',
    'mt': 'michaelmas',
    'hilary': 'hilary',
    'hil': 'hilary',
    'ht': 'hilary',
    'trinity': 'trinity',
    'trin': 'trinity',
    'tt': 'trinity'
  };
  
  // Extract components - more flexible regex  
  const weekMatch = query.match(/w(?:ee)?k?\s*(\d+)/i) || 
                    query.match(/(\d+)\s*w(?:ee)?k/i);
  const yearMatch = query.match(/\b(20\d{2})(?:-(\d{2}))?\b/);
  
  let termName = null;
  for (const [key, value] of Object.entries(termNames)) {
    if (query.includes(key)) {
      termName = value;
      break;
    }
  }
  
  if (weekMatch && termName && yearMatch) {
    const weekNumber = parseInt(weekMatch[1] || weekMatch[2]);
    
    // Validate week number
    if (isNaN(weekNumber) || weekNumber < 0 || weekNumber > 12) {
      return { type: 'invalid', error: 'Week number must be between 0 and 12' };
    }
    
    // Handle academic year format
    let year = yearMatch[1];
    if (yearMatch[2]) {
      year = `${year}-${yearMatch[2]}`;
    } else {
      // Determine academic year based on term
      const startYear = parseInt(year);
      if (termName === 'michaelmas') {
        year = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
      } else {
        year = `${startYear - 1}-${startYear.toString().slice(-2)}`;
      }
    }
    
    return {
      type: 'term-week',
      term: termName,
      week: weekNumber,
      year: year
    };
  }
  
  return { type: 'invalid' };
}

/**
 * Parse date queries like "25 March 2027" or "2027-03-25"
 * @param {string} query - Normalized query string
 * @returns {Object} Parsed result
 */
function parseDateQuery(query) {
  const monthNames = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
  };
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = query.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const y = parseInt(year);
    const m = String(parseInt(month)).padStart(2, '0');
    const d = String(parseInt(day)).padStart(2, '0');
    return {
      type: 'date',
      date: `${y}-${m}-${d}`
    };
  }
  
  // Try natural format (25 March 2027 or March 25, 2027)
  const dayMatch = query.match(/\b(\d{1,2})\b/);
  const yearMatch = query.match(/\b(20\d{2})\b/);
  
  let monthNumber = null;
  for (const [name, num] of Object.entries(monthNames)) {
    if (query.includes(name)) {
      monthNumber = num;
      break;
    }
  }
  
  if (dayMatch && monthNumber && yearMatch) {
    const day = parseInt(dayMatch[1]);
    const year = parseInt(yearMatch[1]);
    
    if (day >= 1 && day <= 31) {
      const m = String(monthNumber).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return {
        type: 'date',
        date: `${year}-${m}-${d}`
      };
    }
  }
  
  // Try UK format (DD/MM/YYYY)
  const ukMatch = query.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const y = parseInt(year);
    const m = String(parseInt(month)).padStart(2, '0');
    const d = String(parseInt(day)).padStart(2, '0');
    return {
      type: 'date',
      date: `${y}-${m}-${d}`
    };
  }
  
  return { type: 'invalid' };
}

/**
 * Parse day of week in term week queries like "Tuesday Week 2 Trinity 2025"
 * @param {string} query - Normalized query string
 * @returns {Object} Parsed result
 */
function parseDayWeekQuery(query) {
  const dayNames = {
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
    'sunday': 0, 'sun': 0
  };
  
  // First check if there's a day name at the start
  let dayOfWeek = null;
  let dayName = null;
  
  // Check if query starts with a day name
  for (const [name, day] of Object.entries(dayNames)) {
    if (query.startsWith(name) || query.includes(` ${name} `)) {
      dayOfWeek = day;
      dayName = name;
      break;
    }
  }
  
  if (dayOfWeek === null) {
    return { type: 'invalid' };
  }
  
  // Remove the day name and try to parse as term week
  const queryWithoutDay = query.replace(new RegExp(`\\b${dayName}\\b`, 'i'), '').trim();
  const termWeekResult = parseTermWeekQuery(queryWithoutDay);
  
  if (termWeekResult.type === 'term-week') {
    return {
      type: 'day-term-week',
      dayOfWeek: dayOfWeek,
      term: termWeekResult.term,
      week: termWeekResult.week,
      year: termWeekResult.year
    };
  }
  
  return { type: 'invalid' };
}

/**
 * Extract search suggestions from partial query
 * @param {string} query - Partial query string
 * @returns {Array} Array of suggestion strings
 */
export function getSuggestions(query) {
  if (!query || query.length < 2) {
    return [];
  }
  
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
  if (normalized.startsWith('w') || normalized.startsWith('week')) {
    for (let i = 0; i <= 8; i++) {
      suggestions.push(`Week ${i}`);
    }
  }
  
  // Example patterns if query is very short
  if (normalized.length <= 3) {
    suggestions.push('Week 5 Michaelmas 2025');
    suggestions.push('Tuesday Week 2 Trinity 2025');
    suggestions.push('25 March 2025');
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}