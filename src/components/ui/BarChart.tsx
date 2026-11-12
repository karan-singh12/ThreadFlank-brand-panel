"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type ChartSeries = { key: string; label: string; color: string };
export type ChartRow = { label: string; values: Record<string, number> };

/**
 * Small column chart (single or stacked series) on the app's dark surface.
 * Marks follow the data-viz spec: ≤24px columns, 4px rounded data end, 2px
 * surface gap between stacked segments, hover tooltip, legend for 2+ series,
 * and a screen-reader table so values are never colour-only.
 */
export function BarChart({
  rows,
  series,
  height = 120,
  format = (n) => n.toLocaleString(),
  title,
}: {
  rows: ChartRow[];
  series: ChartSeries[];
  height?: number;
  format?: (n: number) => string;
  title: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const totals = rows.map((r) => series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const active = hover !== null ? rows[hover] : null;

  return (
    <figure className="flex flex-col gap-2" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{title}</span>
        {series.length > 1 && (
          <span className="flex gap-3">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-subtle">
                <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10" aria-hidden />
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/[0.06]" aria-hidden />
        <span className="absolute -top-1 right-0 -translate-y-full text-[10px] text-muted" aria-hidden>
          {format(max)}
        </span>
        <div className="absolute inset-0 flex items-end gap-0.5" aria-hidden>
          {rows.map((r, i) => (
            <div key={r.label} className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center" onMouseEnter={() => setHover(i)}>
              <div className={cn("flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity", hover !== null && hover !== i && "opacity-60")}>
                {series.map((s, si) => {
                  const v = r.values[s.key] ?? 0;
                  if (!v) return null;
                  const top = series.slice(si + 1).every((x) => !(r.values[x.key] ?? 0));
                  return <div key={s.key} style={{ height: Math.max(2, (v / max) * (height - 4)), background: s.color }} className={top ? "rounded-t-[4px]" : undefined} />;
                })}
              </div>
            </div>
          ))}
        </div>
        {active && hover !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 min-w-32 -translate-x-1/2 rounded-lg border border-white/12 bg-[#15132e] px-3 py-2 text-xs shadow-xl"
            style={{ left: `${((hover + 0.5) / rows.length) * 100}%` }}
          >
            <p className="font-medium text-white">{active.label}</p>
            {series.map((s) => (
              <p key={s.key} className="mt-0.5 flex items-center justify-between gap-3 text-subtle">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="text-white">{format(active.values[s.key] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted" aria-hidden>
        <span>{rows[0]?.label}</span>
        <span>{rows[rows.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              {series.map((s) => (
                <td key={s.key}>{format(r.values[s.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Validated pair for success/failure stacks on the dark surface (CVD ΔE 25.7). */
export const CHART_COLORS = { series1: "#3987e5", critical: "#d03b3b" } as const;
