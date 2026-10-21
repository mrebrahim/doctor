/* Shared runtime: config, Cairo clock, slot engine, attribution capture, neutral event tracking, UI bits. */
(function () {
  "use strict";
  var cfg = JSON.parse(document.getElementById("cfg").textContent);
  var DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var MONTH_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  function store(key, val) {
    var k = "dse_" + cfg.slug + "_" + key;
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(k) || "null");
      localStorage.setItem(k, JSON.stringify(val));
    } catch (e) { return null; }
  }

  // Wall-clock "now" in Cairo, as a Date whose local fields equal Cairo time.
  function cairoNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mins(t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; }
  function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  function t12(t) { var m = mins(t), h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ":" + String(mm).padStart(2, "0") : "") + " " + (h < 12 ? "ص" : "م"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dayLabel(d) {
    var today = cairoNow(); today.setHours(0, 0, 0, 0);
    var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 864e5);
    if (diff === 0) return "النهارده";
    if (diff === 1) return "بكرة";
    return DAY_AR[d.getDay()] + " " + d.getDate() + " " + MONTH_AR[d.getMonth()];
  }
  function fullDate(d) { return DAY_AR[d.getDay()] + " " + d.getDate() + " " + MONTH_AR[d.getMonth()]; }
  function branch(id) { return cfg.branches.filter(function (b) { return b.id === id; })[0] || cfg.branches[0]; }
  function ranges(b, d) { return b.hours[DAY_KEYS[d.getDay()]] || []; }

  function myBookings() { return store("bookings") || []; }

  // Demo availability: deterministic per branch/doctor/date so every visitor sees the same calendar.
  function slotsFor(b, doctorId, d) {
    var now = cairoNow(), isToday = iso(d) === iso(now), out = [];
    var taken = {};
    myBookings().forEach(function (x) { if (x.branch === b.id && x.date === iso(d) && (x.doctor || "") === (doctorId || "")) taken[x.time] = 1; });
    ranges(b, d).forEach(function (r) {
      var se = r.split("-"), s = mins(se[0]), e = mins(se[1]);
      if (b.bookingType === "queue") {
        var key = b.id + doctorId + iso(d) + r, n = 2 + (hash(key) % 9) + (taken[se[0]] ? 1 : 0);
        out.push({ time: se[0], end: se[1], queue: true, number: n + 1, full: n >= b.queueCapacity || (isToday && now.getHours() * 60 + now.getMinutes() > e - 30) });
        return;
      }
      for (var m = s; m + b.slotMinutes <= e; m += b.slotMinutes) {
        var t = hhmm(m);
        var busy = hash(b.id + "|" + (doctorId || "") + "|" + iso(d) + "|" + t) % 100 < 38;
        var past = isToday && m <= now.getHours() * 60 + now.getMinutes() + 30;
        out.push({ time: t, available: !busy && !past && !taken[t] });
      }
    });
    return out;
  }
  function days(n) {
    var out = [], d = cairoNow(); d.setHours(0, 0, 0, 0);
    for (var i = 0; i < n; i++) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }
  function nextSlot(b, doctorId) {
    var ds = days(14);
    for (var i = 0; i < ds.length; i++) {
      var s = slotsFor(b, doctorId, ds[i]).filter(function (x) { return x.queue ? !x.full : x.available; })[0];
      if (s) return { date: ds[i], slot: s };
    }
    return null;
  }
  function openState(b) {
    var now = cairoNow(), m = now.getHours() * 60 + now.getMinutes();
    var r = ranges(b, now).map(function (x) { return x.split("-"); }).filter(function (x) { return m >= mins(x[0]) && m < mins(x[1]); })[0];
    return r ? { open: true, text: "مفتوح دلوقتي – بيقفل " + t12(r[1]) } : { open: false, text: "مقفول دلوقتي – احجز أونلاين لأقرب ميعاد" };
  }

  // ---------------------------------------------------------------- attribution (first + last touch, 90 days)
  (function captureAttribution() {
    var q = new URLSearchParams(location.search), keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid", "fbclid"];
    var touch = {}, has = false;
    keys.forEach(function (k) { if (q.get(k)) { touch[k] = q.get(k).slice(0, 200); has = true; } });
    var ref = document.referrer && document.referrer.indexOf(location.host) === -1 ? document.referrer : "";
    if (!has && ref) { touch.utm_source = new URL(ref).hostname.replace(/^www\./, ""); touch.utm_medium = "referral"; has = true; }
    var attr = store("attr");
    if (attr && Date.now() - attr.first_visit_ts > 90 * 864e5) attr = null;
    if (!attr) attr = { first: has ? touch : { utm_source: "(direct)" }, first_visit_ts: Date.now(), landing_page: location.pathname, referrer: ref };
    if (has) attr.last = touch;
    var c = document.cookie.match(/_fbp=([^;]+)/); if (c) attr._fbp = c[1];
    if (q.get("fbclid")) attr._fbc = "fb.1." + Date.now() + "." + q.get("fbclid");
    store("attr", attr);
  })();

  // ---------------------------------------------------------------- tracking (neutral names only — never service/diagnosis)
  var META = { cta_whatsapp_click: "ContactWA", cta_call_click: "ContactCall", booking_start: "FlowStart", booking_submit: "FlowComplete", directions_click: "Directions" };
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (window.gtag && cfg.tracking.ga4) window.gtag("event", name === "booking_submit" ? "generate_lead" : name, params);
    if (window.fbq && META[name]) window.fbq("trackCustom", META[name], params, params.event_id ? { eventID: params.event_id } : undefined);
  }
  var loaded = false;
  function loadTags() {
    if (loaded) return; loaded = true;
    var t = cfg.tracking;
    if (t.ga4) {
      var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + t.ga4; document.head.appendChild(s);
      window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag("js", new Date()); window.gtag("config", t.ga4, { page_path: location.pathname.replace(/\/(services|articles|lp)\/[^/]+/, "/$1/:slug") });
    }
    if (t.metaPixel) {
      !function (f, b, e, v, n, t2, s2) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t2 = b.createElement(e); t2.async = !0; t2.src = v; s2 = b.getElementsByTagName(e)[0]; s2.parentNode.insertBefore(t2, s2); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", t.metaPixel); window.fbq("track", "PageView");
    }
  }
  ["pointerdown", "keydown", "scroll"].forEach(function (ev) { addEventListener(ev, loadTags, { once: true, passive: true }); });
  setTimeout(loadTags, 4000);
  function pageType() { var p = location.pathname.replace(cfg.base, ""); return p ? p.split("/")[0] : "home"; }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-track]"); if (!a) return;
    track(a.dataset.track, { page_type: pageType(), branch_id: a.dataset.branch || "", cta_position: a.dataset.pos || "" });
  });

  // ---------------------------------------------------------------- UI
  var mb = document.querySelector(".menu-btn"), mn = document.getElementById("mnav");
  if (mb) mb.addEventListener("click", function () { var o = mn.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });

  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t); document.getElementById(x.getAttribute("aria-controls")).hidden = x !== t; });
      });
    });
  });

  document.querySelectorAll("[data-map]").forEach(function (box) {
    var btn = box.querySelector(".map-facade");
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=" + box.dataset.map + "&z=16&output=embed&hl=ar";
      f.title = btn.getAttribute("aria-label"); f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      box.innerHTML = ""; box.appendChild(f);
    });
  });

  document.querySelectorAll("[data-live]").forEach(function (el) {
    var s = openState(branch(el.dataset.live));
    el.className = "live " + (s.open ? "open" : "closed"); el.textContent = s.text;
  });
  var todayKey = DAY_KEYS[cairoNow().getDay()];
  document.querySelectorAll('.hours tr[data-day="' + todayKey + '"]').forEach(function (tr) { tr.classList.add("today"); });

  var ns = document.querySelector("[data-next-slots]");
  if (ns) {
    ns.innerHTML = cfg.branches.map(function (b) {
      var n = nextSlot(b, cfg.doctors.length > 1 ? "" : cfg.doctors[0].id);
      var when = n ? dayLabel(n.date) + " " + (n.slot.queue ? "من " + t12(n.slot.time) : t12(n.slot.time)) : "المواعيد خلصت – سجّل في قائمة الانتظار";
      return '<div class="slot-card"><div><div class="small muted">' + b.area + " – أقرب ميعاد</div><div class=\"when\">" + when + '</div></div><a class="btn btn-primary btn-sm" href="' + cfg.base + "book/?branch=" + b.id + '" data-track="cta_book_click" data-branch="' + b.id + '" data-pos="next_slot">احجز</a></div>';
    }).join("");
  }

  window.DSE = { cfg: cfg, store: store, cairoNow: cairoNow, iso: iso, t12: t12, hash: hash, dayLabel: dayLabel, fullDate: fullDate, branch: branch, slotsFor: slotsFor, days: days, nextSlot: nextSlot, myBookings: myBookings, track: track, DAY_AR: DAY_AR, MONTH_AR: MONTH_AR };
})();
