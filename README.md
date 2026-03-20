# oxcal

Oxford term calendar web app.

## What it does

Shows oxford university term dates and week numbers. Terms run week 0 through week 12, with weeks 1-8 being "full term".

You can:
- see term weeks on a calendar
- search for dates using natural language
- find out what week a specific date falls in

### Search examples

The search bar accepts flexible natural language queries:

- `Week 5 Michaelmas 2025` — standard term-week lookup
- `w5 mt25` — shorthand aliases
- `michealmas week 3 2025` — tolerates typos
- `week 5` — fills in current term and year automatically
- `today`, `tomorrow`, `this week`, `next term` — relative queries
- `when does hilary start` — conversational patterns
- `Tuesday Week 3` — specific day in a term week
- `25 March 2027`, `2027-03-25`, `25/03/2027` — date lookups

## Setup

Requires node 18+

```
pnpm install
pnpm dev
```

Build for production:
```
pnpm build
```

## How it works

Everything runs client-side. Term dates are in `public/terms.json` covering 2024-2032.

Built with vanilla js, no framework. Uses vite for bundling.

## Deployment

Static site, deploy the `dist/` folder anywhere. Works with netlify, vercel, github pages, etc.

## Tests

```
pnpm test
```

## Structure

```
src/
  js/
    search/
      parser/       - NL query parser pipeline
        tokenizer.js      - splits and normalizes input
        classifier.js     - labels tokens (term, week, day, etc.)
        intentResolver.js - determines query intent from tokens
        defaultResolver.js - fills missing fields from context
        context.js        - detects current term/week
        fuzzyMatch.js     - Levenshtein typo tolerance
        patterns.js       - entity dictionaries
      queryParser.js      - orchestrator
      searchEngine.js     - executes parsed queries
      suggestions.js      - search suggestions
    data/         - term data and date utilities
    components/   - UI components
  css/            - styles
public/           - static files including terms.json
dist/             - build output
```

## Browser support

Works in modern browsers. Has offline support through service worker.

## License

MIT