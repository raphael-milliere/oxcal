/**
 * Search suggestions module for Oxford term dates
 */

import { getAvailableYears, getCurrentAcademicYear } from '../data/termService.js';

/**
 * Generate search suggestions based on partial input
 * @param {string} input - Partial user input
 * @param {Object} options - Options for suggestion generation
 * @returns {Array<Object>} Array of suggestion objects
 */
export function generateSuggestions(input, options = {}) {
  if (!input || input.length < 2) {
    return getDefaultSuggestions();
  }
  
  const normalized = input.toLowerCase().trim();
  const suggestions = [];
  
  // Add term-based suggestions
  suggestions.push(...getTermSuggestions(normalized, options));
  
  // Add week-based suggestions
  suggestions.push(...getWeekSuggestions(normalized, options));
  
  // Add day-based suggestions
  suggestions.push(...getDaySuggestions(normalized, options));
  
  // Add date format suggestions
  suggestions.push(...getDateFormatSuggestions(normalized));
  
  // Remove duplicates and limit
  const unique = Array.from(new Map(
    suggestions.map(s => [s.text, s])
  ).values());
  
  return unique.slice(0, options.maxSuggestions || 8);
}

/**
 * Get default suggestions when no input
 * @returns {Array<Object>} Default suggestions
 */
function getDefaultSuggestions() {
  const currentYear = getCurrentAcademicYear();
  const nextYear = getNextAcademicYear(currentYear);
  
  return [
    {
      text: `Week 1 Michaelmas ${currentYear}`,
      type: 'example',
      description: 'First week of Michaelmas term'
    },
    {
      text: `Week 5 Hilary ${currentYear}`,
      type: 'example',
      description: 'Fifth week of Hilary term'
    },
    {
      text: `Trinity ${currentYear} Week 8`,
      type: 'example',
      description: 'Last week of Trinity full term'
    },
    {
      text: 'Tuesday Week 3',
      type: 'example',
      description: 'Specific day in a term week'
    }
  ];
}

/**
 * Get term-based suggestions
 * @param {string} input - Normalized input
 * @param {Object} options - Options
 * @returns {Array<Object>} Term suggestions
 */
