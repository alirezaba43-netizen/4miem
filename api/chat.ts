// Vercel Serverless Function: POST /api/chat
// Forwards chat requests to your home LM Studio through a tunnel (Pinggy / Cloudflare).
// Vercel -> Settings -> Environment Variables:
//   LLM_BASE_URL     = https://xxxx.a.free.pinggy.link   (no trailing slash, no /v1)
//   LLM_MODEL        = (optional) exact LM Studio model id; auto-detected if empty
//   --- optional cloud fallback when your PC / tunnel is offline ---
//   POLLINATIONS_KEY = sk_...   (the key must have Text permission)
//   POLLI_TEXT_MODEL = e.g. qwen/qwen3.8-2.4t-a95b  (works with free Quest Pollen) or qwen/qwen3.8-flash (needs Paid Pollen)

export const config = { maxDuration: 60 };

const hits = new Map<string, { n: number; t: number }>();
const LIMIT = 8; // requests per minute per IP (best-effort, per server instance)

const trimSlash = (s: string) => s.replace(/\/+$/, "");

async function callChat(base: string, headers: Record<string, string>, body: object, ms: number) {
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ms),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Upstream did not return JSON"); }
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return json;
}

async function pickModel(base: string): Promise<string> {
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  try {
    const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(8000) });
    const ids: string[] = ((await res.json()).data ?? []).map((m: any) => m.id);
    return ids.find((i) => /qwen/i.test(i) && !/embed/i.test(i)) ?? ids[0] ?? "qwen3-14b";
  } catch {
    return "qwen3-14b";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- simple rate limit ---
  const ip = String(req.headers["x-forwarded-for"] ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) hits.set(ip, { n: 1, t: now });
  else if (++h.n > LIMIT) return res.status(429).json({ error: "Too many requests" });

  // --- validate input ---
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const msgs = body?.messages;
  const valid =
    Array.isArray(msgs) && msgs.length > 0 && msgs.length <= 4 &&
    msgs.every((m: any) => ["system", "user"].includes(m?.role) && typeof m?.content === "string" && m.content.length <= 2500);
  if (!valid) return res.status(400).json({ error: "Invalid messages" });

  const params = { messages: msgs, temperature: 0.7, max_tokens: 700, stream: false };

  // --- 1) your home LM Studio through the tunnel ---
  const tunnel = process.env.LLM_BASE_URL ? trimSlash(process.env.LLM_BASE_URL) : "";
  if (tunnel) {
    try {
      const model = await pickModel(tunnel);
      const data = await callChat(tunnel, {}, { ...params, model }, 35_000);
      res.setHeader("x-llm-source", "local");
      return res.status(200).json(data);
    } catch (e) {
      console.error("Tunnel failed:", e);
    }
  }

  // --- 2) optional cloud fallback ---
  let creditOut = false;
  const key = process.env.POLLINATIONS_KEY;
  const cloudModel = process.env.POLLI_TEXT_MODEL;
  if (key && cloudModel) {
    try {
      const data = await callChat(
        "https://gen.pollinations.ai",
        { Authorization: `Bearer ${key}` },
        // reasoning models can spend tokens on "thinking": keep it short and leave room for the answer
        { ...params, max_tokens: 1200, reasoning_effort: "low", model: cloudModel },
        25_000
      );
      res.setHeader("x-llm-source", "cloud");
      return res.status(200).json(data);
    } catch (e) {
      console.error("Cloud fallback failed:", e);
      creditOut = e instanceof Error && /Upstream 402/.test(e.message);
    }
  }

  return res.status(503).json({ error: creditOut ? "CREDIT_EXHAUSTED" : "AI_OFFLINE" });
}
