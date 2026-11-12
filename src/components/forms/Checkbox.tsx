"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

export function Checkbox({ label, error, id, className, ref, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 text-sm text-subtle">
        <span className="relative mt-0.5 flex size-5 shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-md border bg-white/[0.04] transition-colors",
              "checked:border-accent-bright checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
              error ? "border-red-400/60" : "border-white/20"
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
        </span>
        <span className="leading-relaxed">{label}</span>
      </label>
      {error && (
        <p id={errorId} className="pl-8 text-[13px] text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
