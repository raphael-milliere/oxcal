/**
 * Main application entry point
 */

import { loadTermsData, findTermWeekForDate } from './data/termService.js';
import { getToday, formatDate } from './data/dateUtils.js';
import { Calendar } from './components/calendar.js';
import { search, generateSuggestions } from './search/index.js';
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
  selectedSuggestionIndex: -1,
  infoPanelMode: 'today' // 'today', 'selected', 'search'
};

/**
 * Initialize the application
 */
async function init() {
  try {
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
    handleURLParams();
    updateInfoPanel('today');

  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError('Failed to load term data. Please refresh the page.');
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
    updateInfoPanel('selected', date);
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
  
  // Info modal functionality
  const infoButton = document.getElementById('info-button');
  const infoModal = document.getElementById('info-modal');
  const modalClose = document.getElementById('modal-close');
  
  if (infoButton && infoModal) {
    // Open modal
    infoButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
    
    // Close modal via close button
    if (modalClose) {
      modalClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }
    
    // Close modal via overlay click
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) {
        closeModal();
      }
    });
    
    // Close modal via Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && infoModal.classList.contains('active')) {
        closeModal();
      }
    });
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
 * Handle URL parameters from manifest shortcuts
 */
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('focus') === 'search') {
    const searchInput = document.getElementById('date-search');
    if (searchInput) {
      searchInput.focus();
    }
  }
}

/**
 * Open the info modal
 */
function openModal() {
  const modal = document.getElementById('info-modal');
  const infoButton = document.getElementById('info-button');
  
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // Store reference to triggering element for focus return
    modal.dataset.triggerElement = 'info-button';
    
    // Focus the close button for keyboard navigation
    const closeButton = document.getElementById('modal-close');
    if (closeButton) {
      closeButton.focus();
    }
  }
}

/**
 * Close the info modal
 */
function closeModal() {
  const modal = document.getElementById('info-modal');
  
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    // Return focus to trigger element
    if (modal.dataset.triggerElement) {
      const trigger = document.getElementById(modal.dataset.triggerElement);
      if (trigger) {
        trigger.focus();
      }
    }
  }
}

/**
 * Handle search functionality
 */
function handleSearch() {
  const input = document.getElementById('date-search');
  
  if (!input) return;
  
  const query = input.value.trim();
  if (!query) {
    // Clear search and return to showing today's info or selected date
    hideSuggestions();
    appState.searchResults = null;
    if (appState.selectedDate) {
      updateInfoPanel('selected');
    } else {
      updateInfoPanel('today');
    }
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
        appState.calendar.setMonthAndHighlight(firstDate, results.dates);
        appState.currentMonth = firstDate;
        updateMonthHeader();
      }
    }
  } else {
    // Show error in info panel
    updateInfoPanel('search', results);
  }
  
  hideSuggestions();
}

/**
 * Display search results
 */
function displaySearchResults(results) {
  updateInfoPanel('search', results);
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
        <div class="suggestion-text">${s.text}</div>
        <div class="suggestion-description">${s.description || ''}</div>
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

  announce(`${suggestion.text}, ${suggestion.description || ''}`);
}

/**
 * Update the persistent live region with a message
 */
function announce(message) {
  const liveRegion = document.getElementById('live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
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
 * Update the unified info panel based on current state
 */
function updateInfoPanel(mode, data = null) {
  const infoPanel = document.getElementById('info-panel');
  if (!infoPanel) return;
  
  appState.infoPanelMode = mode;
  let html = '';
  
  switch (mode) {
    case 'today':
      const today = getToday();
      const todayTermWeek = findTermWeekForDate(today);
      
      if (todayTermWeek) {
        const termName = todayTermWeek.term.charAt(0).toUpperCase() + todayTermWeek.term.slice(1);
        html = `
          <div class="info-content">
            <div class="info-line primary">${formatDate(today, 'full')}</div>
            <div class="info-line secondary">${termName} Term, Week ${todayTermWeek.week}</div>
          </div>
        `;
      } else {
        html = `
          <div class="info-content">
            <div class="info-line primary">${formatDate(today, 'full')}</div>
            <div class="info-line secondary">Outside term time</div>
          </div>
        `;
      }
      break;
      
    case 'selected':
      const selectedDate = data || appState.selectedDate;
      if (!selectedDate) return;
      
      const selectedTermWeek = findTermWeekForDate(selectedDate);
      
      if (selectedTermWeek) {
        const termName = selectedTermWeek.term.charAt(0).toUpperCase() + selectedTermWeek.term.slice(1);
        html = `
          <div class="info-content">
            <div class="info-line primary">${formatDate(selectedDate, 'full')}</div>
            <div class="info-line secondary">${termName} Term, Week ${selectedTermWeek.week}</div>
          </div>
        `;
      } else {
        html = `
          <div class="info-content">
            <div class="info-line primary">${formatDate(selectedDate, 'full')}</div>
            <div class="info-line secondary">Outside term time</div>
          </div>
        `;
      }
      break;
      
    case 'search':
      const results = data || appState.searchResults;
      if (!results) return;
      
      if (results.success) {
        if (results.type === 'week-range') {
          const termName = results.term.charAt(0).toUpperCase() + results.term.slice(1);
          html = `
            <div class="info-content">
              <div class="info-line primary">${results.weekRangeText}</div>
              <div class="info-line secondary">${termName} Term, Week ${results.week}</div>
            </div>
          `;
        } else if (results.type === 'single-date') {
          // For specific date queries like "Tuesday Week 5 Michaelmas 2025"
          if (results.term && results.week) {
            const termName = results.term.charAt(0).toUpperCase() + results.term.slice(1);
            html = `
              <div class="info-content">
                <div class="info-line primary">${results.displayText}</div>
                <div class="info-line secondary">${termName} Term, Week ${results.week}</div>
              </div>
            `;
          } else if (results.detailText === 'Outside term time') {
            html = `
              <div class="info-content">
                <div class="info-line primary">${results.displayText}</div>
                <div class="info-line secondary">Outside term time</div>
              </div>
            `;
          } else {
            // Extract term and week from detailText like "Tuesday, Week 5 of Michaelmas Term 2025-26"
            const detailMatch = results.detailText.match(/Week (\d+) of (\w+) Term/);
            if (detailMatch) {
              const weekNum = detailMatch[1];
              const termName = detailMatch[2];
              html = `
                <div class="info-content">
                  <div class="info-line primary">${results.displayText}</div>
                  <div class="info-line secondary">${termName} Term, Week ${weekNum}</div>
                </div>
              `;
            } else {
              html = `
                <div class="info-content">
                  <div class="info-line primary">${results.displayText}</div>
                  <div class="info-line secondary">${results.detailText}</div>
                </div>
              `;
            }
          }
        }
      } else {
        html = `
          <div class="info-content error">
            <div class="info-line primary">No results found</div>
            <div class="info-line secondary">${results.error || 'Could not parse query'}</div>
          </div>
        `;
      }
      break;
  }
  
  infoPanel.innerHTML = html;
}

/**
 * Show error message in the info panel
 */
function showError(message) {
  console.error(message);
  const infoPanel = document.getElementById('info-panel');
  if (infoPanel) {
    infoPanel.innerHTML = `
      <div class="info-content error">
        <div class="info-line primary">Error</div>
        <div class="info-line secondary">${message}</div>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}