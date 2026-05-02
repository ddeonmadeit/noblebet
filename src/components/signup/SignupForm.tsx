import { useRef, useState } from "react";
import { FormField, TextInput, TextArea, RadioGroup, FileUpload } from "./FormField";
import { TermsContent } from "./Terms";
import { submitForm, type FilePayload } from "@/lib/submitForm";

async function fileToPayload(file: File): Promise<FilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({ name: file.name, data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type FormState = {
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
  licenseFront: File | null;
  licenseBack: File | null;
  medicareOrPassport: File | null;
  selfie: File | null;
};

const STEPS = ["Details", "Terms", "Documents"] as const;

export function SignupForm() {
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const goToStep = (n: number) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [data, setData] = useState<FormState>({
    email: "",
    referrer: "",
    firstName: "",
    lastName: "",
    phone: "",
    hasSportsbettingAccount: "",
    existingAccounts: "",
    participatedSimilar: "",
    hasValidId: "",
    agreedTerms: "",
    authoriseUpBankFinal: "",
    licenseFront: null,
    licenseBack: null,
    medicareOrPassport: null,
    selfie: null,
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  if (submitted) {
    return (
      <div className="bg-card border border-glass-border rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto">
        <img src="/logo.svg" alt="Noble Bet" className="mx-auto mb-5 w-24 h-24 opacity-90" />
        <h2 className="text-2xl font-semibold text-foreground">Thank you for submitting</h2>
        <p className="mt-2 text-muted-foreground">
          We will be in touch shortly.
        </p>
      </div>
    );
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  const phoneValid = (() => {
    const d = data.phone.replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15;
  })();

  const stepValid = [
    emailValid &&
      phoneValid &&
      !!data.firstName &&
      !!data.lastName &&
      !!data.referrer.trim() &&
      !!data.hasSportsbettingAccount &&
      !!data.participatedSimilar &&
      data.hasValidId === "Yes",
    data.agreedTerms === "Yes",
    !!(data.licenseFront && data.licenseBack && data.medicareOrPassport && data.selfie),
  ];

  const isLastStep = step === STEPS.length - 1;

  const handleReactSubmit = async () => {
    if (!data.licenseFront || !data.licenseBack || !data.medicareOrPassport || !data.selfie) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const [licenseFront, licenseBack, medicareOrPassport, selfie] = await Promise.all([
        fileToPayload(data.licenseFront),
        fileToPayload(data.licenseBack),
        fileToPayload(data.medicareOrPassport),
        fileToPayload(data.selfie),
      ]);
      await submitForm({
        data: {
          email: data.email,
          referrer: data.referrer,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          hasSportsbettingAccount: data.hasSportsbettingAccount,
          existingAccounts: data.existingAccounts,
          participatedSimilar: data.participatedSimilar,
          hasValidId: data.hasValidId,
          agreedTerms: data.agreedTerms,
          authoriseUpBankFinal: data.authoriseUpBankFinal,
          licenseFront,
          licenseBack,
          medicareOrPassport,
          selfie,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // action + encType = native fallback when React doesn't hydrate
    <form
      action="/api/submit-all"
      method="post"
      encType="multipart/form-data"
      onSubmit={(e) => { e.preventDefault(); handleReactSubmit(); }}
      id="signup-form"
    >
      <div ref={topRef} className="space-y-3 sm:space-y-5 scroll-mt-4">
        {/* Stepper */}
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            {STEPS.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={label} className="flex items-center gap-1.5 sm:gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      id={`step-circle-${i}`}
                      className={
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition " +
                        (active
                          ? "bg-primary text-primary-foreground glow"
                          : done
                          ? "bg-primary/30 text-primary"
                          : "glass text-muted-foreground")
                      }
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={
                        "text-[10px] font-medium hidden sm:block " +
                        (active ? "text-foreground" : "text-muted-foreground")
                      }
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-6 sm:w-14 h-px bg-glass-border" />}
                </div>
              );
            })}
          </div>
          <div id="stepper-text" className="mt-2 text-center text-[11px] text-muted-foreground sm:hidden">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </div>
        </div>

        {/* All steps always in DOM */}
        <div className="bg-card border border-glass-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">

          {/* Step 0 — Details */}
          <div data-step="0" style={step !== 0 ? { display: "none" } : undefined}>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Your Details</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                This form takes about 3–5 minutes. We collect ID to comply with Australian legislation and to create accounts with fully regulated Australian bookmakers (TAB, Sportsbet, Pointsbet, etc).
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.05] border-l-4 border-l-primary border border-white/10 p-4 text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Why we ask:</strong> We will never use your ID for anything beyond signing you up to the aforementioned websites or creating a new bank account for depositing into and withdrawing from those accounts.
            </div>
            <FormField label="Email" required hint={data.email && !emailValid ? "Please enter a valid email address." : undefined}>
              <TextInput id="f-email" name="email" type="email" placeholder="example@example.com" value={data.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>
            <FormField label="Hotel/Hostel/Villa" required>
              <TextInput id="f-referrer" name="referrer" value={data.referrer} onChange={(e) => update("referrer", e.target.value)} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" required>
                <TextInput id="f-firstName" name="firstName" value={data.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </FormField>
              <FormField label="Last name" required>
                <TextInput id="f-lastName" name="lastName" value={data.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Phone number" required hint="Please enter a valid phone number.">
              <TextInput id="f-phone" name="phone" type="tel" placeholder="(000) 000-0000" value={data.phone} onChange={(e) => update("phone", e.target.value)} />
            </FormField>
            <FormField label="Have you already created any sportsbetting accounts? (Sportsbet, TAB, Ladbrokes etc) Even if you have never used them" required>
              <RadioGroup name="hasSportsbettingAccount" value={data.hasSportsbettingAccount} onChange={(v) => update("hasSportsbettingAccount", v)} options={["Yes", "No", "Not Sure"]} />
            </FormField>
            {data.hasSportsbettingAccount === "Yes" && (
              <FormField label="Which accounts have you already created?">
                <TextArea name="existingAccounts" value={data.existingAccounts} onChange={(e) => update("existingAccounts", e.target.value)} placeholder="e.g. Sportsbet, TAB, Pointsbet..." />
              </FormField>
            )}
            <FormField label="Have you participated in a program similar to this?" required>
              <RadioGroup name="participatedSimilar" value={data.participatedSimilar} onChange={(v) => update("participatedSimilar", v)} options={["Yes", "No"]} />
            </FormField>
            <FormField
              label="Do you have a valid form of identification (driver's license or passport)?"
              required
              hint="We do NOT accept photo cards or proof-of-age cards. Only unexpired drivers licenses or passports."
            >
              <RadioGroup name="hasValidId" value={data.hasValidId} onChange={(v) => update("hasValidId", v)} options={["Yes"]} />
            </FormField>
          </div>

          {/* Step 1 — Terms */}
          <div data-step="1" style={step !== 1 ? { display: "none" } : undefined}>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Terms &amp; Conditions</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Please read the full agreement below before agreeing.</p>
            </div>
            <TermsContent />
            <FormField label="I have read and agreed to the terms and conditions" required>
              <RadioGroup name="agreedTerms" value={data.agreedTerms} onChange={(v) => update("agreedTerms", v)} options={["Yes", "No"]} />
            </FormField>
          </div>

          {/* Step 2 — Documents */}
          <div data-step="2" style={step !== 2 ? { display: "none" } : undefined}>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Document Uploads</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">All 4 corners visible and all text clearly readable and unobstructed.</p>
            </div>
            <FileUpload label="Frontside of your DRIVER'S LICENSE" name="licenseFront" required description="We do NOT accept photo cards or ID cards — only unexpired licenses." file={data.licenseFront} onFile={(f) => update("licenseFront", f)} />
            <FileUpload label="Backside of your DRIVER'S LICENSE" name="licenseBack" required file={data.licenseBack} onFile={(f) => update("licenseBack", f)} />
            <FileUpload label="Frontside of your MEDICARE or PASSPORT" name="medicareOrPassport" required description="Used to verify any sports betting accounts." file={data.medicareOrPassport} onFile={(f) => update("medicareOrPassport", f)} />
            <FileUpload label="Selfie holding your driver's licence or passport" name="selfie" required description="Ensures no 3rd party is posting your ID information without consent." file={data.selfie} onFile={(f) => update("selfie", f)} />
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-2">
          <button
            id="back-btn"
            type="button"
            onClick={() => goToStep(step - 1)}
            className={
              "glass px-4 py-3 min-h-[52px] rounded-xl text-sm font-medium text-foreground transition touch-manipulation shrink-0 " +
              (step === 0 ? "invisible pointer-events-none" : "hover:border-primary/40 active:brightness-90")
            }
          >
            ← Back
          </button>

          {/* Continue — hidden on last step */}
          <button
            id="continue-btn"
            type="button"
            disabled={!stepValid[step]}
            onClick={() => goToStep(step + 1)}
            style={isLastStep ? { display: "none" } : undefined}
            className="flex-1 bg-primary text-primary-foreground py-3 min-h-[52px] rounded-xl text-base font-semibold hover:brightness-110 active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed transition glow touch-manipulation"
          >
            Continue →
          </button>

          {/* Submit — shown only on last step; type=submit so native form POST works too */}
          <button
            id="submit-btn"
            type="submit"
            disabled={submitting}
            style={!isLastStep ? { display: "none" } : undefined}
            className="flex-1 bg-primary text-primary-foreground py-3 min-h-[52px] rounded-xl text-base font-semibold hover:brightness-110 active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed transition glow touch-manipulation"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>

        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        )}
      </div>
    </form>
  );
}
