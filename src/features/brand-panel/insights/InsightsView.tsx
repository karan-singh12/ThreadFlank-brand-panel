"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download } from "lucide-react";
import { Card, SectionHeader, StatCard } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ActionButton, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatCompactNumber, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { download, toCsv } from "../catalog/csv";
import type { Metric, SeriesDay } from "../types";
import { useResource } from "../useResource";

const total = (m?: Metric) => m?.total ?? null;
const show = (n: number | null, fmt: (v: number) => string = (v) => v.toLocaleString("en-IN")) => (n == null ? "—" : fmt(n));

const SERIES = [
  { id: "views", label: "Views" },
  { id: "drapes", label: "Try-ons" },
  { id: "saves", label: "Saves" },
  { id: "clicks", label: "Buy clicks" },
] as const;
type SeriesKey = (typeof SERIES)[number]["id"];

/** Daily bars for one measure. Each bar has a tooltip title; the chart carries a text summary for screen readers. */
function DailyChart({ data, measure }: { data: SeriesDay[]; measure: SeriesKey }) {
  const max = Math.max(1, ...data.map((d) => d[measure]));
  const W = 720;
  const H = 180;
  const gap = data.length > 45 ? 1 : 3;
  const bar = (W - gap * (data.length - 1)) / data.length;
  const label = SERIES.find((s) => s.id === measure)!.label;
  const sum = data.reduce((n, d) => n + d[measure], 0);
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={`${label} per day, ${sum.toLocaleString("en-IN")} in total`} className="h-auto w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="currentColor" className="text-white/10" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const h = Math.max(d[measure] > 0 ? 2 : 0, (d[measure] / max) * H);
        return (
          <rect key={d.date} x={i * (bar + gap)} y={H - h} width={bar} height={h} rx={Math.min(3, bar / 2)} className="fill-accent-bright">
            <title>{`${d.date}: ${d[measure]} ${label.toLowerCase()}`}</title>
          </rect>
        );
      })}
      <text x={0} y={H + 16} className="fill-muted" fontSize={9}>
        {data[0]?.date.slice(5)}
      </text>
      <text x={W} y={H + 16} textAnchor="end" className="fill-muted" fontSize={9}>
        {data[data.length - 1]?.date.slice(5)}
      </text>
      <text x={W} y={12} textAnchor="end" className="fill-muted" fontSize={9}>
        {sum > 0 ? `peak ${max.toLocaleString("en-IN")}` : `No ${label.toLowerCase()} in this period`}
      </text>
    </svg>
  );
}

function Skeletons() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-60" />
    </div>
  );
}

