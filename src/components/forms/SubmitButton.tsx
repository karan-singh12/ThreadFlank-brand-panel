import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "btn-primary inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-(--radius-pill) text-body font-medium",
        "transition-[filter,transform,opacity] duration-300 hover:brightness-110 active:scale-[0.99]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright",
        "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100",
        className
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-[18px] animate-spin" aria-hidden />}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
}
