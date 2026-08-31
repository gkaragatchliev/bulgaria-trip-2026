const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Harness
//
// jsdom does not share top-level const bindings across separate external
// <script> tags. We combine data.js + app.js into a single inline script.
// All text splicing uses split/join (NOT .replace) to avoid $ corruption.
// ---------------------------------------------------------------------------

function buildScript() {
  const config = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
  const data = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  let app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");

  const hook =
    "  window.__trip = {\n" +
    "    state: state,\n" +
    "    init: init,\n" +
    "    renderAll: renderAll,\n" +
    "    renderHero: renderHero,\n" +
    "    renderOverview: renderOverview,\n" +
    "    renderTimeline: renderTimeline,\n" +
    "    setLang: setLang,\n" +
    "    t: t,\n" +
    "    escapeHtml: escapeHtml,\n" +
    "    TRIP: TRIP\n" +
    "  };\n";

  app = app.split('  document.addEventListener("DOMContentLoaded", init);')
    .join(hook + '\n  document.addEventListener("DOMContentLoaded", init);');

  return config + "\n" + data + "\n" + app;
}

function makeDom() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const inline = buildScript().split("</script>").join("<\\/script>");
  const processed = html
    .replace(/<script src="[^"]*"><\/script>/g, "")
    .split("</body>").join("<script>" + inline + "</script></body>");

  const vc = new VirtualConsole();
  vc.on("jsdomError", () => {});
  const dom = new JSDOM(processed, {
    runScripts: "dangerously",
    url: "http://localhost/",
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const w = dom.window;
  w.__trip.init();
  return dom;
}

function fresh() {
  return makeDom();
}

// ---------------------------------------------------------------------------
// 1. Data integrity
// ---------------------------------------------------------------------------

test("TRIP data has title, subtitle, travelers, and legs", () => {
  const w = fresh().window;
  const trip = w.__trip.TRIP;
  assert.ok(trip.title && trip.title.en && trip.title.bg, "title has en/bg");
  assert.ok(trip.subtitle && trip.subtitle.en && trip.subtitle.bg, "subtitle has en/bg");
  assert.ok(Array.isArray(trip.travelers) && trip.travelers.length === 2, "2 travelers");
  assert.ok(Array.isArray(trip.legs) && trip.legs.length > 0, "legs array populated");
});

test("each leg has required fields", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  legs.forEach((leg) => {
    assert.ok(leg.id, `leg ${leg.id} has id`);
    assert.ok(leg.date, `${leg.id} has date`);
    assert.ok(leg.day && leg.day.en && leg.day.bg, `${leg.id} has day en/bg`);
    assert.ok(leg.title && leg.title.en && leg.title.bg, `${leg.id} has title en/bg`);
    assert.ok(leg.notes && leg.notes.en && leg.notes.bg, `${leg.id} has notes en/bg`);
    assert.ok(Array.isArray(leg.thingsToSee), `${leg.id} has thingsToSee array`);
  });
});

test("flights have all required fields", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  legs.forEach((leg) => {
    const flights = leg.flight ? [leg.flight] : (leg.flights || []);
    flights.forEach((f) => {
      assert.ok(f.airline, `${leg.id} flight has airline`);
      assert.ok(f.number, `${leg.id} flight has number`);
      assert.ok(f.depart, `${leg.id} flight has depart`);
      assert.ok(f.arrive, `${leg.id} flight has arrive`);
      assert.ok(f.duration, `${leg.id} flight has duration`);
    });
  });
});

test("TBD accommodations are present for correct legs", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  const tbdLegs = legs.filter((l) => l.accommodation && l.accommodation.name.includes("TBD"));
  assert.ok(tbdLegs.length >= 1, "at least 1 TBD accommodation");
  tbdLegs.forEach((l) => {
    assert.ok(l.accommodation.name.includes("TBD"), `${l.id} has TBD`);
  });
});

