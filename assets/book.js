/* Booking wizard: branch → (doctor) → visit type → day & time → details → confirmation. */
(function () {
  "use strict";
  var D = window.DSE, cfg = D.cfg;
  var root = document.getElementById("wiz-body"), stepper = document.querySelector(".stepper");
  var q = new URLSearchParams(location.search);
  var st = { branch: q.get("branch") || "", doctor: q.get("doctor") || "", service: q.get("service") || "", visit: "", reason: "", date: "", time: "", queue: false, number: 0 };
  if (cfg.branches.length === 1) st.branch = cfg.branches[0].id;
  if (cfg.doctors.length === 1) st.doctor = cfg.doctors[0].id;
  if (st.service) { var sv = cfg.services.filter(function (s) { return s.slug === st.service; })[0]; if (sv) st.reason = sv.title; }
  var skipBranch = !!st.branch;
  var started = false;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function doctorsAt(bid) { return cfg.doctors.filter(function (d) { return d.branches.indexOf(bid) > -1 && (!st.service || !d.services.length || d.services.indexOf(st.service) > -1); }); }
  function doctor(id) { return cfg.doctors.filter(function (d) { return d.id === id; })[0]; }
  function steps() {
    var s = [];
    if (!skipBranch) s.push("branch");
    if (cfg.doctors.length > 1) s.push("doctor");
    s.push("visit", "time", "details");
    return s;
  }
  var cur = 0;
  function go(i) {
    cur = Math.max(0, Math.min(i, steps().length - 1));
    if (!started) { started = true; D.track("booking_start", { entry_point: q.get("branch") ? "branch_link" : q.get("service") ? "service_page" : "direct" }); }
    D.track("booking_step", { step_number: cur + 1 });
    render();
    root.focus && window.scrollTo({ top: document.getElementById("wizard").offsetTop - 70, behavior: "smooth" });
  }
  function header(title, hint) {
    var n = steps().length;
    stepper.innerHTML = Array.from({ length: n }, function (_, i) { return '<li class="' + (i <= cur ? "done" : "") + '"></li>'; }).join("");
    return '<div class="step-title"><h2 style="font-size:20px">' + title + '</h2><span class="muted small">خطوة ' + (cur + 1) + " من " + n + "</span></div>" + (hint ? '<p class="muted small">' + hint + "</p>" : "");
  }
  function nav(nextLabel, nextDisabled) {
    return '<div class="wiz-nav">' + (cur > 0 ? '<button class="btn btn-ghost" data-back type="button">رجوع</button>' : "<span></span>") +
      (nextLabel ? '<button class="btn btn-primary" data-next type="button"' + (nextDisabled ? " disabled" : "") + ">" + nextLabel + "</button>" : "") + "</div>";
  }
  function summary() {
    var b = D.branch(st.branch), bits = [];
    if (st.branch) bits.push("الفرع: <b>" + esc(b.area) + "</b>");
    if (st.doctor && cfg.doctors.length > 1) bits.push("الدكتور: <b>" + esc(doctor(st.doctor).name) + "</b>");
    if (st.visit) bits.push(esc(st.visit));
    if (st.date) bits.push("<b>" + esc(D.fullDate(new Date(st.date + "T00:00"))) + " – " + (st.queue ? "فترة من " + D.t12(st.time) : D.t12(st.time)) + "</b>");
    return bits.length ? '<div class="summary">' + bits.join(" · ") + "</div>" : "";
  }

  function render() {
    var s = steps()[cur];
    ({ branch: rBranch, doctor: rDoctor, visit: rVisit, time: rTime, details: rDetails })[s]();
  }

  function rBranch() {
    root.innerHTML = header("اختار الفرع") + '<div class="choice-grid c2">' + cfg.branches.map(function (b) {
      var n = D.nextSlot(b, cfg.doctors.length === 1 ? cfg.doctors[0].id : "");
      return '<button class="choice" type="button" data-b="' + b.id + '" aria-pressed="' + (st.branch === b.id) + '"><span><b>' + esc(b.name) + "</b><small>" + esc(b.address) + "</small><small>أقرب ميعاد: " + (n ? D.dayLabel(n.date) + " " + D.t12(n.slot.time) : "قائمة انتظار") + "</small></span></button>";
    }).join("") + "</div>" + nav();
    bind("[data-b]", function (el) { st.branch = el.dataset.b; if (st.doctor && doctorsAt(st.branch).map(function (d) { return d.id; }).indexOf(st.doctor) < 0) st.doctor = ""; st.date = st.time = ""; go(cur + 1); });
  }
  function rDoctor() {
    var list = doctorsAt(st.branch);
    root.innerHTML = header("اختار الدكتور", "أو سيبها علينا ونختار لك أقرب ميعاد متاح") + summary() + '<div class="choice-grid">' + list.map(function (d) {
      var n = D.nextSlot(D.branch(st.branch), d.id);
      return '<button class="choice" type="button" data-d="' + d.id + '" aria-pressed="' + (st.doctor === d.id) + '"><span><b>' + esc(d.name) + "</b><small>" + esc(d.title) + "</small><small>أقرب ميعاد: " + (n ? D.dayLabel(n.date) + " " + D.t12(n.slot.time) : "قائمة انتظار") + "</small></span></button>";
    }).join("") + "</div>" + nav();
    bind("[data-d]", function (el) { st.doctor = el.dataset.d; st.date = st.time = ""; go(cur + 1); });
  }
  function rVisit() {
    root.innerHTML = header("نوع الزيارة") + summary() + '<div class="choice-grid c3">' + cfg.visitTypes.map(function (v) {
      return '<button class="choice" type="button" data-v="' + esc(v) + '" aria-pressed="' + (st.visit === v) + '"><b>' + esc(v) + "</b></button>";
    }).join("") + '</div><h3 style="margin-top:18px">سبب الزيارة <span class="muted small">(اختياري)</span></h3><p class="muted small">بيوصل للدكتور بس علشان يستعد لحالتك — مش بيتشارك مع أي جهة.</p><div class="chips">' +
      cfg.reasons.concat(cfg.services.map(function (s) { return s.title; })).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (r) {
        return '<button class="chipbtn" type="button" data-r="' + esc(r) + '" aria-pressed="' + (st.reason === r) + '">' + esc(r) + "</button>";
      }).join("") + "</div>" + nav("التالي", !st.visit);
    bind("[data-v]", function (el) { st.visit = el.dataset.v; render(); });
    bind("[data-r]", function (el) { st.reason = st.reason === el.dataset.r ? "" : el.dataset.r; render(); });
  }
  function rTime() {
    var b = D.branch(st.branch), ds = D.days(14);
    var anyAvail = ds.some(function (d) { return D.slotsFor(b, st.doctor, d).some(function (x) { return x.queue ? !x.full : x.available; }); });
    if (!anyAvail) return rWaitlist();
    if (!st.date) {
      var n = D.nextSlot(b, st.doctor); st.date = D.iso(n.date);
    }
    var sel = new Date(st.date + "T00:00");
    var slots = D.slotsFor(b, st.doctor, sel);
    var daysHtml = '<div class="days" role="group" aria-label="اختار اليوم">' + ds.map(function (d) {
      var closed = !D.slotsFor(b, st.doctor, d).length;
      return '<button class="day' + (closed ? " closed" : "") + '" type="button" data-day="' + D.iso(d) + '" aria-pressed="' + (D.iso(d) === st.date) + '"' + (closed ? ' disabled aria-label="' + D.fullDate(d) + ' مقفول"' : "") + "><small>" + (D.dayLabel(d).match(/^(النهارده|بكرة)$/) ? D.dayLabel(d) : D.DAY_AR[d.getDay()]) + "</small><b>" + d.getDate() + "</b><small>" + (closed ? "مقفول" : D.MONTH_AR[d.getMonth()]) + "</small></button>";
    }).join("") + "</div>";
    var slotHtml;
    if (b.bookingType === "queue") {
      slotHtml = '<p class="muted small">الفرع ده شغال بنظام أسبقية الحضور في الفترة.</p><div class="choice-grid c2">' + slots.map(function (s) {
        return '<button class="choice" type="button" data-q="' + s.time + '" data-n="' + s.number + '" aria-pressed="' + (st.time === s.time) + '"' + (s.full ? " disabled" : "") + "><span><b>فترة " + D.t12(s.time) + " – " + D.t12(s.end) + "</b><small>" + (s.full ? "الفترة اكتملت" : "دورك المتوقع حوالي رقم " + s.number) + "</small></span></button>";
      }).join("") + "</div>";
    } else {
      var av = slots.filter(function (s) { return s.available; }).length;
      slotHtml = '<p class="muted small">' + av + " ميعاد متاح · المواعيد المحجوزة مشطوبة</p>" + '<div class="chips" role="group" aria-label="اختار الساعة">' + slots.map(function (s) {
        return '<button class="chipbtn" type="button" data-t="' + s.time + '" aria-pressed="' + (st.time === s.time) + '"' + (s.available ? "" : ' disabled aria-label="' + D.t12(s.time) + ' محجوز"') + ">" + D.t12(s.time) + "</button>";
      }).join("") + "</div>";
    }
    root.innerHTML = header("اختار اليوم والميعاد") + summary() + daysHtml + slotHtml + nav("التالي", !st.time);
    bind("[data-day]", function (el) { st.date = el.dataset.day; st.time = ""; render(); });
    bind("[data-t]", function (el) { st.time = el.dataset.t; st.queue = false; render(); });
    bind("[data-q]", function (el) { st.time = el.dataset.q; st.queue = true; st.number = +el.dataset.n; render(); });
  }
  function rWaitlist() {
    root.innerHTML = header("المواعيد خلصت") + '<p>المواعيد في الأسبوعين الجايين اكتملت. سيب رقمك في قائمة الانتظار وهنكلمك أول ما يفضى ميعاد.</p>' +
      '<form id="wl" novalidate><div class="field"><label for="wl-name">الاسم</label><input id="wl-name" type="text" required autocomplete="name"></div><div class="field"><label for="wl-phone">رقم الموبايل</label><input id="wl-phone" type="tel" inputmode="numeric" required dir="ltr" placeholder="01xxxxxxxxx"></div><button class="btn btn-primary" type="submit">سجّلني في قائمة الانتظار</button></form>' + nav();
    document.getElementById("wl").addEventListener("submit", function (e) {
      e.preventDefault(); var w = D.store("waitlist") || []; w.push({ name: e.target[0].value, phone: e.target[1].value, branch: st.branch, ts: Date.now() }); D.store("waitlist", w);
      root.innerHTML = '<div class="success"><h2>تمام، اتسجلت في قائمة الانتظار ✅</h2><p class="muted">هنكلمك أول ما يفضى ميعاد.</p></div>';
    });
    bindNav();
  }
  function rDetails() {
    root.innerHTML = header("بياناتك", "4 حقول بس") + summary() +
      '<form id="bk" novalidate>' +
      '<div class="field" id="f-name"><label for="name">الاسم</label><input id="name" name="name" type="text" autocomplete="name" required><div class="err">اكتب الاسم</div></div>' +
      '<div class="field" id="f-phone"><label for="phone">رقم الموبايل (واتساب)</label><input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx" required><div class="err">اكتب الرقم كده: 01xxxxxxxxx</div></div>' +
      '<div class="field"><span style="display:block;font-weight:600;margin-bottom:4px">الحجز لـ</span><div class="chips" role="radiogroup"><label class="chipbtn" style="display:inline-flex;align-items:center;gap:6px"><input type="radio" name="for" value="self" checked> نفسي</label><label class="chipbtn" style="display:inline-flex;align-items:center;gap:6px"><input type="radio" name="for" value="other"> شخص تاني</label></div></div>' +
      '<div class="field"><label for="note">ملاحظة <span class="muted small">(اختياري)</span></label><textarea id="note" name="note" maxlength="300"></textarea></div>' +
      '<div class="hp" aria-hidden="true"><label>اتركه فاضي<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="check" id="f-consent"><input type="checkbox" name="consent" required><span>أوافق على استخدام بياناتي (الاسم ورقم الموبايل وسبب الزيارة لو كتبته) لتنظيم ميعادي والتواصل معايا بخصوصه، حسب <a href="' + cfg.base + 'privacy/" target="_blank">إشعار الخصوصية</a>.</span></label>' +
      '<label class="check"><input type="checkbox" name="marketing"><span>أوافق أستقبل نصايح ومقالات توعوية على واتساب <span class="muted">(اختياري)</span>.</span></label>' +
      '<p class="err" id="consent-err" style="color:var(--err);display:none">لازم توافق على استخدام البيانات علشان نأكد الحجز.</p>' +
      '<div class="wiz-nav"><button class="btn btn-ghost" data-back type="button">رجوع</button><button class="btn btn-primary" type="submit">' + "أكّد الحجز" + "</button></div></form>";
    var f = document.getElementById("bk");
    f.addEventListener("submit", submit);
    bindNav();
    document.getElementById("name").focus();
  }

  function normPhone(v) { v = v.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, function (c) { return "٠١٢٣٤٥٦٧٨٩".indexOf(c); }); if (v.indexOf("20") === 0 && v.length === 12) v = "0" + v.slice(2); return v; }
  function submit(e) {
    e.preventDefault();
    var f = e.target, ok = true;
    if (f.website.value) return; // honeypot
    var name = f.name.value.trim(), phone = normPhone(f.phone.value);
    document.getElementById("f-name").classList.toggle("invalid", name.length < 2); if (name.length < 2) ok = false;
    var pOk = /^01[0125]\d{8}$/.test(phone);
    document.getElementById("f-phone").classList.toggle("invalid", !pOk); if (!pOk) ok = false;
    document.getElementById("consent-err").style.display = f.consent.checked ? "none" : "block"; if (!f.consent.checked) ok = false;
    if (!ok) { var inv = f.querySelector(".invalid input"); if (inv) inv.focus(); return; }

    var mine = D.myBookings();
    var dup = mine.filter(function (x) { return x.phone === phone && x.date === st.date && x.status !== "cancelled"; })[0];
    if (dup && !f.dataset.force) {
      document.getElementById("consent-err").outerHTML = '<div class="note" id="consent-err">عندك حجز بالفعل في نفس اليوم الساعة ' + D.t12(dup.time) + '. تحب تحجز ميعاد تاني برضه؟ <button class="btn btn-sm btn-ghost" type="button" id="force">أيوه، كمّل</button></div>';
      document.getElementById("force").onclick = function () { f.dataset.force = "1"; f.requestSubmit(); };
      return;
    }
    // Server-side lock would happen here; in the demo we re-check the slot against local bookings.
    var b = D.branch(st.branch);
    if (!st.queue) {
      var still = D.slotsFor(b, st.doctor, new Date(st.date + "T00:00")).filter(function (s) { return s.time === st.time; })[0];
      if (!still || !still.available) {
        var alt = D.slotsFor(b, st.doctor, new Date(st.date + "T00:00")).filter(function (s) { return s.available; })[0];
        alert("الميعاد ده لسه متحجز." + (alt ? " الأقرب له: " + D.t12(alt.time) : "")); st.time = alt ? alt.time : ""; go(steps().indexOf("time")); return;
      }
    }
    var attr = D.store("attr") || {};
    var id = "BK" + Date.now().toString(36).toUpperCase().slice(-6);
    var bk = {
      id: id, event_id: id, branch: st.branch, doctor: st.doctor || "", visit: st.visit, reason: st.reason, date: st.date, time: st.time, queue: st.queue, number: st.number,
      name: name, phone: phone, for: f.for.value, note: f.note.value.trim(), marketing: f.marketing.checked, status: "confirmed", ts: Date.now(),
      source: (attr.last || attr.first || {}).utm_source || "(direct)", attribution: attr,
    };
    var btn = f.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = "جاري التأكيد…";
    send(bk).then(function (res) {
      bk.whatsapp = res && res.whatsapp;
      mine.push(bk); D.store("bookings", mine);
      D.track("booking_submit", { branch_id: bk.branch, booking_type: /متابعة|استشارة/.test(bk.visit) ? "followup" : "new", event_id: bk.event_id });
      success(bk);
    });
  }
  function send(bk) {
    if (!cfg.api || location.protocol === "file:") return Promise.resolve({ whatsapp: "not_configured" });
    var b = D.branch(bk.branch), d = doctor(bk.doctor) || cfg.doctors[0];
    var payload = {
      demo: cfg.slug, id: bk.id, name: bk.name, phone: bk.phone, branch: b.area, address: b.address, mapsUrl: b.mapsUrl, doctor: d.name, clinic: cfg.name,
      dateText: D.fullDate(new Date(bk.date + "T00:00")), timeText: bk.queue ? "فترة من " + D.t12(bk.time) : D.t12(bk.time),
      visit: bk.visit, attribution: bk.attribution, website: "",
    }; // reason/note intentionally stay on the device in the demo
    var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 6000);
    return fetch("/api/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: ctl.signal })
      .then(function (r) { return r.ok ? r.json() : { whatsapp: "failed" }; })
      .catch(function () { return { whatsapp: "not_configured" }; });
  }
  function confirmText(bk) {
    var b = D.branch(bk.branch), d = doctor(bk.doctor) || cfg.doctors[0];
    return "أهلًا " + bk.name + "، ميعادك مع " + d.name + " اتأكد ✅\n" + D.fullDate(new Date(bk.date + "T00:00")) + " – " + (bk.queue ? "فترة من " + D.t12(bk.time) + " (دورك المتوقع حوالي رقم " + bk.number + ")" : D.t12(bk.time)) +
      "\nفرع " + b.area + ": " + b.address + "\nالخريطة: " + b.mapsUrl + "\nرقم الحجز: " + bk.id + "\nللتعديل أو الإلغاء رد على الرسالة دي.";
  }
  function ics(bk) {
    var b = D.branch(bk.branch), d = doctor(bk.doctor) || cfg.doctors[0];
    var s = bk.date.replace(/-/g, "") + "T" + bk.time.replace(":", "") + "00";
    var endM = (+bk.time.split(":")[0]) * 60 + (+bk.time.split(":")[1]) + 30;
    var e = bk.date.replace(/-/g, "") + "T" + String(Math.floor(endM / 60)).padStart(2, "0") + String(endM % 60).padStart(2, "0") + "00";
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DSE//Clinic Demo//AR", "BEGIN:VEVENT", "UID:" + bk.id + "@" + location.host, "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      "DTSTART;TZID=Africa/Cairo:" + s, "DTEND;TZID=Africa/Cairo:" + e, "SUMMARY:ميعاد " + d.name, "LOCATION:" + b.address.replace(/,/g, "\\,"), "DESCRIPTION:رقم الحجز " + bk.id, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:تذكير بالميعاد", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  }
  function success(bk) {
    var b = D.branch(bk.branch), d = doctor(bk.doctor) || cfg.doctors[0];
    stepper.innerHTML = steps().map(function () { return '<li class="done"></li>'; }).join("");
    var waSelf = "https://wa.me/2" + bk.phone + "?text=" + encodeURIComponent(confirmText(bk));
    var sent = bk.whatsapp === "sent";
    root.innerHTML = '<div class="success"><div class="big"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></div>' +
      '<h2>تم حجز ميعادك ✅</h2><p style="font-size:19px"><b>' + esc(D.fullDate(new Date(bk.date + "T00:00"))) + " – " + (bk.queue ? "فترة من " + D.t12(bk.time) : D.t12(bk.time)) + "</b><br>" + esc(d.name) + " · فرع " + esc(b.area) + "</p>" +
      (bk.queue ? '<p class="muted">دورك المتوقع حوالي رقم ' + bk.number + "</p>" : "") +
      '<p class="muted small">رقم الحجز: <span class="ltr">' + bk.id + "</span></p>" +
      (sent ? '<div class="note info">اتبعتلك رسالة تأكيد على واتساب على رقم <span class="ltr">' + esc(bk.phone) + "</span> 📩</div>"
            : '<div class="note info">في النسخة الكاملة رسالة التأكيد بتتبعت أوتوماتيك على واتساب في نفس اللحظة. جرّب تشوف شكلها:</div><a class="btn btn-wa btn-block" href="' + waSelf + '" target="_blank" rel="noopener">' + "افتح رسالة التأكيد على واتساب" + "</a>") +
      '<div class="btn-row" style="justify-content:center;margin-top:14px"><a class="btn btn-ghost btn-sm" href="' + ics(bk) + '" download="appointment.ics">أضف للتقويم</a><a class="btn btn-ghost btn-sm" href="' + esc(b.mapsUrl) + '" target="_blank" rel="noopener" data-track="directions_click" data-branch="' + b.id + '">الاتجاهات</a><button class="btn btn-ghost btn-sm" type="button" id="cancel">إلغاء الحجز</button></div>' +
      '<p class="small" style="margin-top:18px"><a href="' + cfg.base + 'dashboard/">شوف الحجز في لوحة العيادة (ديمو) ←</a></p></div>';
    history.replaceState(null, "", cfg.base + "book/?confirmed=" + bk.id);
    window.scrollTo({ top: 0 });
    document.getElementById("cancel").onclick = function () {
      if (!confirm("متأكد إنك عايز تلغي الحجز؟")) return;
      var all = D.myBookings().map(function (x) { if (x.id === bk.id) x.status = "cancelled"; return x; }); D.store("bookings", all);
      root.innerHTML = '<div class="success"><h2>اتلغى الحجز</h2><p><a class="btn btn-primary" href="' + cfg.base + 'book/">احجز ميعاد تاني</a></p></div>';
    };
  }

  function bind(sel, fn) { root.querySelectorAll(sel).forEach(function (el) { el.addEventListener("click", function () { fn(el); }); }); bindNav(); }
  function bindNav() {
    var bk = root.querySelector("[data-back]"), nx = root.querySelector("[data-next]");
    if (bk) bk.onclick = function () { go(cur - 1); };
    if (nx) nx.onclick = function () { go(cur + 1); };
  }
  go(0);
})();
