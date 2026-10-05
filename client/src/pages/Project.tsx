import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { useLang } from "../lib/i18n";
import { findProject, portfolioProjects } from "../lib/projects";
import NotFound from "./NotFound";
import "./project.css";

const copy = {
  fa: {
    back: "گالری",
    year: "سال",
    duration: "مدت",
    type: "نوع کار",
    tools: "ابزار",
    process: "مراحل ساخت را ببین",
    source: "مشاهده نمونه‌ی اصلی در اینستاگرام",
    next: "پروژه‌ی بعدی",
    cta: "پروژه‌ات را بفرست",
    comma: "، ",
  },
  en: {
    back: "Gallery",
    year: "Year",
    duration: "Duration",
    type: "Type",
    tools: "Tools",
    process: "Show how it was made",
    source: "Watch the original sample on Instagram",
    next: "Next project",
    cta: "Send your project",
    comma: ", ",
  },
} as const;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

type Props = {
  slug: string;
  onNavigate: (to: string) => void;
};

export default function Project({ slug, onNavigate }: Props) {
  const { lang, dir } = useLang();
  const c = copy[lang];
  const project = findProject(slug);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const digits = (value: string) => (lang === "fa" ? value.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : value);

  // Opening another project starts at the top again.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [slug]);

  // The hero video plays by itself (muted) unless the visitor asked for less motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm) video.play().catch(() => {});
    return () => video.pause();
  }, [slug]);

  if (!project) return <NotFound />;

  const to = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(href);
  };

  const index = portfolioProjects.indexOf(project);
  const next = portfolioProjects.length > 1 ? portfolioProjects[(index + 1) % portfolioProjects.length] : null;
  const steps = project.steps?.[lang] ?? [];
  const brief = project.brief?.[lang];
  const result = project.result?.[lang];
  const tagline = project.tagline?.[lang];

  const meta: { label: string; value: ReactNode }[] = [];
  if (project.year) meta.push({ label: c.year, value: digits(project.year) });
  if (project.duration?.[lang]) meta.push({ label: c.duration, value: project.duration[lang] });
  if (project.type?.[lang]) meta.push({ label: c.type, value: project.type[lang] });
  if (project.tools?.length) {
    meta.push({
      label: c.tools,
      value: project.tools.map((tool, i) => (
        <span key={tool}>
          <bdi dir="ltr">{tool}</bdi>
          {i < project.tools!.length - 1 ? c.comma : null}
        </span>
      )),
    });
  }

  return (
    <main id="main" className="site-shell three-act standalone-page project-page" dir={dir}>
      <div className="page-view-inner" ref={scrollRef}>
        <article className="pj">
          <a className="pj-back" href="/gallery" onClick={to("/gallery")}>
            <ChevronLeft size={14} aria-hidden="true" /> {c.back}
          </a>

          <div className={`pj-top ${project.orientation === "landscape" ? "is-wide" : ""}`}>
            <figure className="pj-stage">
              <video
                ref={videoRef}
                src={project.videoUrl}
                poster={project.posterUrl}
                aria-label={project.title[lang]}
                playsInline
                loop
                muted
                controls
                preload="metadata"
                onError={(e) => { e.currentTarget.removeAttribute("src"); e.currentTarget.load(); }}
              />
            </figure>

            <header className="pj-head">
              <h1>{project.title[lang]}</h1>
              {tagline && <p className="pj-tagline">{tagline}</p>}
              {project.sourceUrl && <a className="pj-source-link" href={project.sourceUrl} target="_blank" rel="noreferrer">{c.source} <ArrowUpRight size={14} /></a>}
              {meta.length > 0 && (
                <dl className="pj-meta">
                  {meta.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </header>
          </div>

          {brief && (
            <section className="pj-block">
              <h2>{brief.heading}</h2>
              <p>{brief.text}</p>
            </section>
          )}

          {steps.length > 0 && (
            <details className="pj-process">
              <summary>{c.process}</summary>
              <ol className="pj-steps">
                {steps.map((step, i) => (
                  <li key={step.name}>
                    <span className="pj-step-no">{digits(String(i + 1).padStart(2, "0"))}</span>
                    <div>
                      <h3>{step.name}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {result && (
            <section className="pj-block">
              <h2>{result.heading}</h2>
              <p>{result.text}</p>
            </section>
          )}

          <footer className="pj-next">
            {next && (
              <a className="pj-next-link" href={`/gallery/${next.slug}`} onClick={to(`/gallery/${next.slug}`)}>
                <small>{c.next}</small>
                <strong>{next.title[lang]} <ArrowUpRight size={28} aria-hidden="true" /></strong>
              </a>
            )}
            <a className="svc-btn primary" href="/contact" onClick={to("/contact")}>
              {c.cta} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </footer>
        </article>
      </div>
    </main>
  );
}
