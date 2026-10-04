// Vercel Serverless Function: GET /api/image?prompt=...&seed=...
// Adds the secret Pollinations key on the server so it never reaches the browser.
// Vercel -> Settings -> Environment Variables:  POLLINATIONS_KEY = sk_xxxxxxxx
//
// Hardening: GET only, same-site only, per-IP rate limit, fixed model/size,
// prompt length cap, upstream details never leaked, response must really be an image.

export const config = { maxDuration: 60 };

const WINDOW_MS = 60_000;
const LIMIT_PER_MIN = 6;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT_PER_MIN) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const k of Array.from(hits.keys()).slice(0, 1000)) hits.delete(k);
  return false;
}

export default async function handler(req: any, res: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  // Browsers tell us where an <img> request comes from; refuse other websites hot-linking it.
  const site = String(req.headers["sec-fetch-site"] ?? "");
  if (site && !["same-origin", "same-site", "none"].includes(site)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const key = process.env.POLLINATIONS_KEY;
  if (!key) {
    console.error("POLLINATIONS_KEY is not set");
    return res.status(503).json({ error: "IMAGE_UNAVAILABLE" });
  }

  const ip = String(req.headers["x-forwarded-for"] ?? req.headers["x-real-ip"] ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "RATE_LIMITED" });

  const prompt = String(req.query?.prompt ?? "").trim().slice(0, 600);
  if (prompt.length < 3) return res.status(400).json({ error: "MISSING_PROMPT" });
  const seed = Math.min(Math.max(Math.floor(Number(req.query?.seed)) || 0, 0), 2_147_483_647);

  // Model and size are fixed on the server so visitors cannot run expensive requests.
  const url =
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=flux&width=1024&height=1024&seed=${seed}`;

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(55_000),
    });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.startsWith("image/")) {
      console.error("Pollinations upstream", upstream.status, type);
      return res.status(upstream.status === 402 || upstream.status === 429 ? 503 : 502).json({ error: "IMAGE_UNAVAILABLE" });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buf);
  } catch (e) {
    console.error("Image service unreachable:", e);
    return res.status(502).json({ error: "IMAGE_UNAVAILABLE" });
  }
}
