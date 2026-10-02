// Vercel Serverless Function: /api/image?prompt=...&seed=...
// Adds the secret Pollinations key on the server so it never reaches the browser.
// Set in Vercel -> Project Settings -> Environment Variables:  POLLINATIONS_KEY = sk_xxxxxxxx
export default async function handler(req: any, res: any) {
  const key = process.env.POLLINATIONS_KEY;
  if (!key) return res.status(500).json({ error: "POLLINATIONS_KEY is not set" });

  const prompt = String(req.query?.prompt ?? "").trim().slice(0, 600);
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  const seed = Number(req.query?.seed) || 0;

  // Model and size are fixed on the server so visitors cannot run expensive requests.
  const url =
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=flux&width=1024&height=1024&seed=${seed}`;

  try {
    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buf);
  } catch {
    return res.status(502).json({ error: "Image service unreachable" });
  }
}
