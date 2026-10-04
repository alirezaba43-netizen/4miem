// Runs after `vite build` (see the "build" script in package.json).
//
// A Vite app ships one empty index.html, so crawlers and AI assistants that do not run JavaScript see
// nothing. This script writes a real HTML page for every route with its own <title>, description,
// canonical URL, JSON-LD and readable Persian + English content, plus sitemap.xml.
// React replaces the static block as soon as the app starts, so visitors get the normal site.
//
// Edit texts in client/src/lib/seo.json (also used by the app). It never fails the build: on any
// problem it prints a warning and the plain SPA is still deployed.

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "public");

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

const NAV_LABELS = {
  "/": { fa: "خانه", en: "Home" },
  "/gallery": { fa: "گالری", en: "Gallery" },
  "/services": { fa: "خدمات", en: "Services" },
  "/shop": { fa: "فروشگاه", en: "Shop" },
  "/ai-studio": { fa: "هوش مصنوعی", en: "AI Studio" },
  "/about": { fa: "درباره", en: "About" },
  "/contact": { fa: "تماس", en: "Contact" },
};

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function structuredData(seo, routePath) {
  const base = seo.url;
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: `${base}/`,
      name: seo.name,
      inLanguage: ["fa", "en"],
      publisher: { "@id": `${base}/#studio` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${base}/#studio`,
      name: seo.name,
      alternateName: "میم",
      url: `${base}/`,
      logo: `${base}/icon-512.png`,
      image: `${base}/og-image.jpg`,
      description: seo.description.en,
      slogan: seo.tagline,
      knowsLanguage: ["fa", "en"],
      address: { "@type": "PostalAddress", addressLocality: "Tehran", addressCountry: "IR" },
      makesOffer: seo.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.en.name, description: s.en.text },
      })),
    },
  ];
  if (routePath === "/services") {
    graph.push({
      "@type": "FAQPage",
      mainEntity: seo.faq.flatMap((f) => [
        { "@type": "Question", name: f.fa.q, inLanguage: "fa", acceptedAnswer: { "@type": "Answer", text: f.fa.a } },
        { "@type": "Question", name: f.en.q, inLanguage: "en", acceptedAnswer: { "@type": "Answer", text: f.en.a } },
      ]),
    });
  }
  return `<script type="application/ld+json">${jsonLd({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

const STYLE = `<style>
.pr{position:fixed;inset:0;overflow:auto;background:#06090b;color:#e7f5f3;font:16px/1.9 Vazirmatn,Manrope,system-ui,sans-serif;padding:32px 20px 96px}
.pr>div{max-width:760px;margin:0 auto}.pr a{color:#55f6e7}.pr h1{font-size:34px;line-height:1.3;margin:24px 0 8px}
.pr h2{font-size:22px;margin:32px 0 8px}.pr h3{font-size:17px;margin:20px 0 4px}.pr p{margin:6px 0;color:#b9d3ce}
.pr nav{display:flex;flex-wrap:wrap;gap:6px 18px}.pr ul,.pr ol{padding-inline-start:22px;color:#b9d3ce}
.pr .en{margin-top:28px;padding-top:18px;border-top:1px solid rgba(153,201,196,.2)}
</style>`;

function servicesBlock(seo, lang) {
  return `<ul>${seo.services.map((s) => `<li><strong>${esc(s[lang].name)}</strong>: ${esc(s[lang].text)}</li>`).join("")}</ul>`;
}

function extraBlock(seo, routePath, lang) {
  const parts = [];
  if (routePath === "/" || routePath === "/services" || routePath === "/shop" || routePath === "/about") {
    parts.push(servicesBlock(seo, lang));
  }
  if (routePath === "/services") {
    parts.push(
      `<h2>${lang === "fa" ? "روش کار" : "How we work"}</h2><ol>${seo.process
        .map((p) => `<li><strong>${esc(p[lang].name)}</strong>: ${esc(p[lang].text)}</li>`)
        .join("")}</ol>`,
      `<h2>${lang === "fa" ? "پرسش‌های متداول" : "FAQ"}</h2>${seo.faq
        .map((f) => `<h3>${esc(f[lang].q)}</h3><p>${esc(f[lang].a)}</p>`)
        .join("")}`,
    );
  }
  return parts.join("");
}

function staticContent(seo, routePath) {
  const route = seo.routes[routePath];
  const links = Object.keys(seo.routes)
    .map((p) => `<a href="${p}">${esc(NAV_LABELS[p]?.fa ?? p)} / ${esc(NAV_LABELS[p]?.en ?? p)}</a>`)
    .join("");
  return `${STYLE}<div class="pr" id="prerender"><div>
<nav aria-label="4miem">${links}</nav>
<main>
<section lang="fa" dir="rtl"><h1>${esc(route.fa.h1)}</h1><p>${esc(route.fa.description)}</p>${extraBlock(seo, routePath, "fa")}</section>
<section class="en" lang="en" dir="ltr"><h2>${esc(route.en.h1)}</h2><p>${esc(route.en.description)}</p>${extraBlock(seo, routePath, "en")}</section>
</main>
<p lang="fa" dir="rtl">${esc(seo.description.fa)}</p>
</div></div>`;
}

function buildPage(template, seo, routePath) {
  const route = seo.routes[routePath];
  const { title, description } = route.fa; // Persian is the default language of the site
  const url = routePath === "/" ? `${seo.url}/` : `${seo.url}${routePath}`;
  let html = template;
  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  html = setTag(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  html = setTag(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  html = setTag(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  html = html.replace("<!--JSONLD-->", structuredData(seo, routePath));
  html = html.replace("<!--PRERENDER-->", staticContent(seo, routePath));
  return html;
}

async function main() {
  const seo = JSON.parse(await readFile(path.join(ROOT, "client/src/lib/seo.json"), "utf8"));
  const templatePath = path.join(DIST, "index.html");
  await access(templatePath);
  const template = await readFile(templatePath, "utf8");
  if (!template.includes("<!--PRERENDER-->")) {
    console.warn("[prerender] marker <!--PRERENDER--> not found in index.html; skipping.");
    return;
  }

  const routes = Object.keys(seo.routes);
  for (const routePath of routes) {
    const html = buildPage(template, seo, routePath);
    const out = routePath === "/" ? templatePath : path.join(DIST, routePath, "index.html");
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, html, "utf8");
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map((p) => `  <url><loc>${seo.url}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n");
  await writeFile(
    path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8",
  );
  console.log(`[prerender] wrote ${routes.length} pages + sitemap.xml`);
}

main().catch((err) => {
  console.warn("[prerender] skipped:", err?.message ?? err);
});
