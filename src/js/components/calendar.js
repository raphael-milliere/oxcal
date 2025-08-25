/**
 * Calendar component for displaying Oxford term dates
 */

import { findTermWeekForDate, getTermData } from '../data/termService.js';
import { formatDate, isSameDay, getWeekStart, getWeekEnd } from '../data/dateUtils.js';

/**
 * Calendar component class
 */
export class Calendar {
  constructor(container) {
    this.container = container;
    this.currentMonth = new Date();
    this.selectedDate = null;
    this.highlightedDates = [];
    this.listeners = {};
    
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  
  /**
   * Set the current month to display
   * @param {Date} date - Any date in the desired month
   */
  setMonth(date) {
    this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    this.render();
  }
  
  /**
   * Navigate to previous or next month
   * @param {number} direction - -1 for previous, 1 for next
   */
  navigateMonth(direction) {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    this.setMonth(newMonth);
    this.emit('navigate', { month: newMonth });
  }
  
  /**
   * Select a date in the calendar
   * @param {Date} date - Date to select
   */
  selectDate(date) {
    this.selectedDate = date;
    this.render();
    this.emit('select', { date });
  }
  
  /**
   * Highlight multiple dates (e.g., search results)
   * @param {Array<Date>} dates - Dates to highlight
   */
  highlightDates(dates) {
    this.highlightedDates = dates || [];
    this.render();
  }
  
  /**
   * Clear all highlighted dates
   */
  clearHighlights() {
    this.highlightedDates = [];
    this.render();
  }
  
  /**
   * Get calendar grid data for a month
   * @param {number} year - Full year
   * @param {number} month - Month (0-11)
   * @returns {Array} Array of date objects for the grid
   */
  getMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const grid = [];
    
    // Add previous month's trailing days
    if (startPadding > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startPadding - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i);
        grid.push({
          date,
          isCurrentMonth: false,
          isPreviousMonth: true,
          isNextMonth: false
        });
      }
    }
    
    // Add current month's days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      grid.push({
        date,
        isCurrentMonth: true,
        isPreviousMonth: false,
        isNextMonth: false
      });
    }
    
    // Add next month's leading days to complete the grid
    const remainingCells = 42 - grid.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      grid.push({
        date,
        isCurrentMonth: false,
        isPreviousMonth: false,
        isNextMonth: true
      });
    }
    
    // Add term week information to each day
    return grid.map(day => ({
      ...day,
      termWeek: findTermWeekForDate(day.date)
    }));
  }
  
  /**
   * Create term week badge element
   * @param {Object} termWeek - Term week data
   * @returns {string} HTML string for badge
   */
  createTermWeekBadge(termWeek) {
    if (!termWeek) return '';
    
    const termClass = termWeek.term.toLowerCase();
    const weekLabel = `Wk ${termWeek.week}`;
    
    return `<span class="term-week-badge ${termClass}">${weekLabel}</span>`;
  }
  
  /**
   * Create day cell element
   * @param {Object} dayData - Day data object
   * @returns {HTMLElement} Day cell element
   */
  createDayCell(dayData) {
    const { date, isCurrentMonth, termWeek } = dayData;
    const dayDiv = document.createElement('div');
    
    // Build class list
    const classes = ['calendar-day'];
    if (!isCurrentMonth) classes.push('other-month');
    if (isSameDay(date, new Date())) classes.push('today');
    if (this.selectedDate && isSameDay(date, this.selectedDate)) classes.push('selected');
    if (this.highlightedDates.some(d => isSameDay(d, date))) classes.push('highlighted');
    if (termWeek) classes.push(`term-${termWeek.term.toLowerCase()}`);
    
    dayDiv.className = classes.join(' ');
    
    // Create day content
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);
    
    // Add term week badge if applicable
    if (termWeek && isCurrentMonth) {
      const badge = document.createElement('div');
      badge.innerHTML = this.createTermWeekBadge(termWeek);
      dayDiv.appendChild(badge);
    }
    
    // Add click handler
    dayDiv.addEventListener('click', () => {
      if (isCurrentMonth) {
        this.selectDate(date);
      }
    });
    
    // Add data attributes for testing
    dayDiv.setAttribute('data-date', date.toISOString().split('T')[0]);
    if (termWeek) {
      dayDiv.setAttribute('data-term', termWeek.term);
      dayDiv.setAttribute('data-week', termWeek.week);
    }
    
    return dayDiv;
  }
  
  /**
   * Render the calendar
   */
  render() {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Add day headers
    this.dayNames.forEach(dayName => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = dayName;
      this.container.appendChild(header);
    });
    
    // Get and render month grid
    const grid = this.getMonthGrid(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth()
    );
    
    grid.forEach(dayData => {
      const dayCell = this.createDayCell(dayData);
      this.container.appendChild(dayCell);
    });
  }
  
  /**
   * Get current month display string
   * @returns {string} Month and year string
   */
  getMonthDisplayString() {
    const month = this.monthNames[this.currentMonth.getMonth()];
    const year = this.currentMonth.getFullYear();
    return `${month} ${year}`;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }
  
  /**
   * Emit event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      callback(data);
    });
  }
  
  /**
   * Destroy the calendar and clean up
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.listeners = {};
  }
}

/**
 * Factory function to create calendar instance
 * @param {HTMLElement} container - Container element
 * @returns {Calendar} Calendar instance
 */
export function createCalendar(container) {
  return new Calendar(container);
}