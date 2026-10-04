import { ArrowUpRight } from "lucide-react";
import { useLang } from "../lib/i18n";
import seo from "../lib/seo.json";

export default function Services({ onContact, onShop }: { onContact: () => void; onShop: () => void }) {
  const { lang, dir, t } = useLang();
  const s = t.services;
  const page = seo.routes["/services"][lang];
  const num = (n: number) => (lang === "fa" ? (n + 1).toLocaleString("fa-IR") : String(n + 1).padStart(2, "0"));

  return <main id="main" className="site-shell three-act standalone-page services-page" dir={dir}>
    <div className="page-view-inner">
      <header className="page-heading">
        <span className="eyebrow">{s.eyebrow}</span>
        <h1>{page.h1}</h1>
        <p>{s.lead}</p>
      </header>

      <section className="svc-grid" aria-label={page.h1}>
        {seo.services.map((item, i) => (
          <article className="svc-card" key={item.id}>
            <span className="svc-index">{num(i)}</span>
            <h2>{item[lang].name}</h2>
            <p>{item[lang].text}</p>
            <ul>
              {item[lang].points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className="svc-block" aria-labelledby="svc-process">
        <h2 id="svc-process" className="svc-title">{s.process}</h2>
        <ol className="svc-steps">
          {seo.process.map((step, i) => (
            <li key={step.en.name}>
              <span className="svc-index">{num(i)}</span>
              <b>{step[lang].name}</b>
              <p>{step[lang].text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="svc-block" aria-labelledby="svc-faq">
        <h2 id="svc-faq" className="svc-title">{s.faq}</h2>
        <div className="svc-faq">
          {seo.faq.map((item) => (
            <details key={item.en.q}>
              <summary>{item[lang].q}</summary>
              <p>{item[lang].a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="svc-cta">
        <h2>{s.ctaTitle}</h2>
        <p>{s.ctaText}</p>
        <div>
          <button type="button" className="svc-btn primary" onClick={onContact}>{s.cta} <ArrowUpRight size={14} /></button>
          <button type="button" className="svc-btn" onClick={onShop}>{s.ctaShop}</button>
        </div>
      </section>
    </div>
  </main>;
}
