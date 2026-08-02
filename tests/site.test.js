const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Harness
//
// jsdom does not share top-level `const` bindings across separate external
// <script> tags the way browsers do, so we combine data.js + app.js into a
// single inline script. All text splicing below uses split/join (NOT
// String.replace), because .replace() interprets `$` in replacement strings
// and would corrupt the app's `$$` helper.
// The harness locates the script tags by regex so cache-busting query strings
// (?v=N) never break it.
// ---------------------------------------------------------------------------

function buildScript() {
  const data = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  let app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");

  const hook =
    "  window.__hot = {\n" +
    "    state: state,\n" +
    "    init: init,\n" +
    "    renderLocationCards: renderLocationCards,\n" +
    "    renderFavoritePicker: renderFavoritePicker,\n" +
    "    renderInfoPanel: renderInfoPanel,\n" +
    "    selectFavorite: selectFavorite,\n" +
    "    syncFavoriteUI: syncFavoriteUI,\n" +
    "    renderResults: renderResults,\n" +
    "    renderSummary: renderSummary,\n" +
    "    renderTally: renderTally,\n" +
    "    renderVotesList: renderVotesList,\n" +
    "    handleSave: handleSave,\n" +
    "    handleClear: handleClear,\n" +
    "    upsertVote: upsertVote,\n" +
    "    importVotes: importVotes,\n" +
    "    getMyVote: getMyVote,\n" +
    "    buildLink: buildLink,\n" +
    "    encodeVotes: encodeVotes,\n" +
    "    decodeVotes: decodeVotes,\n" +
    "    escapeHtml: escapeHtml,\n" +
    "    normalize: normalize,\n" +
    "    locationById: locationById,\n" +
    "    loadVotes: loadVotes,\n" +
    "    LOCATIONS: LOCATIONS\n" +
    "  };\n";

  app = app.split('  document.addEventListener("DOMContentLoaded", init);')
    .join(hook + '\n  document.addEventListener("DOMContentLoaded", init);');

  return data + "\n" + app;
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
  w.navigator.clipboard = {
    writeText: function (t) { (w.__copied = w.__copied || []).push(t); return Promise.resolve(true); }
  };
  w.__alerts = [];
  w.alert = function (m) { w.__alerts.push(String(m)); };
  w.__raft = w.__hot;
  w.__raft.init();
  return dom;
}

// Each interactive test gets its own fresh page so listeners/state don't leak.
function fresh() {
  return makeDom();
}

function renderers() {
  const w = fresh().window;
  return {
    w,
    summary(votes) {
      setVotes(w, votes);
      w.__raft.renderSummary();
      return w.document.getElementById("summary").textContent;
    },
    tally(votes) {
      setVotes(w, votes);
      w.__raft.renderTally();
      return w.document.getElementById("favorite-tally").innerHTML;
    },
    votesList(votes) {
      setVotes(w, votes);
      w.__raft.renderVotesList();
      return w.document.getElementById("votes-list").innerHTML;
    }
  };
}
function setVotes(w, votes) {
  w.__raft.state.votes = votes.map((v) => JSON.parse(JSON.stringify(v)));
}

