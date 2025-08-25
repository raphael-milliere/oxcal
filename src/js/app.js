/**
 * Main application entry point
 */

import { loadTermsData, getCurrentAcademicYear, findTermWeekForDate } from './data/termService.js';
import { getToday, formatDate } from './data/dateUtils.js';
import { Calendar } from './components/calendar.js';

// Application state
let appState = {
  termsLoaded: false,
  currentDate: getToday(),
  currentMonth: new Date(),
  selectedDate: null,
  calendar: null
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
    initializeCalendar();
    initializeEventListeners();
    updateCurrentTermInfo();
    
    showLoading(false);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError('Failed to load term data. Please refresh the page.');
    showLoading(false);
  }
}

/**
 * Initialize calendar component
 */
function initializeCalendar() {
  const gridElement = document.getElementById('calendar-grid');
  if (!gridElement) return;
  
  // Create calendar instance
  appState.calendar = new Calendar(gridElement);
  
  // Set up event listeners
  appState.calendar.on('select', ({ date }) => {
    appState.selectedDate = date;
    updateSelectedDateInfo(date);
  });
  
  appState.calendar.on('navigate', ({ month }) => {
    appState.currentMonth = month;
    updateMonthHeader();
  });
  
  // Initial render
  appState.calendar.setMonth(appState.currentMonth);
  updateMonthHeader();
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
    prevButton.addEventListener('click', () => {
      if (appState.calendar) {
        appState.calendar.navigateMonth(-1);
      }
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (appState.calendar) {
        appState.calendar.navigateMonth(1);
      }
    });
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
 * Update month header
 */
function updateMonthHeader() {
  const monthElement = document.getElementById('current-month');
  if (!monthElement || !appState.calendar) return;
  
  monthElement.textContent = appState.calendar.getMonthDisplayString();
}

/**
 * Update selected date information
 */
function updateSelectedDateInfo(date) {
  const resultDiv = document.getElementById('search-result');
  if (!resultDiv) return;
  
  const termWeek = findTermWeekForDate(date);
  
  if (termWeek) {
    resultDiv.innerHTML = `
      <div class="result-info">
        <div class="result-title">Selected Date</div>
        <div class="result-details">
          <strong>${formatDate(date, 'full')}</strong><br>
          ${termWeek.term.charAt(0).toUpperCase() + termWeek.term.slice(1)} Term, Week ${termWeek.week}<br>
          Academic Year ${termWeek.year}
        </div>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="result-info">
        <div class="result-title">Selected Date</div>
        <div class="result-details">
          <strong>${formatDate(date, 'full')}</strong><br>
          Outside term time
        </div>
      </div>
    `;
  }
  
  resultDiv.classList.add('active');
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