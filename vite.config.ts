import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing storage key");
          return;
        }

        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (!forgeBaseUrl || !forgeKey) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Storage proxy not configured");
          return;
        }

        try {
          const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
          forgeUrl.searchParams.set("path", key);

          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });

          if (!forgeResp.ok) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Storage backend error");
            return;
          }

          const { url } = (await forgeResp.json()) as { url: string };
          if (!url) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Empty signed URL");
            return;
          }

          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Storage proxy error");
        }
      });
    },
  };
}

// Legacy local LM Studio address, retained for the optional Stable Diffusion/old setup.
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://192.168.10.2:1234";

// Pollinations secret key (sk_...) lives ONLY on the server side (never VITE_ prefixed).
// Put it in .env as: POLLINATIONS_KEY=sk_xxxxxxxx
const POLLI_KEY =
  process.env.POLLINATIONS_KEY || loadEnv("development", import.meta.dirname, "").POLLINATIONS_KEY || "";
const GROQ_KEY =
  process.env.GROQ_API_KEY || loadEnv("development", import.meta.dirname, "").GROQ_API_KEY || "";

console.log(
  POLLI_KEY
    ? `[pollinations] key loaded: ${POLLI_KEY.slice(0, 3)}...${POLLI_KEY.slice(-3)} (${POLLI_KEY.length} chars)`
    : "[pollinations] WARNING: POLLINATIONS_KEY not found in .env (project root) -> image requests will fail with 401"
);

// Address of the image generator (Stable Diffusion WebUI / Forge, started with --api)
const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginStorageProxy()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // Local Groq proxy: /api/llm?path=... -> api.groq.com/openai/v1/...
      // The API key stays in the Vite server and is never exposed to the browser.
      // Groq is reached through the local Python requests proxy because direct
      // curl/Node requests are rejected by the current network edge with 403.
      "/api/llm": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        rewrite: (reqPath) => {
          const u = new URL(reqPath, "http://localhost");
          const requestedPath =
            u.searchParams.get("path") === "models"
              ? "models"
              : "chat/completions";
          return `/${requestedPath}`;
        },
      },
      // LM Studio (Qwen) proxy:
      // The browser calls /v1/... on the same origin (localhost:3000) and Vite
      // forwards it to LM Studio server-side, so CORS no longer applies.
      "/v1": {
        target: LM_STUDIO_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 0, // LLM responses can be slow; don't cut the connection
        proxyTimeout: 0,
      },
      // Pollinations image proxy: /api/image?prompt=... -> gen.pollinations.ai/image/...
      // The secret key is added here, so it never reaches the browser.
      "/api/image": {
        target: "https://gen.pollinations.ai",
        changeOrigin: true,
        secure: true,
        headers: { Authorization: `Bearer ${POLLI_KEY}` },
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            console.log(`[pollinations] upstream responded ${proxyRes.statusCode}`);
          });
        },
        rewrite: (reqPath) => {
          const u = new URL(reqPath, "http://localhost");
          const prompt = (u.searchParams.get("prompt") || "").slice(0, 600);
          const seed = Number(u.searchParams.get("seed")) || 0;
          return `/image/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${seed}`;
        },
      },
      // Image generation proxy (Stable Diffusion WebUI API)
      "/sdapi": {
        target: SD_URL,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
});
