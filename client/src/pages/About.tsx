import type { MouseEvent, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "../lib/i18n";
import { about } from "../lib/about";
import seo from "../lib/seo.json";
import "./about.css";

const copy = {
  fa: {
    make: "چه می‌سازیم",
    allServices: "همه‌ی خدمات",
    tools: "ابزار",
    timeline: "مسیر کار",
    comma: "، ",
  },
  en: {
    make: "What we make",
    allServices: "All services",
    tools: "Tools",
    timeline: "Track record",
    comma: ", ",
  },
} as const;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export default function About({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { lang, dir, t } = useLang();
  const c = copy[lang];
  const s = t.services;
  const page = seo.routes["/about"][lang];
  const digits = (value: string) => (lang === "fa" ? value.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : value);

  const link = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(href);
  };

  const facts: { label: string; value: ReactNode }[] = about.facts.map((f) => ({ label: f.label[lang], value: f.value[lang] }));
  if (about.tools?.length) {
    facts.push({
      label: c.tools,
      value: about.tools.map((tool, i) => (
        <span key={tool}>
          <bdi dir="ltr">{tool}</bdi>
          {i < about.tools!.length - 1 ? c.comma : null}
        </span>
      )),
    });
  }

  const story = about.story?.[lang];
  const timeline = about.timeline ?? [];

  return (
    <main id="main" className="site-shell three-act standalone-page about-page" dir={dir}>
      <div className="page-view-inner">
        <article className="ab">
          <h1 className="ab-intro">{page.h1}</h1>

          <div className="ab-body">
            <section aria-labelledby="ab-make">
              <h2 id="ab-make" className="ab-title">{c.make}</h2>
              <ul className="ab-list">
                {seo.services.map((item) => (
                  <li key={item.id}>
                    <h3>{item[lang].name}</h3>
                    <p>{item[lang].text}</p>
                  </li>
                ))}
              </ul>
              <a className="ab-more" href="/services" onClick={link("/services")}>
                {c.allServices} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </section>

            <dl className="ab-facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {story && (
            <section className="ab-story">
              <h2 className="ab-title">{story.heading}</h2>
              <p>{story.text}</p>
            </section>
          )}

          {timeline.length > 0 && (
            <section className="ab-timeline" aria-labelledby="ab-track">
              <h2 id="ab-track" className="ab-title">{c.timeline}</h2>
              <ol>
                {timeline.map((item) => (
                  <li key={item.year.en + item.title.en}>
                    <span className="ab-year">{digits(item.year[lang])}</span>
                    <div>
                      <h3>{item.title[lang]}</h3>
                      {item.place && <small>{item.place[lang]}</small>}
                      {item.text && <p>{item.text[lang]}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="ab-cta">
            <h2>{s.ctaTitle}</h2>
            <p>{s.ctaText}</p>
            <a className="svc-btn primary" href="/contact" onClick={link("/contact")}>
              {s.cta} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </section>
        </article>
      </div>
    </main>
  );
}
