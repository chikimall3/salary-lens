# SalaryLens — Chrome Extension

## Overview
Chrome extension that shows real-time salary data on job listing pages (Indeed).
Helps job seekers understand if an offer is fair by comparing it to market data.

## Core Features (v1)
1. Auto-detect job title & location from Indeed job pages
2. Fetch salary range (25th/50th/75th/90th percentile) from BLS/CareerOneStop API
3. Show "market position" bar — where the listed salary falls in the distribution
4. Save & compare multiple offers (stored locally in chrome.storage)
5. Total Compensation calculator (base + bonus + equity + benefits)
6. AI negotiation script generation (free bonus feature, not the main selling point)

## Tech Stack
- **Extension**: Manifest V3, vanilla JS + lightweight UI
- **Salary Data**: BLS API + CareerOneStop API (free, public, no scraping)
- **AI**: Claude Sonnet 4.6 API (negotiation scripts only, NOT for salary estimation)
- **Payments**: ExtensionPay ($29 one-time)
- **Landing Page**: Vercel (static HTML/CSS)

## Architecture
```
content-script.js  → Injects UI into Indeed job pages
                   → Extracts job title & location from DOM
background.js      → Service worker (MV3)
                   → Handles BLS/CareerOneStop API calls
                   → Manages chrome.storage for saved offers
popup.html/js      → Offer comparison dashboard
                   → Total Compensation calculator
options.html/js    → Settings (API keys, preferences)
```

## Key Design Decisions
- DO NOT use AI to estimate salaries (documented bias issues). Always use BLS/CareerOneStop public data.
- Revenue model is one-time purchase ($29), NOT subscription (churn problem with job seekers).
- Free tier: 3 salary lookups/day. Paid: unlimited + offer comparison + TC calculator.
- English only. US market only (BLS data is US-specific).

## File Structure
```
salary-lens/
  manifest.json
  src/
    content/         # Content scripts injected into Indeed
    background/      # Service worker
    popup/           # Popup UI (offer comparison)
    options/         # Settings page
    shared/          # Shared utilities, API clients
  assets/            # Icons, images
  landing/           # Landing page (deployed to Vercel)
  tests/             # Tests
```

## Manifest V3 Constraints
- **Content scripts**: Classic scripts ONLY. No ES module imports (`import`/`export`). Use inline constants or IIFE patterns. For testing, expose via `globalThis._salaryLensTest`.
- **Service worker**: ES modules OK (`"type": "module"` in manifest).
- **chrome:// pages**: Cannot be automated or accessed programmatically.
- **External API calls**: Must be from service worker (not content script). Requires `host_permissions`.
- **BLS API series ID format**: `OEUN` + area(7) + industry(6) + SOC(6) + dataType(2). National area type = `N`. Annual wage percentiles = data types 11-15.

## Coding Conventions
- Vanilla JS (no framework for extension — keep it lightweight)
- ES modules for service worker and popup/options only; classic scripts for content scripts
- JSDoc comments for public functions
- Error handling: fail gracefully, show user-friendly messages
- All strings in English
- Always verify external API responses with curl before implementing client code

## API Notes
- BLS API: Free, 500 queries/day with registration key. OEWS data for occupation × area.
- CareerOneStop API: Free with registration. 36-month renewable token. SOC code based.
- Both return annual/hourly wages by percentile.

## Permissions (Manifest V3 — minimal)
- `activeTab` — read current tab's URL/DOM
- `storage` — save offers locally
- `host_permissions` for BLS/CareerOneStop API endpoints only
