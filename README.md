# Bulgaria Trip 2026

A bilingual (EN/BG) static reference site for George and Harue's October 2026
trip to Bulgaria. Displays the itinerary, accommodations, flights, and things
to see at each stop. Deployed on GitHub Pages.

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Run tests

```bash
npm install
npm test
```

The test suite (`tests/site.test.js`) validates the site in a simulated browser:
all legs render, language toggle works, flights display, TBD placeholders show,
and Melnik sights expand.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Page structure (hero, timeline, footer) |
| `css/style.css` | Styles (teal/ink palette, timeline cards) |
| `js/data.js` | Trip data model (legs, flights, accommodations, sights) |
| `js/app.js` | Timeline rendering, language toggle |
| `PRD.md` | Product requirements document |
| `tests/site.test.js` | 25 tests, all passing |

## Editing the itinerary

Trip details are in `js/data.js`. Edit the `TRIP` object to add/remove legs,
update flights, or change accommodations. All text has `en` and `bg` variants.

## Deploy

Commit + push to `main`. GitHub Pages publishes automatically (~1 min).
Use cache-busting query strings (`?v=N`) when changing CSS or JS.
