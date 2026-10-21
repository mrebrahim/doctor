/* Demo clinic dashboard: today's appointments (sample + bookings made on this device) and bookings by source. */
(function () {
  "use strict";
  var D = window.DSE, cfg = D.cfg;
  var FIRST = ["محمد", "أحمد", "منى", "سارة", "محمود", "هبة", "كريم", "ياسمين", "عمرو", "نهى", "إبراهيم", "دينا", "مصطفى", "رنا"];
  var LAST = ["ع.", "س.", "م.", "ح.", "ف.", "ش."];
  var today = D.iso(D.cairoNow());
  var sel = cfg.branches[0].id;
  var saved = D.store("dash_status") || {};

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sample(b) {
    // Busy slots of today's demo calendar become sample patients.
    var out = [], now = D.cairoNow();
    var docs = cfg.doctors.filter(function (d) { return d.branches.indexOf(b.id) > -1; });
    docs.forEach(function (doc) {
      var all = [];
      (b.hours[["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()]] || []).forEach(function (r) {
        var s = r.split("-"), a = +s[0].split(":")[0] * 60 + +s[0].split(":")[1], e = +s[1].split(":")[0] * 60 + +s[1].split(":")[1];
        for (var m = a; m + b.slotMinutes <= e; m += b.slotMinutes) all.push(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"));
      });
      all.forEach(function (t) {
        var h = D.hash(b.id + "|" + doc.id + "|" + today + "|" + t);
        if (h % 100 < 38) {
          out.push({ id: "S" + b.id + doc.id + t, time: t, name: FIRST[h % FIRST.length] + " " + LAST[(h >>> 4) % LAST.length], visit: cfg.visitTypes[(h >>> 8) % cfg.visitTypes.length], doctor: doc.name, status: "confirmed", sample: true, phone: "" });
        }
      });
    });
    return out;
  }
  function rows() {
    var b = D.branch(sel);
    var mine = D.myBookings().filter(function (x) { return x.branch === sel && x.date === today && x.status !== "cancelled"; }).map(function (x) {
      var d = cfg.doctors.filter(function (y) { return y.id === x.doctor; })[0] || cfg.doctors[0];
      return { id: x.id, time: x.time, name: x.name, visit: x.visit, doctor: d.name, status: x.status, phone: x.phone, fresh: true, source: x.source };
    });
    return sample(b).concat(mine).map(function (r) { if (saved[r.id]) r.status = saved[r.id]; return r; }).sort(function (a, z) { return a.time < z.time ? -1 : 1; });
  }
  var LABEL = { confirmed: "مؤكد", attended: "حضر", no_show: "ماحضرش" };
  function renderToday() {
    var list = rows(), tb = document.querySelector("#dash-today tbody"), multi = cfg.doctors.length > 1;
    if (!list.length) { tb.innerHTML = '<tr><td colspan="6" class="muted">مافيش مواعيد النهارده في الفرع ده (يوم إجازة). جرّب تحجز من <a href="' + cfg.base + 'book/">صفحة الحجز</a>.</td></tr>'; return; }
    tb.innerHTML = list.map(function (r) {
      return "<tr" + (r.fresh ? ' style="background:#f0fdf4"' : "") + "><td><b>" + D.t12(r.time) + "</b></td><td>" + esc(r.name) + (r.fresh ? ' <span class="chip">جديد من الموقع · ' + esc(r.source) + "</span>" : "") + "</td><td>" + esc(r.visit) + "</td>" + (multi ? "<td>" + esc(r.doctor) + "</td>" : "") +
        '<td><span class="status ' + r.status + '">' + LABEL[r.status] + "</span></td>" +
        '<td><div class="btn-row" style="gap:6px"><button class="btn btn-sm btn-ghost" data-s="attended" data-id="' + r.id + '">حضر</button><button class="btn btn-sm btn-ghost" data-s="no_show" data-id="' + r.id + '">ماحضرش</button>' +
        (r.phone ? '<a class="btn btn-sm btn-wa" href="https://wa.me/2' + esc(r.phone) + '" target="_blank" rel="noopener">واتساب</a>' : "") + "</div></td></tr>";
    }).join("");
    tb.querySelectorAll("[data-s]").forEach(function (btn) {
      btn.onclick = function () {
        saved[btn.dataset.id] = saved[btn.dataset.id] === btn.dataset.s ? "confirmed" : btn.dataset.s; D.store("dash_status", saved);
        if (btn.dataset.s === "attended") D.track("visit_attended", { event_id: btn.dataset.id });
        renderToday();
      };
    });
  }
  function renderBranches() {
    var el = document.getElementById("dash-branches");
    if (cfg.branches.length < 2) { el.remove(); return; }
    el.innerHTML = cfg.branches.map(function (b) { return '<button class="tab" type="button" aria-pressed="' + (b.id === sel) + '" aria-selected="' + (b.id === sel) + '" data-b="' + b.id + '">' + esc(b.area) + "</button>"; }).join("");
    el.querySelectorAll("[data-b]").forEach(function (t) { t.onclick = function () { sel = t.dataset.b; renderBranches(); renderToday(); }; });
  }
  function renderAttribution() {
    var seed = D.hash(cfg.slug), base = { "Meta (إعلانات)": 14 + seed % 9, "Google Ads": 8 + (seed >> 3) % 7, "Google Maps": 6 + (seed >> 5) % 6, "واتساب / مباشر": 5 + (seed >> 7) % 5 };
    D.myBookings().filter(function (x) { return x.status !== "cancelled"; }).forEach(function (x) {
      var s = x.source || "(direct)", k = /facebook|instagram|meta/.test(s) ? "Meta (إعلانات)" : /google/.test(s) ? ((x.attribution.last || x.attribution.first || {}).utm_medium === "cpc" || (x.attribution.last || {}).gclid ? "Google Ads" : "Google Maps") : "واتساب / مباشر";
      base[k] += 1;
    });
    var total = Object.values(base).reduce(function (a, b) { return a + b; }, 0), max = Math.max.apply(null, Object.values(base));
    var cpbMeta = 70 + seed % 40, cpbG = 95 + (seed >> 2) % 50, show = 76 + seed % 15;
    document.getElementById("dash-kpis").innerHTML =
      '<div class="kpi"><b>' + total + "</b><span>حجز مؤكد</span></div>" +
      '<div class="kpi"><b>' + show + '%</b><span>نسبة الحضور</span></div>' +
      '<div class="kpi"><b>' + cpbMeta + ' ج</b><span>تكلفة الحجز – Meta</span></div>' +
      '<div class="kpi"><b>' + cpbG + ' ج</b><span>تكلفة الحجز – Google</span></div>';
    document.getElementById("dash-bars").innerHTML = Object.keys(base).map(function (k) {
      return '<div class="bar"><b>' + k + '</b><div class="track"><span style="display:block;width:' + Math.round(base[k] / max * 100) + '%"></span></div><span>' + base[k] + "</span></div>";
    }).join("");
    document.getElementById("dash-weekly").innerHTML = "<b>رسالة الواتساب الأسبوعية للدكتور:</b> الأسبوع ده " + total + " حجز · " + (base["Meta (إعلانات)"] + base["Google Ads"]) + " من إعلانات (Meta " + base["Meta (إعلانات)"] + " / Google " + base["Google Ads"] + ") · " + base["Google Maps"] + " من جوجل ماب · " + base["واتساب / مباشر"] + " مباشر. تكلفة الحجز: Meta " + cpbMeta + " ج / Google " + cpbG + " ج · نسبة الحضور " + show + "%.";
  }
  function renderNew() {
    var list = D.myBookings().filter(function (x) { return x.status !== "cancelled"; }).sort(function (a, z) { return z.ts - a.ts; });
    var tb = document.querySelector("#dash-new tbody");
    if (!list.length) { tb.innerHTML = '<tr><td colspan="6" class="muted">لسه مافيش. جرّب تحجز من <a href="' + cfg.base + 'book/">صفحة الحجز</a> وارجع هنا.</td></tr>'; return; }
    tb.innerHTML = list.map(function (x) {
      return "<tr><td><b>" + esc(D.fullDate(new Date(x.date + "T00:00"))) + " – " + D.t12(x.time) + "</b></td><td>" + esc(x.name) + '<br><span class="ltr small">' + esc(x.phone) + "</span></td><td>" + esc(D.branch(x.branch).area) + "</td><td>" + esc(x.visit) + '</td><td><span class="chip">' + esc(x.source) + '</span></td><td><a class="btn btn-sm btn-wa" href="https://wa.me/2' + esc(x.phone) + '" target="_blank" rel="noopener">واتساب</a></td></tr>';
    }).join("");
  }
  renderBranches(); renderToday(); renderNew(); renderAttribution();
})();
