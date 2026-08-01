(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var state = {
    votes: loadVotes(),
    favorite: null,
    myVoteId: null
  };

  // ---------- съхранение ----------
  function loadVotes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveVotes() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.votes)); }
    catch (e) { /* storage may be unavailable */ }
  }

  // ---------- url кодиране (unicode-safe base64) ----------
  function b64Encode(str) {
    var bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (m, p) {
      return String.fromCharCode("0x" + p);
    });
    return btoa(bytes);
  }
  function b64Decode(b64) {
    var bytes = atob(b64);
    return decodeURIComponent(bytes.split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  }
  function encodeVotes(arr) { return b64Encode(JSON.stringify(arr)); }
  function decodeVotes(b64) { return JSON.parse(b64Decode(b64)); }

  function normalize(name) { return String(name || "").trim().toLowerCase(); }
  function locationById(id) {
    for (var i = 0; i < LOCATIONS.length; i++) if (LOCATIONS[i].id === id) return LOCATIONS[i];
    return null;
  }

  // ---------- рендиране: карти на дестинациите ----------
  function renderLocationCards() {
    var wrap = $("#location-cards");
    if (!wrap) return;
    wrap.innerHTML = LOCATIONS.map(function (l) {
      return (
        '<div class="location-card" data-id="' + l.id + '">' +
          '<span class="flag">' + l.flag + '</span>' +
          '<span class="emoji">' + l.emoji + '</span>' +
          '<h3>' + l.name + '</h3>' +
          '<div class="place">' + l.place + '</div>' +
          '<div class="specs">' + l.specs.map(function (s) { return '<span class="spec">' + s + '</span>'; }).join("") + '</div>' +
          '<ul>' + l.highlights.map(function (h) { return '<li>' + h + '</li>'; }).join("") + '</ul>' +
          '<p class="why">' + l.why + '</p>' +
          '<div class="specs">' +
            '<span class="spec">' + l.price + '</span>' +
            '<span class="spec">' + l.distance + '</span>' +
          '</div>' +
          infoBlock(l) +
          '<div class="check">Кликни, за да го избереш като любима дестинация</div>' +
        '</div>'
      );
    }).join("");
    $$("#location-cards .location-card").forEach(function (card) {
      card.addEventListener("click", function (ev) {
        if (ev.target.closest && ev.target.closest(".loc-info")) return;
        selectFavorite(card.getAttribute("data-id"));
        var voteEl = $("#vote");
        if (voteEl) voteEl.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function seCol(title, items) {
    if (!items || !items.length) return "";
    return (
      '<div class="se-col">' +
        '<h4>' + title + '</h4>' +
        '<ul class="se-list">' + items.map(function (it) {
          return '<li><strong>' + escapeHtml(it.name) + '</strong> — ' + escapeHtml(it.info) + '</li>';
        }).join("") + '</ul>' +
      '</div>'
    );
  }

  function infoBlock(l) {
    return (
      '<details class="loc-info">' +
        '<summary>🏨 Къде да спим, да ядем и какво да видим</summary>' +
        seCol("Настаняване", l.hotels) +
        seCol("Храна", l.eat) +
        seCol("Забележителности", l.see) +
      '</details>'
    );
  }

  // ---------- рендиране: панел с информация ----------
  function renderInfoPanel() {
    var panel = $("#info-panel");
    if (!panel) return;
    panel.innerHTML = LOCATIONS.map(function (l) {
      return (
        '<div class="se-location">' +
          '<h3>' + l.emoji + " " + l.name + "</h3>" +
          '<div class="se-grid">' +
            seCol("Настаняване", l.hotels) +
            seCol("Храна", l.eat) +
            seCol("Забележителности", l.see) +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  // ---------- рендиране: избор на любима дестинация ----------
  function renderFavoritePicker() {
    var wrap = $("#favorite-picker");
    if (!wrap) return;
    wrap.innerHTML = LOCATIONS.map(function (l) {
      return (
        '<div class="fav-opt" data-id="' + l.id + '">' +
          '<div class="fo-emoji">' + l.emoji + '</div>' +
          '<div class="fo-name">' + l.name + '</div>' +
          '<div class="fo-place">' + l.place.split(",")[0].trim() + '</div>' +
        '</div>'
      );
    }).join("");
    $$("#favorite-picker .fav-opt").forEach(function (opt) {
      opt.addEventListener("click", function () { selectFavorite(opt.getAttribute("data-id")); });
    });
    syncFavoriteUI();
  }

  function selectFavorite(id) {
    state.favorite = id;
    syncFavoriteUI();
  }
  function syncFavoriteUI() {
    $$(".fav-opt").forEach(function (opt) {
      opt.classList.toggle("selected", opt.getAttribute("data-id") === state.favorite);
    });
    $$(".location-card").forEach(function (card) {
      var active = card.getAttribute("data-id") === state.favorite;
      card.classList.toggle("selected", active);
      var check = card.querySelector(".check");
      if (check) check.textContent = active ? "✓ Твоят избор" : "Кликни, за да го избереш като любима дестинация";
    });
  }

  // ---------- форма за гласуване ----------
  function upsertVote(vote) {
    var existing = null;
    for (var i = 0; i < state.votes.length; i++) {
      if (normalize(state.votes[i].name) === normalize(vote.name)) { existing = state.votes[i]; break; }
    }
    if (existing) {
      Object.keys(vote).forEach(function (k) { existing[k] = vote[k]; });
      return existing;
    }
    vote.id = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    state.votes.push(vote);
    return vote;
  }

  function handleSave(e) {
    e.preventDefault();
    var name = ($("#voter-name") && $("#voter-name").value.trim()) || "";
    var status = $("#save-status");
    if (!name) { setStatus(status, "Моля, въведете име (кой гласува).", "err"); return; }
    if (!state.favorite) { setStatus(status, "Моля, изберете любимата си дестинация.", "err"); return; }

    var vote = {
      name: name,
      favorite: state.favorite,
      note: ($("#voter-note") && $("#voter-note").value.trim()) || "",
      ts: new Date().toISOString()
    };
    var saved = upsertVote(vote);
    saveVotes();
    state.myVoteId = saved.id;
    setStatus(status, "✓ Гласът на „" + name + "“ е записан! Използвайте „Копирай моя линк“, за да го споделите.", "ok");
    renderResults();
    renderVotesList();
    syncFavoriteUI();
  }

  function handleClear() {
    var name = ($("#voter-name") && $("#voter-name").value.trim()) || "";
    var status = $("#save-status");
    if (name) {
      state.votes = state.votes.filter(function (v) { return normalize(v.name) !== normalize(name); });
      saveVotes();
      setStatus(status, "Изтрит е гласът на „" + name + "“ от това устройство.", "ok");
    } else {
      setStatus(status, "Не сте въвели име за изтриване.", "err");
    }
    renderResults();
    renderVotesList();
  }

  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg;
    el.className = "save-status " + (kind || "ok");
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(function () { el.textContent = ""; el.className = "save-status"; }, 6000);
  }

  // ---------- резултати ----------
  function renderResults() {
    renderSummary();
    renderTally();
  }

  function renderSummary() {
    var el = $("#summary");
    if (!el) return;
    if (state.votes.length === 0) {
      el.classList.add("empty");
      el.innerHTML = "<h3>📊 Все още няма гласове</h3><p>След като всеки гласува, тук ще се покаже коя дестинация води в момента.</p>";
      return;
    }
    var counts = {};
    LOCATIONS.forEach(function (l) { counts[l.id] = 0; });
    state.votes.forEach(function (p) { if (counts[p.favorite] !== undefined) counts[p.favorite]++; });
    var max = 0;
    LOCATIONS.forEach(function (l) { if (counts[l.id] > max) max = counts[l.id]; });
    var leaders = LOCATIONS.filter(function (l) { return counts[l.id] === max; });

    el.classList.remove("empty");
    var head;
    var names = leaders.map(function (l) { return l.emoji + " " + l.name; });
    if (leaders.length === 1) {
      head = "🏆 В момента води: <strong>" + names[0] + "</strong> (" + max + " " + (max === 1 ? "глас" : "гласа") + ")";
    } else {
      head = "🤝 Равни: <strong>" + names.join(" и ") + "</strong> (" + max + " " + (max === 1 ? "глас" : "гласа") + ")";
    }
    var total = state.votes.length;
    el.innerHTML = "<h3>" + head + "</h3><p>Общо " + total + " " + (total === 1 ? "глас" : "гласа") + " досега. Виж пълното разпределение по-долу.</p>";
  }

  function renderTally() {
    var wrap = $("#favorite-tally");
    if (!wrap) return;
    var counts = {};
    LOCATIONS.forEach(function (l) { counts[l.id] = 0; });
    state.votes.forEach(function (p) { if (counts[p.favorite] !== undefined) counts[p.favorite]++; });

    var max = 1;
    LOCATIONS.forEach(function (l) { if (counts[l.id] > max) max = counts[l.id]; });
    var rows = LOCATIONS.map(function (l) {
      var n = counts[l.id];
      var pct = Math.round((n / max) * 100);
      return (
        '<div class="tally-row">' +
          '<div class="tally-head"><span>' + l.emoji + " " + l.name + "</span><span>" + n + " " + (n === 1 ? "глас" : "гласа") + "</span></div>" +
          '<div class="tally-bar"><div class="tally-fill" style="width:' + pct + '%;background:' + l.color + '"></div></div>' +
        '</div>'
      );
    }).join("");
    wrap.innerHTML = state.votes.length ? rows : '<p class="tally-none">Гласовете ще се появят тук.</p>';
  }

  function renderVotesList() {
    var list = $("#votes-list");
    if (!list) return;
    if (state.votes.length === 0) {
      list.innerHTML = '<li class="votes-none" style="list-style:none">Все още няма записани гласове.</li>';
      return;
    }
    list.innerHTML = state.votes.map(function (p) {
      var l = locationById(p.favorite);
      var fav = l ? l.emoji + " " + l.name : "—";
      var note = p.note ? '<div class="v-note">“' + escapeHtml(p.note) + '”</div>' : "";
      return (
        "<li>" +
          '<div class="v-name">' + escapeHtml(p.name) + "</div>" +
          '<div class="v-fav">⭐ Любима дестинация: <strong>' + fav + "</strong></div>" +
          note +
        "</li>"
      );
    }).join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- линкове за споделяне ----------
  function getMyVote() {
    var name = ($("#voter-name") && $("#voter-name").value.trim()) || "";
    if (state.myVoteId) {
      for (var i = 0; i < state.votes.length; i++) if (state.votes[i].id === state.myVoteId) return state.votes[i];
    }
    if (name) {
      for (var j = 0; j < state.votes.length; j++) if (normalize(state.votes[j].name) === normalize(name)) return state.votes[j];
    }
    return state.votes[state.votes.length - 1] || null;
  }

  function buildLink(arr) {
    return location.href.split("#")[0] + "#v=" + encodeVotes(arr);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function flash(btn, msg) {
    var old = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = old; }, 2500);
  }

  function importVotes(arr, source) {
    if (!Array.isArray(arr)) return 0;
    var added = 0;
    arr.forEach(function (incoming) {
      if (!incoming || !incoming.name || !incoming.favorite || !locationById(String(incoming.favorite))) return;
      var cleaned = {
        name: String(incoming.name),
        favorite: String(incoming.favorite),
        note: String(incoming.note || ""),
        ts: incoming.ts || new Date().toISOString()
      };
      var saved = upsertVote(cleaned);
      if (source === "all") state.myVoteId = saved.id;
      added++;
    });
    if (added) { saveVotes(); renderResults(); renderVotesList(); }
    return added;
  }

  function handleHash() {
    var m = location.hash.match(/v=([A-Za-z0-9+/=_-]+)/);
    if (!m) return;
    try {
      var arr = decodeVotes(decodeURIComponent(m[1]));
      var n = importVotes(arr, "all");
      history.replaceState(null, "", location.pathname + location.search);
      var status = $("#save-status");
      if (status && n > 0) setStatus(status, "✓ Добавени са " + n + " " + (n === 1 ? "глас" : "гласа") + " от споделения линк.", "ok");
    } catch (e) { /* ignore bad links */ }
  }

  // ---------- init ----------
  function init() {
    renderLocationCards();
    renderFavoritePicker();
    renderResults();
    renderVotesList();
    handleHash();

    var infoToggle = $("#info-toggle");
    if (infoToggle) {
      renderInfoPanel();
      infoToggle.addEventListener("click", function () {
        var panel = $("#info-panel");
        if (!panel) return;
        var open = panel.classList.toggle("hidden");
        infoToggle.setAttribute("aria-expanded", open ? "false" : "true");
        infoToggle.textContent = open
          ? "🏨 Хотели, храна и забележителности (само информация)"
          : "Скрий хотели, храна и забележителности";
      });
    }

    var form = $("#vote-form");
    if (form) form.addEventListener("submit", handleSave);
    var clearBtn = $("#clear-vote");
    if (clearBtn) clearBtn.addEventListener("click", handleClear);

    $("#copy-my-vote").addEventListener("click", function () {
      var v = getMyVote();
      if (!v) { alert("Първо запишете гласа си, а после копирайте линка."); return; }
      copyText(buildLink([v])).then(function (ok) {
        flash($("#copy-my-vote"), ok ? "✓ Копирано!" : "Копирането не успя — изберете и копирайте на ръка.");
      });
    });

    $("#copy-all-votes").addEventListener("click", function () {
      if (state.votes.length === 0) { alert("Все още няма записани гласове."); return; }
      copyText(buildLink(state.votes)).then(function (ok) {
        flash($("#copy-all-votes"), ok ? "✓ Копирано!" : "Копирането не успя — изберете и копирайте на ръка.");
      });
    });

    $("#import-vote").addEventListener("click", function () {
      var val = $("#paste-vote").value.trim();
      var m = val.match(/v=([A-Za-z0-9+/=_-]+)/);
      if (!m) { alert("В този текст не открихме линк за гласуване."); return; }
      try {
        var n = importVotes(decodeVotes(decodeURIComponent(m[1])), "all");
        alert("Добавени са " + n + " " + (n === 1 ? "глас" : "гласа") + " успешно.");
      } catch (e) { alert("Този линк не изглежда валиден."); }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
