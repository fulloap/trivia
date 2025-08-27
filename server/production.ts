import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Serve static files in production
 * Separated from vite.ts to avoid bundling vite dependencies
 */
export function serveStatic(app: express.Express) {
  // Serve static files from dist/public
  const publicPath = path.resolve(__dirname, "public");
  app.use(express.static(publicPath));

  // Catch-all handler for SPA routing
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}