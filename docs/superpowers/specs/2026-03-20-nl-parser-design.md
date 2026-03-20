# Natural Language Query Parser — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Scope:** Replace the regex-based query parser in OxCal with a token-based entity extraction pipeline that handles flexible word order, typo tolerance, relative/contextual queries, partial inputs, and curated conversational patterns — all client-side with no external dependencies.

---

## 1. Problem Statement

OxCal's current parser (`src/js/search/queryParser.js`) uses a rigid regex pipeline: preprocess aliases, then try three sub-parsers (day-week, term-week, date) in order. Any input that doesn't match the narrow expected patterns fails with a generic "Could not parse query" error.

**Key limitations:**
- Fixed word order required (e.g., day name must come first for day-week queries)
- No typo tolerance — "Michealmas" fails silently
- No relative/contextual queries ("today", "this week", "next term")
- No partial queries — "Week 5" alone is invalid without term and year
- No term-only queries — "Michaelmas 2025" without a week number fails
- No conversational phrasing — "When does Hilary start?" is not recognized
- `string.includes()` matching for term names is fragile and order-dependent
- Generic error messages with no indication of what was understood

## 2. Design Goals

1. **Any word order** — "2025 Michaelmas week 5", "week 5 of michaelmas 2025", and "michaelmas 5th week 2025" all work
2. **Typo tolerance** — "Michealmas", "trinty", "hilry" resolve to correct terms with fuzzy matching
3. **Relative queries** — "today", "tomorrow", "this week", "next term", "last week"
4. **Partial queries with smart defaults** — "Week 5" infers current term and year; "Michaelmas 2025" defaults to Week 1
5. **Curated conversational patterns** — ~20-30 common phrasings like "when does X start", "what week is it"
6. **Helpful error messages** — show what was understood and what's missing
7. **Offline-first** — fully client-side, no API calls, no external dependencies
8. **Backward compatible** — existing API (`parseQuery()`, `search()`, `generateSuggestions()`) unchanged
9. **English only**

## 3. Architecture

Four-stage pipeline replacing the current regex approach:

```
Input string
    |
    v
+------------+
| Tokenizer  |  Split input, normalize whitespace/punctuation
+-----+------+
      |  string[]
      v
+------------------+
| Token Classifier |  Classify each token with fuzzy matching
+-----+------------+
      |  ClassifiedToken[]
      v
+-----------------+
| Intent Resolver |  Determine query type from token combination
+-----+-----------+
      |  { intent, entities, missing }
      v
+-------------------+
| Default Resolver  |  Fill missing entities from context;
| + Error Reporter  |  generate errors if still incomplete
+-----+-------------+
      |
      v
  ParsedQuery (same shape as today)
```

Each stage is a pure function (input -> output), independently testable. The output format stays compatible with the existing `searchEngine.js`.

## 4. Stage 1: Tokenizer

**Module:** `src/js/search/parser/tokenizer.js`
**Signature:** `tokenize(input: string) -> string[]`

**Steps:**
1. Trim and lowercase
2. Normalize punctuation: strip trailing `?`, `!`, `,` from tokens; convert curly quotes to straight; keep `/` and `-` intact (needed for dates like `25/03/2027` and academic years like `2024-25`)
3. Split on whitespace
4. Preserve compound tokens: do not split `wk3`, `mt25`, `w5`, `2024-25`, `25/03/2027`, or ISO dates like `2027-03-25`

**What it does NOT do:** No alias expansion. The classifier handles aliases directly during classification, avoiding bugs where alias expansion corrupts other parts of the input.

**Edge cases:**
- Multiple spaces/tabs -> collapsed
- Leading/trailing whitespace -> trimmed
- Empty/null input -> returns `[]`
- Ordinal suffixes (`"5th"`) -> preserved; classifier strips during classification

## 5. Stage 2: Token Classifier

**Module:** `src/js/search/parser/classifier.js`
**Signature:** `classifyTokens(tokens: string[]) -> ClassifiedToken[]`

### Entity Types

| Type | Examples | Value |
|------|----------|-------|
| `term` | "michaelmas", "mich", "mt", "trinty" (typo) | `"michaelmas"` / `"hilary"` / `"trinity"` |
| `week` | "week", "wk", "w5", "wk3", "week5" | number (0-12), or `null` if bare keyword |
| `week-number` | "5", "0", "12", "5th", "3rd" | number (0-12) |
| `day` | "tuesday", "tue", "fri" | 0-6 (Sunday=0) |
| `year` | "2025", "2024-25", "25" (two-digit) | normalized academic year string |
| `term-year` | "mt25", "ht26", "tt24" | `{ term, year }` compound |
| `month` | "march", "jan", "november" | 1-12 |
| `day-number` | "25", "1" (when month present) | 1-31 |
| `relative` | "today", "tomorrow", "this", "next", "current" | keyword string |
| `question` | "when", "what", "what's", "how" | keyword string |
| `noise` | "the", "of", "is", "does", "in", "it" | ignored |
| `unknown` | unrecognized tokens | raw string |

