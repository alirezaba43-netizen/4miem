// Vercel Serverless Function: POST /api/lead
// The contact form posts here instead of calling Google Apps Script from the browser.
// That keeps the Apps Script URL private and lets us validate + rate limit first.
//
// Optional env var (Vercel -> Settings -> Environment Variables):
//   GOOGLE_SHEET_WEB_APP_URL = https://script.google.com/macros/s/.../exec
// If it is not set, the fallback URL below is used (server side only, never sent to visitors).

export const config = { maxDuration: 30 };

const FALLBACK_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyP0C6DqiR74c4wyUxgvGrXItgR6YX276OF6OaYfxAYN3M3c5paSuVXpZ5F7U5Hy_UNOw/exec";

const SERVICES = new Set(["Film & commercial", "Branding", "Web & 3D Experience"]);
const WINDOW_MS = 10 * 60_000;
const LIMIT_PER_WINDOW = 4;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const k of Array.from(hits.keys()).slice(0, 1000)) hits.delete(k);
  return false;
}

const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const PHONE_RE = /^(09\d{9}|\+?\d{7,15})$/;

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const origin = String(req.headers.origin ?? "");
  if (origin) {
    const host = (() => { try { return new URL(origin).host; } catch { return ""; } })();
    const mine = String(req.headers.host ?? "");
    const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    if (host !== mine && !local) return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  }

  const ip = String(req.headers["x-forwarded-for"] ?? req.headers["x-real-ip"] ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ ok: false, error: "RATE_LIMITED" });

  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "INVALID" });

  // Honeypot: bots fill the hidden field; pretend everything went fine.
  if (clean(body.website, 50)) return res.status(200).json({ ok: true });

  const lead = {
    name: clean(body.name, 80),
    email: clean(body.email, 160),
    phone: clean(body.phone, 20).replace(/[\s\-()]/g, ""),
    service: clean(body.service, 40),
    brief: clean(body.brief, 2000),
  };

  if (!lead.name || !lead.brief || !EMAIL_RE.test(lead.email) || !PHONE_RE.test(lead.phone) || !SERVICES.has(lead.service)) {
    return res.status(400).json({ ok: false, error: "INVALID" });
  }

  const target = process.env.GOOGLE_SHEET_WEB_APP_URL || FALLBACK_SHEET_URL;
  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead), // same keys and order as before: name, email, phone, service, brief
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) {
      console.error("Apps Script responded", upstream.status);
      return res.status(502).json({ ok: false, error: "UPSTREAM" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Lead forward failed:", e);
    return res.status(502).json({ ok: false, error: "UPSTREAM" });
  }
}
