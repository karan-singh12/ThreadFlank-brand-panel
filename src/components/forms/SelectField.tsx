"use client";

import { useId, type ReactNode, type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly string[];
  icon?: LucideIcon;
  error?: string;
  hint?: ReactNode;
  ref?: Ref<HTMLSelectElement>;
};

/** Native select styled like TextField, so it keeps the platform picker on phones. */
export function SelectField({ label, options, icon: Icon, error, hint, className, id, ref, ...props }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={selectId} className="text-sm font-medium text-subtle">
        {label}
      </label>
      <div className="group relative">
        {Icon && (
          <Icon
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 transition-colors",
              error ? "text-red-300" : "text-muted group-focus-within:text-accent-bright"
            )}
            strokeWidth={1.75}
          />
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            "h-[52px] w-full appearance-none rounded-xl border bg-white/[0.04] pr-11 text-body text-white",
            "transition-[border-color,box-shadow,background-color] duration-200 outline-none",
            "focus:bg-white/[0.06] focus:ring-4 [&>option]:bg-[#0b0b1e]",
            Icon ? "pl-11" : "pl-4",
            error
              ? "border-red-400/60 focus:border-red-400/80 focus:ring-red-500/15"
              : "border-white/10 hover:border-white/20 focus:border-accent-bright/70 focus:ring-accent/20"
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      {hasMessage && (
        <p id={messageId} className={cn("text-[13px] leading-snug", error ? "text-red-300" : "text-muted")} role={error ? "alert" : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
