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
    wrap.innerHTML = TRIP.legs.map(function (leg, idx) {
      return renderLeg(leg, idx);
    }).join("");
  }

  function renderLeg(leg, idx) {
    var locKey = leg.location ? leg.location.en.toLowerCase().replace(/\s+/g, "") : "transit";
    var dayNum = idx + 1;
    var html = '<div class="timeline-card reveal" data-location="' + escapeHtml(locKey) + '">';
    html += '<span class="tc-day-badge">Day ' + dayNum + '</span>';
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

  function initGParticles() {
    var canvas = document.getElementById("g-particles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var particles = [];
    var letters = ["G", "H"];
    var colors = [
      "rgba(255,255,255,",
      "rgba(185,232,222,",
      "rgba(252,213,102,",
      "rgba(167,220,210,",
      "rgba(255,180,130,",
      "rgba(180,210,240,",
      "rgba(210,180,255,",
      "rgba(255,200,200,",
      "rgba(200,240,200,",
      "rgba(240,220,180,",
      "rgba(180,230,230,",
      "rgba(220,200,230,"
    ];
    var count = 22;
    var raf;

    function resize() {
      var hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    var colorIdx = 0;
    var letterIdx = 0;

    function createParticle() {
      var c = colors[colorIdx % colors.length];
      var l = letters[letterIdx % letters.length];
      colorIdx++;
      letterIdx++;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3 - 0.05,
        size: 20 + Math.random() * 50,
        opacity: 0.06 + Math.random() * 0.14,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.006,
        letter: l,
        color: c
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < count; i++) particles.push(createParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = canvas.height + p.size;
        if (p.y > canvas.height + p.size) p.y = -p.size;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = "800 " + p.size + "px Inter, system-ui, sans-serif";
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.letter, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", function () {
      resize();
    });
    init();
    draw();
  }

  function initScrollReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    $$(".reveal").forEach(function (el) { observer.observe(el); });
  }

  function initProgressBar() {
    var bar = $(".progress-bar");
    if (!bar) return;
    window.addEventListener("scroll", function () {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + "%";
    });
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
    initGParticles();
    if (typeof IntersectionObserver !== "undefined") initScrollReveal();
    initProgressBar();

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
