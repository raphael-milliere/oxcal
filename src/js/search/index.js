/**
 * Search module exports
 */

export { parseQuery, getSuggestions, setTermData } from './queryParser.js';
export { search, searchMultiple, getResultSummary } from './searchEngine.js';
export { 
  generateSuggestions, 
  formatSuggestionsForDisplay,
  getSuggestionHTML 
} from './suggestions.js';