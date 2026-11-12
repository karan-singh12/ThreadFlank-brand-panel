"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Notice } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { BarChart, CHART_COLORS } from "@/components/ui/BarChart";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type AnalyticsRow, type WardrobeAnalytics } from "@/features/workspace/api";
import { errorMessage } from "@/features/workspace/hooks";
import { rupees } from "./WardrobeView";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Wardrobe value, cost-per-wear and under-used items (feature #5). */
export function InsightsPanel() {
  const { token } = useAuth();
  const [data, setData] = useState<WardrobeAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    workspaceApi
      .wardrobeAnalytics(token)
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [token]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading">
        <LoaderCircle className="size-6 animate-spin text-accent-bright" />
      </div>
    );
  }

  const t = data.totals;
  if (t.items === 0) return <Notice>Add items to your wardrobe to see insights.</Notice>;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Wardrobe value" value={rupees(t.totalValue)} hint={`${t.pricedItems} of ${t.items} items priced`} />
        <Tile label="Average cost per wear" value={rupees(t.averageCostPerWear)} hint="across priced items" />
        <Tile label="Total wears logged" value={t.totalWears.toLocaleString()} hint={`${t.neverWornCount} never worn`} />
        <Tile label={`Unworn ${t.unwornDays}+ days`} value={String(t.unwornCount)} hint="give these an outing" />
      </div>

      {t.pricedItems < t.items && (
        <Notice>
          Add what you paid to more items in{" "}
          <Link href="/wardrobe" className="text-accent-bright hover:text-white">
            My items
          </Link>{" "}
          to get a truer cost per wear.
        </Notice>
      )}

      <section className="card-violet rounded-(--radius-panel) p-5">
        <BarChart
          title="Wears logged per month"
          height={140}
          rows={data.wearsByMonth.map((m) => ({ label: `${MONTHS[Number(m.month.slice(5, 7)) - 1]} ${m.month.slice(2, 4)}`, values: { wears: m.wears } }))}
          series={[{ key: "wears", label: "Wears", color: CHART_COLORS.series1 }]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankList title="Best value" icon={<TrendingDown className="size-4 text-green" />} rows={data.bestValue} empty="Log a few wears on priced items to see this." />
        <RankList title="Highest cost per wear" icon={<TrendingUp className="size-4 text-amber-200" />} rows={data.worstValue} empty="Add prices to your items to see this." />
      </div>

      <section>
        <h2 className="text-body font-medium text-white">Waiting for an outing</h2>
        <p className="mt-1 text-sm text-muted">Not worn in {t.unwornDays}+ days. Try them in a new combination.</p>
        {data.unworn.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing — you&apos;re getting good use out of your wardrobe.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.unworn.map((r) => (
              <Link key={r.id} href={`/drape?item=${r.id}`} className="group overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
                <div className="aspect-[3/4] bg-white/[0.05]">
                  <Photo src={r.image} alt={r.name} fit="contain" />
                </div>
                <p className="truncate px-2 pt-1.5 text-xs text-white">{r.name}</p>
                <p className="px-2 pb-2 text-[11px] text-muted">{r.daysSinceWorn != null ? `${r.daysSinceWorn} days ago` : "Never worn"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card-violet overflow-x-auto rounded-(--radius-panel) p-5">
        <h2 className="mb-3 text-body font-medium text-white">By category</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 text-right font-medium">Items</th>
              <th className="py-2 text-right font-medium">Wears</th>
              <th className="py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.byCategory.map((c) => (
              <tr key={c.category} className="border-t border-white/6 text-subtle">
                <td className="py-2 text-white">{c.category}</td>
                <td className="py-2 text-right">{c.items}</td>
                <td className="py-2 text-right">{c.wears}</td>
                <td className="py-2 text-right">{rupees(c.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card-violet rounded-(--radius-card) p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-[1.6rem] font-medium leading-tight text-white">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

function RankList({ title, icon, rows, empty }: { title: string; icon: React.ReactNode; rows: AnalyticsRow[]; empty: string }) {
  return (
    <section className="card-violet rounded-(--radius-panel) p-5">
      <h2 className="flex items-center gap-2 text-body font-medium text-white">
        {icon}
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3">
              <span className="aspect-square w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                <Photo src={r.image} alt="" fit="contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{r.name}</span>
                <span className="block text-xs text-muted">
                  {rupees(r.costPaid)} · worn {r.wornCount}×
                </span>
              </span>
              <span className="text-sm text-white">{rupees(r.costPerWear)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
