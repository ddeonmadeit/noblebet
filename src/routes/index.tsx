import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "@/components/signup/SignupForm";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Noble Bet — We Will Buy Your Betting Account For $350" },
      { name: "description", content: "Australians Only — secure sign-up form. Takes 3–5 minutes to complete." },
      { property: "og:title", content: "Noble Bet — We Will Buy Your Betting Account For $350" },
      { property: "og:description", content: "Australians Only — secure sign-up form." },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen min-h-dvh relative">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 w-64 h-64 sm:w-[36rem] sm:h-[36rem] rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -right-40 w-64 h-64 sm:w-[36rem] sm:h-[36rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-3 sm:px-6 pt-5 pb-8 sm:pt-10 sm:pb-16 md:pt-16 md:pb-20">
        <header className="text-center mb-5 sm:mb-8">
          <img src="/logo.svg" alt="Noble Bet" className="mx-auto mb-4 w-20 h-20 sm:w-28 sm:h-28" />
          <h1 className="text-[1.6rem] leading-tight sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            We Will Buy Your Betting Account For{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              $350
            </span>
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-foreground/80">
            Australians Only
          </p>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Takes 3–5 minutes. ID used strictly to comply with Australian legislation and create licensed bookmaker accounts.
          </p>
        </header>

        <SignupForm />

        <footer className="mt-8 sm:mt-10 text-center text-[11px] text-muted-foreground/60 px-2">
          Secure 2FA-protected vault · Governed by NSW law
        </footer>
      </div>
    </main>
  );
}
