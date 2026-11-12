import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "glass-pill text-subtle",
  accent: "bg-accent/20 text-[#c9bcff] ring-1 ring-accent-bright/40",
  success: "bg-green/10 text-green ring-1 ring-green/30",
  warning: "bg-[#f6c453]/10 text-[#f6c453] ring-1 ring-[#f6c453]/30",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium", tones[tone], className)} {...props} />;
}