### Classification Algorithm

**Two-pass approach:**

1. **First pass — unambiguous tokens:** Classify term names (exact + aliases), day names, month names, keywords (relative, question, noise), and compound tokens (`mt25`, `w5`).
2. **Disambiguation pass — context-dependent numbers:** If a month is present, a bare number 1-31 becomes `day-number`. If a term is present but no week, a bare number 0-12 becomes `week-number`. Otherwise it stays `unknown`.

### Fuzzy Matching

Lightweight Levenshtein distance function (~20 lines, no dependencies). Applied only to tokens >= 4 characters that didn't get a direct match in the first pass.

**Thresholds by word length:**

| Word length | Max Levenshtein distance |
|-------------|--------------------------|
| 4-5 chars | 1 |
| 6-8 chars | 2 |
| 9+ chars | 3 |

Checked against: full term names (michaelmas, hilary, trinity), full day names, full month names. Short aliases (mt, w5, tue) require exact match — fuzzy matching on 2-3 char strings produces too many false positives.

### Confidence Score

Each classification gets a confidence value:
- 1.0 for exact match
- 0.5-0.9 for fuzzy match (inversely proportional to distance)

Confidence below 0.8 triggers "Did you mean...?" messages in error output.

### ClassifiedToken Shape

```js
{
  raw: string,       // original token
  type: string,      // entity type from table above
  value: any,        // normalized value
  confidence: number // 0.0-1.0
}
```

## 6. Stage 3: Intent Resolver

**Module:** `src/js/search/parser/intentResolver.js`
**Signature:** `resolveIntent(classifiedTokens: ClassifiedToken[]) -> Intent`

### Entity-Based Resolution

Determines query type from which entity types are present. Word order is irrelevant since tokens are classified independently.

| Entities found | Intent | Example |
|---|---|---|
| day + week + term + year | `day-term-week` | "Tuesday week 2 Trinity 2025" |
| day + week + term (no year) | `day-term-week` (needs default year) | "Friday week 3 Michaelmas" |
| week + term + year | `term-week` | "week 5 michaelmas 2025" |
| week + term (no year) | `term-week` (needs default year) | "week 5 hilary" |
| term + year (no week) | `term-info` | "Michaelmas 2025" -> Week 1 |
| term only (no week, no year) | `term-info` (needs default year) | "Michaelmas" |
| month + day-number + year | `date` | "25 March 2027" |
| month + day-number (no year) | `date` (needs default year) | "25 March" |
| relative + term/week | `relative` | "next term", "this week" |
| relative alone | `relative` | "today", "tomorrow" |
| day + week (no term) | `day-term-week` (needs defaults) | "Tuesday week 3" |
| week only | `term-week` (needs defaults) | "week 5" |

### Conversational Pattern Matching

For queries containing question words, matched after entity extraction. Patterns match loosely — noise words are already classified and ignored.

| Pattern | Intent |
|---|---|
| "when does {term} start/begin" | `term-info` (start date) |
| "when does {term} end/finish" | `term-info` (end date) |
| "what week is {date}" | `date` |
| "what week is it" / "what week are we in" | `relative` -> today |
| "what's the date of {day} week {n}" | `day-term-week` |
| "how many weeks until {term}" | `relative` (countdown) |
| "is it term time" / "are we in term" | `relative` -> today |

### Intent Shape

```js
{
  intent: string,          // query type
  entities: {              // extracted entities
    term?: string,
    week?: number,
    year?: string,
    day?: number,
    month?: number,
    dayNumber?: number,
    relative?: string
  },
  missing: string[],       // entity types needed but not found
  conversational?: string  // matched pattern name, if any
}
```

## 7. Stage 4: Default Resolver & Error Reporter

**Module:** `src/js/search/parser/defaultResolver.js`
**Signature:** `applyDefaults(intent: Intent, context: Context) -> ParsedQuery`

### Context Object

**Module:** `src/js/search/parser/context.js`
**Signature:** `getCurrentContext(termData) -> Context`

Computed once per query from the current date and loaded term data:

```js
{
  today: Date,
  currentTerm: 'hilary',         // term we're in or nearest upcoming
  currentWeek: 3,                // week of that term, or null if in vacation
  currentAcademicYear: '2025-26',
  inTerm: true                   // whether today is during term time
}
```

### Default Rules

| Missing entity | Default value | Condition |
|---|---|---|
| year | current academic year | Always |
| term | current or nearest upcoming term | Always |
| term + year | both from context | Always |
| week (for `term-info` intent) | 1 | When only term is specified |

### Relative Query Resolution

| Query | Resolution |
|---|---|
| "today" | today's date -> date lookup |
| "tomorrow" | today + 1 -> date lookup |
| "this week" | current term + current week |
| "next week" | current term + current week + 1 (handles term boundary) |
| "next term" | next upcoming term, Week 1 |
| "last week" | current term + current week - 1 |

