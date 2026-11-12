import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed",
        tone === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-green/30 bg-green/10 text-green"
      )}
    >
      <Icon className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.75} />
      <div>{children}</div>
    </div>
  );
}
