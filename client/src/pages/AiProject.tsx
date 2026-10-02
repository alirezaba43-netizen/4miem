import { useRef, useState, type FormEvent } from "react";
import { Cpu, Image, Play, Sparkles, Loader2 } from "lucide-react";

const tools = [
  { id: "image", name: "Image Foundry", type: "STILL / STYLE FRAME", model: "QWEN3 14B (LOCAL)", image: "/images/sample-1.jpg" },
  { id: "motion", name: "Motion Lab", type: "VIDEO / LOOP", model: "QWEN3 14B (LOCAL)", image: "/images/sample-2.jpg" },
  { id: "portrait", name: "Portrait Signal", type: "PORTRAIT / PERFORMANCE", model: "QWEN3 14B (LOCAL)", image: "/images/sample-3.jpg" },
];

// درخواست‌ها به آدرس نسبی می‌روند و Vite (پروکسی) آن‌ها را به سرور لوکال می‌رساند.
const LLM_BASE = "/v1";        // LM Studio  -> LM_STUDIO_URL
const SD_BASE = "/sdapi/v1";   // Stable Diffusion WebUI / Forge -> SD_URL
const FALLBACK_MODEL = "qwen3-14b";
// منبع ساخت تصویر: "pollinations" (رایگان، آنلاین، بدون کلید) یا "local-sd" (Stable Diffusion لوکال)
const IMAGE_PROVIDER: "pollinations" | "local-sd" = "pollinations";
const LLM_TIMEOUT_MS = 180_000;
const SD_TIMEOUT_MS = 300_000;

const stripThinking = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();

const parseReply = (text: string) => {
  const m = text.match(/IMAGE_PROMPT:\s*([\s\S]*)$/i);
  const concept = text.replace(/IMAGE_PROMPT:[\s\S]*$/i, "").replace(/^\s*CONCEPT:\s*/i, "").trim();
  return { concept, sdPrompt: m?.[1]?.trim().replace(/\n+/g, " ") };
};

const white = "#ffffff";

