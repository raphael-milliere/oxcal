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
    this.focusedDate = null;
    this.keyboardNavEnabled = false;
    
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    this.dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Bind keyboard event handler
    this.handleKeyDown = this.handleKeyDown.bind(this);
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
    // Adjust for Monday start (0 = Sunday becomes 6, 1 = Monday becomes 0, etc.)
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
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
    const isExtended = termWeek.week === 0 || termWeek.week >= 9;
    const extendedClass = isExtended ? ' extended-week' : '';
    
    return `<span class="term-week-badge ${termClass}${extendedClass}">${weekLabel}</span>`;
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
    if (this.focusedDate && isSameDay(date, this.focusedDate)) classes.push('focused');
    if (this.highlightedDates.some(d => isSameDay(d, date))) classes.push('highlighted');
    if (termWeek) {
      classes.push(`term-${termWeek.term.toLowerCase()}`);
      // Add extended-week class for weeks 0 and 9-12
      if (termWeek.week === 0 || termWeek.week >= 9) {
        classes.push('extended-week');
      }
    }
    
    dayDiv.className = classes.join(' ');
    
    // Set ARIA attributes
    dayDiv.setAttribute('role', 'gridcell');
    dayDiv.setAttribute('tabindex', isCurrentMonth && isSameDay(date, this.focusedDate || this.selectedDate || new Date()) ? '0' : '-1');
    
    const dateStr = formatDate(date, 'full');
    let ariaLabel = dateStr;
    if (termWeek) {
      ariaLabel += `, ${termWeek.term} Term Week ${termWeek.week}`;
    }
    if (isSameDay(date, new Date())) {
      ariaLabel += ', Today';
    }
    dayDiv.setAttribute('aria-label', ariaLabel);
    
    if (this.selectedDate && isSameDay(date, this.selectedDate)) {
      dayDiv.setAttribute('aria-selected', 'true');
    }
    
    if (isSameDay(date, new Date())) {
      dayDiv.setAttribute('aria-current', 'date');
    }
    
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
    
    // Add focus handler for keyboard navigation
    dayDiv.addEventListener('focus', () => {
      if (isCurrentMonth) {
        this.focusedDate = date;
        this.keyboardNavEnabled = true;
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
    
    // Remove existing keyboard listener
    this.container.removeEventListener('keydown', this.handleKeyDown);
    
    // Clear container
    this.container.innerHTML = '';
    
    // Add day headers
    this.dayNames.forEach((dayName, index) => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = dayName;
      header.setAttribute('role', 'columnheader');
      header.setAttribute('aria-label', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]);
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
    
    // Add keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown);
    
    // Set initial focus if needed
    if (!this.focusedDate) {
      this.focusedDate = this.selectedDate || new Date();
    }
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
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (!this.keyboardNavEnabled || !this.focusedDate) return;
    
    const key = event.key;
    let newDate = new Date(this.focusedDate);
    let handled = false;
    
    switch (key) {
      case 'ArrowLeft':
        newDate.setDate(newDate.getDate() - 1);
        handled = true;
        break;
      case 'ArrowRight':
        newDate.setDate(newDate.getDate() + 1);
        handled = true;
        break;
      case 'ArrowUp':
        newDate.setDate(newDate.getDate() - 7);
        handled = true;
        break;
      case 'ArrowDown':
        newDate.setDate(newDate.getDate() + 7);
        handled = true;
        break;
      case 'Home':
        // Go to start of week (Monday)
        const dayOfWeek = newDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        newDate.setDate(newDate.getDate() + daysToMonday);
        handled = true;
        break;
      case 'End':
        // Go to end of week (Sunday)
        const currentDay = newDate.getDay();
        const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;
        newDate.setDate(newDate.getDate() + daysToSunday);
        handled = true;
        break;
      case 'PageUp':
        if (event.shiftKey) {
          // Previous year
          newDate.setFullYear(newDate.getFullYear() - 1);
        } else {
          // Previous month
          newDate.setMonth(newDate.getMonth() - 1);
        }
        handled = true;
        break;
      case 'PageDown':
        if (event.shiftKey) {
          // Next year
          newDate.setFullYear(newDate.getFullYear() + 1);
        } else {
          // Next month
          newDate.setMonth(newDate.getMonth() + 1);
        }
        handled = true;
        break;
      case 'Enter':
      case ' ':
        // Select the focused date
        this.selectDate(this.focusedDate);
        handled = true;
        break;
      case 'Escape':
        // Clear selection
        this.selectedDate = null;
        this.render();
        this.emit('select', { date: null });
        handled = true;
        break;
    }
    
    if (handled) {
      event.preventDefault();
      
      // Update focused date
      const oldMonth = this.focusedDate.getMonth();
      const oldYear = this.focusedDate.getFullYear();
      const newMonth = newDate.getMonth();
      const newYear = newDate.getFullYear();
      
      this.focusedDate = newDate;
      
      // Check if we need to change month view
      if (oldMonth !== newMonth || oldYear !== newYear) {
        this.setMonth(newDate);
        this.emit('navigate', { month: newDate });
      } else {
        // Update focus within current month
        this.updateFocus();
      }
      
      // Announce change to screen readers
      this.announceDate(newDate);
    }
  }
  
  /**
   * Update focus to the focused date
   */
  updateFocus() {
    // Remove tabindex from all cells
    const cells = this.container.querySelectorAll('.calendar-day');
    cells.forEach(cell => {
      cell.setAttribute('tabindex', '-1');
      cell.classList.remove('focused');
    });
    
    // Set tabindex and focus on the focused date
    if (this.focusedDate) {
      const focusedDateStr = this.focusedDate.toISOString().split('T')[0];
      const focusedCell = this.container.querySelector(`[data-date="${focusedDateStr}"]`);
      if (focusedCell && !focusedCell.classList.contains('other-month')) {
        focusedCell.setAttribute('tabindex', '0');
        focusedCell.classList.add('focused');
        focusedCell.focus();
      }
    }
  }
  
  /**
   * Announce date to screen readers
   * @param {Date} date - Date to announce
   */
  announceDate(date) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    
    const termWeek = findTermWeekForDate(date);
    let text = formatDate(date, 'full');
    if (termWeek) {
      text += `, ${termWeek.term} Term Week ${termWeek.week}`;
    }
    
    announcement.textContent = text;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  /**
   * Destroy the calendar and clean up
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener('keydown', this.handleKeyDown);
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