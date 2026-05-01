import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getSubmissions, type Submission } from "@/lib/getSubmissions";

export const Route = createFileRoute("/dash")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Noble Bet" }] }),
});

function Dashboard() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (pw !== "0") { setError("Incorrect password"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await getSubmissions();
      setSubs(data);
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border border-glass-border rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-foreground text-center">Noble Bet Dashboard</h1>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            autoFocus
            className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold disabled:opacity-50 touch-manipulation transition hover:brightness-110"
          >
            {loading ? "Loading…" : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Submissions <span className="text-muted-foreground font-normal text-lg">({subs.length})</span>
        </h1>
        <a
          href="/api/csv"
          download="submissions.csv"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold touch-manipulation hover:brightness-110 transition"
        >
          ↓ Download CSV
        </a>
      </div>

      {subs.length === 0 ? (
        <p className="text-muted-foreground text-center py-20 text-lg">No submissions yet.</p>
      ) : (
        <div className="space-y-5">
          {subs.map((sub, i) => <SubmissionCard key={i} sub={sub} />)}
        </div>
      )}
    </main>
  );
}

function SubmissionCard({ sub }: { sub: Submission }) {
  const fields = [
    ["Email", sub.email],
    ["Phone", sub.phone],
    ["Referred by", sub.referrer],
    ["Betting accounts", sub.hasSportsbettingAccount],
    ["Existing accounts", sub.existingAccounts],
    ["Similar program", sub.participatedSimilar],
    ["Valid ID", sub.hasValidId],
    ["Agreed to terms", sub.agreedTerms],
    ["Authorise UP bank", sub.authoriseUpBankFinal],
  ].filter(([, v]) => v) as [string, string][];

  const photos = [
    { path: sub.licenseFront, label: "License Front" },
    { path: sub.licenseBack, label: "License Back" },
    { path: sub.medicareOrPassport, label: "Medicare / Passport" },
    { path: sub.selfie, label: "Selfie with ID" },
  ].filter((p) => p.path);

  return (
    <div className="bg-card border border-glass-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {sub.firstName} {sub.lastName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{sub.timestamp}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {fields.map(([label, value]) => (
          <div key={label} className="glass rounded-lg p-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="text-foreground font-medium mt-0.5 break-words">{value}</div>
          </div>
        ))}
      </div>

      {photos.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Documents</p>
          <div className="flex flex-wrap gap-2">
            {photos.map(({ path, label }) => (
              <a
                key={path}
                href={`/api/photo?path=${encodeURIComponent(path)}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.07] border border-white/10 text-sm text-foreground hover:bg-white/[0.12] active:brightness-90 transition touch-manipulation"
              >
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
