"use client";

import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Compact in-app form controls. The auth forms keep their larger TextField.

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
      {children}
    </label>
  );
}

export function Field({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={cn(fieldBase, "h-11 px-3.5")} {...props} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} rows={3} className={cn(fieldBase, "resize-none px-3.5 py-3")} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={cn(fieldBase, "h-11 appearance-none px-3.5 [&>option]:bg-[#0b0b1e]")} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const buttonVariants = {
  primary: "btn-primary",
  light: "btn-light",
  ghost: "border border-white/12 text-subtle hover:border-white/25 hover:text-white",
  danger: "border border-red-400/30 text-red-300 hover:bg-red-500/10",
};

export function ActionButton({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants; loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-[filter,background-color,border-color,color] duration-200",
        "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Single-choice pill row. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { id: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-9 rounded-full border px-4 text-sm transition-colors",
            value === o.id ? "border-transparent chip-on" : "border-white/12 text-subtle hover:border-white/25 hover:text-white"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm",
        tone === "error" && "border-red-400/30 bg-red-500/10 text-red-200",
        tone === "success" && "border-green/30 bg-green/10 text-green",
        tone === "info" && "border-white/10 bg-white/[0.04] text-subtle"
      )}
    >
      {children}
    </p>
  );
}
