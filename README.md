# OxCal

A web application for navigating Oxford University's academic calendar system.

## Overview

OxCal provides an interface for working with Oxford's term dates and week numbering system. The application handles the university's three-term structure (Michaelmas, Hilary, Trinity) and extended week system (weeks 0-12).

## Oxford Term System

Oxford divides the academic year into three terms:
- **Michaelmas** (Autumn): October to December
- **Hilary** (Spring): January to March  
- **Trinity** (Summer): April to June

Each term uses a 13-week numbering system:
- Week 0: The week before Full Term
- Weeks 1-8: Full Term (standard teaching weeks)
- Weeks 9-12: Extended weeks after Full Term

## Features

### Calendar View
Interactive monthly calendar with term weeks highlighted and labeled. Navigate between months to see term boundaries and week numbers.
- **Full keyboard navigation**: Arrow keys, Home/End, PageUp/PageDown
- **Screen reader support**: ARIA labels and live regions
- **Touch-friendly**: Works on all devices

### Date Lookup
Query dates using natural language:
- "Week 5 Michaelmas 2026"
- "Tuesday Week 2 Trinity 2025"
- "25 March 2027"

Returns exact dates or identifies the term/week for any given date.
- **Smart suggestions**: Type-ahead with keyboard navigation
- **Flexible parsing**: Handles various date formats

### Dark Mode
Toggle between light and dark themes with a single click.
- **System preference detection**: Respects OS dark mode setting
- **Persistent choice**: Remembers your preference across sessions
- **Smooth transitions**: Animated theme switching

### Accessibility
WCAG 2.1 AA compliant with comprehensive accessibility features:
- **Skip navigation link**: Quick access to main content
- **Full keyboard support**: Navigate without a mouse
- **Screen reader optimized**: Descriptive ARIA labels
- **High contrast support**: Enhanced visibility options

### Offline Support
Functions as a Progressive Web App with full offline capability. All term data is cached locally for instant access.
- **Install to home screen**: Use like a native app
- **Automatic updates**: Seamlessly updates in background
- **Works offline**: Full functionality without internet

## Setup

### Requirements
- Node.js 18+
- Modern browser with PWA support

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
# or with pnpm
pnpm run build
```

### Testing
```bash
npm test
# or with pnpm
pnpm test
```

### Deployment

The application is configured for static hosting with pre-configured settings for popular platforms:

#### Netlify
```bash
# Automatic deployment with netlify.toml
git push origin main
```

#### Vercel
```bash
# Deploy with Vercel CLI
vercel
```

#### Manual Deployment
The `dist/` folder contains all static files ready for deployment to any web server.

## Data

Term dates are stored in `terms.json` covering academic years 2024-25 through 2031-32. Each week runs Sunday to Saturday.

## Architecture

Built as a client-side application with:
- Vanilla JavaScript for core functionality
- Service Worker for offline support
- Responsive CSS for mobile/desktop layouts
- No external dependencies for calendar operations