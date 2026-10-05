import { Suspense, lazy, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { Volume2, VolumeX } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider, useLang } from "./lib/i18n";
import { setSoundEnabled, useSoundEnabled } from "./lib/sound";
import { useSeo } from "./lib/seo";
import { projectFromPath } from "./lib/projects";
import "./nav-mobile.css";

// Every page is its own chunk: the heavy 3D code only downloads when its page opens.
const Home = lazy(() => import("./pages/Home"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Services = lazy(() => import("./pages/Services"));
const Project = lazy(() => import("./pages/Project"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ShopCalculator = lazy(() => import("./pages/ShopCalculator"));
const AiProject = lazy(() => import("./pages/AiProject"));
const NotFound = lazy(() => import("./pages/NotFound"));

const NAV = [
  { path: "/", key: "home" },
  { path: "/gallery", key: "gallery" },
  { path: "/services", key: "services" },
  { path: "/shop", key: "shop" },
  { path: "/ai-studio", key: "ai" },
  { path: "/about", key: "about" },
  { path: "/contact", key: "contact" },
] as const;

const KNOWN = new Set<string>(NAV.map((n) => n.path));

function Shell() {
  const { lang, toggle, t } = useLang();
  const soundOn = useSoundEnabled();
  const [location, setLocation] = useLocation();
  const [stage, setStage] = useState<"idle" | "out" | "in">("idle");
  const busy = useRef(false);
  const timer = useRef<number | null>(null);

  const path = location === "/ai" ? "/ai-studio" : location;
  const project = projectFromPath(path);
  useSeo(project ? "/gallery" : KNOWN.has(path) ? path : "/404", lang, project ? {
    title: `${project.title[lang]} | 4miem`,
    description: project.tagline?.[lang],
    canonicalPath: path,
  } : {});

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const go = useCallback((next: string) => {
    if (next === location || busy.current) return;
    busy.current = true;
    setStage("out");
    timer.current = window.setTimeout(() => {
      setLocation(next);
      setStage("in");
      timer.current = window.setTimeout(() => {
        setStage("idle");
        busy.current = false;
        timer.current = null;
      }, 220);
    }, 220);
  }, [location, setLocation]);

  const onNavClick = (next: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(next);
  };

  const skipToContent = (e: MouseEvent) => {
    e.preventDefault();
    const main = document.querySelector<HTMLElement>("main");
    if (main) {
      main.tabIndex = -1;
      main.focus();
    }
  };

  return (
    <div className="studio-app" data-view={path}>
      <a href="#main" className="skip-link" onClick={skipToContent}>{t.nav.skip}</a>

      <Suspense fallback={<div className="route-loading" role="status" aria-label="Loading"><span>∞</span></div>}>
        <Switch>
          <Route path="/"><Home onOpenGallery={() => go("/gallery")} onOpenContact={() => go("/contact")} /></Route>
          <Route path="/gallery"><Gallery lang={lang} onToggleLang={toggle} onOpenAi={() => go("/ai-studio")} onOpenProject={(slug) => go(`/gallery/${slug}`)} /></Route>
          <Route path="/gallery/:slug">{(params) => <Project slug={params.slug} onNavigate={go} />}</Route>
          <Route path="/services"><Services onContact={() => go("/contact")} onShop={() => go("/shop")} /></Route>
          <Route path="/shop"><ShopCalculator onContact={() => go("/contact")} /></Route>
          <Route path="/ai-studio"><AiProject /></Route>
          <Route path="/ai"><Redirect to="/ai-studio" replace /></Route>
          <Route path="/about"><About onNavigate={go} /></Route>
          <Route path="/contact"><Contact onClose={() => go("/")} /></Route>
          <Route><NotFound /></Route>
        </Switch>
      </Suspense>

      <div className="utility-dock">
        <button type="button" onClick={toggle} lang={lang === "fa" ? "en" : "fa"} aria-label={t.nav.switchLang} title={t.nav.switchLang}>
          {t.nav.langShort}
        </button>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundOn)}
          aria-pressed={!soundOn}
          aria-label={soundOn ? t.nav.soundOn : t.nav.soundOff}
          title={soundOn ? t.nav.soundOn : t.nav.soundOff}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      <nav className="view-nav" aria-label={t.nav.label} dir={lang === "fa" ? "rtl" : "ltr"}>
        {NAV.map(({ path: to, key }) => {
          const active = path === to || (to === "/gallery" && !!project);
          return (
          <a
            key={to}
            href={to}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
            onClick={onNavClick(to)}
          >
            {t.nav[key]}
          </a>
          );
        })}
      </nav>

      {stage !== "idle" && <div className={`studio-transition is-${stage}`} aria-hidden="true" />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <Shell />
          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
