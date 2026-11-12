import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full border border-[#7c5cff]/80 bg-[#6645eb]/12 px-3 text-[11.5px] text-white",
        className
      )}
    >
      <Check className="size-3.5" strokeWidth={2} />
      {children}
    </span>
  );
}
