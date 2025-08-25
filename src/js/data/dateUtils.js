/**
 * Utility functions for date operations
 */

/**
 * Parse an ISO date string to a Date object
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {Date} Parsed date object
 */
export function parseISODate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date to ISO string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
export function toISODateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the number of days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of days between dates
 */
export function daysBetween(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISODate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISODate(date2) : date2;
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date falls within a range (inclusive)
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {boolean} True if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const start = typeof startDate === 'string' ? parseISODate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISODate(endDate) : endDate;
  
  // Set end date to end of day for inclusive comparison
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  
  return d >= start && d <= endOfDay;
}

/**
 * Get the day of week name
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Day name (e.g., "Monday")
 */
export function getDayName(date) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
}

/**
 * Get the short day name
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Short day name (e.g., "Mon")
 */
export function getShortDayName(date) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
}

/**
 * Get month name
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Month name (e.g., "January")
 */
export function getMonthName(date) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[d.getMonth()];
}

/**
 * Get short month name
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Short month name (e.g., "Jan")
 */
export function getShortMonthName(date) {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[d.getMonth()];
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: "full", "short", "month-day", "day-month"
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'full') {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  
  switch (format) {
    case 'full':
      // e.g., "Monday, 25 January 2024"
      return `${getDayName(d)}, ${d.getDate()} ${getMonthName(d)} ${d.getFullYear()}`;
    
    case 'short':
      // e.g., "Mon 25 Jan 2024"
      return `${getShortDayName(d)} ${d.getDate()} ${getShortMonthName(d)} ${d.getFullYear()}`;
    
    case 'month-day':
      // e.g., "25 January"
      return `${d.getDate()} ${getMonthName(d)}`;
    
    case 'day-month':
      // e.g., "25 Jan"
      return `${d.getDate()} ${getShortMonthName(d)}`;
    
    default:
      return toISODateString(d);
  }
}

/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the Sunday starting a week for any date
 * @param {Date|string} date - Any date in the week
 * @returns {Date} Sunday of that week
 */
export function getWeekStart(date) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get the Saturday ending a week for any date
 * @param {Date|string} date - Any date in the week
 * @returns {Date} Saturday of that week
 */
export function getWeekEnd(date) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return new Date(d.setDate(diff));
}

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISODate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISODate(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Get today's date at midnight
 * @returns {Date} Today's date with time set to 00:00:00
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}