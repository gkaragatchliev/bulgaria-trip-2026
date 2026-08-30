# AGENTS.md - Project Context

This file is auto-loaded by opencode at the start of every session. Read first:
conventions, pitfalls we've hit, and current state.

## What this repo is

`Hotspring_BG` -- now **Bulgaria Trip 2026** -- a small **static site (no backend)**
for George and Harue's October 2026 Bulgaria trip. Bilingual (EN/BG) with a
language selector. Displays the itinerary, flights, accommodations, and things
to see. Deployed on GitHub Pages.

## Tech stack and structure

- Vanilla HTML/CSS/JS (ES5 style, IIFE, `var`). No frameworks, no build step.
- `index.html` -- page structure (hero with language selector, timeline, footer).
  `<html lang="en">`, bilingual UI.
- `css/style.css` -- styles (CSS custom properties, teal/ink palette, timeline cards).
- `js/data.js` -- trip data: `TRIP` object with `legs[]` array. Each leg has
  `id`, `date`, `day` (en/bg), `title` (en/bg), `flight` or `flights`,
  `accommodation`, `notes` (en/bg), `thingsToSee[]`. Edit this file to change itinerary.
- `js/app.js` -- all logic in one IIFE: timeline rendering, language toggle,
  XSS escaping. No localStorage, no dynamic state.
- `tests/site.test.js` -- `node --test` + jsdom, **25 tests, all green**.
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
   Harness must merge `data.js` + `app.js` into one inline script and expose
   internals via `window.__trip` before `DOMContentLoaded`.
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

## Current state

- 14 itinerary legs fully populated with real data.
- Melnik legs have 5 things to see (Kordopulov House, Wine Museum, Earth Pyramids,
  Rozhen Monastery, Despot Slav's Fortress, St. Nicholas Church, Villa Melnik).
- Flights for George (Oct 8) and Harue (Oct 15) outbound, return Oct 26.
- TBD placeholders for Oct 22 (outing with father) and Oct 25 (Sofia hotel).
- All UI bilingual with EN/BG toggle in top-right corner.
- Repo for deploy: public, GitHub Pages.
