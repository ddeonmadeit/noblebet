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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO ?? "ddeonmadeit/noblebet";

async function ghFetch(path) {
  return fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json" },
  });
}

serve({
  fetch: async (request) => {
    const url = new URL(request.url);

    // Photo proxy — streams a file from GitHub with download header
    if (url.pathname === "/api/photo") {
      const path = url.searchParams.get("path");
      if (!path) return new Response("Missing path", { status: 400 });
      const res = await ghFetch(path);
      if (!res.ok) return new Response("Not found", { status: 404 });
      const filename = path.split("/").pop() ?? "file";
      const ct = res.headers.get("Content-Type") ?? "application/octet-stream";
      return new Response(res.body, {
        headers: { "Content-Type": ct, "Content-Disposition": `attachment; filename="${filename}"` },
      });
    }

    // CSV proxy — downloads submissions.csv from GitHub
    if (url.pathname === "/api/csv") {
      const res = await ghFetch("submissions.csv");
      if (res.status === 404) return new Response("timestamp,firstName,lastName,email\n", {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="submissions.csv"' },
      });
      if (!res.ok) return new Response("Failed", { status: 502 });
      return new Response(res.body, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="submissions.csv"' },
      });
    }

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

    const response = await server.fetch(request);
    const ct = response.headers.get("Content-Type") ?? "";
    if (ct.includes("text/html")) {
      const body = await response.text();
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store, no-transform");
      headers.set("Content-Length", String(new TextEncoder().encode(body).byteLength));
      return new Response(body, { status: response.status, headers });
    }
    return response;
  },
});
