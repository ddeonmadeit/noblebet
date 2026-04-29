import { serve } from "srvx";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(__dirname, "dist/client");
const publicDir = join(__dirname, "public");

const { default: server } = await import("./dist/server/server.js");

const MIME = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
};

serve({
  fetch: async (request) => {
    const url = new URL(request.url);

    // Serve hashed static assets (cache forever)
    if (url.pathname.startsWith("/assets/")) {
      try {
        const filePath = join(clientDir, url.pathname);
        const content = readFileSync(filePath);
        const ext = extname(filePath).toLowerCase();
        return new Response(content, {
          headers: {
            "Content-Type": MIME[ext] ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        // not a static file — fall through
      }
    }

    // Serve public directory files (favicon, etc.)
    try {
      const filePath = join(publicDir, url.pathname);
      const content = readFileSync(filePath);
      const ext = extname(filePath).toLowerCase();
      return new Response(content, {
        headers: {
          "Content-Type": MIME[ext] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      // fall through to SSR
    }

    return server.fetch(request);
  },
});
