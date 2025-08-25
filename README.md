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

### Date Lookup
Query dates using natural language:
- "Week 5 Michaelmas 2026"
- "Tuesday Week 2 Trinity 2025"
- "25 March 2027"

Returns exact dates or identifies the term/week for any given date.

### Offline Support
Functions as a Progressive Web App with full offline capability. All term data is cached locally for instant access.

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
```

### Deployment
The application is configured for static hosting. Build output can be deployed to any static hosting service.

## Data

Term dates are stored in `terms.json` covering academic years 2024-25 through 2031-32. Each week runs Sunday to Saturday.

## Architecture

Built as a client-side application with:
- Vanilla JavaScript for core functionality
- Service Worker for offline support
- Responsive CSS for mobile/desktop layouts
- No external dependencies for calendar operations