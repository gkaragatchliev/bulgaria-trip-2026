# Trip Site Template -- PRD

## Product
Bilingual (EN/BG) static reference site for George and Harue's
October 2026 Bulgaria trip. Itinerary display, accommodations,
things to see, drive routes, activity planning. Reusable template
for future trips. Deployed on GitHub Pages, shareable with family.

## Reusable Template
To create a new trip site from this template:
1. Copy the folder
2. Edit `js/config.js` -- trip title, dates, travelers, email, country
3. Edit `js/data.js` -- legs (flights, drives, accommodations, notes, things to see)
4. Update `index.html` -- `<title>`, favicon
5. Deploy to GitHub Pages

## Tech Stack
- Vanilla HTML/CSS/JS (ES5, IIFE, var) -- no frameworks, no build step
- Vendor libs: Splitting.js (hero title char animation), Rough.js (hand-drawn SVG map)
- node --test + jsdom tests (33 tests), GitHub Pages deploy

## Data Architecture
- `js/config.js` -- trip-specific settings (title, dates, travelers, email, country, colors)
- `js/data.js` -- legs array, references TRIP_CONFIG for metadata
- `js/app.js` -- all rendering logic, language toggle, animations

## Language
English/Bulgarian selector in top-right corner. Entire UI translated.
Bulgarian uses 24-hour time for flights.

## Features

### Hero Section
- Animated title (Splitting.js char-by-char fly-in)
- Floating G/H particles (Caveat + Permanent Marker fonts, bright colors)
- Language toggle (EN/BG), Plan Activity button
- Travelers display, gradient background with warm radial accents

### Timeline
- Vertical cards with connector line and location-colored dots
- Each card: date, day name, title, flight/drive/accommodation details
- Giant day number watermarks (DM Serif Display, location-tinted)
- Pull quotes on key legs (editorial serif, warm gradient backgrounds)
- Expandable "things to see" with Google Maps links
- Scroll-reveal animations (IntersectionObserver)

### Drive Routes
- Google Maps directions + live traffic links
- Country-qualified to avoid ambiguity (e.g. Melnik Bulgaria vs Czechia)

### Flight Display
- Boarding-pass style cards with dashed border
- 24-hour time conversion for Bulgarian language

### Route Map
- SVG map with Sofia, Plovdiv, Melnik dots
- Hand-drawn style lines via Rough.js (static fallback when unavailable)

### Plan Activity Feature
- "Plan Activity" button in hero toggles calendar section
- Calendar view: all 19 days color-coded (travel=blue, booked=yellow, free=green)
- Activity proposal form: day selector (free days only), who, activity description
- Pre-filled mailto: email to trip organizer

### Design System
- Typography: DM Serif Display (editorial serif) + Space Grotesk (technical grotesque)
- Particles: Caveat (handwriting) + Permanent Marker (bold marker)
- Colors: teal/ink palette, location accents (Sofia=teal, Plovdiv=indigo, Melnik=wine)
- Card shadows, hover effects, slight rotation for tossed-on-desk feel
- Print stylesheet

## Data Model
- TRIP_CONFIG: title, subtitle, travelers, email, country, month, primary color
- TRIP.legs[]: each leg has id, location, date, day, title, flight/flights, drive, accommodation, notes, thingsToSee, pullquote
- Drive legs: { from, to, duration } for map + traffic links
- All user-facing text: { en: "...", bg: "..." } bilingual objects

## Tests
33 tests covering:
- Itinerary renders all legs
- Language toggle switches content
- TBD placeholders display correctly
- Flight details render
- Drive legs render with map + traffic links
- Pull quotes render
- Day badges render
- Activity form elements present
- Calendar section hidden by default
- Responsive layout at mobile breakpoints

## Deployment
- GitHub Pages from main branch
- Cache-busting query strings on CSS/JS (bump on every change)
- `vendor/` folder for third-party libs (committed, referenced locally)
