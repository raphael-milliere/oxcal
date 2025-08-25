/**
 * Service for accessing and querying Oxford term data
 */

let termsData = null;

/**
 * Load terms data from JSON file
 * @returns {Promise<Object>} The loaded terms data
 */
export async function loadTermsData() {
  if (termsData) {
    return termsData;
  }
  
  try {
    const response = await fetch('/terms.json');
    if (!response.ok) {
      throw new Error(`Failed to load terms data: ${response.status}`);
    }
    const data = await response.json();
    termsData = data;
    return data;
  } catch (error) {
    console.error('Error loading terms data:', error);
    throw error;
  }
}

/**
 * Get all terms for a specific academic year
 * @param {string} year - Academic year in format "YYYY-YY" (e.g., "2024-25")
 * @returns {Object|null} Year data containing all three terms
 */
export function getYearData(year) {
  if (!termsData) {
    throw new Error('Terms data not loaded. Call loadTermsData() first.');
  }
  
  const yearData = termsData.terms.find(t => t.year === year);
  return yearData || null;
}

/**
 * Get data for a specific term
 * @param {string} year - Academic year in format "YYYY-YY"
 * @param {string} termName - Term name: "michaelmas", "hilary", or "trinity"
 * @returns {Object|null} Term data containing all weeks
 */
export function getTermData(year, termName) {
  const yearData = getYearData(year);
  if (!yearData) return null;
  
  const normalizedTermName = termName.toLowerCase();
  return yearData[normalizedTermName] || null;
}

/**
 * Get data for a specific week
 * @param {string} year - Academic year in format "YYYY-YY"
 * @param {string} termName - Term name: "michaelmas", "hilary", or "trinity"
 * @param {number} weekNumber - Week number (0-12)
 * @returns {Object|null} Week data with start and end dates
 */
export function getWeekData(year, termName, weekNumber) {
  const termData = getTermData(year, termName);
  if (!termData) return null;
  
  const weekKey = `week${weekNumber}`;
  return termData[weekKey] || null;
}

/**
 * Find which term and week a given date falls into
 * @param {Date|string} date - Date to check
 * @returns {Object|null} Object with year, term, week, and week data
 */
export function findTermWeekForDate(date) {
  if (!termsData) {
    throw new Error('Terms data not loaded. Call loadTermsData() first.');
  }
  
  const searchDate = typeof date === 'string' ? new Date(date) : date;
  const searchDateStr = searchDate.toISOString().split('T')[0];
  
  for (const yearData of termsData.terms) {
    for (const termName of ['michaelmas', 'hilary', 'trinity']) {
      const termData = yearData[termName];
      if (!termData) continue;
      
      for (let weekNum = 0; weekNum <= 12; weekNum++) {
        const weekData = termData[`week${weekNum}`];
        if (!weekData) continue;
        
        const startDate = new Date(weekData.start);
        const endDate = new Date(weekData.end);
        endDate.setHours(23, 59, 59, 999); // Include the full end day
        
        if (searchDate >= startDate && searchDate <= endDate) {
          return {
            year: yearData.year,
            term: termName,
            week: weekNum,
            weekData: weekData
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all available academic years
 * @returns {string[]} Array of academic years
 */
export function getAvailableYears() {
  if (!termsData) {
    throw new Error('Terms data not loaded. Call loadTermsData() first.');
  }
  
  return termsData.terms.map(t => t.year);
}

/**
 * Get the current academic year based on today's date
 * @returns {string|null} Current academic year or null if not in term
 */
export function getCurrentAcademicYear() {
  const today = new Date();
  const termWeek = findTermWeekForDate(today);
  
  if (termWeek) {
    return termWeek.year;
  }
  
  // If not in a term, determine the most relevant academic year
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  // If July-December, current year is start of academic year
  // If January-June, previous year is start of academic year
  if (currentMonth >= 7) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
}

/**
 * Get dates for Full Term (weeks 1-8)
 * @param {string} year - Academic year
 * @param {string} termName - Term name
 * @returns {Object|null} Object with start and end dates of Full Term
 */
export function getFullTermDates(year, termName) {
  const week1 = getWeekData(year, termName, 1);
  const week8 = getWeekData(year, termName, 8);
  
  if (!week1 || !week8) return null;
  
  return {
    start: week1.start,
    end: week8.end
  };
}