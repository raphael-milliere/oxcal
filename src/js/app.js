/**
 * Main application entry point
 */

import { loadTermsData, getCurrentAcademicYear, findTermWeekForDate } from './data/termService.js';
import { getToday, formatDate } from './data/dateUtils.js';

// Application state
let appState = {
  termsLoaded: false,
  currentDate: getToday(),
  currentMonth: new Date(),
  selectedDate: null
};

/**
 * Initialize the application
 */
async function init() {
  try {
    showLoading(true);
    
    // Load terms data
    await loadTermsData();
    appState.termsLoaded = true;
    
    // Set current month to today
    appState.currentMonth = new Date();
    
    // Initialize UI components
    initializeEventListeners();
    updateCalendarDisplay();
    updateCurrentTermInfo();
    
    showLoading(false);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError('Failed to load term data. Please refresh the page.');
    showLoading(false);
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Search functionality
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('date-search');
  
  if (searchButton) {
    searchButton.addEventListener('click', handleSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  // Calendar navigation
  const prevButton = document.getElementById('prev-month');
  const nextButton = document.getElementById('next-month');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => navigateMonth(-1));
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => navigateMonth(1));
  }
}

/**
 * Handle search functionality
 */
function handleSearch() {
  const input = document.getElementById('date-search');
  const resultDiv = document.getElementById('search-result');
  
  if (!input || !resultDiv) return;
  
  const query = input.value.trim();
  if (!query) {
    resultDiv.classList.remove('active');
    return;
  }
  
  // For now, just show a placeholder result
  resultDiv.innerHTML = `
    <div class="result-info">
      <div class="result-title">Search Results</div>
      <div class="result-details">
        Search functionality will be implemented in Stage 3.
        <br>Query: "${query}"
      </div>
    </div>
  `;
  resultDiv.classList.add('active');
}

/**
 * Navigate calendar months
 */
function navigateMonth(direction) {
  appState.currentMonth.setMonth(appState.currentMonth.getMonth() + direction);
  updateCalendarDisplay();
}

/**
 * Update calendar display
 */
function updateCalendarDisplay() {
  const monthElement = document.getElementById('current-month');
  const gridElement = document.getElementById('calendar-grid');
  
  if (!monthElement || !gridElement) return;
  
  // Update month header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  monthElement.textContent = `${monthNames[appState.currentMonth.getMonth()]} ${appState.currentMonth.getFullYear()}`;
  
  // For now, create a simple calendar grid
  gridElement.innerHTML = `
    <div class="calendar-day-header">Sun</div>
    <div class="calendar-day-header">Mon</div>
    <div class="calendar-day-header">Tue</div>
    <div class="calendar-day-header">Wed</div>
    <div class="calendar-day-header">Thu</div>
    <div class="calendar-day-header">Fri</div>
    <div class="calendar-day-header">Sat</div>
  `;
  
  // Add placeholder days (full calendar implementation in Stage 2)
  const daysInMonth = new Date(
    appState.currentMonth.getFullYear(),
    appState.currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDay = new Date(
    appState.currentMonth.getFullYear(),
    appState.currentMonth.getMonth(),
    1
  ).getDay();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    gridElement.innerHTML += '<div class="calendar-day other-month"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      appState.currentMonth.getFullYear(),
      appState.currentMonth.getMonth(),
      day
    );
    
    const isToday = 
      date.getDate() === appState.currentDate.getDate() &&
      date.getMonth() === appState.currentDate.getMonth() &&
      date.getFullYear() === appState.currentDate.getFullYear();
    
    const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
    
    gridElement.innerHTML += `
      <div class="${dayClass}">
        <div class="day-number">${day}</div>
      </div>
    `;
  }
}

/**
 * Update current term information
 */
function updateCurrentTermInfo() {
  const infoElement = document.getElementById('current-term-info');
  if (!infoElement) return;
  
  const today = getToday();
  const termWeek = findTermWeekForDate(today);
  
  if (termWeek) {
    infoElement.innerHTML = `
      <div class="term-info-item">
        <span class="term-info-label">Current Date:</span>
        <span class="term-info-value">${formatDate(today, 'full')}</span>
      </div>
      <div class="term-info-item">
        <span class="term-info-label">Academic Year:</span>
        <span class="term-info-value">${termWeek.year}</span>
      </div>
      <div class="term-info-item">
        <span class="term-info-label">Term:</span>
        <span class="term-info-value">${termWeek.term.charAt(0).toUpperCase() + termWeek.term.slice(1)}</span>
      </div>
      <div class="term-info-item">
        <span class="term-info-label">Week:</span>
        <span class="term-info-value">Week ${termWeek.week}</span>
      </div>
    `;
  } else {
    const currentYear = getCurrentAcademicYear();
    infoElement.innerHTML = `
      <div class="term-info-item">
        <span class="term-info-label">Current Date:</span>
        <span class="term-info-value">${formatDate(today, 'full')}</span>
      </div>
      <div class="term-info-item">
        <span class="term-info-label">Status:</span>
        <span class="term-info-value">Outside term time</span>
      </div>
      <div class="term-info-item">
        <span class="term-info-label">Academic Year:</span>
        <span class="term-info-value">${currentYear || 'N/A'}</span>
      </div>
    `;
  }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    if (show) {
      loadingElement.classList.add('active');
    } else {
      loadingElement.classList.remove('active');
    }
  }
}

/**
 * Show error message
 */
function showError(message) {
  console.error(message);
  // In a real app, would show this in the UI
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}