export function InsightsView() {
  const [days, setDays] = useState(30);
  const [measure, setMeasure] = useState<SeriesKey>("drapes");

  const loadMetrics = useCallback((t: string, s: AbortSignal) => brandApi.metrics(t, days, s), [days]);
  const loadSeries = useCallback((t: string, s: AbortSignal) => brandApi.series(t, days, s), [days]);
  const loadCats = useCallback((t: string, s: AbortSignal) => brandApi.categoryStats(t, days, s), [days]);
  const loadTop = useCallback((t: string, s: AbortSignal) => brandApi.topPieces(t, days, s, 25), [days]);
  const metrics = useResource(loadMetrics);
  const series = useResource(loadSeries);
  const cats = useResource(loadCats);
  const top = useResource(loadTop);

  const m = metrics.data;
  const views = total(m?.storeViews);
  const drapes = total(m?.totalDrapes);
  const saves = total(m?.saves);
  const clicks = total(m?.clickOuts);
  const hasActivity = [views, drapes, saves, clicks].some((n) => (n ?? 0) > 0);

  const funnel = useMemo(
    () => [
      { label: "Views", n: views ?? 0 },
      { label: "Try-ons", n: drapes ?? 0 },
      { label: "Saves", n: saves ?? 0 },
      { label: "Buy clicks", n: clicks ?? 0 },
    ],
    [views, drapes, saves, clicks],
  );

  const exportPieces = () => {
    const rows = (top.data ?? []).map((p) => [p.title, p.sku, String(p.price), String(p.views), String(p.drapes), String(p.saves), String(p.shares), String(p.clicks), String(p.score)]);
    download(`threadflank-insights-${days}d-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(["Title", "SKU", "Price", "Views", "Try-ons", "Saves", "Shares", "Buy clicks", "Score"], rows));
  };

  const all = [metrics, series, cats, top];
  const failed = all.find((r) => r.status === "error");

  return (
    <div className="space-y-8">
      <BrandPageHeader
        eyebrow="Insights"
        title="What shoppers do with your pieces"
        blurb="Views, try-ons, saves and buy clicks, compared with the period before. Use it to see which pieces and categories to push."
        actions={
          <Segmented
            label="Period"
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            options={[
              { id: "7", label: "7 days" },
              { id: "30", label: "30 days" },
              { id: "90", label: "90 days" },
            ]}
          />
        }
      />

      {failed ? (
        <ErrorState message={failed.error} onRetry={() => all.forEach((r) => r.reload())} className="py-8" />
      ) : metrics.status === "loading" || !m ? (
        <Skeletons />
      ) : !hasActivity ? (
        <EmptyState
          icon={BarChart3}
          title="No shopper activity in this period yet"
          description="Numbers appear here as shoppers view your store, try pieces on, save them and tap Buy. Share your store link and publish more pieces to get going."
          action={
            <Link href="/catalog" className="btn-primary inline-flex h-10 items-center rounded-full px-5 text-sm">
              Go to catalog
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Views" value={show(views, formatCompactNumber)} change={m.storeViews?.changePct} hint="Store + piece views" />
            <StatCard label="Try-ons" value={show(drapes, formatCompactNumber)} change={m.totalDrapes?.changePct} hint="Draped on shoppers" />
            <StatCard label="Saves" value={show(saves, formatCompactNumber)} change={m.saves?.changePct} hint="Added to closets" />
            <StatCard label="Shares" value={show(total(m.shares), formatCompactNumber)} change={m.shares?.changePct} hint="Sent to friends" />
            <StatCard label="Buy clicks" value={show(clicks, formatCompactNumber)} change={m.clickOuts?.changePct} hint="To your website" />
            <StatCard label="New followers" value={show(total(m.newFollowers), formatCompactNumber)} change={m.newFollowers?.changePct} hint="Hear about your drops" />
          </div>

          <section className="space-y-3">
            <SectionHeader
              title="Activity by day"
              hint={`Last ${days} days (UTC days).`}
              action={<Segmented label="Measure" value={measure} onChange={(v) => setMeasure(v as SeriesKey)} options={SERIES.map((s) => ({ id: s.id, label: s.label }))} />}
            />
            <Card>{series.status === "ready" && series.data ? <DailyChart data={series.data} measure={measure} /> : <Skeleton className="h-48" />}</Card>
          </section>

          <section className="space-y-3">
            <SectionHeader title="From view to buy click" hint="How many shoppers go from one step to the next." />
            <Card className="space-y-3">
              {funnel.map((f, i) => {
                const pct = funnel[0].n > 0 ? (f.n / funnel[0].n) * 100 : 0;
                const step = i > 0 && funnel[i - 1].n > 0 ? Math.round((f.n / funnel[i - 1].n) * 100) : null;
                return (
                  <div key={f.label}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="text-white">{f.label}</span>
                      <span className="tabular-nums text-muted">
                        {f.n.toLocaleString("en-IN")}
                        {step !== null && ` · ${step}% of ${funnel[i - 1].label.toLowerCase()}`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-accent-bright" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader title="By category" hint="Where the attention goes." />
            <Card className="overflow-x-auto p-0 sm:p-0">
              {cats.status !== "ready" ? (
                <Skeleton className="h-32" />
              ) : (cats.data ?? []).length === 0 ? (
                <p className="p-5 text-sm text-muted">No activity on pieces yet.</p>
              ) : (
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      {["Category", "Views", "Try-ons", "Saves", "Shares", "Buy clicks"].map((h, i) => (
                        <th key={h} scope="col" className={cn("px-4 py-3 font-medium", i > 0 && "text-right")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cats.data!.map((c) => (
                      <tr key={c.category} className="border-t border-white/10 text-white/90">
                        <th scope="row" className="px-4 py-3 font-normal">
                          {c.category}
                        </th>
                        {[c.views, c.drapes, c.saves, c.shares, c.clicks].map((n, i) => (
                          <td key={i} className="px-4 py-3 text-right tabular-nums">
                            {n.toLocaleString("en-IN")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Top pieces"
              hint="Ranked by try-ons (×4), saves and shares (×3) and buy clicks (×2)."
              action={
                <ActionButton variant="ghost" onClick={exportPieces} disabled={(top.data ?? []).length === 0}>
                  <Download className="size-4" aria-hidden /> Export CSV
                </ActionButton>
              }
            />
            <Card className="overflow-x-auto p-0 sm:p-0">
              {top.status !== "ready" ? (
                <Skeleton className="h-40" />
              ) : (top.data ?? []).length === 0 ? (
                <p className="p-5 text-sm text-muted">No piece-level activity yet.</p>
              ) : (
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      {["#", "Piece", "Views", "Try-ons", "Saves", "Shares", "Buy clicks"].map((h, i) => (
                        <th key={h} scope="col" className={cn("px-4 py-3 font-medium", i > 1 && "text-right")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top.data!.map((p, i) => (
                      <tr key={p.id} className="border-t border-white/10 text-white/90">
                        <td className="px-4 py-3 tabular-nums text-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 flex-none overflow-hidden rounded-lg bg-white/5">{p.image && <Photo src={p.image} alt="" className="object-top" />}</div>
                            <div className="min-w-0">
                              <p className="truncate text-white">{p.title}</p>
                              <p className="truncate text-xs text-muted">
                                {p.sku ? `${p.sku} · ` : ""}
                                {formatRupee(p.price)}
                              </p>
                            </div>
                          </div>
                        </td>
                        {[p.views, p.drapes, p.saves, p.shares, p.clicks].map((n, j) => (
                          <td key={j} className="px-4 py-3 text-right tabular-nums">
                            {n.toLocaleString("en-IN")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