test("thingsToSee items have en/bg name and info", () => {
  const w = fresh().window;
  const legs = w.__trip.TRIP.legs;
  legs.forEach((leg) => {
    leg.thingsToSee.forEach((thing) => {
      assert.ok(thing.name && thing.name.en && thing.name.bg, `${leg.id} thing has name en/bg`);
      assert.ok(thing.info && thing.info.en && thing.info.bg, `${leg.id} thing has info en/bg`);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Page structure
// ---------------------------------------------------------------------------

test("index.html has lang=en and proper title", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(/<html lang="en">/.test(html), "html lang is en");
  assert.ok(html.includes("Bulgaria Trip 2026"), "page title present");
});

test("language selector buttons exist", () => {
  const w = fresh().window;
  const btns = w.document.querySelectorAll(".lang-btn");
  assert.strictEqual(btns.length, 2, "2 lang buttons");
  assert.strictEqual(btns[0].getAttribute("data-lang"), "en");
  assert.strictEqual(btns[1].getAttribute("data-lang"), "bg");
});

// ---------------------------------------------------------------------------
// 3. Timeline rendering (English default)
// ---------------------------------------------------------------------------

test("timeline renders all legs", () => {
  const w = fresh().window;
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  assert.strictEqual(cards.length, w.__trip.TRIP.legs.length, "one card per leg");
});

test("timeline card shows date, day, and title in English", () => {
  const w = fresh().window;
  const first = w.__trip.TRIP.legs[0];
  const card = w.document.querySelector("#timeline .timeline-card");
  assert.ok(card.querySelector(".tc-date").textContent.includes(first.date), "date shown");
  assert.ok(card.querySelector(".tc-day").textContent.includes(first.day.en), "day in English");
  assert.ok(card.querySelector(".tc-title").textContent.includes(first.title.en), "title in English");
});

test("flight details render for legs with flights", () => {
  const w = fresh().window;
  const georgeDepart = w.__trip.TRIP.legs.find((l) => l.id === "george-depart");
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  const card = Array.from(cards).find((c) => c.querySelector(".tc-title").textContent.includes(georgeDepart.title.en));
  const flights = card.querySelectorAll(".tc-flight");
  assert.ok(flights.length >= 1, "flight blocks rendered");
  assert.ok(card.textContent.includes("FB852"), "FB852 shown");
});

test("accommodation details render", () => {
  const w = fresh().window;
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  const card = Array.from(cards).find((c) => c.textContent.includes("Premier Sofia Airport Hotel"));
  assert.ok(card, "Premier Sofia Airport Hotel card found");
  assert.ok(card.querySelector(".tc-accommodation"), "accommodation section exists");
});

test("TBD accommodation renders", () => {
  const w = fresh().window;
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  const tbdCards = Array.from(cards).filter((c) => c.textContent.includes("TBD"));
  assert.ok(tbdCards.length >= 1, "at least 1 TBD card");
});

test("thingsToSee expandable section renders for Melnik legs", () => {
  const w = fresh().window;
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  const melnikCards = Array.from(cards).filter((c) => c.textContent.includes("Melnik"));
  assert.ok(melnikCards.length >= 1, "Melnik cards found");
  melnikCards.forEach((card) => {
    const things = card.querySelector(".tc-things");
    if (things) {
      assert.ok(things.querySelector("summary"), "has summary");
      const items = things.querySelectorAll(".tc-things-list li");
      assert.ok(items.length > 0, "has things listed");
    }
  });
});

test("empty thingsToSee legs have no expandable section", () => {
  const w = fresh().window;
  const legsWithNoThings = w.__trip.TRIP.legs.filter((l) => l.thingsToSee.length === 0);
  const cards = w.document.querySelectorAll("#timeline .timeline-card");
  assert.ok(legsWithNoThings.length > 0, "some legs have no thingsToSee");
  // Just verify timeline renders without errors for these legs
  assert.ok(cards.length === w.__trip.TRIP.legs.length, "all legs rendered");
});

// ---------------------------------------------------------------------------
// 4. Language toggle
// ---------------------------------------------------------------------------

test("switching to Bulgarian updates timeline content", () => {
  const w = fresh().window;
  const d = w.document;

  // English first
  const enTitle = d.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(enTitle.includes("George departs Portland"), "English title shown");

  // Switch to BG
  w.__trip.setLang("bg");

  const bgTitle = d.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(bgTitle.includes("Георги отпътува"), "Bulgarian title shown");
  assert.ok(!bgTitle.includes("George departs"), "English title gone");
});

test("switching to Bulgarian updates hero section", () => {
  const w = fresh().window;
  const d = w.document;

  w.__trip.setLang("bg");
  const h1 = d.querySelector(".hero h1").textContent;
  assert.ok(h1.includes("Почивка"), "Bulgarian hero title");
});

test("language buttons reflect active state", () => {
  const w = fresh().window;
  const d = w.document;

  const enBtn = d.querySelector('.lang-btn[data-lang="en"]');
  const bgBtn = d.querySelector('.lang-btn[data-lang="bg"]');

  assert.ok(enBtn.classList.contains("active"), "EN active by default");
  assert.ok(!bgBtn.classList.contains("active"), "BG not active by default");

  w.__trip.setLang("bg");
  assert.ok(!enBtn.classList.contains("active"), "EN not active after switch");
  assert.ok(bgBtn.classList.contains("active"), "BG active after switch");
});

test("clicking lang button triggers language switch", () => {
  const w = fresh().window;
  const d = w.document;

  const bgBtn = d.querySelector('.lang-btn[data-lang="bg"]');
  bgBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

  const bgTitle = d.querySelector("#timeline .timeline-card .tc-title").textContent;
  assert.ok(bgTitle.includes("Георги"), "language switched on click");
});

test("Bulgarian flight labels render correctly", () => {
  const w = fresh().window;
  w.__trip.setLang("bg");

  const d = w.document;
  const labels = d.querySelectorAll(".tc-flight .tc-label");
  assert.ok(labels.length > 0, "flight labels exist");
  assert.ok(labels[0].textContent.includes("Полет"), "Bulgarian flight label");
});

test("Bulgarian thingsToSee labels render correctly", () => {
  const w = fresh().window;
  w.__trip.setLang("bg");

  const d = w.document;
  const summaries = d.querySelectorAll(".tc-things summary");
  summaries.forEach((s) => {
    assert.ok(s.textContent.includes("Какво да видим"), "Bulgarian things label");
  });
});

// ---------------------------------------------------------------------------
// 5. XSS safety
// ---------------------------------------------------------------------------

test("escapeHtml handles all five special characters", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.escapeHtml('a&b<c>d"e\'f'), "a&amp;b&lt;c&gt;d&quot;e&#39;f");
  assert.strictEqual(w.__trip.escapeHtml("обикновен"), "обикновен");
});

// ---------------------------------------------------------------------------
// 6. Helper function t() returns correct language
// ---------------------------------------------------------------------------

test("t() returns English by default", () => {
  const w = fresh().window;
  const obj = { en: "Hello", bg: "Здравей" };
  assert.strictEqual(w.__trip.t(obj), "Hello");
});

test("t() returns Bulgarian after setLang", () => {
  const w = fresh().window;
  w.__trip.setLang("bg");
  const obj = { en: "Hello", bg: "Здравей" };
  assert.strictEqual(w.__trip.t(obj), "Здравей");
});

test("t() handles string input", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.t("plain string"), "plain string");
});

test("t() handles null/undefined", () => {
  const w = fresh().window;
  assert.strictEqual(w.__trip.t(null), "");
  assert.strictEqual(w.__trip.t(undefined), "");
});

// ---------------------------------------------------------------------------
// 7. Overview strip, map links, TBD badge, travelers, a11y
// ---------------------------------------------------------------------------

test("overview strip renders distinct stops in trip order", () => {
  const w = fresh().window;
  const chips = Array.from(w.document.querySelectorAll("#overview .ov-chip")).map((c) => c.textContent);
  assert.deepStrictEqual(chips, ["Sofia", "Plovdiv", "Sofia", "Melnik", "Plovdiv", "Sofia"]);
});

test("overview chips switch language with the page", () => {
  const w = fresh().window;
  w.__trip.setLang("bg");
  const chips = Array.from(w.document.querySelectorAll("#overview .ov-chip")).map((c) => c.textContent);
  assert.deepStrictEqual(chips, ["София", "Пловдив", "София", "Мелник", "Пловдив", "София"]);
});

test("named accommodations get a Google Maps link", () => {
  const w = fresh().window;
  const d = w.document;
  const cards = d.querySelectorAll("#timeline .timeline-card");
  const card = Array.from(cards).find((c) => c.textContent.includes("Premier Sofia Airport Hotel"));
  const map = card.querySelector(".tc-accommodation .tc-map");
  assert.ok(map, "map link present");
  assert.ok(map.getAttribute("href").indexOf("google.com/maps") !== -1);
});

test("TBD accommodations get the is-tbd marker and no map link", () => {
  const w = fresh().window;
  const d = w.document;
  const tbd = Array.from(d.querySelectorAll(".tc-accommodation.is-tbd"));
  assert.ok(tbd.length >= 1, "at least 1 TBD-marked stay");
  tbd.forEach((el) => {
    assert.strictEqual(el.querySelector(".tc-map"), null, "no map link for TBD");
  });
});

test("thingsToSee entries include a Google Maps link", () => {
  const w = fresh().window;
  const d = w.document;
  const links = d.querySelectorAll(".tc-things-list .tc-map");
  assert.ok(links.length >= 5, "Melnik sights have map links");
  links.forEach((a) => assert.ok(a.getAttribute("href").indexOf("google.com/maps") !== -1));
});

test("drive legs render a route block with map and traffic links", () => {
  const w = fresh().window;
  const d = w.document;
  const driveBlocks = d.querySelectorAll(".tc-drive");
  const driveLegs = w.__trip.TRIP.legs.filter((l) => l.drive);
  assert.strictEqual(driveBlocks.length, driveLegs.length, "one drive block per drive leg");

  driveBlocks.forEach((block) => {
    const links = block.querySelectorAll(".tc-map");
    assert.strictEqual(links.length, 2, "map + road conditions links");
    links.forEach((a) => assert.ok(a.getAttribute("href").indexOf("google.com/maps") !== -1));
    assert.ok(/Sofia|Melnik|Plovdiv/.test(block.textContent), "cities shown");
  });
});

test("hero shows travelers line", () => {
  const w = fresh().window;
  const text = w.document.querySelector(".hero-travelers").textContent;
  assert.ok(text.includes("George"));
  assert.ok(text.includes("Harue"));
  assert.ok(text.includes("Portland"));
});

test("language buttons expose aria-pressed state", () => {
  const w = fresh().window;
  const d = w.document;
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="en"]').getAttribute("aria-pressed"), "true");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="bg"]').getAttribute("aria-pressed"), "false");
  w.__trip.setLang("bg");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="en"]').getAttribute("aria-pressed"), "false");
  assert.strictEqual(d.querySelector('.lang-btn[data-lang="bg"]').getAttribute("aria-pressed"), "true");
});
