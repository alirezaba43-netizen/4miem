import { useRef, useState, type FormEvent } from "react";
import { Cpu, Image, Play, Sparkles, Loader2 } from "lucide-react";
import { useLang } from "../lib/i18n";

const tools = [
  { id: "image", icon: "image", model: "QWEN / GROQ CLOUD", image: "/images/sample-1.jpg" },
  { id: "motion", icon: "motion", model: "QWEN / GROQ CLOUD", image: "/images/sample-2.jpg" },
  { id: "portrait", icon: "portrait", model: "QWEN / GROQ CLOUD", image: "/images/sample-3.jpg" },
];

// Both endpoints are our own Vercel functions: the secret keys never reach the browser.
const LLM_URL = "/api/llm";
const IMAGE_URL = "/api/image";
const LLM_TIMEOUT_MS = 65_000;
const IMAGE_TIMEOUT_MS = 75_000;
const COOLDOWN_MS = 4_000;
const MAX_PROMPT = 500;

class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

const stripThinking = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();

const parseReply = (text: string) => {
  const m = text.match(/IMAGE_PROMPT:\s*([\s\S]*)$/i);
  const concept = text.replace(/IMAGE_PROMPT:[\s\S]*$/i, "").replace(/^\s*CONCEPT:\s*/i, "").trim();
  return { concept, imagePrompt: m?.[1]?.trim().replace(/\n+/g, " ") };
};

const white = "#ffffff";

export default function AiProject() {
  const { lang, dir, t } = useLang();
  const a = t.ai;
  const [toolId, setToolId] = useState(tools[0].id);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [started, setStarted] = useState(false); // after the first prompt the demo frame is replaced
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const lastRun = useRef(0);

  const tool = tools.find((item) => item.id === toolId) ?? tools[0];
  const info = a.tools_[tool.id];

  const generateImage = (imgPrompt: string): Promise<string> => {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `${IMAGE_URL}?prompt=${encodeURIComponent(imgPrompt.slice(0, 600))}&seed=${seed}`;
    return new Promise((resolve, reject) => {
      const probe = new window.Image();
      const timer = setTimeout(() => reject(new Error("timeout")), IMAGE_TIMEOUT_MS);
      probe.onload = () => { clearTimeout(timer); resolve(url); };
      probe.onerror = () => { clearTimeout(timer); reject(new Error("image failed")); };
      probe.src = url;
    });
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = prompt.trim().slice(0, MAX_PROMPT);
    if (!text || loading) return;
    if (Date.now() - lastRun.current < COOLDOWN_MS) return; // small client-side brake on repeated clicks
    lastRun.current = Date.now();

    setLoading(true);
    setStarted(true);
    setAiResponse(null);
    setImageUrl(null);
    setImageNote(null);
    setIsError(false);
    setStage(a.thinking);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    const wantsImage = tool.id === "image";

    try {
      const system = wantsImage
        ? `You are an AI assistant for a creative studio (tool: ${info.name}). Reply in EXACTLY this format and nothing else:
CONCEPT: <a short creative description, max 100 words, in the same language as the user>
IMAGE_PROMPT: <one single line, in English, for an image generator: subject, environment, style, lighting, camera, quality tags>`
        : `You are an AI assistant for a creative studio working on tool: ${info.name} (${info.type}). Provide a professional, creative concept description based on the user's prompt. Reply in the same language as the user.`;

      const response = await fetch(LLM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            { role: "system", content: system },
            { role: "user", content: `${text} /no_think` },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) throw new ApiError(response.status);

      const data = await response.json();
      const reply = stripThinking(data.choices?.[0]?.message?.content ?? "");

      if (!wantsImage) {
        setAiResponse(reply || a.empty);
        return;
      }

      const { concept, imagePrompt } = parseReply(reply);
      setAiResponse(concept || reply || a.empty);

      setStage(a.rendering);
      try {
        setImageUrl(await generateImage(imagePrompt || text));
      } catch (imgErr) {
        console.error("Image generation error:", imgErr);
        setImageNote(a.imgFail);
      }
    } catch (error) {
      console.error("AI request error:", error);
      setIsError(true);
      if (error instanceof DOMException && error.name === "AbortError") setAiResponse(a.errTimeout);
      else if (error instanceof ApiError && error.status === 429) setAiResponse(a.errBusy);
      else setAiResponse(a.errOffline);
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
    <main id="main" className="site-shell three-act standalone-page ai-page" dir={dir}>
      <div className="page-view-inner">
        <header className="page-heading ai-heading">
          <span className="eyebrow">{a.eyebrow}</span>
          <h1>{a.title}<br /><em>{a.titleEm}</em></h1>
          <p>{a.intro}</p>
        </header>

        <div className="ai-layout">
          <section className="ai-tools" aria-label={a.tools}>
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
                <span><b>{a.tools_[item.id].name}</b><small>{a.tools_[item.id].type}</small></span>
                <span className="ai-tool-model">{item.model}</span>
              </button>
            ))}

            <form className="ai-prompt" onSubmit={handleGenerate}>
              <label htmlFor="ai-prompt">
                <span>{a.sceneLabel}</span>
                <textarea
                  id="ai-prompt"
                  required
                  rows={4}
                  maxLength={MAX_PROMPT}
                  dir="auto"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={a.promptPh}
                />
              </label>
              <button className="page-submit" type="submit" disabled={loading}>
                <span>{loading ? a.working : a.generate}</span>
                {loading ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
              </button>
            </form>
          </section>

          <section className="ai-preview" aria-live="polite">
            {!started ? (
              <div className="ai-preview-image">
                <img src={tool.image} alt={info.name} />
                <span className="ai-preview-shade" />
                <div className="ai-preview-status">
                  <span className="status-dot" style={{ background: "#64748b" }} />
                  {a.ready}
                </div>
              </div>
            ) : (
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: lang === "fa" ? 0 : "0.08em", color: white }}>
                  <span className="status-dot" style={{ background: statusColor }} />
                  {loading ? stage : isError ? a.error : a.response}
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={loading}
                    style={{ marginInlineStart: "auto", color: white, border: "1px solid rgba(255,255,255,0.4)", padding: "4px 10px", fontSize: 11 }}
                  >
                    {a.clear}
                  </button>
                </div>

                <div style={{ fontSize: 13, color: white }} dir="auto">
                  <strong>{a.yourPrompt}</strong> {prompt}
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
              <span>{info.name}</span>
              <span>{tool.model}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
