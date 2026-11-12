"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: ReactNode;
  /** Right-aligned slot inside the input, e.g. a visibility toggle. */
  trailing?: ReactNode;
  /** Extra content on the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function TextField({ label, icon: Icon, error, hint, trailing, labelAction, className, id, ref, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-subtle">
          {label}
        </label>
        {labelAction}
      </div>
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
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            "h-[52px] w-full rounded-xl border bg-white/[0.04] text-body text-white placeholder:text-muted/70",
            "transition-[border-color,box-shadow,background-color] duration-200 outline-none",
            "focus:bg-white/[0.06] focus:ring-4",
            Icon ? "pl-11" : "pl-4",
            trailing ? "pr-12" : "pr-4",
            error
              ? "border-red-400/60 focus:border-red-400/80 focus:ring-red-500/15"
              : "border-white/10 hover:border-white/20 focus:border-accent-bright/70 focus:ring-accent/20"
          )}
          {...props}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hasMessage && (
        <p id={messageId} className={cn("text-[13px] leading-snug", error ? "text-red-300" : "text-muted")} role={error ? "alert" : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
