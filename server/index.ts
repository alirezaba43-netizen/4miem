import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware برای خواندن داده‌های JSON از سمت کلاینت
  app.use(express.json());

  // مسیر دریافت فرم تماس در لوکال
  app.post("/api/contact", (req, res) => {
    const { name, email, service, brief } = req.body;
    
    console.log("\n----------------------------------------");
    console.log("📩 پیام جدید از فرم تماس دریافت شد:");
    console.log(`👤 نام: ${name}`);
    console.log(`📧 ایمیل: ${email}`);
    console.log(`🛠️ نوع پروژه: ${service}`);
    console.log(`📝 توضیحات: ${brief}`);
    console.log("----------------------------------------\n");

    res.status(200).json({ success: true, message: "Message received successfully locally." });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
