# Bulgaria Trip 2026 -- PRD

## Product
Bilingual (EN/BG) static reference site for George and Harue's
October 2026 Bulgaria trip. Itinerary display, accommodations, and
things to see at each stop. No voting, no dynamic state. Deployed
on GitHub Pages, shareable with family.

## Tech Stack
- Vanilla HTML/CSS/JS (ES5, IIFE, var) -- no frameworks, no build step
- Reuse: CSS theme (teal/ink), card layout, responsive grid,
  node --test + jsdom tests, GitHub Pages deploy
- Delete: all voting logic, old data model, old tests

## Language
English/Bulgarian selector in top-right corner. Entire UI translated.

## Itinerary

| Date | Day | What | Stay |
|------|-----|------|------|
| Oct 8 (Thu) | 1 | George departs PDX 7:30 PM (BA266) | -- |
| Oct 9 (Fri) | 2 | Arrives LHR 1 PM, departs 5:55 PM (FB852), arrives SOF 11:15 PM | Premier Sofia Airport Hotel |
| Oct 10-15 | 3-8 | George in Plovdiv with family | with family |
| Oct 15 (Thu) | 8 | Harue departs PDX 7:30 PM (BA266) | -- |
| Oct 16 (Fri) | 9 | Arrives LHR 1 PM, departs 5:55 PM (FB852), arrives SOF 11:15 PM | Premier Sofia Airport Hotel |
| Oct 17 (Sat) | 10 | Drive to Melnik, meet family, wine tasting | Guest House Holiday (3BR apt) |
| Oct 18 (Sun) | 11 | Melnik sightseeing, drive to Plovdiv | with family |
| Oct 19-21 | 12-14 | Plovdiv -- time with family | with family |
| Oct 22 (Wed) | 15 | Outing with father | TBD hotel |
| Oct 23 (Thu) | 16 | Father's birthday | with family |
| Oct 24 (Fri) | 17 | Dinner with Mom | with family |
| Oct 25 (Sat) | 18 | Sofia, dinner with Krasi | TBD hotel (near SOF) |
| Oct 26 (Sun) | 19 | Fly back: SOF 6:20 AM (FB851) -> LHR, LHR 1:35 PM (BA267) -> PDX 4:50 PM | -- |

## Flight Details

### Outbound (same for George Oct 8 and Harue Oct 15)
- BA266: PDX 7:30 PM -> LHR 1:00 PM (+1 day), 4h 55min, Economy
- FB852: LHR 5:55 PM -> SOF 11:15 PM, 3h 20min, Economy Standard

### Return (Oct 26)
- FB851: SOF 6:20 AM -> LHR 7:50 AM, 3h 30min, Economy Standard
- BA267: LHR 1:35 PM -> PDX 4:50 PM, 10h 15min, Economy

## Melnik Highlights (Oct 17-18)
- Kordopulov House (wine cellar, 18th c. architecture, tasting)
- Melnik Wine Museum (walkable, tastings)
- Villa Melnik Winery (Top 50 world, ~4km, need car)
- Zindan Cellar (Ottoman underground, atmospheric)
- Melnik Earth Pyramids (sandstone formations, hiking, photos)
- Rozhen Monastery (6km, frescoes)
- Despot Slav's Fortress (medieval ruins, views)
- St. Nicholas Church

## Page Sections
1. Hero -- "Bulgaria Trip 2026" with date range
2. Language selector (EN/BG) -- top right
3. Timeline -- vertical cards, one per leg
4. Each card: date, title, accommodation, notes, expandable "things to see"
5. Footer

## Data Model
Single TRIP object with legs[] array. Each leg has date, title (en/bg),
accommodation, notes, thingsToSee. Flight details as nested object.

## Tests
- Itinerary renders all legs
- Language toggle switches content
- TBD placeholders display correctly
- Responsive layout at mobile breakpoints

## Deployment
- GitHub Pages from main branch
- Cache-busting query strings on CSS/JS
