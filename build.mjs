#!/usr/bin/env node
// Static generator for the clinic demos.
// Reads demos/<slug>/site.json (+ demos/<slug>/photos/*) and writes dist/<slug>/**.
// Usage: node build.mjs [slug ...]      BASE=/ node build.mjs <slug>  (serve one demo at the domain root)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEMOS = path.join(ROOT, "demos");
const DIST = path.join(ROOT, "dist");
const ASSET_VER = Date.now().toString(36);

const only = process.argv.slice(2);
const slugs = fs.readdirSync(DEMOS).filter((d) => fs.existsSync(path.join(DEMOS, d, "site.json")) && (!only.length || only.includes(d)));
if (process.env.BASE && slugs.length !== 1) throw new Error("BASE works with exactly one slug: BASE=/ node build.mjs <slug>");

if (!only.length) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
fs.copyFileSync(path.join(ROOT, "static", "_headers"), path.join(DIST, "_headers"));
fs.copyFileSync(path.join(ROOT, "static", "robots.txt"), path.join(DIST, "robots.txt"));


// ---------------------------------------------------------------- helpers
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, f.name), d = path.join(dst, f.name);
    f.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function write(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const ldjson = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_AR = { sat: "السبت", sun: "الأحد", mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة" };
const DAY_SCHEMA = { sat: "Saturday", sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
const WEEK_ORDER = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
function to12(t) {
  const [h, m] = t.split(":").map(Number);
  const suf = h < 12 ? "ص" : "م";
  const hh = h % 12 || 12;
  return `${hh}${m ? ":" + String(m).padStart(2, "0") : ""} ${suf}`;
}
const rangeAr = (r) => { const [a, b] = r.split("-"); return `من ${to12(a)} لـ ${to12(b)}`; };

// ---------------------------------------------------------------- icons
const I = {
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  wa: '<path d="M3 21l1.65-3.8A9 9 0 1 1 7.6 20L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  cal: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h2M3 10h18"/>',
  car: '<path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4z"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  arrow: '<path d="M15 6l-6 6 6 6"/>',
  knee: '<path d="M9 3v6c0 2 1 3 3 4s3 2 3 4v4"/><path d="M15 3v5M9 21v-4"/><circle cx="12" cy="12" r="1.5"/>',
  sport: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
  joint: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/><path d="M10 10l4 4"/>',
  shoulder: '<path d="M4 20c0-6 3-10 8-10s8 4 8 10"/><circle cx="12" cy="6" r="3"/>',
  spine: '<path d="M12 3v18"/><path d="M9 6h6M8.5 10h7M9 14h6M9.5 18h5"/>',
  ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0"/>',
  nose: '<path d="M12 3c0 5-4 9-4 12a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3"/><path d="M9 18c-1 0-2-.5-2-1.5M15 18c1 0 2-.5 2-1.5"/>',
  throat: '<path d="M8 3v5a4 4 0 0 0 8 0V3"/><path d="M12 12v9M9 21h6"/>',
  sleep: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  tooth: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7 .5 3 1 6.5 2.5 6.5S9.5 16 12 16s3 5 4.5 5 2-3.5 2.5-6.5c.5-3 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
  implant: '<path d="M8 3h8l-1 5H9z"/><path d="M10 8v3h4V8M9.5 13h5M10 15.5h4M10.5 18h3M12 18v3"/>',
  brace: '<path d="M3 12h18"/><rect x="5" y="9" width="3" height="6" rx="1"/><rect x="10.5" y="9" width="3" height="6" rx="1"/><rect x="16" y="9" width="3" height="6" rx="1"/>',
  root: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 2 5 2 5M17 3c2.5 0 4 2 4 4.5 0 3-2 5-2 5"/><path d="M9 12l-1 9M15 12l1 9M12 10v6"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14a5 5 0 0 0 8 0M9 9h.01M15 9h.01"/>',
  plus: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
};
const icon = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.plus}</svg>`;
const waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>';

// ---------------------------------------------------------------- images
function initials(name) {
  return name.replace(/^(د\.|دكتور|دكتورة)\s*/, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join(" ");
}
function placeholderSvg(kind, label, theme, hint = true) {
  const a = theme.primary, b = theme.accent;
  const id = "g" + Math.abs(hash(kind + label)).toString(36);
  if (kind === "person") {
    return `<svg viewBox="0 0 400 500" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="500" fill="url(#${id})"/><circle cx="200" cy="190" r="78" fill="#fff" opacity=".22"/><path d="M70 500c0-90 58-150 130-150s130 60 130 150z" fill="#fff" opacity=".22"/><text x="200" y="212" text-anchor="middle" font-family="Cairo,sans-serif" font-size="64" font-weight="700" fill="#fff">${esc(initials(label))}</text>${hint ? '<text x="200" y="44" text-anchor="middle" font-family="IBM Plex Sans Arabic,sans-serif" font-size="18" fill="#fff" opacity=".9">مكان صورة الدكتور</text>' : ""}</svg>`;
  }
  return `<svg viewBox="0 0 400 300" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${a}" stop-opacity=".85"/><stop offset="1" stop-color="${b}" stop-opacity=".75"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/><g fill="none" stroke="#fff" stroke-width="6" opacity=".55"><rect x="150" y="90" width="100" height="80" rx="10"/><circle cx="200" cy="130" r="22"/><path d="M175 90l10-16h30l10 16"/></g>${hint ? `<text x="200" y="230" text-anchor="middle" font-family="IBM Plex Sans Arabic,sans-serif" font-size="22" fill="#fff">${esc(label)}</text>` : ""}</svg>`;
}
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

// ---------------------------------------------------------------- per demo
function buildDemo(slug) {
  const src = path.join(DEMOS, slug);
  const c = JSON.parse(fs.readFileSync(path.join(src, "site.json"), "utf8"));
  c.slug = slug;
  const base = process.env.BASE || `/${slug}/`;
  const out = path.join(DIST, ...base.split("/").filter(Boolean));
  if (fs.existsSync(path.join(src, "photos"))) copyDir(path.join(src, "photos"), path.join(out, "photos"));
  const origin = (c.siteUrl || `https://${slug}.pages.dev`).replace(/\/$/, "");
  const abs = (p) => origin + (process.env.BASE ? "/" : base) + p;
  const L = (p = "") => base + p;
  const isClinic = c.type === "clinic";
  const docs = c.doctors;
  const lead = docs[0];
  const theme = { primary: "#0F4C5C", accent: "#14B8A6", ...c.theme };

  // "pexels:<id>" → free Pexels image; http(s) URL → hotlinked (e.g. Google Maps photo); else a file under demos/<slug>/.
  const imgUrl = (src, w = 900) => {
    const px = /^pexels:(\d+)$/.exec(src);
    if (px) return `https://images.pexels.com/photos/${px[1]}/pexels-photo-${px[1]}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
    return /^https?:/.test(src) ? src : L(src);
  };
  // The placeholder stays underneath; if the image fails to load it is removed and the placeholder shows.
  const photo = (src, alt, kind, cls = "", eager = false, w = 900) =>
    `<span class="media ${cls}">${placeholderSvg(kind, alt, theme, !src)}${src
      ? `<img src="${esc(imgUrl(src, w))}"${/^pexels:/.test(src) ? ` srcset="${esc(imgUrl(src, Math.round(w / 2)))} ${Math.round(w / 2)}w, ${esc(imgUrl(src, w))} ${w}w"  sizes="(max-width: 700px) 100vw, ${Math.round(w / 2)}px"` : ""} alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
      : ""}</span>`;

  const waLink = (text) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}`;
  const waText = (page, branch) => `السلام عليكم، عايز أحجز كشف${branch ? " في فرع " + branch : ""}${page ? " (من صفحة: " + page + ")" : ""}`;
  const orgId = abs("#org");
  const docId = (d) => abs(`doctors/${d.id}/#physician`);
  const clinicId = (b) => abs(`branches/${b.id}/#clinic`);
  const svcBySlug = Object.fromEntries(c.services.map((s) => [s.slug, s]));

  const clientCfg = {
    slug, base, name: c.brand.name, short: c.brand.short, whatsapp: c.whatsapp, phone: c.phone,
    api: c.bookingApi !== false, tracking: c.tracking || {},
    fee: c.fees, visitTypes: c.visitTypes || ["كشف جديد", "استشارة (متابعة خلال " + c.fees.followupDays + " يوم)", "متابعة بعد إجراء"],
    reasons: c.reasons || [],
    doctors: docs.map((d) => ({ id: d.id, name: d.name, title: d.title, branches: d.branches || c.branches.map((b) => b.id), services: d.services || [] })),
    branches: c.branches.map((b) => ({ id: b.id, name: b.name, area: b.area, address: b.address, phone: b.phone, hours: b.hours, slotMinutes: b.slotMinutes || 20, bookingType: b.bookingType || "slot", queueCapacity: b.queueCapacity || 15, mapsUrl: b.mapsUrl || `https://www.google.com/maps?q=${b.lat},${b.lng}`, lat: b.lat, lng: b.lng })),
    services: c.services.map((s) => ({ slug: s.slug, title: s.title })),
  };

  // ------------------------------------------------------------ chrome
  const nav = [
    ["services/", "الخدمات"],
    ["branches/", "الفروع"],
    ["about/", isClinic ? "عن المركز والأطباء" : "عن الدكتور"],
    ["articles/", "مقالات"],
    ["reviews/", "آراء المرضى"],
  ];
  function page({ p = "", title, desc, body, schema = [], noindex = false, pageName = "", branchName = "", scripts = [] }) {
    const canonical = abs(p);
    const navHtml = nav.map(([href, t]) => `<a href="${L(href)}"${p.startsWith(href) ? ' aria-current="page"' : ""}>${t}</a>`).join("");
    const wa = waLink(waText(pageName, branchName));
    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${c.demo !== false || noindex ? "noindex,nofollow" : "index,follow"}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:locale" content="ar_EG">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
${(c.brand.heroPhoto || lead.photo) ? `<meta property="og:image" content="${esc(/^(https?|pexels):/.test(c.brand.heroPhoto || lead.photo) ? imgUrl(c.brand.heroPhoto || lead.photo, 1200) : abs(c.brand.heroPhoto || lead.photo))}">` : ""}
<meta name="theme-color" content="${theme.primary}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${ASSET_VER}">
<script>document.documentElement.classList.add("js")</script>
<style>:root{--primary:${theme.primary};--primary-ink:${theme.primaryInk || theme.primary};--accent:${theme.accent};--accent-ink:${theme.accentInk || theme.primary};--bg:${theme.bg || "#F8F6F2"};--soft:${theme.soft || "#EEF4F4"}}</style>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${theme.primary}"/><path d="M16 8v16M8 16h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`)}">
${schema.map(ldjson).join("\n")}
</head>
<body>
<a class="skip" href="#main">انتقل للمحتوى</a>
${c.demo !== false ? `<div class="demo-banner" role="note"><b>نموذج تجريبي</b> من ${esc(c.agency?.name || "Digital Solution Egypt")} — البيانات والمواعيد للعرض فقط ولسه محتاجة مراجعة الدكتور</div>` : ""}
<header class="hdr">
  <div class="wrap">
    <a class="logo" href="${L()}"><span class="logo-mark" aria-hidden="true">${esc(c.brand.mark || initials(c.brand.short)[0])}</span><span>${esc(c.brand.short)}<small>${esc(c.brand.headerLine)}</small></span></a>
    <nav class="nav" aria-label="القائمة الرئيسية">${navHtml}</nav>
    <a class="hdr-phone" href="tel:${c.phone}">${icon("phone")}<span class="ltr">${esc(c.phoneDisplay || c.phone)}</span></a>
    <a class="btn btn-primary btn-sm" href="${L("book/")}" data-track="cta_book_click" data-pos="header">احجز</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="mnav" aria-label="القائمة">${icon("menu")}</button>
  </div>
  <nav id="mnav" class="mnav" aria-label="قائمة الموبايل">${nav.map(([h, t]) => `<a href="${L(h)}">${t}</a>`).join("")}<a href="${L("faq/")}">الأسئلة الشائعة</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="ftr">
  <div class="wrap">
    <div class="grid g3">
      <div>
        <h3>${esc(c.brand.name)}</h3>
        <p>${esc(c.brand.footerAbout)}</p>
        ${docs.map((d) => d.syndicateNo ? `<p class="small">${esc(d.name)} — رقم القيد بنقابة الأطباء: <span class="ltr">${esc(d.syndicateNo)}</span></p>` : "").join("")}
      </div>
      <div>
        <h3>الفروع</h3>
        <ul>${c.branches.map((b) => `<li><a href="${L(`branches/${b.id}/`)}">${esc(b.name)}</a><br><span class="small">${esc(b.address)}</span></li>`).join("")}</ul>
      </div>
      <div>
        <h3>روابط</h3>
        <ul>
          <li><a href="${L("book/")}">احجز ميعاد</a></li>
          <li><a href="${L("faq/")}">الأسئلة الشائعة</a></li>
          <li><a href="${L("privacy/")}">إشعار الخصوصية</a></li>
          <li><a href="${L("dashboard/")}">لوحة العيادة (ديمو)</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">المحتوى توعوي ولا يغني عن الكشف الطبي. في الحالات الطارئة اتصل بالإسعاف <span class="ltr">123</span>. · آخر مراجعة طبية للمحتوى: ${esc(c.lastReviewedAr || "أكتوبر 2026")} · تصميم وتطوير ${esc(c.agency?.name || "Digital Solution Egypt")}</div>
  </div>
</footer>
<nav class="cta-bar" aria-label="تواصل سريع">
  <a class="btn btn-call" href="${c.branches.length > 1 ? L("branches/#call") : "tel:" + c.phone}" data-track="cta_call_click" data-pos="sticky_bar" data-call>${icon("phone")}اتصل</a>
  <a class="btn btn-wa" href="${wa}" data-track="cta_whatsapp_click" data-pos="sticky_bar" target="_blank" rel="noopener">${waIcon}واتساب</a>
  <a class="btn btn-primary" href="${L("book/")}" data-track="cta_book_click" data-pos="sticky_bar">${icon("cal")}احجز الآن</a>
</nav>
<a class="wa-float" href="${wa}" aria-label="تواصل على واتساب" data-track="cta_whatsapp_click" data-pos="float" target="_blank" rel="noopener">${waIcon}</a>
<script id="cfg" type="application/json">${JSON.stringify(clientCfg).replace(/</g, "\\u003c")}</script>
<script src="/assets/site.js?v=${ASSET_VER}" defer></script>
${scripts.map((s) => `<script src="/assets/${s}?v=${ASSET_VER}" defer></script>`).join("\n")}
</body>
</html>`;
  }
  const crumbs = (items) => `<nav class="crumbs" aria-label="مسار الصفحة"><a href="${L()}">الرئيسية</a>${items.map(([h, t]) => `<span aria-hidden="true">›</span>${h ? `<a href="${L(h)}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`}`).join("")}</nav>`;
  const crumbSchema = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [["", "الرئيسية"], ...items].map(([h, t], i) => ({ "@type": "ListItem", position: i + 1, name: t, item: abs(h) })) });
  const faqSchema = (qa) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  const faqHtml = (qa) => qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join("");
  const ratingLine = c.rating ? `<span class="stars" aria-hidden="true">★</span> ${esc(c.rating.value)} على Google (${esc(c.rating.count)} تقييم)` : "";
  const emergency = `<div class="note danger" role="note"><b>حالة طارئة؟</b> ${esc(c.emergencyText || "لو عندك إصابة شديدة أو نزيف أو ألم مفاجئ شديد، توجّه لأقرب طوارئ فورًا أو اتصل بالإسعاف")} <span class="ltr">123</span>.</div>`;
  const disclaimer = `<div class="note info" role="note">المعلومات دي توعوية ومش بديل عن الكشف الطبي. القرار العلاجي بيتاخد بعد الكشف ومراجعة حالتك.</div>`;
  const sampleNote = c.reviewsAreSamples !== false ? `<p class="sample-note">التقييمات المعروضة هنا نماذج توضيحية للديمو، وهتتبدّل بتقييمات Google الحقيقية بعد موافقة أصحابها.</p>` : "";

  const hoursTable = (b) => `<table class="hours" data-hours="${b.id}"><caption class="sr-only">مواعيد ${esc(b.name)}</caption><tbody>${WEEK_ORDER.map((k) => `<tr data-day="${k}"><th scope="row">${DAY_AR[k]}</th><td>${b.hours[k]?.length ? b.hours[k].map(rangeAr).join(" · ") : '<span class="muted">مقفول — الحجز الأونلاين متاح</span>'}</td></tr>`).join("")}</tbody></table>`;
  const mapBox = (b) => `<div class="map" data-map="${b.lat},${b.lng}"><button class="map-facade" type="button" aria-label="اعرض خريطة ${esc(b.name)}"><span><span class="pin" aria-hidden="true"></span><b>${esc(b.name)}</b><br><span class="small">${esc(b.landmark || b.address)}</span><br><span class="more">اضغط لعرض الخريطة</span></span></button></div>`;
  const branchCard = (b) => `
    <div class="branch">
      <div class="card">
        <h3>${esc(b.name)} <span class="live" data-live="${b.id}"></span></h3>
        <div class="kv">
          <div>${icon("pin")}<span>${esc(b.address)}${b.landmark ? `<br><span class="muted small">علامة مميزة: ${esc(b.landmark)}</span>` : ""}</span></div>
          <div>${icon("phone")}<a href="tel:${b.phone}" data-track="cta_call_click" data-branch="${b.id}" data-pos="branch_card"><span class="ltr">${esc(b.phoneDisplay || b.phone)}</span></a></div>
          <div>${icon("clock")}<span>${b.bookingType === "queue" ? "الحجز بأسبقية الحضور في الفترة" : "الحجز بميعاد محدد"}</span></div>
        </div>
        <div style="margin-top:12px">${hoursTable(b)}</div>
        <div class="btn-row" style="margin-top:14px">
          <a class="btn btn-primary btn-sm" href="${L(`book/?branch=${b.id}`)}" data-track="cta_book_click" data-branch="${b.id}" data-pos="branch_card">احجز في الفرع ده</a>
          <a class="btn btn-ghost btn-sm" href="${esc(b.mapsUrl || `https://www.google.com/maps?q=${b.lat},${b.lng}`)}" target="_blank" rel="noopener" data-track="directions_click" data-branch="${b.id}">${icon("pin")}الاتجاهات</a>
          <a class="btn btn-ghost btn-sm" href="tel:${b.phone}" data-track="cta_call_click" data-branch="${b.id}" data-pos="branch_card">${icon("phone")}اتصل</a>
        </div>
      </div>
      ${mapBox(b)}
    </div>`;

  // ------------------------------------------------------------ schema objects
  const physicianLd = (d) => ({
    "@context": "https://schema.org", "@type": "Physician", "@id": docId(d), name: d.name, description: d.bio,
    image: d.photo ? (/^https?:/.test(d.photo) ? d.photo : abs(d.photo)) : undefined,
    medicalSpecialty: (d.schemaSpecialty || c.schemaSpecialty || []).map((s) => `https://schema.org/${s}`),
    hasCredential: (d.qualifications || []).map((q) => ({ "@type": "EducationalOccupationalCredential", name: q.title, recognizedBy: q.org ? { "@type": "Organization", name: q.org } : undefined })),
    alumniOf: d.alumniOf ? { "@type": "CollegeOrUniversity", name: d.alumniOf } : undefined,
    memberOf: (d.memberships || []).map((m) => ({ "@type": "Organization", name: m })),
    worksFor: (d.branches || c.branches.map((b) => b.id)).map((id) => ({ "@id": clinicId(c.branches.find((b) => b.id === id)) })),
    url: abs(isClinic ? `doctors/${d.id}/` : "about/"),
  });
  const clinicLd = (b) => ({
    "@context": "https://schema.org", "@type": "MedicalClinic", "@id": clinicId(b), name: b.schemaName || `${c.brand.name} – ${b.area}`,
    url: abs(`branches/${b.id}/`), telephone: b.phone, priceRange: c.fees?.consult ? `${c.fees.consult} EGP` : undefined,
    address: { "@type": "PostalAddress", streetAddress: b.street || b.address, addressLocality: b.area, addressRegion: b.region || "القاهرة", addressCountry: "EG" },
    geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng }, hasMap: b.mapsUrl,
    openingHoursSpecification: Object.entries(b.hours).flatMap(([k, rs]) => rs.map((r) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_SCHEMA[k]}`, opens: r.split("-")[0], closes: r.split("-")[1] }))),
    medicalSpecialty: (c.schemaSpecialty || []).map((s) => `https://schema.org/${s}`),
    availableService: c.services.map((s) => ({ "@type": "MedicalProcedure", name: s.title })),
    physician: docs.filter((d) => !d.branches || d.branches.includes(b.id)).map((d) => ({ "@id": docId(d) })),
    parentOrganization: { "@id": orgId },
  });
  const orgLd = {
    "@context": "https://schema.org", "@type": "MedicalOrganization", "@id": orgId, name: c.brand.name, url: abs(""),
    telephone: c.phone, sameAs: c.sameAs || [], medicalSpecialty: (c.schemaSpecialty || []).map((s) => `https://schema.org/${s}`),
    department: c.branches.map((b) => ({ "@id": clinicId(b) })),
  };
  const websiteLd = { "@context": "https://schema.org", "@type": "WebSite", name: c.brand.name, url: abs(""), inLanguage: "ar-EG", publisher: { "@id": orgId } };

  // ------------------------------------------------------------ pages
  const pages = {};

  // HOME
  const [h1Lead, ...h1Rest] = c.brand.h1.split(" – ");
  const img = c.images || {};
  const exp = c.experience || { title: "تجربة كشف مريحة من أول رسالة", points: ["سعر كشف واضح من الأول", "تأكيد وتذكير على واتساب"] };
  const yearsBadge = ((c.trust.find((t) => /سن/.test(t.b || "")) || {}).b || "").replace(/[^\d]/g, "");
  const allPhotos = [...new Set(c.branches.flatMap((b) => b.photos || []))];
  const stats = [
    ...c.trust.filter((t) => t.b !== "rating").slice(0, 2).map((t) => ({ n: t.b, l: t.t })),
    c.rating ? { n: `${c.rating.value}★`, l: `تقييم على Google من ${c.rating.count} مريض` } : null,
    { n: "24/7", l: "حجز أونلاين وتأكيد فوري على واتساب" },
  ].filter(Boolean);
  pages[""] = page({
    title: c.seo.homeTitle, desc: c.seo.homeDesc, pageName: "الرئيسية",
    schema: [orgLd, websiteLd, ...(isClinic ? [] : [physicianLd(lead)])],
    body: `
<section class="hero2">
  <span class="blob b1" aria-hidden="true"></span><span class="blob b2" aria-hidden="true"></span>
  <div class="wrap hero2-grid">
    <div class="hero2-copy">
      <span class="pill reveal"><span class="dot" aria-hidden="true"></span>الحجز أونلاين متاح 24 ساعة · ${esc(c.brand.eyebrow || "")}</span>
      <h1 class="reveal">${esc(h1Lead)}${h1Rest.length ? `<span class="hl">${esc(h1Rest.join(" – "))}</span>` : ""}</h1>
      <p class="sub reveal">${esc(c.brand.subtitle)}</p>
      <div class="btn-row reveal">
        <a class="btn btn-primary btn-lg" href="${L("book/")}" data-track="cta_book_click" data-pos="hero">${icon("cal")}احجز ميعادك أونلاين</a>
        <a class="btn btn-wa btn-lg" href="${waLink(waText("الرئيسية"))}" target="_blank" rel="noopener" data-track="cta_whatsapp_click" data-pos="hero">${waIcon}اسأل على الواتساب</a>
      </div>
      <div class="social-proof reveal">
        <span class="faces" aria-hidden="true">${["م", "س", "ك", "ن"].map((x) => `<i>${x}</i>`).join("")}</span>
        <span><b><span class="stars">★★★★★</span> ${esc(c.rating?.value || "")}</b><br><span class="muted small">من ${esc(c.rating?.count || "")} تقييم على Google</span></span>
      </div>
    </div>
    <div class="hero2-visual reveal">
      <div class="arch">${photo(c.brand.heroPhoto || lead.photo, isClinic ? c.brand.name : lead.name, isClinic ? "place" : "person", "", true, 1000)}</div>
      <div class="float f1 glass"><span class="ico-sm">${icon("cal")}</span><span><small>أقرب ميعاد متاح</small><b data-hero-next>…</b></span></div>
      <div class="float f2 glass"><span class="ico-sm gold">${icon("star")}</span><span><b>${esc(c.rating?.value || "")} / 5</b><small>${esc(c.rating?.count || "")} تقييم</small></span></div>
      ${isClinic
        ? `<div class="float f3 glass team"><span class="faces">${docs.map((d) => `<span class="avatar xs">${photo(d.photo, d.name, "person", "", false, 200)}</span>`).join("")}</span><span><b>${docs.length} أطباء متخصصين</b><small>اختار دكتورك وقت الحجز</small></span></div>`
        : `<div class="float f3 glass"><span class="ico-sm">${icon("shield")}</span><span><b>${esc(lead.degreeLine.split(" – ")[0])}</b><small>${esc(lead.degreeLine.split(" – ")[1] || "")}</small></span></div>`}
    </div>
  </div>
</section>

<section class="stats-band">
  <div class="wrap stats">${stats.map((s) => `<div class="stat reveal"><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join("")}</div>
</section>

<section class="sec" style="padding-top:36px">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">مواعيد لحظية</span><h2>أقرب ميعاد متاح في كل فرع</h2></div></div>
    <div class="slot-cards" data-next-slots>${c.branches.map(() => '<div class="skeleton" style="height:76px;border-radius:12px"></div>').join("")}</div>
  </div>
</section>

<section class="sec sec-soft">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">${isClinic ? "التخصصات" : "الخدمات"}</span><h2>${esc(c.servicesHeading || "بنساعدك في إيه؟")}</h2></div><a class="more" href="${L("services/")}">كل الخدمات ←</a></div>
    <div class="grid g3">${c.services.map((s, i) => `<a class="card svc reveal" href="${L(`services/${s.slug}/`)}"><span class="num" aria-hidden="true">0${i + 1}</span><div class="ico">${icon(s.icon)}</div><h3>${esc(s.title)}</h3><p class="muted small">${esc(s.short)}</p><span class="more">اعرف أكتر ←</span></a>`).join("")}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap exp">
    <div class="collage reveal">
      <div class="c1">${photo(img.scene1, "داخل غرفة الكشف", "place", "", false, 900)}</div>
      <div class="c2">${photo(img.scene2, "استشارة مع المريض", "place", "", false, 700)}</div>
      ${yearsBadge ? `<div class="badge-round" aria-hidden="true"><b>+${esc(yearsBadge)}</b><span>سنة خبرة</span></div>` : ""}
    </div>
    <div class="reveal">
      <span class="eyebrow">ليه المرضى بيرجعوا لنا؟</span>
      <h2>${esc(exp.title)}</h2>
      <ul class="checks">${exp.points.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("")}</ul>
      <a class="btn btn-primary" href="${L("book/")}" data-track="cta_book_click" data-pos="experience">${icon("cal")}احجز كشفك</a>
    </div>
  </div>
</section>

${isClinic ? `
<section class="sec sec-soft">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">فريق المركز</span><h2>الأطباء</h2></div><a class="more" href="${L("about/")}">عن المركز ←</a></div>
    <div class="grid g3">${docs.map((d) => `<a class="card team-card reveal" href="${L(`doctors/${d.id}/`)}"><div class="team-photo">${photo(d.photo, d.name, "person", "", false, 700)}</div><div class="team-body"><h3>${esc(d.name)}</h3><p class="muted small" style="margin:0 0 8px">${esc(d.title)}</p><span class="chip">${esc(d.degreeLine)}</span></div></a>`).join("")}</div>
  </div>
</section>` : `
<section class="sec sec-soft">
  <div class="wrap about-band">
    <div class="about-photo reveal">${photo(lead.photo, lead.name, "person", "", false, 800)}</div>
    <div class="reveal">
      <span class="eyebrow">عن الدكتور</span>
      <h2>${esc(lead.name)}</h2>
      <p class="lead-quote">${esc(lead.approach || lead.bio)}</p>
      <ul class="timeline">${(lead.qualifications || []).slice(0, 4).map((q) => `<li><b>${esc(q.title)}</b><br><span class="muted small">${esc(q.org || "")}${q.year ? " · " + q.year : ""}</span></li>`).join("")}</ul>
      <a class="btn btn-ghost" href="${L("about/")}">اعرف أكتر عن ${esc(lead.shortName || lead.name)} ←</a>
    </div>
  </div>
</section>`}

<section class="sec">
  <div class="wrap">
    <h2 style="text-align:center">إزاي تحجز؟ <span class="muted" style="font-weight:400">أقل من دقيقة</span></h2>
    <ol class="steps steps2">
      <li class="reveal"><span class="ico">${icon("pin")}</span><div><b>اختار الفرع والميعاد</b><br><span class="muted small">من المواعيد المتاحة فعلًا</span></div></li>
      <li class="reveal"><span class="ico">${icon("user")}</span><div><b>اكتب اسمك ورقمك</b><br><span class="muted small">من غير تسجيل حساب</span></div></li>
      <li class="reveal"><span class="ico wa">${waIcon}</span><div><b>هيوصلك تأكيد على واتساب</b><br><span class="muted small">وتذكير قبل الميعاد بيوم</span></div></li>
    </ol>
  </div>
</section>

<section class="sec sec-dark">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow light">آراء المرضى</span><h2>${ratingLine}</h2></div><a class="more light" href="${L("reviews/")}">كل التقييمات ←</a></div>
    ${sampleNote}
    <div class="rev-scroll" tabindex="0" aria-label="تقييمات المرضى">${c.reviews.map(reviewCard).join("")}</div>
  </div>
</section>

<section class="sec" id="branches">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">العنوان والمواعيد</span><h2>${c.branches.length > 1 ? "فروعنا" : "مكاننا"}</h2></div></div>
    ${c.branches.length > 1 ? `<div class="tabs" role="tablist">${c.branches.map((b, i) => `<button class="tab" role="tab" id="tab-${b.id}" aria-controls="panel-${b.id}" aria-selected="${i === 0}">${esc(b.area)}</button>`).join("")}</div>` : ""}
    ${c.branches.map((b, i) => `<div role="tabpanel" id="panel-${b.id}" aria-labelledby="tab-${b.id}" ${i ? "hidden" : ""}>${branchCard(b)}</div>`).join("")}
  </div>
</section>

${allPhotos.length ? `
<section class="sec sec-soft">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">جولة في العيادة</span><h2>مكان مريح ونضيف</h2></div></div>
    <div class="bento">${allPhotos.slice(0, 5).map((p, i) => `<figure class="reveal">${photo(p, ["الاستقبال", "منطقة الانتظار", "غرفة الكشف", "العيادة", "العيادة"][i], "place", "", false, i ? 700 : 1100)}</figure>`).join("")}</div>
  </div>
</section>` : ""}

<section class="sec">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">مقالات توعوية</span><h2>اعرف أكتر عن حالتك</h2></div><a class="more" href="${L("articles/")}">كل المقالات ←</a></div>
    <div class="grid g3">${c.articles.slice(0, 3).map(articleCard).join("")}</div>
  </div>
</section>

<section class="sec sec-soft">
  <div class="wrap prose" style="margin:0 auto">
    <h2>أسئلة شائعة</h2>
    ${faqHtml(c.faq.slice(0, 5))}
    <a class="more" href="${L("faq/")}">كل الأسئلة ←</a>
  </div>
</section>

<section class="cta-band">
  <div class="cta-bg">${photo(img.cta, "", "place", "", false, 1600)}</div>
  <div class="wrap cta-inner reveal">
    <h2>${esc(c.closingCta)}</h2>
    <p>الحجز بياخد أقل من دقيقة، والتأكيد بيوصلك على واتساب.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn btn-primary btn-lg" href="${L("book/")}" data-track="cta_book_click" data-pos="closing">${icon("cal")}احجز دلوقتي</a>
      <a class="btn btn-light btn-lg" href="tel:${c.phone}" data-track="cta_call_click" data-pos="closing">${icon("phone")}اتصل بالعيادة</a>
    </div>
  </div>
</section>`,
  });

  function reviewCard(r) {
    return `<div class="card review"><div class="who"><b>${esc(r.name)}</b><span>${esc(r.date)}${r.branch ? " · " + esc(r.branch) : ""}</span></div><div class="stars" aria-label="${r.stars} من 5">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><p style="margin:0"><q>${esc(r.text)}</q></p></div>`;
  }
  function articleCard(a) {
    return `<a class="card" href="${L(`articles/${a.slug}/`)}"><span class="chip">${a.minutes} دقايق قراءة</span><h3 style="margin-top:10px">${esc(a.title)}</h3><p class="muted small">${esc(a.excerpt)}</p><span class="more">اقرأ المقال ←</span></a>`;
  }
  const bookAside = (svc) => `<aside class="aside"><div class="card">
      <h3>احجز كشف لتقييم حالتك</h3>
      <p class="muted small">الكشف: ${esc(c.fees.consult)} جنيه · الاستشارة خلال ${esc(c.fees.followupDays)} يوم: ${esc(c.fees.followupLabel || "مجانًا")}</p>
      <a class="btn btn-primary btn-block" href="${L(`book/${svc ? "?service=" + svc : ""}`)}" data-track="cta_book_click" data-pos="aside">${icon("cal")}احجز ميعاد</a>
      <a class="btn btn-wa btn-block" style="margin-top:8px" href="${waLink(waText(svc ? svcBySlug[svc].title : ""))}" target="_blank" rel="noopener" data-track="cta_whatsapp_click" data-pos="aside">${waIcon}اسأل على الواتساب</a>
    </div></aside>`;

  // ABOUT + DOCTORS
  const doctorBody = (d, h1) => `
<section class="ph profile"><div class="wrap profile-grid">
  <div>${crumbs(isClinic ? [["about/", "عن المركز"], ["", d.name]] : [["", "عن الدكتور"]])}<h1>${esc(h1)}</h1><p class="muted">${esc(d.title)}</p>
    <div class="btn-row"><a class="btn btn-primary" href="${L(`book/${isClinic ? "?doctor=" + d.id : ""}`)}" data-track="cta_book_click" data-pos="profile">${icon("cal")}احجز مع ${esc(d.shortName || d.name)}</a></div></div>
  <div class="profile-photo">${photo(d.photo, d.name, "person", "", true, 800)}</div>
</div></section>
<section class="sec"><div class="wrap layout">
  <div class="prose">
    <p><span class="chip">${esc(d.degreeLine)}</span> ${d.syndicateNo ? `<span class="chip">رقم القيد بالنقابة: <span class="ltr">${esc(d.syndicateNo)}</span></span>` : ""}</p>
    <p>${esc(d.bio)}</p>
    ${d.approach ? `<h2>طريقة العلاج</h2><p>${esc(d.approach)}</p>` : ""}
    <h2>المؤهلات</h2>
    <ul class="timeline">${(d.qualifications || []).map((q) => `<li><b>${esc(q.title)}</b><br><span class="muted small">${esc(q.org || "")}${q.year ? " · " + q.year : ""}</span></li>`).join("")}</ul>
    ${d.memberships?.length ? `<h2>العضويات</h2><ul>${d.memberships.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
    ${d.focus?.length ? `<h2>مجالات الاهتمام</h2><ul>${d.focus.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
    <div class="note">كل شهادة هنا هتتعرض بصورة من الأصل بعد مراجعة الدكتور — مفيش أي مؤهل أو مؤتمر بيتكتب من غير مستند.</div>
  </div>
  ${bookAside()}
</div></section>`;

  if (isClinic) {
    pages["about/"] = page({
      p: "about/", title: `عن ${c.brand.name} والأطباء`, desc: c.brand.footerAbout, pageName: "عن المركز",
      schema: [orgLd, crumbSchema([["about/", "عن المركز"]])],
      body: `
<section class="ph"><div class="wrap">${crumbs([["", "عن المركز"]])}<h1>عن ${esc(c.brand.name)}</h1></div></section>
<section class="sec"><div class="wrap layout"><div class="prose">
  ${(c.brand.about || []).map((p) => `<p>${esc(p)}</p>`).join("")}
  <h2>فريق الأطباء</h2>
  <div class="grid">${docs.map((d) => `<a class="card doc-card" href="${L(`doctors/${d.id}/`)}"><div class="avatar">${photo(d.photo, d.name, "person")}</div><div><h3>${esc(d.name)}</h3><p class="muted small" style="margin:0">${esc(d.title)}</p></div></a>`).join("")}</div>
  <h2 style="margin-top:24px">صور المركز</h2>
  <div class="photos">${c.branches.flatMap((b) => (b.photos?.length ? b.photos : [null, null, null]).map((src, i) => `<figure>${photo(src, ["الواجهة", "الاستقبال", "غرفة الكشف"][i] || "صورة المركز", "place")}</figure>`)).slice(0, 6).join("")}</div>
</div>${bookAside()}</div></section>`,
    });
    for (const d of docs) {
      pages[`doctors/${d.id}/`] = page({ p: `doctors/${d.id}/`, title: `${d.name} – ${d.title} | ${c.brand.short}`, desc: d.bio.slice(0, 150), pageName: d.name, schema: [physicianLd(d), crumbSchema([["about/", "عن المركز"], [`doctors/${d.id}/`, d.name]])], body: doctorBody(d, d.name) });
    }
  } else {
    pages["about/"] = page({ p: "about/", title: `${lead.name}: المؤهلات والخبرة`, desc: lead.bio.slice(0, 150), pageName: "عن الدكتور", schema: [physicianLd(lead), crumbSchema([["about/", "عن الدكتور"]])], body: doctorBody(lead, `${lead.name}: المؤهلات والخبرة`) });
  }

  // SERVICES
  pages["services/"] = page({
    p: "services/", title: `الخدمات | ${c.brand.short}`, desc: `خدمات ${c.brand.name}: ${c.services.map((s) => s.title).join("، ")}.`, pageName: "الخدمات",
    schema: [crumbSchema([["services/", "الخدمات"]])],
    body: `<section class="ph"><div class="wrap">${crumbs([["", "الخدمات"]])}<h1>الخدمات</h1><p class="muted" style="margin:0">${esc(c.brand.subtitle)}</p></div></section>
<section class="sec"><div class="wrap grid g3">${c.services.map((s) => `<a class="card" href="${L(`services/${s.slug}/`)}"><div class="ico">${icon(s.icon)}</div><h3>${esc(s.title)}</h3><p class="muted small">${esc(s.short)}</p><span class="more">اعرف أكتر ←</span></a>`).join("")}</div></section>`,
  });
  for (const s of c.services) {
    const rel = c.articles.filter((a) => a.services?.includes(s.slug));
    const docsFor = docs.filter((d) => !d.services || d.services.includes(s.slug));
    pages[`services/${s.slug}/`] = page({
      p: `services/${s.slug}/`, title: s.seoTitle || `${s.title} | ${c.brand.short}`, desc: s.seoDesc || s.intro.slice(0, 150), pageName: s.title,
      schema: [
        { "@context": "https://schema.org", "@type": "MedicalWebPage", name: s.h1, url: abs(`services/${s.slug}/`), inLanguage: "ar-EG", lastReviewed: c.lastReviewed, reviewedBy: { "@id": docId(docsFor[0] || lead) }, about: { "@type": "MedicalProcedure", name: s.title }, audience: "https://schema.org/Patient" },
        crumbSchema([["services/", "الخدمات"], [`services/${s.slug}/`, s.title]]),
        faqSchema(s.faq),
      ],
      body: `<section class="ph"><div class="wrap">${crumbs([["services/", "الخدمات"], ["", s.title]])}<h1>${esc(s.h1)}</h1></div></section>
<section class="sec"><div class="wrap layout"><div class="prose">
  <p>${esc(s.intro)}</p>
  <h2>مين محتاج يكشف؟</h2><ul>${s.who.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
  <h2>رحلة العلاج خطوة بخطوة</h2><ol class="journey">${s.journey.map((j) => `<li>${esc(j)}</li>`).join("")}</ol>
  <h2>التحضير والتعافي</h2><p>${esc(s.recovery)}</p>
  ${isClinic && docsFor.length ? `<h2>الأطباء</h2><div class="grid">${docsFor.map((d) => `<a class="card doc-card" href="${L(`doctors/${d.id}/`)}"><div class="avatar">${photo(d.photo, d.name, "person")}</div><div><b>${esc(d.name)}</b><br><span class="muted small">${esc(d.title)}</span></div></a>`).join("")}</div>` : ""}
  <h2>أسئلة شائعة عن ${esc(s.title)}</h2>${faqHtml(s.faq)}
  ${rel.length ? `<h2>مقالات مرتبطة</h2><div class="grid g2">${rel.map(articleCard).join("")}</div>` : ""}
  ${disclaimer}${emergency}
</div>${bookAside(s.slug)}</div></section>`,
    });
  }

  // BRANCHES
  pages["branches/"] = page({
    p: "branches/", title: `الفروع والمواعيد | ${c.brand.short}`, desc: `عناوين ومواعيد ${c.brand.name}: ${c.branches.map((b) => b.area).join(" و")}.`, pageName: "الفروع",
    schema: [crumbSchema([["branches/", "الفروع"]]), ...c.branches.map(clinicLd)],
    body: `<section class="ph"><div class="wrap">${crumbs([["", "الفروع"]])}<h1>الفروع والمواعيد</h1></div></section>
<section class="sec"><div class="wrap">
  <div id="call" class="card" style="margin-bottom:20px"><h2 style="font-size:20px">اتصل بالفرع الأقرب ليك</h2><div class="btn-row">${c.branches.map((b) => `<a class="btn btn-ghost" href="tel:${b.phone}" data-track="cta_call_click" data-branch="${b.id}" data-pos="call_picker">${icon("phone")}${esc(b.area)} · <span class="ltr">${esc(b.phoneDisplay || b.phone)}</span></a>`).join("")}</div></div>
  <div class="grid">${c.branches.map((b) => `<div><h2><a href="${L(`branches/${b.id}/`)}">${esc(b.name)}</a></h2>${branchCard(b)}</div>`).join("")}</div>
</div></section>`,
  });
  for (const b of c.branches) {
    const bdocs = docs.filter((d) => !d.branches || d.branches.includes(b.id));
    pages[`branches/${b.id}/`] = page({
      p: `branches/${b.id}/`, title: b.seoTitle || `${c.brand.short} – ${b.area} | العنوان والمواعيد`, desc: `${c.brand.name} في ${b.area}: ${b.address}. مواعيد العيادة والحجز الأونلاين 24 ساعة.`,
      pageName: b.name, branchName: b.area,
      schema: [clinicLd(b), crumbSchema([["branches/", "الفروع"], [`branches/${b.id}/`, b.area]])],
      body: `<section class="ph"><div class="wrap">${crumbs([["branches/", "الفروع"], ["", b.area]])}<h1>${esc(b.h1 || `${c.brand.name} – ${b.area}`)}</h1><p style="margin:0"><span class="live" data-live="${b.id}"></span></p></div></section>
<section class="sec"><div class="wrap">
  ${branchCard(b)}
  <div class="grid g3" style="margin-top:20px">
    <div class="card"><div class="ico">${icon("wallet")}</div><h3>سعر الكشف</h3><p class="muted" style="margin:0">الكشف: ${esc(c.fees.consult)} جنيه<br>الاستشارة خلال ${esc(c.fees.followupDays)} يوم: ${esc(c.fees.followupLabel || "مجانًا")}</p></div>
    <div class="card"><div class="ico">${icon("car")}</div><h3>إرشادات الوصول</h3><ul class="muted small" style="margin:0;padding-inline-start:18px">${(b.access || []).map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
    <div class="card"><div class="ico">${icon("shield")}</div><h3>التأمين</h3><p class="muted small" style="margin:0">${b.insurance?.length ? esc(b.insurance.join("، ")) : "اسأل الاستقبال عن شركات التأمين المتعاقد معاها."}</p></div>
  </div>
  ${bdocs.length > 1 ? `<h2 style="margin-top:28px">الأطباء في الفرع ده</h2><div class="grid g3">${bdocs.map((d) => `<a class="card doc-card" href="${L(`doctors/${d.id}/`)}"><div class="avatar">${photo(d.photo, d.name, "person")}</div><div><b>${esc(d.name)}</b><br><span class="muted small">${esc(d.title)}</span></div></a>`).join("")}</div>` : ""}
  <h2 style="margin-top:28px">صور الفرع</h2>
  <div class="photos">${(b.photos?.length ? b.photos : [null, null, null]).map((src, i) => `<figure>${photo(src, ["واجهة " + b.area, "الاستقبال", "غرفة الكشف"][i] || "صورة الفرع", "place")}</figure>`).join("")}</div>
  <h2 style="margin-top:28px">آراء مرضى الفرع</h2>${sampleNote}
  <div class="grid g3" style="margin-top:12px">${(c.reviews.filter((r) => r.branch === b.area).slice(0, 3).length ? c.reviews.filter((r) => r.branch === b.area) : c.reviews).slice(0, 3).map(reviewCard).join("")}</div>
  ${b.reviewUrl ? `<p style="margin-top:12px"><a class="btn btn-ghost btn-sm" href="${esc(b.reviewUrl)}" target="_blank" rel="noopener">${icon("star")}اكتب تقييمك على Google</a></p>` : ""}
</div></section>`,
    });
  }

  // BOOK
  pages["book/"] = page({
    p: "book/", title: `احجز ميعادك أونلاين | ${c.brand.short}`, desc: `احجز مع ${c.brand.name} أونلاين 24 ساعة، واختار الفرع والميعاد المناسب، والتأكيد بيوصلك على واتساب.`, pageName: "الحجز",
    scripts: ["book.js"],
    body: `<section class="sec" style="padding-top:20px"><div class="wrap wizard" id="wizard">
  <h1 style="font-size:26px">احجز ميعادك</h1>
  <p class="muted">خطوات بسيطة · من غير تسجيل حساب · التأكيد على واتساب</p>
  <ol class="stepper" aria-hidden="true"><li></li><li></li><li></li><li></li></ol>
  <div id="wiz-body" aria-live="polite"><div class="skeleton"></div></div>
  <div style="margin-top:20px">${emergency}</div>
</div></section>`,
  });

  // REVIEWS
  pages["reviews/"] = page({
    p: "reviews/", title: `آراء المرضى | ${c.brand.short}`, desc: `تقييمات مرضى ${c.brand.name} على Google.`, pageName: "آراء المرضى",
    schema: [crumbSchema([["reviews/", "آراء المرضى"]])],
    body: `<section class="ph"><div class="wrap">${crumbs([["", "آراء المرضى"]])}<h1>آراء المرضى</h1><p style="margin:0">${ratingLine}</p></div></section>
<section class="sec"><div class="wrap">
  <div class="btn-row" style="margin-bottom:14px">${c.rating?.url ? `<a class="btn btn-ghost btn-sm" href="${esc(c.rating.url)}" target="_blank" rel="noopener">شوف كل التقييمات على Google</a>` : ""}${c.branches[0].reviewUrl ? `<a class="btn btn-primary btn-sm" href="${esc(c.branches[0].reviewUrl)}" target="_blank" rel="noopener">${icon("star")}اكتب تقييمك</a>` : ""}</div>
  ${sampleNote}
  <div class="grid g3" style="margin-top:12px">${c.reviews.map(reviewCard).join("")}</div>
  <p class="muted small" style="margin-top:16px">سياسة التقييمات: بنعرض تقييمات حقيقية من Google بموافقة أصحابها، من غير أي حوافز ومن غير أي تفاصيل تشخيصية.</p>
</div></section>`,
  });

  // ARTICLES
  pages["articles/"] = page({
    p: "articles/", title: `مقالات توعوية | ${c.brand.short}`, desc: `مقالات توعوية بلغة بسيطة من ${c.brand.name}.`, pageName: "المقالات",
    schema: [crumbSchema([["articles/", "المقالات"]])],
    body: `<section class="ph"><div class="wrap">${crumbs([["", "المقالات"]])}<h1>مقالات توعوية</h1></div></section><section class="sec"><div class="wrap grid g3">${c.articles.map(articleCard).join("")}</div></section>`,
  });
  for (const a of c.articles) {
    const author = docs.find((d) => d.id === a.author) || lead;
    pages[`articles/${a.slug}/`] = page({
      p: `articles/${a.slug}/`, title: `${a.title} | ${c.brand.short}`, desc: a.excerpt, pageName: a.title,
      schema: [
        { "@context": "https://schema.org", "@type": ["Article", "MedicalWebPage"], headline: a.title, description: a.excerpt, inLanguage: "ar-EG", url: abs(`articles/${a.slug}/`), author: { "@id": docId(author) }, reviewedBy: { "@id": docId(author) }, lastReviewed: c.lastReviewed, datePublished: a.date || c.lastReviewed, dateModified: c.lastReviewed, publisher: { "@id": orgId } },
        crumbSchema([["articles/", "المقالات"], [`articles/${a.slug}/`, a.title]]),
      ],
      body: `<section class="ph"><div class="wrap">${crumbs([["articles/", "المقالات"], ["", a.title]])}<h1>${esc(a.title)}</h1>
<p class="muted small" style="margin:0">كتابة ومراجعة طبية: <a href="${L(isClinic ? `doctors/${author.id}/` : "about/")}">${esc(author.name)}</a> · آخر مراجعة: ${esc(c.lastReviewedAr || "أكتوبر 2026")} · ${a.minutes} دقايق قراءة</p></div></section>
<section class="sec"><div class="wrap layout"><article class="prose">
  <nav class="card" aria-label="فهرس المقال" style="margin-bottom:20px"><b>في المقال ده</b><ol style="margin:6px 0 0">${a.sections.map((s, i) => `<li><a href="#s${i}">${esc(s.h)}</a></li>`).join("")}</ol></nav>
  ${a.sections.map((s, i) => `<h2 id="s${i}">${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join("")}${s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : ""}`).join("")}
  ${a.urgent?.length ? `<div class="note danger"><b>إمتى تروح للدكتور أو الطوارئ فورًا؟</b><ul style="margin:6px 0 0">${a.urgent.map((u) => `<li>${esc(u)}</li>`).join("")}</ul></div>` : ""}
  <div class="note info">لو الأعراض دي مستمرة، الكشف بيساعد تحدد السبب وتختار العلاج المناسب لحالتك. <a href="${L("book/")}" data-track="cta_book_click" data-pos="article">احجز ميعاد</a></div>
  ${a.sources?.length ? `<h2>مصادر</h2><ul class="small">${a.sources.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
  ${disclaimer}
</article>${bookAside(a.services?.[0])}</div></section>`,
    });
  }

  // FAQ
  pages["faq/"] = page({
    p: "faq/", title: `الأسئلة الشائعة | ${c.brand.short}`, desc: `إجابات عن سعر الكشف والحجز والمواعيد في ${c.brand.name}.`, pageName: "الأسئلة الشائعة",
    schema: [faqSchema(c.faq), crumbSchema([["faq/", "الأسئلة الشائعة"]])],
    body: `<section class="ph"><div class="wrap">${crumbs([["", "الأسئلة الشائعة"]])}<h1>الأسئلة الشائعة</h1></div></section><section class="sec"><div class="wrap prose">${faqHtml(c.faq)}${emergency}</div></section>`,
  });

  // PRIVACY
  pages["privacy/"] = page({
    p: "privacy/", title: `إشعار الخصوصية | ${c.brand.short}`, desc: `إزاي ${c.brand.name} بيستخدم ويحمي بياناتك.`, pageName: "الخصوصية",
    body: `<section class="ph"><div class="wrap">${crumbs([["", "إشعار الخصوصية"]])}<h1>إشعار الخصوصية</h1><p class="muted small" style="margin:0">نسخة مبدئية للديمو — النسخة النهائية بتتراجع مع محامي حسب قانون حماية البيانات الشخصية 151 لسنة 2020 ولائحته التنفيذية.</p></div></section>
<section class="sec"><div class="wrap prose">
  <h2>البيانات اللي بنجمعها</h2><ul><li>الاسم ورقم الموبايل: علشان نأكد الميعاد ونفكّرك بيه.</li><li>سبب الزيارة (اختياري): بيتحفظ في نظام الحجز بس، علشان الدكتور يستعد لحالتك.</li><li>مصدر الزيارة (زي الإعلان أو جوجل): بيانات تقنية مش مرتبطة بحالتك الصحية.</li></ul>
  <h2>إحنا مش بنعمل إيه</h2><ul><li>مش بنبعت سبب الزيارة أو أي معلومة صحية لأي منصة إعلانات أو تحليلات.</li><li>مش بنبيع أو نشارك بياناتك مع أي طرف تالت لأغراض تسويقية.</li><li>مش بنبعتلك رسائل تسويقية إلا لو وافقت على ده بشكل منفصل.</li></ul>
  <h2>مدة الاحتفاظ</h2><p>بيانات الحجز بتتحفظ للمدة اللازمة لتنظيم المواعيد والمتابعة، وبعدها بتتحذف أوتوماتيك حسب السياسة المعتمدة للعيادة.</p>
  <h2>حقوقك</h2><p>من حقك تطلب الاطلاع على بياناتك أو تصحيحها أو حذفها أو تسحب موافقتك في أي وقت، بالتواصل معانا على <a href="tel:${c.phone}"><span class="ltr">${esc(c.phoneDisplay || c.phone)}</span></a> أو على واتساب.</p>
  <h2>مسؤول حماية البيانات</h2><p>[اسم مسؤول حماية البيانات وطريقة التواصل معاه — يتحدد قبل الإطلاق].</p>
</div></section>`,
  });

  // DASHBOARD (demo admin)
  pages["dashboard/"] = page({
    p: "dashboard/", title: `لوحة العيادة (ديمو) | ${c.brand.short}`, desc: "لوحة السكرتارية: مواعيد النهارده والحجوزات حسب المصدر.", pageName: "لوحة العيادة",
    scripts: ["dash.js"],
    body: `<section class="ph"><div class="wrap"><span class="chip">بيانات تجريبية</span><h1 style="margin-top:8px">لوحة العيادة</h1><p class="muted" style="margin:0">ده شكل اللوحة اللي السكرتارية بتستخدمها من الموبايل. الحجوزات اللي بتعملها من الموقع على الجهاز ده بتظهر هنا فورًا.</p></div></section>
<section class="sec"><div class="wrap">
  <div class="tabs" role="group" aria-label="الفرع" id="dash-branches"></div>
  <h2>مواعيد النهارده</h2>
  <div class="scroll-x"><table class="dash-table" id="dash-today"><thead><tr><th>الساعة</th><th>المريض</th><th>نوع الزيارة</th>${isClinic ? "<th>الدكتور</th>" : ""}<th>الحالة</th><th>إجراء</th></tr></thead><tbody></tbody></table></div>
  <h2 style="margin-top:36px">حجوزات جديدة من الموقع</h2>
  <div class="scroll-x"><table class="dash-table" id="dash-new"><thead><tr><th>اليوم والساعة</th><th>المريض</th><th>الفرع</th><th>نوع الزيارة</th><th>المصدر</th><th></th></tr></thead><tbody></tbody></table></div>
  <h2 style="margin-top:36px">الحجوزات حسب المصدر — آخر 7 أيام</h2>
  <div class="kpis" id="dash-kpis"></div>
  <div class="card" style="margin-top:16px"><div class="bars" id="dash-bars"></div><p class="muted small" style="margin:12px 0 0">الإسناد بيتعمل من نظام الحجز نفسه (UTM / gclid / fbclid محفوظين مع كل حجز)، مش من الـ Pixel بس.</p></div>
  <div class="note info" style="margin-top:16px" id="dash-weekly"></div>
</div></section>`,
  });

  // CAMPAIGN LANDING PAGE
  const lpSvc = svcBySlug[c.landing?.service] || c.services[0];
  pages[`lp/${lpSvc.slug}/`] = page({
    p: `lp/${lpSvc.slug}/`, title: `${lpSvc.title} | ${c.brand.short}`, desc: lpSvc.intro.slice(0, 150), pageName: `حملة ${lpSvc.title}`, noindex: true,
    body: `<section class="hero"><div class="wrap hero-grid"><div>
  <span class="eyebrow">${esc(c.brand.short)}</span>
  <h1>${esc(c.landing?.h1 || lpSvc.h1)}</h1>
  <p class="sub">${esc(c.landing?.sub || lpSvc.intro)}</p>
  <ul>${lpSvc.who.slice(0, 3).map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
  <div class="btn-row"><a class="btn btn-primary" href="${L(`book/?service=${lpSvc.slug}`)}" data-track="cta_book_click" data-pos="lp_hero">${icon("cal")}احجز كشف</a><a class="btn btn-wa" href="${waLink(waText(lpSvc.title))}" target="_blank" rel="noopener" data-track="cta_whatsapp_click" data-pos="lp_hero">${waIcon}واتساب</a></div>
</div><div class="hero-photo">${photo(lead.photo, lead.name, "person", "", true)}</div></div></section>
<section class="sec sec-soft"><div class="wrap"><h2>${ratingLine}</h2>${sampleNote}<div class="grid g2" style="margin-top:12px">${c.reviews.slice(0, 2).map(reviewCard).join("")}</div></div></section>
<section class="sec"><div class="wrap prose">${disclaimer}${emergency}</div></section>`,
  });

  for (const [p, html] of Object.entries(pages)) write(path.join(out, p, "index.html"), html);
  write(path.join(out, "404.html"), page({ p: "404", title: "الصفحة مش موجودة", desc: "", body: `<section class="sec"><div class="wrap" style="text-align:center"><h1>الصفحة دي مش موجودة</h1><p><a class="btn btn-primary" href="${L()}">ارجع للرئيسية</a></p></div></section>` }));
  return { slug, name: c.brand.name, type: c.type, h1: c.brand.h1, base, pages: Object.keys(pages).length };
}

function galleryPage(list) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ديمو مواقع العيادات</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap"><link rel="stylesheet" href="/assets/site.css?v=${ASSET_VER}"></head>
<body style="padding:0"><main class="sec"><div class="wrap"><h1>ديمو مواقع العيادات — Digital Solution Egypt</h1><p class="muted">صفحة داخلية (noindex). ابعت للدكتور لينك الديمو بتاعه بس.</p>
<div class="grid g3">${list.map((d) => `<a class="card" href="${d.base}"><span class="chip">${d.type === "clinic" ? "مركز / عيادة" : "براند دكتور"}</span><h3 style="margin-top:8px">${esc(d.name)}</h3><p class="muted small">${esc(d.h1)}</p><span class="more">${d.base} ←</span></a>`).join("")}</div></div></main></body></html>`;
}

// ---------------------------------------------------------------- run
const built = [];
for (const slug of slugs) built.push(buildDemo(slug));
if (!only.length) write(path.join(DIST, "index.html"), galleryPage(built));
console.log(`built ${built.length} demo(s): ${built.map((b) => b.slug).join(", ")}`);
