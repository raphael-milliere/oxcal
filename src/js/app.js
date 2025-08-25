/**
 * Main application entry point
 */

import { loadTermsData, getCurrentAcademicYear, findTermWeekForDate } from './data/termService.js';
import { getToday, formatDate } from './data/dateUtils.js';
import { Calendar } from './components/calendar.js';
import { search, generateSuggestions, getSuggestionHTML } from './search/index.js';
import themeManager from './themeManager.js';
import './pwa.js';

// Application state
let appState = {
  termsLoaded: false,
  currentDate: getToday(),
  currentMonth: new Date(),
  selectedDate: null,
  calendar: null,
  searchResults: null,
  suggestions: [],
  selectedSuggestionIndex: -1
};

/**
 * Initialize the application
 */
async function init() {
  try {
    showLoading(true);
    
    // Initialize theme manager first (requires DOM to be ready)
    themeManager.init();
    
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
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Remove any existing listeners to prevent duplicates
    const newToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newToggle, themeToggle);
    
    // Add click listener to the fresh element
    newToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const newTheme = themeManager.toggle();
      
      // Update button aria-label
      newToggle.setAttribute('aria-label', 
        newTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      newToggle.setAttribute('title',
        newTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    
    // Set initial aria-label based on current theme
    const currentTheme = themeManager.getTheme();
    newToggle.setAttribute('aria-label',
      currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    newToggle.setAttribute('title',
      currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  
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
    
    // Add input handler for suggestions
    searchInput.addEventListener('input', handleSearchInput);
    
    // Add keyboard navigation for suggestions
    searchInput.addEventListener('keydown', handleSearchKeyDown);
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-group')) {
        hideSuggestions();
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
    hideSuggestions();
    return;
  }
  
  // Execute search
  const results = search(query);
  appState.searchResults = results;
  
  if (results.success) {
    displaySearchResults(results);
    
    // Navigate calendar to show results
    if (results.dates && results.dates.length > 0) {
      const firstDate = results.dates[0];
      if (appState.calendar) {
        appState.calendar.setMonth(firstDate);
        appState.calendar.highlightDates(results.dates);
      }
    }
  } else {
    // Show error
    resultDiv.innerHTML = `
      <div class="result-info error">
        <div class="result-title">No Results Found</div>
        <div class="result-details">
          ${results.error || 'Could not parse your query. Try "Week 5 Michaelmas 2025" or "25 March 2025".'}
        </div>
      </div>
    `;
    resultDiv.classList.add('active');
  }
  
  hideSuggestions();
}

/**
 * Display search results
 */
function displaySearchResults(results) {
  const resultDiv = document.getElementById('search-result');
  if (!resultDiv) return;
  
  let html = '';
  
  if (results.type === 'week-range') {
    html = `
      <div class="result-info">
        <div class="result-title">${results.displayText}</div>
        <div class="result-details">
          ${results.detailText}
        </div>
      </div>
    `;
  } else if (results.type === 'single-date') {
    html = `
      <div class="result-info">
        <div class="result-title">${results.displayText}</div>
        <div class="result-details">
          ${results.detailText}
        </div>
      </div>
    `;
  }
  
  resultDiv.innerHTML = html;
  resultDiv.classList.add('active');
}

/**
 * Handle search input changes for suggestions
 */
function handleSearchInput(e) {
  const query = e.target.value;
  
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  
  // Generate and display suggestions
  const suggestions = generateSuggestions(query);
  appState.suggestions = suggestions;
  appState.selectedSuggestionIndex = -1;
  displaySuggestions(suggestions);
}

/**
 * Handle keyboard navigation in search input
 */
function handleSearchKeyDown(e) {
  const suggestionsContainer = document.getElementById('search-suggestions');
  if (!suggestionsContainer || !suggestionsContainer.classList.contains('active')) {
    return;
  }
  
  const key = e.key;
  let handled = false;
  
  switch (key) {
    case 'ArrowDown':
      e.preventDefault();
      appState.selectedSuggestionIndex = Math.min(
        appState.selectedSuggestionIndex + 1,
        appState.suggestions.length - 1
      );
      updateSuggestionSelection();
      handled = true;
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      appState.selectedSuggestionIndex = Math.max(
        appState.selectedSuggestionIndex - 1,
        -1
      );
      updateSuggestionSelection();
      handled = true;
      break;
      
    case 'Enter':
      if (appState.selectedSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(appState.selectedSuggestionIndex);
        handled = true;
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      hideSuggestions();
      handled = true;
      break;
      
    case 'Tab':
      // Allow Tab to move to next suggestion or exit
      if (appState.suggestions.length > 0) {
        if (!e.shiftKey && appState.selectedSuggestionIndex < appState.suggestions.length - 1) {
          e.preventDefault();
          appState.selectedSuggestionIndex++;
          updateSuggestionSelection();
          handled = true;
        } else if (e.shiftKey && appState.selectedSuggestionIndex > 0) {
          e.preventDefault();
          appState.selectedSuggestionIndex--;
          updateSuggestionSelection();
          handled = true;
        }
      }
      break;
  }
  
  if (handled) {
    // Announce to screen readers
    announceSelectedSuggestion();
  }
}

/**
 * Display search suggestions
 */
function displaySuggestions(suggestions) {
  const container = document.getElementById('search-suggestions');
  if (!container) {
    // Create suggestions container if it doesn't exist
    const searchContainer = document.querySelector('.search-input-group');
    if (searchContainer) {
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.id = 'search-suggestions';
      suggestionsDiv.className = 'search-suggestions';
      suggestionsDiv.setAttribute('role', 'listbox');
      suggestionsDiv.setAttribute('aria-label', 'Search suggestions');
      searchContainer.appendChild(suggestionsDiv);
    }
  }
  
  const suggestionsContainer = document.getElementById('search-suggestions');
  if (!suggestionsContainer) return;
  
  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }
  
  const html = suggestions.map((s, index) => {
    const isSelected = index === appState.selectedSuggestionIndex;
    return `
      <div class="suggestion-item ${isSelected ? 'selected' : ''}" 
           role="option" 
           aria-selected="${isSelected}"
           data-index="${index}">
        ${getSuggestionHTML(s).match(/<div class="suggestion-text">(.*?)<\/div>/)?.[0] || ''}
        ${getSuggestionHTML(s).match(/<div class="suggestion-description">(.*?)<\/div>/)?.[0] || ''}
      </div>
    `;
  }).join('');
  
  suggestionsContainer.innerHTML = html;
  suggestionsContainer.classList.add('active');
  
  // Add click handlers for suggestions
  suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      selectSuggestion(index);
    });
    
    // Add hover handler to update selection
    item.addEventListener('mouseenter', () => {
      appState.selectedSuggestionIndex = index;
      updateSuggestionSelection();
    });
  });
}

