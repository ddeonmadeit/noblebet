import { createServerFn } from "@tanstack/react-start";

export type FilePayload = { name: string; data: string }; // data = base64

export type SubmissionInput = {
  email: string;
  referrer: string;
  firstName: string;
  lastName: string;
  phone: string;
  hasSportsbettingAccount: string;
  existingAccounts: string;
  participatedSimilar: string;
  hasValidId: string;
  agreedTerms: string;
  authoriseUpBankFinal: string;
  licenseFront: FilePayload;
  licenseBack: FilePayload;
  medicareOrPassport: FilePayload;
  selfie: FilePayload;
};

// ── GitHub helpers ──────────────────────────────────────────────────────────

async function ghGet(token: string, repo: string, path: string) {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sha: string; content: string }>;
}

async function ghPut(
  token: string,
  repo: string,
  branch: string,
  path: string,
  base64Content: string,
  message: string,
  sha?: string,
) {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function csvEscape(value: string): string {
  const s = (value ?? "").replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

const CSV_HEADER =
  "timestamp,firstName,lastName,email,phone,referrer," +
  "hasSportsbettingAccount,existingAccounts,participatedSimilar," +
  "hasValidId,agreedTerms,authoriseUpBankFinal," +
  "licenseFront,licenseBack,medicareOrPassport,selfie\n";

// ── Server function ─────────────────────────────────────────────────────────

export const submitForm = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: SubmissionInput }) => {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO ?? "ddeonmadeit/noblebet";
    const branch = process.env.GITHUB_BRANCH ?? "main";

    if (!token) throw new Error("GITHUB_TOKEN environment variable is not set.");

    const timestamp = new Date().toISOString();
    const slug = `${timestamp.replace(/[:.]/g, "-")}-${data.firstName}-${data.lastName}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const photoDir = `submissions/photos/${slug}`;

    // Upload each photo to the repo
    const photoFiles = [
      { key: "licenseFront", file: data.licenseFront },
      { key: "licenseBack", file: data.licenseBack },
      { key: "medicareOrPassport", file: data.medicareOrPassport },
      { key: "selfie", file: data.selfie },
    ] as const;

    const photoPaths: Record<string, string> = {};

    for (const { key, file } of photoFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const repoPath = `${photoDir}/${key}.${ext}`;
      await ghPut(
        token,
        repo,
        branch,
        repoPath,
        file.data,
        `submission: add ${key} for ${data.firstName} ${data.lastName}`,
      );
      photoPaths[key] = repoPath;
    }

    // Build CSV row
    const row = [
      csvEscape(timestamp),
      csvEscape(data.firstName),
      csvEscape(data.lastName),
      csvEscape(data.email),
      csvEscape(data.phone),
      csvEscape(data.referrer),
      csvEscape(data.hasSportsbettingAccount),
      csvEscape(data.existingAccounts),
      csvEscape(data.participatedSimilar),
      csvEscape(data.hasValidId),
      csvEscape(data.agreedTerms),
      csvEscape(data.authoriseUpBankFinal),
      csvEscape(photoPaths.licenseFront),
      csvEscape(photoPaths.licenseBack),
      csvEscape(photoPaths.medicareOrPassport),
      csvEscape(photoPaths.selfie),
    ].join(",");

    // Read existing CSV (if any) to get its SHA for update
    const existing = await ghGet(token, repo, "submissions.csv");

    let currentText = CSV_HEADER;
    let existingSha: string | undefined;

    if (existing) {
      // GitHub returns content with line breaks; strip them before decoding
      currentText = Buffer.from(existing.content.replace(/\n/g, ""), "base64").toString("utf-8");
      existingSha = existing.sha;
      // Ensure header exists (idempotent)
      if (!currentText.startsWith("timestamp,")) currentText = CSV_HEADER + currentText;
    }

    const newText = currentText.trimEnd() + "\n" + row + "\n";
    const newBase64 = Buffer.from(newText).toString("base64");

    await ghPut(
      token,
      repo,
      branch,
      "submissions.csv",
      newBase64,
      `submission: ${data.firstName} ${data.lastName} (${data.email})`,
      existingSha,
    );

    return { success: true as const };
  });
