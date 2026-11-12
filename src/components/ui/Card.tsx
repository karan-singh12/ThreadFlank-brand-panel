import type { HTMLAttributes, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, strong, ...props }: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return <div className={cn("rounded-(--radius-panel) p-5 sm:p-6", strong ? "card-violet-strong" : "card-violet", className)} {...props} />;
}

export function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="chrome-soft text-lg font-medium tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** A single metric: label, big value and the change versus the previous period. */
export function StatCard({ label, value, change, hint }: { label: string; value: string; change?: number | null; hint?: string }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="card-violet flex flex-col justify-between rounded-(--radius-card) p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-[28px] font-medium leading-none tracking-tight text-white tabular-nums">{value}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
        {change != null ? (
          <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", up ? "text-green" : "text-red-400")}>
            {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
            {Math.abs(change).toFixed(1)}%
          </span>
        ) : (
          <span className="text-dim">—</span>
        )}
        {hint && <span className="truncate text-muted">{hint}</span>}
      </div>
    </div>
  );
}
