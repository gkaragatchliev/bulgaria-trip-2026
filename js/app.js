(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var state = {
    lang: "en"
  };

  function t(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.en || "";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setLang(lang) {
    state.lang = lang;
    document.documentElement.lang = lang === "bg" ? "bg" : "en";
    renderAll();
    syncLangUI();
  }

  function syncLangUI() {
    $$(".lang-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === state.lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderAll() {
    renderHero();
    renderOverview();
    renderTimeline();
  }

  function renderHero() {
    var titleEl = $(".hero h1");
    var subEl = $(".hero-sub");
    var kickerEl = $(".hero-kicker");
    var travelersEl = $(".hero-travelers");
    if (titleEl) titleEl.textContent = t(TRIP.title);
    if (subEl) subEl.textContent = t(TRIP.subtitle);
    if (kickerEl) kickerEl.textContent = state.lang === "bg"
      ? "Октомври 2026 \u00B7 България"
      : "October 2026 \u00B7 Bulgaria";
    if (travelersEl) travelersEl.textContent = TRIP.travelers.join(" & ") + " \u00B7 " + (state.lang === "bg"
      ? "Портланд, Орегон \u2192 България"
      : "Portland, Oregon \u2192 Bulgaria");
  }

  function mapsLink(q) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  function renderOverview() {
    var el = $("#overview");
    if (!el) return;
    var stops = [];
    TRIP.legs.forEach(function (leg) {
      if (!leg.location) return;
      var key = leg.location.en;
      var last = stops[stops.length - 1];
      if (!last || last.key !== key) stops.push({ key: key, name: leg.location });
    });
    el.innerHTML = stops.map(function (s, i) {
      var sep = i === 0 ? "" : '<span class="ov-arrow">\u2192</span>';
      return sep + '<span class="ov-chip">' + escapeHtml(t(s.name)) + '</span>';
    }).join("");
  }

  function renderTimeline() {
    var wrap = $("#timeline");
    if (!wrap) return;
    wrap.innerHTML = TRIP.legs.map(function (leg) {
      return renderLeg(leg);
    }).join("");
  }

  function renderLeg(leg) {
    var html = '<div class="timeline-card">';
    html += '<div class="tc-header">';
    html += '<span class="tc-date">' + escapeHtml(leg.date) + '</span>';
    html += '<span class="tc-day">' + escapeHtml(t(leg.day)) + '</span>';
    html += '</div>';
    html += '<h3 class="tc-title">' + escapeHtml(t(leg.title)) + '</h3>';

    if (leg.flight) {
      html += renderFlight(leg.flight);
    }
    if (leg.flights) {
      leg.flights.forEach(function (f) { html += renderFlight(f); });
    }

    if (leg.accommodation) {
      var isTbd = /tbd/i.test(leg.accommodation.name);
      html += '<div class="tc-section tc-accommodation' + (isTbd ? " is-tbd" : "") + '">';
      html += '<span class="tc-label">' + (state.lang === "bg" ? "Настаняване" : "Stay") + '</span>';
      html += '<strong>' + escapeHtml(leg.accommodation.name) + '</strong>';
      if (leg.accommodation.details) {
        html += '<span class="tc-detail"> ' + escapeHtml(t(leg.accommodation.details)) + '</span>';
      }
      if (!isTbd) {
        var q = leg.accommodation.name + (leg.location ? ", " + t(leg.location) : "");
        html += ' <a class="tc-map" href="' + mapsLink(q) + '" target="_blank" rel="noopener">' + (state.lang === "bg" ? "\u043A\u0430\u0440\u0442\u0430" : "map") + '</a>';
      }
      html += '</div>';
    }

    if (leg.notes) {
      html += '<p class="tc-notes">' + escapeHtml(t(leg.notes)) + '</p>';
    }

    if (leg.thingsToSee && leg.thingsToSee.length > 0) {
      html += '<details class="tc-things">';
      html += '<summary>' + (state.lang === "bg" ? "Какво да видим" : "Things to see") + ' (' + leg.thingsToSee.length + ')</summary>';
      html += '<ul class="tc-things-list">';
      leg.thingsToSee.forEach(function (thing) {
        html += '<li>';
        html += '<strong>' + escapeHtml(t(thing.name)) + '</strong>';
        html += ' \u2014 ' + escapeHtml(t(thing.info));
        var thingQ = t(thing.name) + (leg.location ? ", " + t(leg.location) : "");
        html += ' <a class="tc-map" href="' + mapsLink(thingQ) + '" target="_blank" rel="noopener">' + (state.lang === "bg" ? "\u043A\u0430\u0440\u0442\u0430" : "map") + '</a>';
        html += '</li>';
      });
      html += '</ul>';
      html += '</details>';
    }

    html += '</div>';
    return html;
  }

  function renderFlight(f) {
    var html = '<div class="tc-flight">';
    html += '<span class="tc-label">' + (state.lang === "bg" ? "Полет" : "Flight") + '</span> ';
    html += '<strong>' + escapeHtml(f.airline) + ' ' + escapeHtml(f.number) + '</strong>';
    html += '<span class="tc-flight-detail"> ';
    html += escapeHtml(f.depart) + ' \u2192 ' + escapeHtml(f.arrive);
    html += ' (' + escapeHtml(f.duration) + ')';
    html += '</span>';
    html += '</div>';
    return html;
  }

  function init() {
    var langBtns = $$(".lang-btn");
    langBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
    renderAll();
    syncLangUI();

    window.addEventListener("beforeprint", function () {
      $$(".tc-things").forEach(function (d) {
        if (!d.open) { d.setAttribute("data-print-open", "1"); d.open = true; }
      });
    });
    window.addEventListener("afterprint", function () {
      $$(".tc-things").forEach(function (d) {
        if (d.getAttribute("data-print-open")) {
          d.open = false;
          d.removeAttribute("data-print-open");
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