function getTermSuggestions(input, options = {}) {
  const suggestions = [];
  const terms = [
    { name: 'Michaelmas', abbrev: ['mich', 'mt'] },
    { name: 'Hilary', abbrev: ['hil', 'ht'] },
    { name: 'Trinity', abbrev: ['trin', 'tt'] }
  ];
  
  const currentYear = getCurrentAcademicYear();
  
  for (const term of terms) {
    const termLower = term.name.toLowerCase();
    
    // Check if input matches term name or abbreviation
    const matches = termLower.startsWith(input) || 
                   term.abbrev.some(a => a.startsWith(input));
    
    if (matches) {
      // Add term with current year
      suggestions.push({
        text: `${term.name} ${currentYear}`,
        type: 'term',
        description: `${term.name} term of ${currentYear}`
      });
      
      // Add term with week examples
      suggestions.push({
        text: `Week 1 ${term.name} ${currentYear}`,
        type: 'term-week',
        description: `First week of ${term.name} term`
      });
      
      if (input.length > 2) {
        suggestions.push({
          text: `Week 5 ${term.name} ${currentYear}`,
          type: 'term-week',
          description: `Fifth week of ${term.name} term`
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Get week-based suggestions
 * @param {string} input - Normalized input
 * @param {Object} options - Options
 * @returns {Array<Object>} Week suggestions
 */
function getWeekSuggestions(input, options = {}) {
  const suggestions = [];
  
  if (input.startsWith('w') || input.startsWith('week')) {
    const currentYear = getCurrentAcademicYear();
    
    // Extract week number if present
    const weekMatch = input.match(/w(?:ee)?k?\s*(\d+)/);
    const weekNum = weekMatch ? parseInt(weekMatch[1]) : null;
    
    if (weekNum !== null && weekNum >= 0 && weekNum <= 12) {
      // Specific week number with all terms
      suggestions.push({
        text: `Week ${weekNum} Michaelmas ${currentYear}`,
        type: 'week',
        description: `Week ${weekNum} of Michaelmas term`
      });
      
      suggestions.push({
        text: `Week ${weekNum} Hilary ${currentYear}`,
        type: 'week',
        description: `Week ${weekNum} of Hilary term`
      });
      
      suggestions.push({
        text: `Week ${weekNum} Trinity ${currentYear}`,
        type: 'week',
        description: `Week ${weekNum} of Trinity term`
      });
    } else {
      // Generic week suggestions
      const weeks = [0, 1, 4, 5, 8];
      for (const week of weeks) {
        suggestions.push({
          text: `Week ${week}`,
          type: 'week-partial',
          description: week === 0 ? 'Week before full term' : 
                      week === 8 ? 'Last week of full term' : 
                      `Week ${week} of term`
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Get day-based suggestions
 * @param {string} input - Normalized input
 * @param {Object} options - Options
 * @returns {Array<Object>} Day suggestions
 */
function getDaySuggestions(input, options = {}) {
  const suggestions = [];
  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];
  
  const currentYear = getCurrentAcademicYear();
  
  for (const day of days) {
    if (day.toLowerCase().startsWith(input)) {
      suggestions.push({
        text: `${day} Week 1`,
        type: 'day-partial',
        description: `${day} of Week 1`
      });
      
      if (input.length > 2) {
        suggestions.push({
          text: `${day} Week 5 Michaelmas ${currentYear}`,
          type: 'day-week',
          description: `${day} of Week 5, Michaelmas term`
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Get date format suggestions
 * @param {string} input - Normalized input
 * @param {Object} options - Options
 * @returns {Array<Object>} Date format suggestions
 */
function getDateFormatSuggestions(input) {
  const suggestions = [];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Check if input looks like a date
  const hasNumber = /\d/.test(input);
  
  if (hasNumber) {
    const currentYear = new Date().getFullYear();
    
    // Check for day number
    const dayMatch = input.match(/^(\d{1,2})/);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      if (day >= 1 && day <= 31) {
        // Suggest months for this day
        const relevantMonths = getRelevantMonths();
        for (const month of relevantMonths) {
          suggestions.push({
            text: `${day} ${month} ${currentYear}`,
            type: 'date',
            description: `Date in ${month}`
          });
        }
      }
    }
  }
  
  // Month name suggestions
  for (const month of months) {
    if (month.toLowerCase().startsWith(input)) {
      const currentYear = new Date().getFullYear();
      suggestions.push({
        text: `15 ${month} ${currentYear}`,
        type: 'date',
        description: `Mid-${month} date`
      });
    }
  }
  
  return suggestions;
}

/**
 * Get relevant months for current time of year
 * @returns {Array<string>} Array of month names
 */
function getRelevantMonths() {
  const currentMonth = new Date().getMonth();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Return current month and next 3 months
  const relevant = [];
  for (let i = 0; i < 4; i++) {
    relevant.push(months[(currentMonth + i) % 12]);
  }
  return relevant;
}

/**
 * Get next academic year from current
 * @param {string} currentYear - Current academic year (e.g., "2024-25")
 * @returns {string} Next academic year
 */
function getNextAcademicYear(currentYear) {
  if (!currentYear) return '2025-26';
  
  const [startYear] = currentYear.split('-');
  const nextStart = parseInt(startYear) + 1;
  const nextEnd = (nextStart + 1).toString().slice(-2);
  return `${nextStart}-${nextEnd}`;
}

/**
 * Format suggestions for display
 * @param {Array<Object>} suggestions - Raw suggestions
 * @returns {Array<string>} Formatted suggestion strings
 */
export function formatSuggestionsForDisplay(suggestions) {
  return suggestions.map(s => s.text);
}

/**
 * Get suggestion details
 * @param {Object} suggestion - Suggestion object
 * @returns {string} HTML string with suggestion details
 */
export function getSuggestionHTML(suggestion) {
  return `
    <div class="suggestion-item" data-type="${suggestion.type}">
      <span class="suggestion-text">${suggestion.text}</span>
      <span class="suggestion-description">${suggestion.description}</span>
    </div>
  `;
}