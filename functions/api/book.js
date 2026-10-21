// Cloudflare Pages Function: POST /api/book
// Sends the WhatsApp utility-template confirmation (and an optional clinic notification) via WhatsApp Cloud API.
// Everything is optional: with no env vars set it answers {whatsapp:"not_configured"} and the page falls back
// to a wa.me preview link.
//
// Env vars (Pages → Settings → Variables and Secrets):
//   WA_TOKEN            permanent access token (secret)
//   WA_PHONE_NUMBER_ID  sender phone number id
//   WA_TEMPLATE         approved UTILITY template name (default: appointment_confirmation)
//   WA_LANG             template language code (default: ar)
//   WA_NOTIFY           optional, comma-separated numbers (2010xxxxxxxx) that get a "new booking" text
// Optional KV binding BOOKINGS stores each booking for 30 days.

const PHONE = /^01[0125]\d{8}$/;
const clip = (v, n = 120) => String(v ?? "").slice(0, n);

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (b.website) return json({ ok: true, whatsapp: "skipped" }); // honeypot
  if (!PHONE.test(b.phone || "") || !b.name) return json({ ok: false, error: "invalid" }, 422);

  const booking = {
    id: clip(b.id, 20), demo: clip(b.demo, 60), name: clip(b.name, 80), phone: b.phone, doctor: clip(b.doctor), clinic: clip(b.clinic),
    branch: clip(b.branch), address: clip(b.address, 200), mapsUrl: clip(b.mapsUrl, 300), dateText: clip(b.dateText, 60), timeText: clip(b.timeText, 60),
    visit: clip(b.visit, 60), attribution: b.attribution && typeof b.attribution === "object" ? b.attribution : {}, ts: Date.now(),
  };
  if (env.BOOKINGS) await env.BOOKINGS.put(`bk:${booking.demo}:${booking.id}`, JSON.stringify(booking), { expirationTtl: 60 * 60 * 24 * 30 });

  if (!env.WA_TOKEN || !env.WA_PHONE_NUMBER_ID) return json({ ok: true, whatsapp: "not_configured" });

  const to = "2" + booking.phone; // 01xxxxxxxxx → 201xxxxxxxxx
  const params = [booking.name, booking.doctor, booking.dateText, booking.timeText, booking.branch, booking.mapsUrl || booking.address];
  const sent = await wa(env, {
    messaging_product: "whatsapp", to, type: "template",
    template: { name: env.WA_TEMPLATE || "appointment_confirmation", language: { code: env.WA_LANG || "ar" }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: text || "-" })) }] },
  });

  if (env.WA_NOTIFY) {
    const text = `حجز جديد من الموقع (${booking.clinic})\n${booking.name} – ${booking.phone}\n${booking.dateText} ${booking.timeText}\nفرع ${booking.branch} · ${booking.visit}\nالمصدر: ${(booking.attribution.last || booking.attribution.first || {}).utm_source || "(direct)"}`;
    // Free-form text only lands inside an open 24h service window; production uses a template here too.
    await Promise.all(env.WA_NOTIFY.split(",").map((n) => wa(env, { messaging_product: "whatsapp", to: n.trim(), type: "text", text: { body: text } })));
  }
  return json({ ok: true, whatsapp: sent ? "sent" : "failed" });
}

async function wa(env, body) {
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST", headers: { authorization: `Bearer ${env.WA_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) console.log("whatsapp error", r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.log("whatsapp fetch failed", e.message);
    return false;
  }
}

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
