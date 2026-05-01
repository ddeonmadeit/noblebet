import { ReactNode } from "react";

export function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </p>
      {hint && <p className="text-[11px] sm:text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg bg-white/[0.07] border border-white/10 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 " +
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition " +
        (props.className ?? "")
      }
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-lg bg-white/[0.07] border border-white/10 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 " +
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition min-h-[100px] " +
        (props.className ?? "")
      }
    />
  );
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const id = `${name}-${opt.replace(/\s+/g, "-")}`;
        return (
          <label
            key={opt}
            htmlFor={id}
            className="relative cursor-pointer touch-manipulation"
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="sr-only peer"
            />
            <span className="flex items-center justify-center px-5 py-3 min-h-[48px] min-w-[72px] rounded-lg text-sm font-semibold border select-none transition bg-white/[0.07] border-white/15 text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary">
              {opt}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function FileUpload({
  label,
  name,
  required,
  description,
  file,
  onFile,
}: {
  label: string;
  name: string;
  required?: boolean;
  description?: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputId = `upload-${name}`;

  return (
    <FormField label={label} required={required} hint={description}>
      <label
        htmlFor={inputId}
        data-upload-ui={name}
        className={
          "w-full flex items-center gap-3 rounded-xl border-dashed border-2 p-4 touch-manipulation transition cursor-pointer " +
          (file
            ? "bg-primary/10 border-primary/60 active:brightness-90"
            : "bg-white/[0.04] border-white/15 active:bg-white/10")
        }
      >
        {file ? (
          <span className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_16px_oklch(0.65_0.18_250/0.4)]">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        ) : (
          <svg className="w-8 h-8 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6.1 4.5 4.5 0 0117 15h-1m-4-4v8m0-8l-3 3m3-3l3 3" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="text-sm font-semibold text-primary truncate">Upload complete</p>
              <p className="text-xs text-muted-foreground truncate">{file.name}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">Tap to upload or take photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or PDF</p>
            </>
          )}
        </div>
        {file && (
          <span className="text-xs font-semibold text-primary shrink-0 underline">Replace</span>
        )}
        <input
          id={inputId}
          type="file"
          name={name}
          data-upload={name}
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </FormField>
  );
}
