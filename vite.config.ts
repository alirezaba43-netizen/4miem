import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

const ROOT = import.meta.dirname;
const env = loadEnv("development", ROOT, "");

// Secrets live ONLY on the server side (never VITE_ prefixed). Put them in .env (project root):
//   POLLINATIONS_KEY=sk_xxx      GROQ_API_KEY=gsk_xxx
const POLLI_KEY = process.env.POLLINATIONS_KEY || env.POLLINATIONS_KEY || "";

if (!POLLI_KEY) {
  console.log("[pollinations] POLLINATIONS_KEY not found in .env -> image requests will fail with 401");
}

/**
 * Dev only: runs the Vercel function api/lead.ts locally so the contact form behaves
 * exactly like production when you use `npm run dev`.
 */
function devLeadApi(): Plugin {
  return {
    name: "dev-lead-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/lead", (req, res) => {
        let raw = "";
        req.on("data", (chunk) => {
          raw += chunk;
          if (raw.length > 64_000) req.destroy();
        });
        req.on("end", async () => {
          const r: any = res;
          r.status = (code: number) => { res.statusCode = code; return r; };
          r.json = (payload: unknown) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(payload));
            return r;
          };
          try {
            const mod = await server.ssrLoadModule(path.resolve(ROOT, "api/lead.ts"));
            let body: unknown = undefined;
            try { body = raw ? JSON.parse(raw) : undefined; } catch { /* handler answers 400 */ }
            (req as any).body = body;
            await mod.default(req, r);
          } catch (e) {
            console.error("[dev-lead-api]", e);
            r.status(500).json({ ok: false, error: "DEV_ERROR" });
          }
        });
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === "serve" ? [jsxLocPlugin(), devLeadApi()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(ROOT, "client", "src"),
    },
  },
  envDir: ROOT,
  root: path.resolve(ROOT, "client"),
  build: {
    outDir: path.resolve(ROOT, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(three|postprocessing)\//.test(id)) return "three";
          if (/node_modules\/@react-three\//.test(id)) return "r3f";
          if (/node_modules\/(framer-motion|gsap)\//.test(id)) return "motion";
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // Groq proxy: run `python scripts/dev_llm_server.py` in a second terminal (port 8001).
      // The API key stays in that Python process and is never exposed to the browser.
      "/api/llm": {
        target: "http://127.0.0.1:8001",
        changeOrigin: false,
        secure: false,
      },
      // Pollinations image proxy: /api/image?prompt=... -> gen.pollinations.ai/image/...
      // The secret key is added here, so it never reaches the browser.
      "/api/image": {
        target: "https://gen.pollinations.ai",
        changeOrigin: true,
        secure: true,
        headers: { Authorization: `Bearer ${POLLI_KEY}` },
        rewrite: (reqPath) => {
          const u = new URL(reqPath, "http://localhost");
          const prompt = (u.searchParams.get("prompt") || "").slice(0, 600);
          const seed = Number(u.searchParams.get("seed")) || 0;
          return `/image/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${seed}`;
        },
      },
    },
  },
}));
