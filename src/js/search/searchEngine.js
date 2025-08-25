/**
 * Search engine for executing Oxford term date queries
 */

import { parseQuery } from './queryParser.js';
import { getWeekData, findTermWeekForDate } from '../data/termService.js';
import { parseISODate, addDays, formatDate, toISODateString } from '../data/dateUtils.js';

/**
 * Execute a search query and return results
 * @param {string} query - User search query
 * @returns {Object} Search results with type and data
 */
export function search(query) {
  const parsed = parseQuery(query);
  
  if (parsed.type === 'invalid') {
    return {
      success: false,
      error: parsed.error || 'Invalid query',
      query: query
    };
  }
  
  switch (parsed.type) {
    case 'term-week':
      return searchTermWeek(parsed);
    
    case 'date':
      return searchDate(parsed);
    
    case 'day-term-week':
      return searchDayTermWeek(parsed);
    
    default:
      return {
        success: false,
        error: 'Unknown query type',
        query: query
      };
  }
}

/**
 * Search for a term week
 * @param {Object} parsed - Parsed query with term, week, year
 * @returns {Object} Search results
 */
function searchTermWeek(parsed) {
  const { term, week, year } = parsed;
  
  try {
    const weekData = getWeekData(year, term, week);
    
    if (!weekData) {
      return {
        success: false,
        error: `Week ${week} of ${capitalizeFirst(term)} ${year} not found`,
        query: parsed
      };
    }
    
    const startDate = parseISODate(weekData.start);
    const endDate = parseISODate(weekData.end);
    
    // Generate all dates in the week
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      success: true,
      type: 'week-range',
      term: term,
      week: week,
      year: year,
      startDate: weekData.start,
      endDate: weekData.end,
      dates: dates,
      displayText: `${capitalizeFirst(term)} Term ${year}, Week ${week}`,
      detailText: `${formatDate(startDate, 'full')} - ${formatDate(endDate, 'full')}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: parsed
    };
  }
}

/**
 * Search for a specific date
 * @param {Object} parsed - Parsed query with date
 * @returns {Object} Search results
 */
function searchDate(parsed) {
  const { date } = parsed;
  
  try {
    const searchDate = parseISODate(date);
    const termWeek = findTermWeekForDate(searchDate);
    
    if (termWeek) {
      return {
        success: true,
        type: 'single-date',
        date: date,
        dates: [searchDate],
        term: termWeek.term,
        week: termWeek.week,
        year: termWeek.year,
        displayText: formatDate(searchDate, 'full'),
        detailText: `${capitalizeFirst(termWeek.term)} Term ${termWeek.year}, Week ${termWeek.week}`
      };
    } else {
      return {
        success: true,
        type: 'single-date',
        date: date,
        dates: [searchDate],
        displayText: formatDate(searchDate, 'full'),
        detailText: 'Outside term time'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: parsed
    };
  }
}

/**
 * Search for a specific day of week in a term week
 * @param {Object} parsed - Parsed query with dayOfWeek, term, week, year
 * @returns {Object} Search results
 */
function searchDayTermWeek(parsed) {
  const { dayOfWeek, term, week, year } = parsed;
  
  try {
    const weekData = getWeekData(year, term, week);
    
    if (!weekData) {
      return {
        success: false,
        error: `Week ${week} of ${capitalizeFirst(term)} ${year} not found`,
        query: parsed
      };
    }
    
    // Find the specific day in the week
    const weekStart = parseISODate(weekData.start);
    const startDay = weekStart.getDay();
    
    // Calculate days to add from Sunday
    // Oxford weeks always start on Sunday (day 0)
    // So we just add the dayOfWeek value directly
    const daysToAdd = dayOfWeek;
    
    const targetDate = addDays(weekStart, daysToAdd);
    
    // Verify the date is within the week
    const weekEnd = parseISODate(weekData.end);
    if (targetDate > weekEnd) {
      return {
        success: false,
        error: 'Date falls outside the specified week',
        query: parsed
      };
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      success: true,
      type: 'single-date',
      date: toISODateString(targetDate),
      dates: [targetDate],
      term: term,
      week: week,
      year: year,
      dayOfWeek: dayOfWeek,
      displayText: formatDate(targetDate, 'full'),
      detailText: `${dayNames[dayOfWeek]}, Week ${week} of ${capitalizeFirst(term)} Term ${year}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: parsed
    };
  }
}

/**
 * Execute multiple searches
 * @param {Array<string>} queries - Array of search queries
 * @returns {Array<Object>} Array of search results
 */
export function searchMultiple(queries) {
  return queries.map(query => search(query));
}

/**
 * Get a human-readable summary of search results
 * @param {Object} results - Search results from search()
 * @returns {string} Human-readable summary
 */
export function getResultSummary(results) {
  if (!results.success) {
    return `Error: ${results.error}`;
  }
  
  switch (results.type) {
    case 'week-range':
      return `Found ${results.displayText}\n${results.detailText}`;
    
    case 'single-date':
      return `${results.displayText}\n${results.detailText}`;
    
    default:
      return 'Unknown result type';
  }
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}