function click(w, el) {
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function submit(w) {
  w.document.getElementById("vote-form")
    .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

// Reference tally/summary implementations (independent of app.js)
function refCounts(LOCATIONS, votes) {
  const counts = {};
  LOCATIONS.forEach((l) => { counts[l.id] = 0; });
  votes.forEach((p) => { if (counts[p.favorite] !== undefined) counts[p.favorite]++; });
  return counts;
}
function refLeaders(LOCATIONS, votes) {
  const counts = refCounts(LOCATIONS, votes);
  const max = votes.length ? Math.max.apply(null, LOCATIONS.map((l) => counts[l.id])) : 0;
  return max > 0 ? LOCATIONS.filter((l) => counts[l.id] === max).map((l) => l.id) : [];
}

const LOCATIONS = makeDom().window.__raft.LOCATIONS;
const STORAGE_KEY = "hotspringVotesV1";

// ---------------------------------------------------------------------------
// 1. Data integrity
// ---------------------------------------------------------------------------

test("data file defines exactly 7 locations with complete fields", () => {
  assert.strictEqual(LOCATIONS.length, 7);
  assert.strictEqual(new Set(LOCATIONS.map((l) => l.id)).size, 7, "ids must be unique");
  LOCATIONS.forEach((l) => {
    ["id", "emoji", "flag", "name", "place", "specs", "price", "distance", "highlights", "why", "hotels", "eat", "see", "color"].forEach((f) => {
      assert.ok(l[f] !== undefined && l[f] !== null && l[f] !== "", `location ${l.id} missing "${f}"`);
    });
    assert.ok(Array.isArray(l.specs) && l.specs.length > 0, `${l.id} needs specs`);
    assert.ok(Array.isArray(l.highlights) && l.highlights.length > 0, `${l.id} needs highlights`);
    assert.ok(Array.isArray(l.hotels) && l.hotels.length > 0, `${l.id} needs hotels`);
    assert.ok(Array.isArray(l.eat) && l.eat.length > 0, `${l.id} needs eat options`);
    assert.ok(Array.isArray(l.see) && l.see.length > 0, `${l.id} needs see options`);
    l.hotels.concat(l.eat).concat(l.see).forEach((item) => {
      assert.ok(item.name && item.info, `${l.id} has an item missing name or info`);
    });
  });
});

test("data file contains exactly the 7 expected candidate locations", () => {
  const ids = Array.from(LOCATIONS.map((l) => l.id)).sort();
  assert.deepStrictEqual(ids, ["belchinski-izvor", "hisarya", "malyovitsa", "melnik", "sapareva-banya", "starosel", "ustina"]);
  const names = LOCATIONS.map((l) => l.name);
  assert.ok(names.some((n) => n.includes("Мальовица")), "Хотел „Мальовица“ present");
  assert.ok(names.some((n) => n.includes("Белчински извор")), "Белчински извор present");
  assert.ok(names.some((n) => n === "Хисаря"), "Хисаря present");
  assert.ok(names.some((n) => n.includes("Сапарева баня")), "Сапарева баня present");
  assert.ok(names.some((n) => n.includes("Старосел")), "Старосел present");
  assert.ok(names.some((n) => n.includes("Мелник")), "Мелник present");
  assert.ok(names.some((n) => n.includes("Устина")), "Устина present");
});

// ---------------------------------------------------------------------------
// 2. Page language & initial render
// ---------------------------------------------------------------------------

test("index.html is a Bulgarian page (lang=bg) with Bulgarian UI labels", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(/<html lang="bg">/.test(html), "html lang attribute is bg");
  ["хотел", "местоположение", "Гласувай", "Резултати"].forEach((label) => {
    assert.ok(html.toLowerCase().includes(label.toLowerCase()), `page mentions "${label}"`);
  });
});

test("init renders 7 location cards with all key sections", () => {
  const w = fresh().window;
  const d = w.document;
  const cards = d.querySelectorAll("#location-cards .location-card");
  assert.strictEqual(cards.length, 7);
  LOCATIONS.forEach((l, i) => {
    const card = cards[i];
    assert.strictEqual(card.getAttribute("data-id"), l.id);
    assert.ok(card.querySelector("h3").textContent.includes(l.name), `card ${l.id} shows name`);
    assert.ok(card.textContent.includes(l.flag), `card ${l.id} shows flag`);
    assert.ok(card.textContent.includes(l.place), `card ${l.id} shows place`);
    l.highlights.forEach((h) => assert.ok(card.textContent.includes(h.slice(0, 16)), `card ${l.id} shows highlight`));
    assert.ok(card.textContent.includes(l.price), `card ${l.id} shows price`);
    assert.ok(card.textContent.includes(l.distance), `card ${l.id} shows distance`);
    assert.ok(card.textContent.includes(l.why), `card ${l.id} shows why`);
  });
});

test("each location card has an info block listing hotels, food and sights", () => {
  const w = fresh().window;
  const d = w.document;
  const cards = d.querySelectorAll("#location-cards .location-card");
  assert.strictEqual(d.querySelectorAll("#location-cards .loc-info").length, 7);
  LOCATIONS.forEach((l, i) => {
    const card = cards[i];
    const info = card.querySelector(".loc-info");
    assert.ok(info, `${l.id} has details.loc-info`);
    assert.ok(info.querySelector("summary").textContent.toLowerCase().includes("къде да спим"));
    const colTitles = Array.from(info.querySelectorAll(".se-col h4")).map((h) => h.textContent);
    assert.ok(colTitles.includes("Настаняване"), `${l.id} has Настаняване column`);
    assert.ok(colTitles.includes("Храна"), `${l.id} has Храна column`);
    assert.ok(colTitles.includes("Забележителности"), `${l.id} has Забележителности column`);
    const lis = info.querySelectorAll("li");
    assert.strictEqual(lis.length, l.hotels.length + l.eat.length + l.see.length, `${l.id} lists all options`);
    l.hotels.concat(l.eat).concat(l.see).forEach((item) => {
      const li = Array.from(lis).find((x) => x.textContent.includes(item.name) && x.textContent.includes(item.info));
      assert.ok(li, `${l.id} "${item.name}" is listed with its info`);
    });
  });
});

test("favorite picker renders 7 options", () => {
  const w = fresh().window;
  const d = w.document;
  const opts = d.querySelectorAll("#favorite-picker .fav-opt");
  assert.strictEqual(opts.length, 7);
  LOCATIONS.forEach((l, i) => {
    assert.strictEqual(opts[i].getAttribute("data-id"), l.id);
    assert.ok(opts[i].textContent.includes(l.name));
  });
});

test("results sections render Bulgarian empty states on load", () => {
  const w = fresh().window;
  const d = w.document;
  assert.ok(d.getElementById("summary").textContent.includes("Все още няма гласове"));
  assert.ok(d.getElementById("favorite-tally").textContent.includes("Гласовете ще се появят тук"));
  assert.ok(d.getElementById("votes-list").textContent.includes("Все още няма записани гласове"));
});

// ---------------------------------------------------------------------------
// 3. Info panel (hotels / food / sights) — info only, under the vote pane
// ---------------------------------------------------------------------------

test("info button sits under the vote pane and toggles a panel listing everything", () => {
  const w = fresh().window;
  const d = w.document;
  const btn = d.getElementById("info-toggle");
  const panel = d.getElementById("info-panel");
  assert.ok(btn, "toggle button exists");
  assert.ok(panel, "panel exists");
  assert.ok(btn.textContent.toLowerCase().includes("хотели"), "button mentions hotels");
  assert.ok(btn.textContent.toLowerCase().includes("храна"), "button mentions food");
  assert.ok(btn.textContent.toLowerCase().includes("забележителности"), "button mentions sights");
  assert.ok(btn.textContent.toLowerCase().includes("само информация"), "button signals info-only");

  const voteSection = d.querySelector("#vote .container");
  const layout = d.querySelector("#vote .vote-layout");
  const btnIndex = Array.from(voteSection.children).indexOf(btn);
  const layoutIndex = Array.from(voteSection.children).indexOf(layout);
  assert.ok(btnIndex !== -1 && layoutIndex !== -1 && btnIndex < layoutIndex, "button renders above the vote layout");

  assert.ok(panel.classList.contains("hidden"), "panel hidden by default");

  const trips = panel.querySelectorAll(".se-location");
  assert.strictEqual(trips.length, 7, "one block per location");
  LOCATIONS.forEach((l, i) => {
    assert.ok(trips[i].querySelector("h3").textContent.includes(l.name), `${l.id} heading`);
    const colTitles = Array.from(trips[i].querySelectorAll(".se-col h4")).map((h) => h.textContent);
    assert.ok(colTitles.includes("Настаняване") && colTitles.includes("Храна") && colTitles.includes("Забележителности"), `${l.id} has all three columns`);
    const lis = trips[i].querySelectorAll("li");
    assert.strictEqual(lis.length, l.hotels.length + l.eat.length + l.see.length, `${l.id} lists all options`);
  });

  click(w, btn);
  assert.ok(!panel.classList.contains("hidden"), "panel opens on click");
  assert.strictEqual(btn.getAttribute("aria-expanded"), "true");
  click(w, btn);
  assert.ok(panel.classList.contains("hidden"), "panel closes on second click");
  assert.strictEqual(btn.getAttribute("aria-expanded"), "false");
});

test("clicks inside a card's info block do not select the location", () => {
  const w = fresh().window;
  const d = w.document;
  click(w, d.querySelector('#location-cards .location-card[data-id="hisarya"] .loc-info summary'));
  assert.strictEqual(w.__raft.state.favorite, null, "info click should be ignored");
});

// ---------------------------------------------------------------------------
// 4. Favorite selection
// ---------------------------------------------------------------------------

test("clicking a location card selects it as favorite and reflects in picker", () => {
  const w = fresh().window;
  const d = w.document;
  LOCATIONS.forEach((l, i) => {
    const card = d.querySelector('#location-cards .location-card[data-id="' + l.id + '"]');
    click(w, card);
    assert.strictEqual(w.__raft.state.favorite, l.id, `favorite = ${l.id}`);
    assert.ok(card.classList.contains("selected"), `card ${l.id} gets .selected`);
    assert.ok(card.querySelector(".check").textContent.includes("Твоят избор"), `card ${l.id} check label`);
    const opt = d.querySelector('#favorite-picker .fav-opt[data-id="' + l.id + '"]');
    assert.ok(opt.classList.contains("selected"), `picker ${l.id} reflects selected`);
    if (i > 0) {
      const prev = d.querySelector('#location-cards .location-card[data-id="' + LOCATIONS[i - 1].id + '"]');
      assert.ok(!prev.classList.contains("selected"));
    }
  });
});

test("clicking a picker option selects the card and updates the check label", () => {
  const w = fresh().window;
  const d = w.document;
  click(w, d.querySelector('#favorite-picker .fav-opt[data-id="starosel"]'));
  const card = d.querySelector('#location-cards .location-card[data-id="starosel"]');
  assert.ok(card.classList.contains("selected"));
  assert.ok(card.querySelector(".check").textContent.includes("Твоят избор"));
});

// ---------------------------------------------------------------------------
// 5. Vote form validation (Bulgarian messages)
// ---------------------------------------------------------------------------

test("saving without a name shows an error and adds no vote", () => {
  const w = fresh().window;
  const d = w.document;
  w.__raft.state.favorite = "hisarya";
  submit(w);
  assert.ok(d.getElementById("save-status").className.includes("err"));
  assert.ok(d.getElementById("save-status").textContent.toLowerCase().includes("име"));
  assert.strictEqual(w.__raft.state.votes.length, 0);
});

test("saving without a favorite shows an error and adds no vote", () => {
  const w = fresh().window;
  const d = w.document;
  d.getElementById("voter-name").value = "Братко";
  submit(w);
  assert.ok(d.getElementById("save-status").className.includes("err"));
  assert.ok(d.getElementById("save-status").textContent.toLowerCase().includes("дестинация"));
  assert.strictEqual(w.__raft.state.votes.length, 0);
});

test("a valid vote is saved, persisted, and reflected everywhere", () => {
  const w = fresh().window;
  const d = w.document;
  d.getElementById("voter-name").value = "  Иван и Мария  ";
  d.getElementById("voter-note").value = "Предпочитаме басейни с минерална вода";
  w.__raft.selectFavorite("belchinski-izvor");
  submit(w);

  assert.ok(d.getElementById("save-status").className.includes("ok"));
  assert.ok(d.getElementById("save-status").textContent.includes("записан"));
  assert.strictEqual(w.__raft.state.votes.length, 1);
  const v = w.__raft.state.votes[0];
  assert.strictEqual(v.name, "Иван и Мария");
  assert.strictEqual(v.favorite, "belchinski-izvor");
  assert.strictEqual(v.note, "Предпочитаме басейни с минерална вода");
  assert.ok(v.id, "vote has id");
  assert.ok(v.ts, "vote has timestamp");

  const raw = w.localStorage.getItem(STORAGE_KEY);
  assert.ok(raw, "votes stored in localStorage");
  assert.deepStrictEqual(JSON.parse(raw).map((x) => x.name), ["Иван и Мария"]);

  const list = d.getElementById("votes-list");
  assert.ok(list.textContent.includes("Иван и Мария"));
  assert.ok(list.textContent.includes("Белчински извор"));
  assert.ok(list.textContent.includes("басейни с минерална вода"));
});

test("re-saving the same name updates the existing vote instead of duplicating", () => {
  const w = fresh().window;
  const d = w.document;
  d.getElementById("voter-name").value = "Георги";
  w.__raft.selectFavorite("hisarya");
  submit(w);
  assert.strictEqual(w.__raft.state.votes.length, 1);

  d.getElementById("voter-name").value = "  гЕоРгИ  ";
  w.__raft.selectFavorite("malyovitsa");
  submit(w);

  assert.strictEqual(w.__raft.state.votes.length, 1, "still exactly one vote");
  const v = w.__raft.state.votes[0];
  assert.strictEqual(v.favorite, "malyovitsa");
});

test("clearing a vote removes it and keeps other votes", () => {
  const w = fresh().window;
  const d = w.document;
  d.getElementById("voter-name").value = "Георги";
  w.__raft.selectFavorite("hisarya");
  submit(w);
  d.getElementById("voter-name").value = "Петър";
  w.__raft.selectFavorite("starosel");
  submit(w);
  assert.strictEqual(w.__raft.state.votes.length, 2);

  d.getElementById("voter-name").value = "георги";
  click(w, d.getElementById("clear-vote"));
  assert.strictEqual(w.__raft.state.votes.length, 1);
  assert.strictEqual(w.__raft.state.votes[0].name, "Петър");
  const stored = JSON.parse(w.localStorage.getItem(STORAGE_KEY));
  assert.deepStrictEqual(stored.map((x) => x.name), ["Петър"]);
});

// ---------------------------------------------------------------------------
// 6. Summary + tally
// ---------------------------------------------------------------------------

test("summary shows the leader and vote totals in Bulgarian", () => {
  const r = renderers();
  const votes = [
    { name: "А", favorite: "hisarya" },
    { name: "Б", favorite: "hisarya" },
    { name: "В", favorite: "malyovitsa" }
  ];
  const text = r.summary(votes);
  assert.ok(text.includes("води"), "summary mentions leader");
  assert.ok(text.includes("Хисаря"), "leader name shown");
  assert.ok(text.includes("2"), "leader vote count shown");
  assert.ok(text.includes("3"), "total votes shown");
});

test("summary shows a tie between leaders", () => {
  const r = renderers();
  const votes = [
    { name: "А", favorite: "hisarya" },
    { name: "Б", favorite: "malyovitsa" }
  ];
  const text = r.summary(votes);
  assert.ok(text.toLowerCase().includes("равни"), "tie is mentioned");
  assert.ok(text.includes("Хисаря"), "first tied leader");
  assert.ok(text.includes("Мальовица"), "second tied leader");
});

test("summary lists every leader for a 4-way tie", () => {
  const r = renderers();
  const votes = ["malyovitsa", "belchinski-izvor", "hisarya", "starosel"]
    .map((favorite) => ({ name: "X", favorite }));
  const text = r.summary(votes);
  ["Мальовица", "Белчински извор", "Хисаря", "Старосел"].forEach((n) => {
    assert.ok(text.includes(n), `tie shows ${n}`);
  });
});

test("tally counts votes per location and scales bars by max", () => {
  const r = renderers();
  const votes = [
    { name: "А", favorite: "hisarya" },
    { name: "Б", favorite: "hisarya" },
    { name: "В", favorite: "malyovitsa" },
    { name: "Г", favorite: "starosel" }
  ];
  const html = r.tally(votes);
  LOCATIONS.forEach((l) => assert.ok(html.includes(l.name), l.id + " has a tally row"));
  assert.ok(/width:100%/.test(html), "max bar is 100%");
  assert.ok(/width:50%/.test(html), "1-vote bar is 50%");
  assert.ok(html.includes("2 гласа"));
  assert.ok(html.includes("1 глас"));
  assert.ok(html.includes("Белчински извор"), "0-vote location still listed");
});

test("tally shows placeholder when there are no votes", () => {
  const r = renderers();
  assert.ok(r.tally([]).includes("Гласовете ще се появят тук"));
});

// ---------------------------------------------------------------------------
// 7. Votes list rendering + XSS safety
// ---------------------------------------------------------------------------

test("votes list escapes HTML in names and notes", () => {
  const r = renderers();
  const votes = [
    { name: '<img src=x onerror=alert(1)>', favorite: "hisarya", note: '<script>bad()</script>' }
  ];
  const html = r.votesList(votes);
  assert.ok(!html.includes("<img"), "img tag not rendered as HTML");
  assert.ok(!html.includes("<script>"), "script tag not rendered as HTML");
  assert.ok(html.includes("&lt;img"), "escaped img present");
  assert.ok(html.includes("&lt;script&gt;"), "escaped script present");
});

test("escapeHtml handles all five special characters", () => {
  const w = fresh().window;
  assert.strictEqual(w.__raft.escapeHtml('a&b<c>d"e\'f'), "a&amp;b&lt;c&gt;d&quot;e&#39;f");
  assert.strictEqual(w.__raft.escapeHtml("обикновен"), "обикновен");
});

// ---------------------------------------------------------------------------
// 8. Share links (unicode-safe base64) + import
// ---------------------------------------------------------------------------

test("encode/decode round-trips votes including unicode names and notes", () => {
  const w = fresh().window;
  const votes = [
    { name: "Семейство Гарсия & Ко — Сандански 🌊", favorite: "sapareva-banya", note: "гейзер и рилски езера" }
  ];
  const dec = w.__raft.decodeVotes(w.__raft.encodeVotes(votes));
  assert.strictEqual(JSON.stringify(dec), JSON.stringify(votes));
});

test("buildLink produces a #v= link that decodes back to the same votes", () => {
  const w = fresh().window;
  w.__raft.state.votes = [
    { name: "Георги", favorite: "hisarya", note: "", ts: "2026-08-01T00:00:00Z", id: "v1" }
  ];
  const link = w.__raft.buildLink(w.__raft.state.votes);
  assert.ok(link.includes("#v="), "link carries #v= hash");
  const hash = link.split("#v=")[1];
  const dec = w.__raft.decodeVotes(decodeURIComponent(hash));
  assert.strictEqual(dec.length, 1);
  assert.strictEqual(dec[0].name, "Георги");
  assert.strictEqual(dec[0].favorite, "hisarya");
});

test("importVotes merges incoming votes and re-renders results", () => {
  const w = fresh().window;
  const d = w.document;
  const n = w.__raft.importVotes([
    { name: "Анна", favorite: "malyovitsa" },
    { name: "Борис", favorite: "starosel" }
  ], "all");
  assert.strictEqual(n, 2);
  assert.strictEqual(w.__raft.state.votes.length, 2);
  const summary = d.getElementById("summary");
  assert.ok(summary.textContent.includes("Все още няма гласове") === false, "summary no longer empty");
  assert.ok(d.getElementById("votes-list").textContent.includes("Анна"));
});

test("importVotes ignores malformed entries and never throws", () => {
  const w = fresh().window;
  const n = w.__raft.importVotes([
    null,
    { favorite: "hisarya" },
    { name: "ОК", favorite: "hisarya" },
    { name: 42, favorite: "no-such-id" }
  ], "all");
  assert.strictEqual(n, 1, "only the valid entry counts");
  assert.strictEqual(w.__raft.state.votes.length, 1);
  assert.strictEqual(w.__raft.state.votes[0].name, "ОК");
});

test("importing votes via a #v= hash on page load merges and clears the hash", () => {
  const w = fresh().window;
  const d = w.document;
  w.__raft.state.votes = [];
  const link = w.__raft.buildLink([{ name: "Цветан", favorite: "belchinski-izvor" }]);
  const hashPart = link.split("#")[1];
  w.location.hash = "#" + hashPart;
  w.__raft.init();
  assert.ok(w.__raft.state.votes.some((v) => v.name === "Цветан"), "vote imported from hash");
  assert.ok(d.getElementById("votes-list").textContent.includes("Цветан"));
});

// ---------------------------------------------------------------------------
// 9. Copy-buttons + getMyVote
// ---------------------------------------------------------------------------

test("copy-my-vote copies a link for the current household", async () => {
  const w = fresh().window;
  const d = w.document;
  d.getElementById("voter-name").value = "Георги";
  w.__raft.selectFavorite("hisarya");
  submit(w);

  click(w, d.getElementById("copy-my-vote"));
  await new Promise((res) => setTimeout(res, 20));
  assert.strictEqual(w.__copied.length, 1, "a link was copied");
  const link = w.__copied[0];
  assert.ok(link.includes("#v="));
  const dec = w.__raft.decodeVotes(decodeURIComponent(link.split("#v=")[1]));
  assert.strictEqual(dec[0].name, "Георги");
});

test("copy-my-vote alerts when there is no vote to share", async () => {
  const w = fresh().window;
  const d = w.document;
  click(w, d.getElementById("copy-my-vote"));
  assert.ok(w.__alerts.length > 0, "alert raised");
  assert.ok(w.__alerts[0].toLowerCase().includes("първо"), "alert tells user to save first");
});

test("copy-all-votes copies a link containing every vote", async () => {
  const w = fresh().window;
  const d = w.document;
  w.__raft.importVotes([
    { name: "Анна", favorite: "malyovitsa" },
    { name: "Борис", favorite: "starosel" }
  ], "all");
  click(w, d.getElementById("copy-all-votes"));
  await new Promise((res) => setTimeout(res, 20));
  const link = w.__copied[0];
  const dec = w.__raft.decodeVotes(decodeURIComponent(link.split("#v=")[1]));
  assert.strictEqual(dec.length, 2);
});

// ---------------------------------------------------------------------------
// 10. localStorage persistence across reloads
// ---------------------------------------------------------------------------

test("votes survive a simulated page reload via localStorage", () => {
  const w = fresh().window;
  w.__raft.importVotes([
    { name: "Петър", favorite: "sapareva-banya" }
  ], "all");
  assert.strictEqual(w.__raft.state.votes.length, 1);
  w.__raft.state.votes = [];
  w.__raft.state.favorite = null;
  w.__raft.state.votes = w.__raft.loadVotes();
  assert.strictEqual(w.__raft.state.votes.length, 1, "vote reloaded from localStorage");
  assert.strictEqual(w.__raft.state.votes[0].name, "Петър");
});

test("corrupt localStorage data is ignored safely", () => {
  const w = fresh().window;
  w.localStorage.setItem(STORAGE_KEY, "{not valid json");
  const loaded = w.__raft.loadVotes();
  assert.strictEqual(loaded.length, 0);
});
