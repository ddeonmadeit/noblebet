import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "@/components/signup/SignupForm";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "We Will Buy Your Betting Account For $350" },
      { name: "description", content: "Australian's Only — secure sign-up form. Takes 3–5 minutes to complete." },
      { property: "og:title", content: "We Will Buy Your Betting Account For $350" },
      { property: "og:description", content: "Australian's Only — secure sign-up form." },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 md:py-20">
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            We Will Buy Your Betting Account For{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              $350
            </span>
          </h1>
          <p className="mt-1 text-base sm:text-lg font-semibold text-foreground">
            Australian's Only
          </p>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto px-2">
            Complete your application in about 3–5 minutes. Your ID is used strictly to comply with Australian legislation and create bookmaker accounts on your behalf.
          </p>
        </header>

        <SignupForm />

        <footer className="mt-10 sm:mt-12 text-center text-xs text-muted-foreground px-2">
          Your data is stored in a secure 2FA-protected vault. Governed by the laws of New South Wales.
        </footer>
      </div>
    </main>
  );
}
