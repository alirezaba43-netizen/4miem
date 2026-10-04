import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useLang } from "../lib/i18n";

export default function NotFound() {
  const { dir, t } = useLang();
  const [, setLocation] = useLocation();

  return (
    <main id="main" className="site-shell three-act standalone-page notfound-page" dir={dir}>
      <div className="page-view-inner">
        <header className="page-heading" style={{ marginTop: "18vh" }}>
          <span className="eyebrow">404</span>
          <h1>{t.notFound.title}</h1>
          <p>{t.notFound.text}</p>
          <div style={{ marginTop: 26 }}>
            <button type="button" className="svc-btn primary" onClick={() => setLocation("/")}>
              {t.notFound.home} <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
      </div>
    </main>
  );
}
