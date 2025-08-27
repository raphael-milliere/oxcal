# oxcal

Oxford term calendar web app.

## What it does

Shows oxford university term dates and week numbers. Terms run week 0 through week 12, with weeks 1-8 being "full term".

You can:
- see term weeks on a calendar
- search for dates like "week 5 michaelmas 2026"
- find out what week a specific date falls in

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
  js/       - application code
  css/      - styles
public/     - static files including terms.json
dist/       - build output
```

## Browser support

Works in modern browsers. Has offline support through service worker.

## License

MIT