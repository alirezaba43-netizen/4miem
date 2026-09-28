import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import ShopCalculator from "./pages/ShopCalculator";
import AiProject from "./pages/AiProject";

type View = "home" | "gallery" | "contact" | "shop" | "ai";

const viewLabels: Array<{ id: View; label: string }> = [
  { id: "home", label: "HOME" },
  { id: "gallery", label: "GALLERY" },
  { id: "contact", label: "CONTACT" },
  { id: "shop", label: "SHOP" },
  { id: "ai", label: "AI STUDIO" },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [transitionStage, setTransitionStage] = useState<"idle" | "out" | "in">("idle");
  const transitionStarted = useRef(false);
  const transitionTarget = useRef<View | null>(null);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const navigateTo = useCallback((nextView: View) => {
    if (currentView === nextView || transitionStarted.current) return;
    transitionStarted.current = true;
    transitionTarget.current = nextView;
    setTransitionStage("out");
    transitionTimer.current = window.setTimeout(() => {
      const destination = transitionTarget.current;
      if (destination) setCurrentView(destination);
      setTransitionStage("in");
      transitionTimer.current = window.setTimeout(() => {
        setTransitionStage("idle");
        transitionStarted.current = false;
        transitionTarget.current = null;
        transitionTimer.current = null;
      }, 720);
    }, 1450);
  }, [currentView]);

  const activePage = currentView === "home"
    ? <Home onOpenGallery={() => navigateTo("gallery")} />
    : currentView === "gallery"
      ? <Gallery lang={language} onToggleLang={() => setLanguage((value) => value === "fa" ? "en" : "fa")} onOpenAi={() => navigateTo("ai")} />
      : currentView === "contact"
        ? <Contact />
        : currentView === "shop"
          ? <ShopCalculator onContact={() => navigateTo("contact")} />
          : <AiProject />;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="studio-app" data-view={currentView}>
            {activePage}
            <nav className="view-nav" aria-label="Studio pages">
              {viewLabels.map(({ id, label }) => <button key={id} className={currentView === id ? "active" : ""} aria-current={currentView === id ? "page" : undefined} onClick={() => navigateTo(id)}>{label}</button>)}
            </nav>
            {transitionStage !== "idle" && <div className={`studio-transition is-${transitionStage}`} aria-hidden="true" />}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
