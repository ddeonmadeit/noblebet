import { useMemo, useRef, useState } from "react";
import { FormField, TextInput, TextArea, RadioGroup, FileUpload } from "./FormField";
import { TermsContent } from "./Terms";
import { submitForm, type FilePayload } from "@/lib/submitForm";

async function fileToPayload(file: File): Promise<FilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:...;base64," prefix — GitHub API wants raw base64
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
  hasUpBank: string;
  authoriseUpBank: string;
  hasValidId: string;
  agreedTerms: string;
  authoriseUpBankFinal: string;
  licenseFront: File | null;
  licenseBack: File | null;
  medicareOrPassport: File | null;
  selfie: File | null;
};

const STEPS = ["Details", "Terms", "Documents", "Review"] as const;

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
    hasUpBank: "",
    authoriseUpBank: "",
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

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()), [data.email]);
  const phoneValid = useMemo(() => {
    const digits = data.phone.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, [data.phone]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return (
        emailValid &&
        phoneValid &&
        data.firstName &&
        data.lastName &&
        data.referrer.trim() &&
        data.hasSportsbettingAccount &&
        data.participatedSimilar &&
        data.hasValidId === "Yes"
      );
    }
    if (step === 1) return data.agreedTerms === "Yes";
    if (step === 2) return data.licenseFront && data.licenseBack && data.medicareOrPassport && data.selfie;
    return true;
  }, [step, data, emailValid, phoneValid]);

  if (submitted) {
    return (
      <div className="glass-strong rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 glow">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Submission received</h2>
        <p className="mt-2 text-muted-foreground">
          Thank you. We'll review your details and be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div ref={topRef} className="space-y-4 sm:space-y-6 scroll-mt-4">
      {/* Stepper */}
      <div className="glass rounded-2xl p-2 sm:p-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold transition " +
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
                      "text-[10px] sm:text-xs font-medium hidden sm:block " +
                      (active ? "text-foreground" : "text-muted-foreground")
                    }
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 sm:w-16 h-px bg-glass-border -mt-3 sm:-mt-5" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 text-center text-[11px] sm:text-xs text-muted-foreground sm:hidden">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </div>
      </div>

      {/* Step content */}
      <div className="glass-strong rounded-2xl p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-hidden">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Your Details</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                This form takes about 3–5 minutes. We collect ID to comply with Australian legislation and to create accounts with fully regulated Australian bookmakers (TAB, Sportsbet, Pointsbet, etc).
              </p>
            </div>

            <div className="relative rounded-xl glass p-4 pl-5 text-sm text-muted-foreground leading-relaxed overflow-hidden">
              <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <strong className="text-foreground">Why we ask:</strong> We will never use your ID for anything beyond signing you up to the aforementioned websites or creating a new bank account for depositing into and withdrawing from those accounts.
            </div>

            <FormField label="Email" required hint={data.email && !emailValid ? "Please enter a valid email address." : undefined}>
              <TextInput type="email" placeholder="example@example.com" value={data.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>

            <FormField label="Hotel/Hostel/Villa" required>
              <TextInput value={data.referrer} onChange={(e) => update("referrer", e.target.value)} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" required>
                <TextInput value={data.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </FormField>
              <FormField label="Last name" required>
                <TextInput value={data.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </FormField>
            </div>

            <FormField label="Phone number" required hint={data.phone && !phoneValid ? "Please enter a valid phone number." : "Please enter a valid phone number."}>
              <TextInput type="tel" placeholder="(000) 000-0000" value={data.phone} onChange={(e) => update("phone", e.target.value)} />
            </FormField>

            <FormField label="Have you already created any sportsbetting accounts? (Sportsbet, TAB, Ladbrokes etc) Even if you have never used them" required>
              <RadioGroup name="hasSportsbettingAccount" value={data.hasSportsbettingAccount} onChange={(v) => update("hasSportsbettingAccount", v)} options={["Yes", "No", "Not Sure"]} />
            </FormField>

            {data.hasSportsbettingAccount === "Yes" && (
              <FormField label="Which accounts have you already created?">
                <TextArea value={data.existingAccounts} onChange={(e) => update("existingAccounts", e.target.value)} placeholder="e.g. Sportsbet, TAB, Pointsbet..." />
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
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Terms &amp; Conditions</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Please read the full agreement below before agreeing.</p>
            </div>
            <TermsContent />
            <FormField label="I have read and agreed to the terms and conditions" required>
              <RadioGroup name="agreedTerms" value={data.agreedTerms} onChange={(v) => update("agreedTerms", v)} options={["Yes", "No"]} />
            </FormField>
            <FormField label="I authorise for an UP / digital bank to be created (this is used to fund the accounts)">
              <RadioGroup name="authoriseUpBankFinal" value={data.authoriseUpBankFinal} onChange={(v) => update("authoriseUpBankFinal", v)} options={["Yes", "No"]} />
            </FormField>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Document Uploads</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">All 4 corners visible and all text clearly readable and unobstructed.</p>
            </div>

            <FileUpload
              label="Frontside of your DRIVER'S LICENSE"
              name="licenseFront"
              required
              description="We do NOT accept photo cards or ID cards — only unexpired licenses."
              file={data.licenseFront}
              onFile={(f) => update("licenseFront", f)}
            />
            <FileUpload
              label="Backside of your DRIVER'S LICENSE"
              name="licenseBack"
              required
              file={data.licenseBack}
              onFile={(f) => update("licenseBack", f)}
            />
            <FileUpload
              label="Frontside of your MEDICARE or PASSPORT"
              name="medicareOrPassport"
              required
              description="Used to verify any sports betting accounts."
              file={data.medicareOrPassport}
              onFile={(f) => update("medicareOrPassport", f)}
            />
            <FileUpload
              label="Selfie holding your driver's licence or passport"
              name="selfie"
              required
              description="Ensures no 3rd party is posting your ID information without consent."
              file={data.selfie}
              onFile={(f) => update("selfie", f)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Review &amp; Submit</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Please confirm your details before submitting.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                ["Name", `${data.firstName} ${data.lastName}`],
                ["Email", data.email],
                ["Phone", data.phone],
                ["Referred by", data.referrer || "—"],
                ["Existing sportsbetting accounts", data.hasSportsbettingAccount],
                ["Similar program", data.participatedSimilar],
                ["Valid ID", data.hasValidId],
                ["Agreed to terms", data.agreedTerms],
              ].map(([label, value]) => (
                <div key={label} className="glass rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-foreground font-medium mt-1 break-words">{value || "—"}</div>
                </div>
              ))}
              <div className="glass rounded-lg p-3 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Documents uploaded</div>
                <ul className="text-foreground mt-1 space-y-1">
                  <li>License front: {data.licenseFront?.name ?? "—"}</li>
                  <li>License back: {data.licenseBack?.name ?? "—"}</li>
                  <li>Medicare/Passport: {data.medicareOrPassport?.name ?? "—"}</li>
                  <li>Selfie with ID: {data.selfie?.name ?? "—"}</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => goToStep(step - 1)}
          className={
            "glass px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-xl text-sm font-medium text-foreground transition touch-manipulation " +
            (step === 0 ? "invisible pointer-events-none" : "hover:border-primary/40")
          }
        >
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => goToStep(step + 1)}
            className="bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition glow touch-manipulation"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
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
            }}
            className="bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition glow touch-manipulation"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}
    </div>
  );
}
