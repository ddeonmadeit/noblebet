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
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";

async function ghFetch(path) {
  return fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.raw+json" },
  });
}

async function ghPut(path, base64Content, message, sha) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, content: base64Content, branch: GITHUB_BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
}

async function ghGetSha(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return { sha: undefined, text: null };
  const j = await res.json();
  const text = Buffer.from(j.content.replace(/\n/g, ""), "base64").toString("utf-8");
  return { sha: j.sha, text };
}

function csvEscape(v) {
  const s = (v ?? "").replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

const CSV_HEADER = "timestamp,firstName,lastName,email,phone,referrer,hasSportsbettingAccount,existingAccounts,participatedSimilar,hasValidId,agreedTerms,authoriseUpBankFinal,licenseFront,licenseBack,medicareOrPassport,selfie\n";

const THANK_YOU_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Submitted — Noble Bet</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0e1120;color:#e8eaf6;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{background:#1a1e2e;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px 32px;max-width:420px;width:100%;text-align:center}.icon{width:64px;height:64px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 20px}.icon svg{width:32px;height:32px;color:#818cf8}h1{font-size:1.5rem;font-weight:700;margin-bottom:8px}p{color:#94a3b8;font-size:.95rem;line-height:1.6}</style></head><body><div class="card"><div class="icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div><h1>Submission received</h1><p>Thank you. We'll review your details and be in touch shortly.</p></div></body></html>`;

serve({
  fetch: async (request) => {
    const url = new URL(request.url);

    // Thank-you page (used after native form POST)
    if (url.pathname === "/thank-you") {
      return new Response(THANK_YOU_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // Native form submission fallback (when React doesn't hydrate)
    if (request.method === "POST" && url.pathname === "/api/submit-all") {
      try {
        const fd = await request.formData();
        const get = (k) => (fd.get(k) ?? "").toString().trim();
        const timestamp = new Date().toISOString();
        const firstName = get("firstName"), lastName = get("lastName");
        const slug = `${timestamp.replace(/[:.]/g, "-")}-${firstName}-${lastName}`
          .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

        const photoDir = `submissions/photos/${slug}`;
        const photoPaths = {};

        for (const key of ["licenseFront", "licenseBack", "medicareOrPassport", "selfie"]) {
          const file = fd.get(key);
          if (file && file.size > 0) {
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
            const repoPath = `${photoDir}/${key}.${ext}`;
            const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
            await ghPut(repoPath, base64, `submission: add ${key} for ${firstName} ${lastName}`);
            photoPaths[key] = repoPath;
          } else {
            photoPaths[key] = "";
          }
        }

        const row = [
          timestamp, firstName, lastName, get("email"), get("phone"), get("referrer"),
          get("hasSportsbettingAccount"), get("existingAccounts"), get("participatedSimilar"),
          get("hasValidId"), get("agreedTerms"), get("authoriseUpBankFinal"),
          photoPaths.licenseFront, photoPaths.licenseBack, photoPaths.medicareOrPassport, photoPaths.selfie,
        ].map(csvEscape).join(",");

        const { sha, text } = await ghGetSha("submissions.csv");
        let current = text ?? CSV_HEADER;
        if (!current.startsWith("timestamp,")) current = CSV_HEADER + current;
        const newText = current.trimEnd() + "\n" + row + "\n";
        await ghPut("submissions.csv", Buffer.from(newText).toString("base64"),
          `submission: ${firstName} ${lastName} (${get("email")})`, sha);

        return Response.redirect(new URL("/thank-you", request.url).toString(), 303);
      } catch (err) {
        console.error("submit-all error:", err);
        return new Response("Submission failed: " + err.message, { status: 500 });
      }
    }

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
