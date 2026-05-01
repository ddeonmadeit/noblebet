import { createServerFn } from "@tanstack/react-start";

export type Submission = {
  timestamp: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  referrer: string;
  hasSportsbettingAccount: string;
  existingAccounts: string;
  participatedSimilar: string;
  hasValidId: string;
  agreedTerms: string;
  authoriseUpBankFinal: string;
  licenseFront: string;
  licenseBack: string;
  medicareOrPassport: string;
  selfie: string;
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export const getSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "ddeonmadeit/noblebet";

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/submissions.csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (res.status === 404) return [] as Submission[];
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);

  const json = await res.json() as { content: string };
  const text = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf-8");

  const lines = text.trim().split("\n");
  if (lines.length < 2) return [] as Submission[];

  const headers = parseCSVLine(lines[0]);

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])) as Submission;
    })
    .reverse();
});