/**
 * Update visual selection of suggestions
 */
function updateSuggestionSelection() {
  const container = document.getElementById('search-suggestions');
  if (!container) return;
  
  const items = container.querySelectorAll('.suggestion-item');
  items.forEach((item, index) => {
    if (index === appState.selectedSuggestionIndex) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
    } else {
      item.classList.remove('selected');
      item.setAttribute('aria-selected', 'false');
    }
  });
}

/**
 * Select a suggestion by index
 */
function selectSuggestion(index) {
  if (index < 0 || index >= appState.suggestions.length) return;
  
  const input = document.getElementById('date-search');
  if (input) {
    input.value = appState.suggestions[index].text;
    handleSearch();
  }
}

/**
 * Announce selected suggestion to screen readers
 */
function announceSelectedSuggestion() {
  if (appState.selectedSuggestionIndex < 0) return;
  
  const suggestion = appState.suggestions[appState.selectedSuggestionIndex];
  if (!suggestion) return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'visually-hidden';
  announcement.textContent = `${suggestion.text}, ${suggestion.description || ''}`;
  
  document.body.appendChild(announcement);
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hide search suggestions
 */
function hideSuggestions() {
  const container = document.getElementById('search-suggestions');
  if (container) {
    container.classList.remove('active');
    container.innerHTML = '';
  }
  appState.selectedSuggestionIndex = -1;
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