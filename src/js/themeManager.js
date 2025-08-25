/**
 * Theme manager for handling light/dark mode
 */

const THEME_KEY = 'oxcal-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.listeners = [];
    this.initialized = false;
  }
  
  /**
   * Initialize theme manager - must be called after DOM is ready
   */
  init() {
    if (this.initialized) return;
    
    // Get theme preference
    this.currentTheme = this.getStoredTheme() || this.getSystemPreference();
    
    // Ensure data-theme attribute is set immediately
    const root = document.documentElement;
    if (!root.hasAttribute('data-theme')) {
      root.setAttribute('data-theme', this.currentTheme);
    }
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    // Listen for system preference changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a manual preference
        if (!this.getStoredTheme()) {
          this.setTheme(e.matches ? THEME_DARK : THEME_LIGHT);
        }
      });
    }
    
    this.initialized = true;
  }
  
  /**
   * Get stored theme preference from localStorage
   * @returns {string|null} Theme name or null
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }
  
  /**
   * Store theme preference in localStorage
   * @param {string} theme - Theme name
   */
  storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }
  
  /**
   * Clear stored theme preference
   */
  clearStoredTheme() {
    try {
      localStorage.removeItem(THEME_KEY);
    } catch (e) {
      console.warn('Could not clear theme preference:', e);
    }
  }
  
  /**
   * Get system color scheme preference
   * @returns {string} Theme name
   */
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME_DARK;
    }
    return THEME_LIGHT;
  }
  
  /**
   * Apply theme to document
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark');
    document.body.classList.remove('light-mode', 'dark-mode');
    
    // Apply new theme
    if (theme === THEME_DARK) {
      root.classList.add('theme-dark');
      document.body.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('theme-light');
      document.body.classList.add('light-mode');
      root.setAttribute('data-theme', 'light');
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === THEME_DARK ? '#1a1a1a' : '#002147';
    }
  }
  
  /**
   * Set theme
   * @param {string} theme - Theme name
   * @param {boolean} store - Whether to store preference
   */
  setTheme(theme, store = true) {
    if (theme !== THEME_LIGHT && theme !== THEME_DARK) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    
    if (store) {
      this.storeTheme(theme);
    }
    
    // Notify listeners
    this.listeners.forEach(callback => callback(theme));
  }
  
  /**
   * Toggle between light and dark themes
   * @returns {string} New theme name
   */
  toggle() {
    const newTheme = this.currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    this.setTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getTheme() {
    if (!this.initialized) {
      // Return stored or system preference if not initialized yet
      return this.getStoredTheme() || this.getSystemPreference();
    }
    return this.currentTheme;
  }
  
  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  isDark() {
    return this.currentTheme === THEME_DARK;
  }
  
  /**
   * Reset to system preference
   */
  resetToSystem() {
    this.clearStoredTheme();
    this.setTheme(this.getSystemPreference(), false);
  }
  
  /**
   * Add theme change listener
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.listeners.push(callback);
  }
  
  /**
   * Remove theme change listener
   * @param {Function} callback - Callback function
   */
  offChange(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export functions for easy use
export default themeManager;
export { THEME_LIGHT, THEME_DARK };