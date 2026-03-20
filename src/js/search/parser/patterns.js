/**
 * Entity dictionaries and conversational patterns for the NL parser.
 * Pure data — no logic here.
 */

/** Term names and aliases -> canonical name */
export const TERM_NAMES = {
  'michaelmas': 'michaelmas',
  'mich': 'michaelmas',
  'mt': 'michaelmas',
  'hilary': 'hilary',
  'hil': 'hilary',
  'ht': 'hilary',
  'trinity': 'trinity',
  'trin': 'trinity',
  'tt': 'trinity'
};

/** Full term names for fuzzy matching (only these, not short aliases) */
export const FUZZY_TERM_CANDIDATES = ['michaelmas', 'hilary', 'trinity'];

/** Day names and aliases -> JS day number (Sunday=0) */
export const DAY_NAMES = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6
};

/** Full day names for fuzzy matching */
export const FUZZY_DAY_CANDIDATES = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday'
];

/** Month names and aliases -> month number (1-12) */
export const MONTH_NAMES = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sep': 9, 'sept': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12
};

/** Full month names for fuzzy matching */
export const FUZZY_MONTH_CANDIDATES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/** Week-related keywords */
export const WEEK_KEYWORDS = ['week', 'wk'];

/** Relative keywords */
export const RELATIVE_KEYWORDS = ['today', 'tomorrow', 'yesterday', 'this', 'next', 'last', 'current'];

/** Question keywords */
export const QUESTION_KEYWORDS = ['when', 'what', "what's", 'whats', 'how', 'is', 'are'];

/** Noise words to ignore */
export const NOISE_WORDS = new Set([
  'the', 'of', 'in', 'a', 'an', 'for', 'to', 'it',
  'does', 'do', 'did', 'we', 'i', 'my', 'me',
  'date', 'time', 'term', 'many', 'weeks', 'until'
]);

/** Term alias regex for compound tokens like MT25, HT26, TT24 */
export const TERM_YEAR_PATTERN = /^(mt|ht|tt)(\d{2})$/;

/** Week alias regex for compound tokens like w5, wk3, week5 */
export const WEEK_COMPOUND_PATTERN = /^w(?:ee)?k?(\d{1,2})$/;

/** Academic year pattern: 2024-25 */
export const ACADEMIC_YEAR_PATTERN = /^(\d{4})-(\d{2})$/;

/** Four-digit year pattern: 2025 */
export const CALENDAR_YEAR_PATTERN = /^(20\d{2})$/;

/** Date slash pattern: DD/MM/YYYY */
export const DATE_SLASH_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** ISO date pattern: YYYY-MM-DD */
export const ISO_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** Ordinal suffix pattern */
export const ORDINAL_PATTERN = /^(\d{1,2})(?:st|nd|rd|th)$/;

/** Conversational patterns — matched after entity extraction.
 *  Each has: keywords to look for (after noise removal), resulting intent modifications.
 */
export const CONVERSATIONAL_PATTERNS = [
  {
    name: 'when-term-start',
    keywords: ['when', 'start'],
    altKeywords: ['when', 'begin'],
    requiresEntity: 'term',
    intent: 'term-info',
    variant: 'start'
  },
  {
    name: 'when-term-end',
    keywords: ['when', 'end'],
    altKeywords: ['when', 'finish'],
    requiresEntity: 'term',
    intent: 'term-info',
    variant: 'end'
  },
  {
    name: 'what-week-is-it',
    keywords: ['what', 'week'],
    noEntity: true,  // triggers only when no term/date entities present
    intent: 'relative',
    relativeValue: 'today'
  },
  {
    name: 'is-it-term-time',
    keywords: ['term'],
    questionRequired: true,
    noEntity: true,
    intent: 'relative',
    relativeValue: 'today'
  }
];