### Assumed Field

When defaults are applied, the result includes an `assumed` array for UI transparency:

```js
{
  type: 'term-week',
  term: 'hilary',
  week: 5,
  year: '2025-26',
  assumed: ['term', 'year']  // these were inferred
}
```

### Error Reporting

When the query cannot be fully resolved:

```js
{
  type: 'invalid',
  error: 'human-readable message',
  understood: { term: 'michaelmas', year: '2025-26' },
  missing: ['week'],
  suggestion: 'Week 1 Michaelmas 2025-26'
}
```

**Error templates:**

| Situation | Message |
|---|---|
| Nothing recognized | "I didn't understand that. Try something like 'Week 5 Michaelmas 2025'" |
| Fuzzy match, low confidence | "Did you mean 'Michaelmas'?" |
| Unresolvable ambiguity | "Found '5' but couldn't tell if it's a week or date. Try 'Week 5' or '5 March'" |

Note: Many "incomplete" queries are resolved via defaults rather than erroring. "Week 5" alone resolves to current term; "Michaelmas 2025" resolves to Week 1.

## 8. Module Structure

```
src/js/search/
  parser/
    tokenizer.js          # tokenize(input) -> string[]
    classifier.js         # classifyTokens(tokens) -> ClassifiedToken[]
    fuzzyMatch.js         # levenshtein(), findClosestMatch()
    intentResolver.js     # resolveIntent(classifiedTokens) -> Intent
    defaultResolver.js    # applyDefaults(intent, context) -> ParsedQuery
    context.js            # getCurrentContext(termData) -> Context
    patterns.js           # conversational patterns, entity dictionaries
  queryParser.js          # thin orchestrator calling the pipeline
  searchEngine.js         # minor change: handle 'term-info' intent
  suggestions.js          # refactored to reuse tokenizer/classifier
  index.js                # barrel export (unchanged API)
```

### Public API (No Breaking Changes)

```js
parseQuery(string)          -> { type, ...entities, assumed?, error? }
search(string)              -> { success, type, ...data }
generateSuggestions(string) -> Suggestion[]
```

### Search Engine Changes

Add one case to the switch in `searchEngine.js`:

```js
case 'term-info':
  return searchTermWeek({ ...parsed, week: parsed.week ?? 1 });
```

### Suggestions Refactor

Refactor `suggestions.js` to reuse the tokenizer and classifier:
1. Tokenize and classify the partial input
2. Based on recognized entities, suggest completions for what's missing
3. Suggestions stay automatically consistent with the parser

### Bundle Impact

All vanilla JS, no dependencies. Estimated: ~4-5KB minified added, ~2-3KB net after removing old regex code.

## 9. Testing Strategy

### Unit Tests (per module)

```
src/js/search/parser/
  tokenizer.test.js
  classifier.test.js
  fuzzyMatch.test.js
  intentResolver.test.js
  defaultResolver.test.js
  context.test.js
```

- **Tokenizer:** whitespace normalization, punctuation stripping, compound token preservation
- **Classifier:** exact matches for all entity types, fuzzy match acceptance/rejection, disambiguation of ambiguous numbers, confidence scores
- **Fuzzy match:** Levenshtein distance, threshold enforcement, specific typo scenarios
- **Intent resolver:** every row in entity-combination table, conversational patterns, unresolvable queries
- **Default resolver:** each default rule with mocked context, `assumed` field, error messages

### Integration Tests (backward compatibility)

Existing test files stay and must all pass:
- `queryParser.test.js`
- `aliasParser.test.js`
- `searchEngine.test.js`
- `suggestions.test.js`

### New Integration Tests

**`queryParser.integration.test.js`** — full pipeline with real-world phrasings:

```
// Flexible word order
"2025 michaelmas week 5"            -> term-week
"week 5 of michaelmas 2025"         -> term-week
"michaelmas 5th week 2025"          -> term-week

// Typos
"trinty week 3 2025"                -> term-week (trinity)
"michealmas wk 5 2026"              -> term-week (michaelmas)

// Partial/incomplete
"week 5"                            -> term-week (defaults applied)
"michaelmas 2025"                   -> term-info -> Week 1
"tuesday week 3"                    -> day-term-week (defaults applied)

// Relative
"today"                             -> date (today's date)
"next term"                         -> term-week (next term, week 1)
"this week"                         -> term-week (current)

// Conversational
"when does hilary start"            -> term-info
"what week is it"                   -> relative -> today
"what's the date of friday week 3"  -> day-term-week

// Dates (must still work)
"25 March 2027"                     -> date
"2027-03-25"                        -> date
"25/03/2027"                        -> date
```

## 10. Non-Goals

- Multilingual support (English only)
- LLM/API-based parsing (offline-first)
- External NLP dependencies (bundle size)
- Week ranges or multi-week queries ("Weeks 1-4")
- Dynamic term data calculation beyond the static `terms.json` range (2024-2032)
- Snapshot or golden-file tests
