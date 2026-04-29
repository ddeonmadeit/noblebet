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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg glass px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 " +
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
        "w-full rounded-lg glass px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 " +
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition min-h-[90px] " +
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
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              "px-4 py-2 rounded-lg text-sm font-medium transition border " +
              (active
                ? "bg-primary text-primary-foreground border-primary glow"
                : "glass text-foreground hover:border-primary/40")
            }
          >
            {opt}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
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
  return (
    <FormField label={label} required={required} hint={description}>
      <label
        htmlFor={name}
        className={
          "group flex items-center gap-3 rounded-xl border-dashed border-2 p-3 cursor-pointer transition " +
          (file
            ? "glass border-primary/60 bg-primary/10"
            : "glass border-glass-border hover:border-primary/50")
        }
      >
        {file ? (
          <span className="w-9 h-9 shrink-0 rounded-full bg-primary/20 flex items-center justify-center glow">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        ) : (
          <svg className="w-7 h-7 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6.1 4.5 4.5 0 0117 15h-1m-4-4v8m0-8l-3 3m3-3l3 3" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="text-sm font-medium text-primary truncate">Upload complete</p>
              <p className="text-xs text-muted-foreground truncate">{file.name}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground">Drag &amp; drop or click to upload</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or PDF</p>
            </>
          )}
        </div>
        {file && (
          <span className="text-xs font-medium text-primary/80 shrink-0 underline">Replace</span>
        )}
        <input
          id={name}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </FormField>
  );
}
