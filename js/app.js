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

  var revealObserver;

  function observeReveals() {
    if (!revealObserver) return;
    $$(".reveal").forEach(function (el) { revealObserver.observe(el); });
  }

  function renderAll() {
    renderHero();
    renderOverview();
    renderTimeline();
    observeReveals();
  }

  function renderHero() {
    var titleEl = $(".hero h1");
    var subEl = $(".hero-sub");
    var kickerEl = $(".hero-kicker");
    var travelersEl = $(".hero-travelers");
    if (titleEl) titleEl.textContent = t(TRIP.title);
    if (subEl) subEl.textContent = t(TRIP.subtitle);
    if (kickerEl) kickerEl.textContent = t(TRIP_CONFIG.month) + " 2026 \u00B7 " + t(TRIP_CONFIG.country);
    if (travelersEl) travelersEl.textContent = TRIP.travelers.join(" & ") + " \u00B7 " + t(TRIP_CONFIG.home) + " \u2192 " + t(TRIP_CONFIG.country);
    splitHeroTitle();
  }

  function splitHeroTitle() {
    var titleEl = $(".hero h1");
    if (!titleEl || typeof Splitting === "undefined") return;
    Splitting({ target: titleEl, by: "chars", force: true });
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
    var range = parseDate(leg.date);
    var dayNum = range ? range.from - 8 + 1 : idx + 1;
    var html = '<div class="timeline-card reveal" data-location="' + escapeHtml(locKey) + '" data-day-num="' + dayNum + '">';
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

    if (leg.drive) {
      html += renderDrive(leg.drive);
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
        if (leg.accommodation.website) {
          html += ' <a class="tc-site" href="' + escapeHtml(leg.accommodation.website) + '" target="_blank" rel="noopener">' + (state.lang === "bg" ? "\u0441\u0430\u0439\u0442" : "site") + '</a>';
        }
        html += ' <a class="tc-map" href="' + mapsLink(q) + '" target="_blank" rel="noopener">' + (state.lang === "bg" ? "\u043A\u0430\u0440\u0442\u0430" : "map") + '</a>';
      }
      html += '</div>';
    }

    if (leg.notes) {
      html += '<p class="tc-notes">' + escapeHtml(t(leg.notes)) + '</p>';
    }

    if (leg.pullquote) {
      html += '<blockquote class="tc-pullquote">' + escapeHtml(t(leg.pullquote)) + '</blockquote>';
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

  function to24h(str) {
    return str.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, function (_, h, min, ap) {
      h = parseInt(h, 10);
      if (ap.toUpperCase() === "PM" && h !== 12) h += 12;
      if (ap.toUpperCase() === "AM" && h === 12) h = 0;
      return (h < 10 ? "0" : "") + h + ":" + min;
    });
  }

  function renderFlight(f) {
    var html = '<div class="tc-flight">';
    html += '<span class="tc-label">' + (state.lang === "bg" ? "Полет" : "Flight") + '</span> ';
    html += '<strong>' + escapeHtml(f.airline) + ' ' + escapeHtml(f.number) + '</strong>';
    html += '<span class="tc-flight-detail"> ';
    var depart = state.lang === "bg" ? to24h(f.depart) : f.depart;
    var arrive = state.lang === "bg" ? to24h(f.arrive) : f.arrive;
    html += escapeHtml(depart) + ' \u2192 ' + escapeHtml(arrive);
    html += ' (' + escapeHtml(f.duration) + ')';
    html += '</span>';
    html += '</div>';
    return html;
  }

  function directionsLink(drive) {
    var country = t(TRIP_CONFIG.country);
    var from = t(drive.from) + ", " + country;
    var to = t(drive.to) + ", " + country;
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to);
  }

  function trafficLink(drive) {
    var country = t(TRIP_CONFIG.country);
    var from = t(drive.from) + ", " + country;
    var to = t(drive.to) + ", " + country;
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(from) +
      "&destination=" + encodeURIComponent(to) + "&traffic=1";
  }

  function renderDrive(drive) {
    var html = '<div class="tc-drive">';
    html += '<span class="tc-label">' + (state.lang === "bg" ? "Пътуване" : "Drive") + '</span> ';
    html += '<strong>' + escapeHtml(t(drive.from)) + ' \u2192 ' + escapeHtml(t(drive.to)) + '</strong>';
    if (drive.duration) {
      html += '<span class="tc-drive-detail"> (' + escapeHtml(drive.duration) + ')</span>';
    }
    html += ' <a class="tc-map" href="' + directionsLink(drive) + '" target="_blank" rel="noopener">' +
      (state.lang === "bg" ? "маршрут" : "map") + '</a>';
    html += ' <a class="tc-map" href="' + trafficLink(drive) + '" target="_blank" rel="noopener">' +
      (state.lang === "bg" ? "пътна обстановка" : "road conditions") + '</a>';
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
      "#ff6b9d",
      "#ffd93d",
      "#6bcb77",
      "#4d96ff",
      "#ff922b",
      "#cc5de8",
      "#20c997",
      "#ff8787",
      "#748ffc",
      "#f06595"
    ];
    var fonts = [
      "'Caveat', cursive",
      "'Permanent Marker', cursive"
    ];
    var count = 18;
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
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.25 - 0.04,
        size: 36 + Math.random() * 56,
        opacity: 0.18 + Math.random() * 0.22,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.005,
        letter: l,
        color: c,
        font: fonts[Math.floor(Math.random() * fonts.length)]
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
        ctx.globalAlpha = p.opacity;
        ctx.font = "800 " + p.size + "px " + p.font;
        ctx.fillStyle = p.color;
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
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observeReveals();
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

  /* ---- Calendar ---- */
  var DOW_HEADERS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var DOW_HEADERS_BG = ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"];
  var DAY_NAMES_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var DAY_NAMES_BG = ["Неделя","Понеделник","Вторник","Сряда","Четвъртък","Петък","Събота"];
  var MONTH_BG = TRIP_CONFIG.month.bg;
  var TRIP_START = 8;
  var TRIP_END = 25;

  function parseDate(str) {
    var m = str.match(/Oct\s+(\d+)(?:\s*-\s*(\d+))?/);
    if (!m) return null;
    return { from: parseInt(m[1], 10), to: parseInt(m[2] || m[1], 10) };
  }

  function buildDayMap() {
    var days = [];
    var legs = TRIP.legs;
    for (var d = TRIP_START; d <= TRIP_END; d++) {
      var entry = { num: d, date: "Oct " + d, status: "free", desc: "", leg: null };
      for (var i = 0; i < legs.length; i++) {
        var leg = legs[i];
        var range = parseDate(leg.date);
        if (!range) continue;
        if (d >= range.from && d <= range.to) { entry.leg = leg; break; }
      }
      if (entry.leg) {
        var hasConcrete = entry.leg.flight || entry.leg.flights || entry.leg.drive ||
          (entry.leg.thingsToSee && entry.leg.thingsToSee.length > 0) || entry.leg.pullquote;
        entry.desc = t(entry.leg.title);
        if (entry.leg.flight || entry.leg.flights) entry.status = "travel";
        else if (hasConcrete) entry.status = "booked";
        else entry.status = "free";
      }
      days.push(entry);
    }
    return days;
  }

  function renderCalendar() {
    var cal = $("#calendar");
    if (!cal) return;
    var days = buildDayMap();
    var isBg = state.lang === "bg";
    var dayNames = isBg ? DAY_NAMES_BG : DAY_NAMES_EN;
    var dowHeaders = isBg ? DOW_HEADERS_BG : DOW_HEADERS_EN;
    var startDow = (4 + TRIP_START - 1) % 7;

    var html = '<div class="cal-grid">';
    html += '<div class="cal-header">';
    for (var h = 0; h < 7; h++) {
      html += '<div class="cal-header-cell">' + dowHeaders[h] + '</div>';
    }
    html += '</div><div class="cal-body">';

    for (var p = 0; p < startDow; p++) {
      html += '<div class="cal-cell cal-empty"></div>';
    }

    days.forEach(function (day) {
      var dateLabel = isBg ? day.num + " " + MONTH_BG : "Oct " + day.num;
      var desc = day.desc || (isBg ? "Свободен ден" : "Free day");
      var status = day.status === "travel" ? "planned" : day.status;
      html += '<div class="cal-cell cal-day ' + status + '">' +
        '<span class="cal-day-date">' + dateLabel + '</span>' +
        '<span class="cal-day-desc">' + escapeHtml(desc) + '</span>' +
        '</div>';
    });

    html += '</div></div>';
    cal.innerHTML = html;
  }

  function populateDaySelect() {
    var sel = $("#plan-day");
    if (!sel) return;
    var days = buildDayMap();
    var isBg = state.lang === "bg";
    var dayNames = isBg ? DAY_NAMES_BG : DAY_NAMES_EN;
    var opts = '<option value="">' + (isBg ? "Изберете ден..." : "Select a day...") + '</option>';
    days.forEach(function (day) {
      var dow = (4 + day.num - 1) % 7;
      var dayName = dayNames[dow];
      var label = (isBg ? day.num + " " + MONTH_BG : day.date) + " - " + dayName;
      var disabled = day.status !== "free" ? " disabled" : "";
      var statusTag = day.status === "free" ? " [Free]" : day.status === "travel" ? " [Travel]" : " [Booked]";
      opts += '<option value="' + day.date + '"' + disabled + '>' + label + statusTag + '</option>';
    });
    sel.innerHTML = opts;
  }

  function initCalendar() {
    var toggleBtn = $("#plan-toggle");
    var section = $("#calendar-section");
    if (!toggleBtn || !section) return;

    toggleBtn.addEventListener("click", function () {
      var hidden = section.classList.contains("hidden");
      section.classList.toggle("hidden", !hidden);
      toggleBtn.classList.toggle("active", hidden);
      if (hidden) {
        renderCalendar();
        populateDaySelect();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    var form = $("#activity-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var dayVal = $("#plan-day").value;
      var whoVal = $("#plan-who").value;
      var actVal = $("#plan-activity").value.trim();
      if (!dayVal || !whoVal || !actVal) return;

      var subject = t(TRIP_CONFIG.title) + " - Activity Proposal";
      var body = "Hi " + TRIP.travelers.join(" and ") + ",\n\n" +
        "I'd like to propose an activity:\n\n" +
        "Day: " + dayVal + "\n" +
        "Who: " + whoVal + "\n" +
        "Activity: " + actVal + "\n\n" +
        "Let me know if this works!\n";
      var mailto = "mailto:" + TRIP_CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
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
    initCalendar();

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
