import { useState, type FormEvent } from "react";
import { Cpu, Image, Play, Sparkles } from "lucide-react";

const tools = [
  { id: "image", name: "Image Foundry", type: "STILL / STYLE FRAME", model: "VISUAL SYSTEM 01", image: "/manus-storage/post-03_d6a7a67f.jpg" },
  { id: "motion", name: "Motion Lab", type: "VIDEO / LOOP", model: "MOTION SYSTEM 02", image: "/manus-storage/post-01_51934b0b.jpg" },
  { id: "portrait", name: "Portrait Signal", type: "PORTRAIT / PERFORMANCE", model: "PORTRAIT SYSTEM 03", image: "/manus-storage/post-05_e997ddae.jpg" },
];

export default function AiProject() {
  const [toolId, setToolId] = useState(tools[0].id);
  const [prompt, setPrompt] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const tool = tools.find((item) => item.id === toolId) ?? tools[0];

  const preparePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewReady(true);
  };

  return <main className="site-shell three-act standalone-page ai-page">
    <div className="page-view-inner">
      <header className="page-heading ai-heading"><span className="eyebrow">05 / 4MIEM AI STUDIO</span><h1>Make the<br /><em>impossible.</em></h1><p>Explore the studio’s image, motion, and portrait workflows.</p></header>
      <div className="ai-layout">
        <section className="ai-tools" aria-label="AI media tools">
          {tools.map((item) => <button className={`ai-tool ${toolId === item.id ? "selected" : ""}`} type="button" key={item.id} onClick={() => { setToolId(item.id); setPreviewReady(false); }} aria-pressed={toolId === item.id}>
            <span className="ai-tool-icon">{item.id === "image" ? <Image size={17} /> : item.id === "motion" ? <Play size={17} /> : <Cpu size={17} />}</span>
            <span><b>{item.name}</b><small>{item.type}</small></span>
            <span className="ai-tool-model">{item.model}</span>
          </button>)}
          <form className="ai-prompt" onSubmit={preparePreview}>
            <label htmlFor="ai-prompt"><span>SCENE PROMPT</span><textarea id="ai-prompt" required rows={4} value={prompt} onChange={(event) => { setPrompt(event.target.value); setPreviewReady(false); }} placeholder="Describe a world, subject, light, or movement..." /></label>
            <button className="page-submit" type="submit"><span>PREPARE PREVIEW</span><Sparkles size={15} /></button>
          </form>
        </section>
        <section className="ai-preview" aria-live="polite">
          <div className="ai-preview-image"><img src={tool.image} alt={`${tool.name} sample frame`} /><span className="ai-preview-shade" /><div className="ai-preview-status"><span className="status-dot" />{previewReady ? "PROMPT READY / SAMPLE OUTPUT" : "SAMPLE OUTPUT / 4MIEM"}</div>{previewReady && <span className="ai-preview-prompt">{prompt}</span>}</div>
          <div className="ai-preview-meta"><span>{tool.name}</span><span>{tool.model}</span></div>
        </section>
      </div>
    </div>
  </main>;
}
