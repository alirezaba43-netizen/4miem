import { useEffect } from "react";
import seo from "./seo.json";
import type { Lang } from "./i18n";

type RouteKey = keyof typeof seo.routes;

export const SITE_ROUTES = Object.keys(seo.routes) as RouteKey[];

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/** Keeps <title>, description, canonical and social tags in sync with the current page and language. */
export function useSeo(
  path: string,
  lang: Lang,
  opts: { noindex?: boolean; title?: string; description?: string; canonicalPath?: string } = {},
) {
  useEffect(() => {
    const route = (seo.routes as Record<string, (typeof seo.routes)["/"]>)[path];
    if (!route) {
      document.title = lang === "fa" ? "صفحه پیدا نشد | 4miem" : "Page not found | 4miem";
      setMeta('meta[name="robots"]', "name", "robots", "noindex, follow");
      return;
    }
    const title = opts.title ?? route[lang].title;
    const description = opts.description ?? route[lang].description;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:locale"]', "property", "og:locale", seo.locale[lang]);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="robots"]', "name", "robots", opts.noindex ? "noindex, follow" : "index, follow");
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const og = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (canonical?.href) {
      const base = new URL(canonical.href).origin;
      const target = opts.canonicalPath ?? path;
      const url = base + (target === "/" ? "/" : target);
      canonical.href = url;
      og?.setAttribute("content", url);
    }
  }, [path, lang, opts.noindex, opts.title, opts.description, opts.canonicalPath]);
}