export default function AiProject() {
  const [toolId, setToolId] = useState(tools[0].id);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [started, setStarted] = useState(false); // بعد از اولین پرامپت، دمو حذف می‌شود
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const modelRef = useRef<string | null>(null);

  const tool = tools.find((item) => item.id === toolId) ?? tools[0];

  const resolveModel = async (signal: AbortSignal): Promise<string> => {
    if (modelRef.current) return modelRef.current;
    if (!import.meta.env.DEV) return FALLBACK_MODEL; // در نسخه آنلاین، مدل را سرور انتخاب می‌کند
    try {
      const res = await fetch(`${LLM_BASE}/models`, { signal });
      if (res.ok) {
        const json = await res.json();
        const ids: string[] = (json.data ?? []).map((m: { id: string }) => m.id);
        const chosen =
          ids.find((id) => id.toLowerCase().includes("qwen") && !id.toLowerCase().includes("embed")) ?? ids[0];
        if (chosen) {
          modelRef.current = chosen;
          return chosen;
        }
      }
    } catch {
      /* fallback */
    }
    return FALLBACK_MODEL;
  };

  // Pollinations از طریق سرور خودمان (/api/image) صدا زده می‌شود؛ کلید فقط سمت سرور است.
  const generateWithPollinations = async (imgPrompt: string): Promise<string> => {
    const seed = Math.floor(Math.random() * 1_000_000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(`/api/image?prompt=${encodeURIComponent(imgPrompt.slice(0, 600))}&seed=${seed}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`IMG_${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } finally {
      clearTimeout(timer);
    }
  };

  const generateImage = async (sdPrompt: string): Promise<string> => {
    if (IMAGE_PROVIDER === "pollinations") return generateWithPollinations(sdPrompt);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SD_TIMEOUT_MS);
    try {
      const res = await fetch(`${SD_BASE}/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: sdPrompt,
          negative_prompt: "lowres, blurry, bad anatomy, watermark, text, logo, deformed",
          steps: 25,
          cfg_scale: 7,
          width: 768,
          height: 768,
          sampler_name: "DPM++ 2M",
        }),
      });
      if (!res.ok) throw new Error(`SD HTTP ${res.status}`);
      const json = await res.json();
      const b64: string | undefined = json.images?.[0];
      if (!b64) throw new Error("No image returned");
      return `data:image/png;base64,${b64}`;
    } finally {
      clearTimeout(timer);
    }
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setStarted(true);
    setAiResponse(null);
    setImageUrl(null);
    setImageNote(null);
    setIsError(false);
    setStage("QWEN IS THINKING...");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    const wantsImage = tool.id === "image";

    try {
      const model = await resolveModel(controller.signal);

      const system = wantsImage
        ? `You are an AI assistant for a creative studio (tool: ${tool.name}). Reply in EXACTLY this format and nothing else:
CONCEPT: <a short creative description, max 100 words, in the same language as the user>
IMAGE_PROMPT: <one single line, in English, for Stable Diffusion: subject, environment, style, lighting, camera, quality tags>`
        : `You are an AI assistant for a creative studio working on tool: ${tool.name} (${tool.type}). Provide a professional, creative concept description based on the user's prompt. Reply in the same language as the user.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `${prompt} /no_think` },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}${detail ? ` - ${detail.slice(0, 200)}` : ""}`);
      }

      const data = await response.json();
      const reply = stripThinking(data.choices?.[0]?.message?.content ?? "");

      if (!wantsImage) {
        setAiResponse(reply || "پاسخی دریافت نشد.");
        return;
      }

      const { concept, sdPrompt } = parseReply(reply);
      setAiResponse(concept || reply || "پاسخی دریافت نشد.");

      // ساخت تصویر واقعی با Stable Diffusion
      setStage("RENDERING IMAGE...");
      try {
        setImageUrl(await generateImage(sdPrompt || prompt));
      } catch (imgErr) {
        console.error("Image generation error:", imgErr);
        const code = imgErr instanceof Error ? imgErr.message : "";
        setImageNote(
          code === "IMG_402"
            ? "اعتبار ساخت تصویر موقتاً تمام شده است. متن Qwen نمایش داده شد."
            : code === "IMG_429"
            ? "تعداد درخواست‌ها زیاد است؛ چند ثانیه صبر کنید و دوباره امتحان کنید."
            : code === "IMG_401"
            ? "کلید سرویس تصویر نامعتبر است (تنظیمات سرور)."
            : "ساخت تصویر انجام نشد. فقط متن Qwen نمایش داده شد."
        );
      }
    } catch (error) {
      console.error("Local AI Error:", error);
      setIsError(true);
      if (error instanceof DOMException && error.name === "AbortError") {
        setAiResponse("خطا: زمان انتظار تمام شد. مدل در LM Studio بارگذاری شده است؟");
      } else {
        const msg = error instanceof Error ? error.message : "";
        setAiResponse(
          /CREDIT/.test(msg)
            ? "اعتبار سرویس هوش مصنوعی موقتاً تمام شده است. کمی بعد دوباره تلاش کنید."
            : /HTTP 429/.test(msg)
            ? "تعداد درخواست‌ها زیاد است؛ یک دقیقه صبر کنید و دوباره تلاش کنید."
            : /HTTP (503|502|504)/.test(msg)
            ? "سرویس هوش مصنوعی فعلاً در دسترس نیست. کمی بعد دوباره تلاش کنید."
            : "خطا: ارتباط با LM Studio برقرار نشد. مطمئن شوید سرور در حال اجراست و مدل لود شده است."
        );
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setStage("");
    }
  };

  const resetAll = () => {
    setStarted(false);
    setAiResponse(null);
    setImageUrl(null);
    setImageNote(null);
    setIsError(false);
  };

  const statusColor = loading ? "#eab308" : isError ? "#ef4444" : aiResponse ? "#22c55e" : "#64748b";

  return (
    <main className="site-shell three-act standalone-page ai-page">
      <div className="page-view-inner">
        <header className="page-heading ai-heading">
          <span className="eyebrow">05 / 4MIEM AI STUDIO</span>
          <h1>Make the<br /><em>impossible.</em></h1>
          <p>Connected locally to Qwen3 14B via LM Studio.</p>
        </header>

        <div className="ai-layout">
          <section className="ai-tools" aria-label="AI media tools">
            {tools.map((item) => (
              <button
                className={`ai-tool ${toolId === item.id ? "selected" : ""}`}
                type="button"
                key={item.id}
                onClick={() => {
                  setToolId(item.id);
                  resetAll();
                }}
                aria-pressed={toolId === item.id}
              >
                <span className="ai-tool-icon">
                  {item.id === "image" ? <Image size={17} /> : item.id === "motion" ? <Play size={17} /> : <Cpu size={17} />}
                </span>
                <span><b>{item.name}</b><small>{item.type}</small></span>
                <span className="ai-tool-model">{item.model}</span>
              </button>
            ))}

            <form className="ai-prompt" onSubmit={handleGenerate}>
              <label htmlFor="ai-prompt">
                <span>SCENE PROMPT (QWEN LOCAL)</span>
                <textarea
                  id="ai-prompt"
                  required
                  rows={4}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe a world, subject, light, or movement..."
                />
              </label>
              <button className="page-submit" type="submit" disabled={loading}>
                <span>{loading ? "PROCESSING..." : "GENERATE WITH QWEN"}</span>
                {loading ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
              </button>
            </form>
          </section>

          <section className="ai-preview" aria-live="polite">
            {!started ? (
              /* حالت دمو: فقط قبل از اولین پرامپت */
              <div className="ai-preview-image">
                <img src={tool.image} alt={`${tool.name} sample frame`} />
                <span className="ai-preview-shade" />
                <div className="ai-preview-status">
                  <span className="status-dot" style={{ background: "#64748b" }} />
                  READY / WAITING FOR PROMPT
                </div>
              </div>
            ) : (
              /* حالت نتیجه: پنل تیره و متن سفید */
              <div
                style={{
                  minHeight: 420,
                  background: "#05090c",
                  border: "1px solid rgba(255,255,255,0.14)",
                  padding: 20,
                  color: white,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: "0.08em", color: white }}>
                  <span className="status-dot" style={{ background: statusColor }} />
                  {loading ? stage : isError ? "CONNECTION ERROR" : "LOCAL QWEN RESPONSE"}
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={loading}
                    style={{ marginLeft: "auto", color: white, border: "1px solid rgba(255,255,255,0.4)", padding: "4px 10px", fontSize: 11 }}
                  >
                    CLEAR
                  </button>
                </div>

                <div style={{ fontSize: 13, color: white }}>
                  <strong>Prompt:</strong> {prompt}
                </div>

                {loading && !aiResponse && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: white }}>
                    <Loader2 className="animate-spin" size={16} /> {stage}
                  </div>
                )}

                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={prompt}
                    style={{ width: "100%", maxWidth: 520, alignSelf: "center", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                )}

                {imageNote && <p style={{ color: "#fbbf24", fontSize: 13 }} dir="auto">{imageNote}</p>}

                {aiResponse && (
                  <p style={{ whiteSpace: "pre-wrap", color: white, lineHeight: 1.7, fontSize: 14 }} dir="auto">
                    {aiResponse}
                  </p>
                )}
              </div>
            )}
            <div className="ai-preview-meta">
              <span>{tool.name}</span>
              <span>{tool.model}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
