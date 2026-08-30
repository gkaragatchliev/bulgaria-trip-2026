# AGENTS.md - Project Context

This file is auto-loaded by opencode at the start of every session. Read first:
conventions, pitfalls we've hit, and current state.

## What this repo is

**Trip Site Template** -- reusable bilingual (EN/BG) static site for trips.
Currently deployed as **Bulgaria Trip 2026** for George and Harue's
October 2026 Bulgaria trip. Deployed on GitHub Pages.

To create a new trip: copy folder, edit `js/config.js` + `js/data.js`, deploy.

## Tech stack and structure

- Vanilla HTML/CSS/JS (ES5 style, IIFE, `var`). No frameworks, no build step.
- `vendor/` -- third-party libraries, committed as minified files for offline dev.
  Reference locally (e.g. `vendor/splitting.min.js?v=N`). **Do not use CDN URLs.**
- `index.html` -- page structure (hero with language selector, timeline, calendar, footer).
- `css/style.css` -- styles (CSS custom properties, teal/ink palette, timeline cards, calendar grid).
- `js/config.js` -- **trip-specific settings**: title, subtitle, travelers, email, country, month, colors. Edit for each new trip.
- `js/data.js` -- trip legs: `TRIP` object with `legs[]` array. Each leg has
  `id`, `date`, `day` (en/bg), `title` (en/bg), `flight` or `flights`,
  `drive`, `accommodation`, `notes` (en/bg), `thingsToSee[]`, `pullquote`.
  Edit this file to change itinerary.
- `js/app.js` -- all logic in one IIFE: timeline rendering, calendar rendering,
  language toggle, activity proposal form, Splitting.js/Rough.js init,
  scroll-reveal, progress bar, G/H particles, XSS escaping.
- `tests/site.test.js` -- `node --test` + jsdom, **33 tests, all green**.
- `package.json` -- script `npm test`, devDependency `jsdom`.

## Commands

- Tests: `npm test`
- Local: `python -m http.server 8000` then `http://localhost:8000`
- Deploy: commit + `git push origin main`; GitHub Pages publishes (~1 min).

## Learned lessons (DO NOT repeat these mistakes)

1. **`String.prototype.replace` interprets `$` in replacement strings** --
   `$$`, `$&`, `$1`, etc. The test harness initially passed app source as a
   replacement string, corrupting `$$` in `var $`. **Always use split/join,
   never `.replace()`**, when embedding source (see `buildScript()` in tests).
2. **jsdom doesn't share top-level `const` across separate external `<script>` tags.**
   Harness must merge scripts into one inline script and expose internals
   via `window.__trip` before `DOMContentLoaded`.
3. **`deepStrictEqual` fails across realms.** Arrays/objects created inside jsdom
   have different prototypes than Node ones. Compare with `Array.from()` or
   `JSON.stringify`, not `deepStrictEqual` on jsdom objects.
4. **GitHub Pages browser cache.** Users saw new HTML with stale JS. Solved with
   cache-busting query strings: `css/style.css?v=N`, `js/data.js?v=N`,
   `js/app.js?v=N`. **Bump version on every change** to these files.
   If user says "button does nothing" -- suspect cache first -> hard refresh (Ctrl+F5).
5. **Bilingual data model.** All user-facing text has `{ en: "...", bg: "..." }`
   objects. The `t(obj)` helper picks the right language. Never hardcode a single
   language string -- always use the object form.
6. **No `gh` CLI on this machine.** Use GitHub MCP tools (or plain `git push`).
7. **SVG filters affect text.** `feTurbulence` + `feDisplacementMap` roughens
   everything inside the element, not just edges. Keep filters on decorative
   elements only, not content containers.
8. **IntersectionObserver must re-observe after innerHTML replacement.**
   Language toggle replaces timeline HTML; new `.reveal` elements need
   re-observation. Store observer in module scope, call `observeReveals()`
   after each `renderAll()`.

## Current state

- 14 itinerary legs fully populated with real data.
- Template system: `config.js` holds trip metadata, `data.js` holds legs.
- Vendor libs: Splitting.js v1.1.0, Rough.js v4.6.6.
- Drive legs (3): Sofia-Melnik, Melnik-Plovdiv, Plovdiv-Sofia with Google Maps + traffic links.
- Pull quotes on Oct 17 (Melnik) and future legs.
- Calendar view with Plan Activity feature (mailto: proposal form).
- 24-hour time for Bulgarian flights.
- Editorial typography: DM Serif Display + Space Grotesk.
- G/H particles: Caveat + Permanent Marker fonts, bright saturated colors.
- All UI bilingual with EN/BG toggle in top-right corner.
- Repo: https://github.com/gkaragatchliev/bulgaria-trip-2026
