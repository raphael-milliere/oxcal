# OxCal - Oxford Calendar Web App Implementation Plan

## Stage 1: Foundation & Data Layer
**Goal**: Establish project structure and data access layer
**Success Criteria**: 
- Modular file structure created ✅
- Data service can retrieve any term/week/date ✅
- Basic HTML page loads with responsive layout ✅
- CSS architecture supports theming ✅
**Tests**: 
- Can load and parse terms.json ✅
- Date utilities correctly calculate week numbers ✅
- Responsive layout works on mobile/tablet/desktop ✅
**Status**: Complete

## Stage 2: Calendar Component
**Goal**: Build the core calendar view component
**Success Criteria**:
- Calendar displays current month with proper grid ✅
- Navigation between months works smoothly ✅
- Term weeks are visually highlighted ✅
- Week numbers (0-12) are clearly displayed ✅
**Tests**:
- Calendar renders correctly for any month ✅
- Term weeks show correct colors/labels ✅
- Navigation maintains state properly ✅
- Touch/mouse events work correctly ✅
**Status**: Complete

## Stage 3: Search & Query System
**Goal**: Add intelligent date lookup with calendar integration
**Success Criteria**:
- Natural language queries parse correctly ✅
- Results highlight in calendar view ✅
- Reverse lookup works for any date ✅
- Search UI is intuitive and responsive ✅
**Tests**:
- Query "week 5 Michaelmas 2026" returns correct dates ✅
- Query "Tuesday week 2 Trinity 2025" returns specific date ✅
- Query "25 March 2027" identifies term/week or vacation ✅
- Search suggestions appear appropriately ✅
**Status**: Complete

## Stage 4: PWA & Offline Support
**Goal**: Transform into a fully functional PWA
**Success Criteria**:
- App works completely offline ✅
- Install prompt appears appropriately ✅
- Updates are handled gracefully ✅
- All resources are cached properly ✅
**Tests**:
- Offline mode preserves full functionality ✅
- Service worker caches all necessary files ✅
- App can be installed on mobile/desktop ✅
- Updates don't break existing functionality ✅
**Status**: Complete

## Stage 5: Polish & Optimization
**Goal**: Enhance UX and prepare for deployment
**Success Criteria**:
- All test suite passes (155 tests) ✅
- Lighthouse score > 95 for all metrics
- Keyboard navigation fully functional
- Dark mode toggle with localStorage persistence
- Documentation is comprehensive
**Tests**:
- All 155 existing tests pass ✅
- Performance metrics meet targets
- Accessibility audit passes WCAG 2.1 AA
- Dark/light themes switch correctly with manual toggle
- Deployment configuration works for static hosting
**Status**: In Progress

### Completed:
- Fixed all failing tests (12 test fixes)
- Query parser now correctly handles day-of-week queries
- Search engine returns proper single-date results
- Suggestions respect maxSuggestions option

### Remaining Tasks:
- Implement keyboard navigation for calendar
- Add comprehensive ARIA labels and accessibility features
- Implement dark mode toggle button with localStorage
- Run Lighthouse audit and optimize performance
- Configure deployment settings (Netlify/Vercel/Cloudflare)