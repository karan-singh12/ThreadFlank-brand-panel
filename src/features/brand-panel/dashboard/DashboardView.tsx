"use client";

import Link from "next/link";
import { ArrowRight, Award, BarChart3, Layers, Rocket, Shirt, ShieldCheck, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeader, StatCard } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Photo } from "@/components/ui/Photo";
import { Button } from "@/components/ui/Button";
import { cn, formatCompactNumber, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandAvatar } from "../BrandAvatar";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { Metric, ProductItem } from "../types";
import { useResource } from "../useResource";

const loadMetrics = brandApi.metrics;

const ACTIONS = [
  { href: "/catalog", label: "Add a garment", hint: "Grow your try-on catalog", icon: Layers },
  { href: "/drops", label: "Schedule a drop", hint: "Launch a collection", icon: Rocket },
  { href: "/ai-studio", label: "Make an AI video", hint: "Motion clips of your pieces", icon: Video },
  { href: "/bidding", label: "Bid for a slot", hint: "Be featured on Discover", icon: Award },
];

const total = (m?: Metric) => m?.total ?? null;
const show = (n: number | null, fmt: (v: number) => string = (v) => v.toLocaleString("en-IN")) => (n == null ? "—" : fmt(n));

export function DashboardView() {
  const { brand, products } = useReadyPanel();
  const metrics = useResource(loadMetrics);
  const m = metrics.data;

  const views = total(m?.storeViews);
  const drapes = total(m?.totalDrapes);
  const saves = total(m?.saves);
  const clicks = total(m?.clickOuts);
  const conversion = total(m?.conversionRate);
  const hasActivity = [views, drapes, saves, clicks].some((n) => (n ?? 0) > 0);

  const ready = products.filter((p) => p.isDrapeReady).length;
  const hasRank = brand.currentRank > 0 && brand.totalBrands > 0;

  return (
    <div className="space-y-8">
      <BrandPageHeader eyebrow="Dashboard" title="Overview" blurb="Your try-on performance, catalog and credits at a glance." />

      <Card strong className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <BrandAvatar name={brand.name} src={brand.logo} className="size-14 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="chrome-soft truncate text-2xl font-medium tracking-tight">{brand.name}</h2>
              {brand.verified && (
                <Badge tone="accent">
                  <ShieldCheck className="size-3" aria-hidden /> Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {hasRank ? (
                <>
                  Rank <span className="text-white">#{brand.currentRank}</span> of {brand.totalBrands} brands
                </>
              ) : (
                "Your try-on performance at a glance"
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-6 sm:text-right">
          {[
            ["Garments", products.length],
            ["Try-on ready", ready],
            ["AI credits", brand.aiCredits],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
              <p className="mt-0.5 text-xl font-medium tabular-nums text-white">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="card-violet group flex flex-col gap-3 rounded-(--radius-card) p-4 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
          >
            <span className="keycap flex size-10 items-center justify-center rounded-xl">
              <a.icon className="size-[18px] text-[#c9bcff]" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="flex items-center gap-1 text-sm text-white">
                {a.label}
                <ArrowRight className="size-3.5 text-accent-bright transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-0.5 block text-xs text-muted">{a.hint}</span>
            </span>
          </Link>
        ))}
      </section>

      <section aria-label="Performance" className="space-y-4">
        <SectionHeader title="Performance" hint="Change is versus the previous period." />
        {metrics.status === "loading" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-busy>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : metrics.status === "error" || !m ? (
          <ErrorState message={metrics.error} onRetry={metrics.reload} className="py-8" />
        ) : hasActivity ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Store views" value={show(views, formatCompactNumber)} change={m.storeViews?.changePct} hint="Showroom visits" />
              <StatCard label="Try-ons" value={show(drapes, formatCompactNumber)} change={m.totalDrapes?.changePct} hint="Draped on shoppers" />
              <StatCard label="Saves" value={show(saves, formatCompactNumber)} change={m.saves?.changePct} hint="Added to closets" />
              <StatCard label="Buy clicks" value={show(clicks, formatCompactNumber)} change={m.clickOuts?.changePct} hint="To your website" />
              <StatCard label="Conversion" value={show(conversion, (v) => `${v}%`)} change={m.conversionRate?.changePct} hint="Try-on to buy click" />
            </div>
            <Funnel
              stages={[
                { label: "Store views", value: views },
                { label: "Try-ons", value: drapes },
                { label: "Saves", value: saves },
                { label: "Buy clicks", value: clicks },
              ]}
            />
          </>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No activity yet"
            description="Once shoppers open your store and try on your pieces, views, try-ons and buy clicks show up here."
            action={<Button href="/catalog" size="sm">Add your first garment</Button>}
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Occasions products={products} />
        <TopGarments products={products} />
      </div>
    </div>
  );
}

/** Four stages side by side; each bar is sized against the largest and shows the step-over-step rate. */
function Funnel({ stages }: { stages: { label: string; value: number | null }[] }) {
  const max = Math.max(...stages.map((s) => s.value ?? 0), 1);
  return (
    <Card>
      <h3 className="text-sm font-medium text-white">From view to buy click</h3>
      <ol className="mt-5 grid gap-5 sm:grid-cols-4">
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].value : null;
          const rate = prev && s.value != null ? (s.value / prev) * 100 : null;
          return (
            <li key={s.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted">{s.label}</span>
                {rate != null && <span className="text-[11px] tabular-nums text-accent-bright">{rate.toFixed(1)}%</span>}
              </div>
              <p className="mt-1 text-xl font-medium tabular-nums text-white">{show(s.value, formatCompactNumber)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="presentation">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright" style={{ width: `${Math.max(4, ((s.value ?? 0) / max) * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Occasion mix from the brand's own catalog tags, weighted by try-ons (or by garment count until there are any). */
function Occasions({ products }: { products: ProductItem[] }) {
  const byDrapes = products.some((p) => (p.drapesCount ?? 0) > 0);
  const counts = new Map<string, number>();
  for (const p of products) for (const occ of p.occasions ?? []) counts.set(occ, (counts.get(occ) ?? 0) + (byDrapes ? (p.drapesCount ?? 0) : 1));
  const entries = Array.from(counts.entries());
  const sum = entries.reduce((a, [, n]) => a + n, 0);
  const rows = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Card className="space-y-4">
      <SectionHeader title="By occasion" hint={byDrapes ? "Share of try-ons" : "Share of your garments"} />
      {rows.length === 0 || sum === 0 ? (
        <EmptyState icon={Shirt} title="No occasion tags yet" description="Tag garments with occasions like Sangeet or Office to see the mix." className="py-8" />
      ) : (
        <ul className="space-y-4">
          {rows.map(([name, n]) => {
            const pct = Math.round((n / sum) * 100);
            return (
              <li key={name}>
                <div className="flex justify-between text-sm">
                  <span className="text-white">{name}</span>
                  <span className="tabular-nums text-muted">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="presentation">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function TopGarments({ products }: { products: ProductItem[] }) {
  const top = [...products].sort((a, b) => (b.drapesCount ?? 0) - (a.drapesCount ?? 0)).slice(0, 4);
  return (
    <Card className="space-y-4">
      <SectionHeader
        title="Top garments"
        hint="Most tried on"
        action={
          products.length > 0 ? (
            <Link href="/catalog" className="flex h-9 items-center gap-1 text-xs text-accent-bright hover:text-white">
              All {products.length} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : undefined
        }
      />
      {top.length === 0 ? (
        <EmptyState icon={Layers} title="Your catalog is empty" description="Add garments so shoppers can try them on." action={<Button href="/catalog" size="sm">Add a garment</Button>} className="py-8" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {top.map((p) => (
            <li key={p.id}>
              <Link href="/catalog" className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright">
                <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-(--radius-card) bg-[#0b0c22] ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-1")}>
                  {p.images?.[0] ? <Photo src={p.images[0]} alt={p.title} className="object-top" /> : <Shirt className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-muted" aria-hidden />}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#010214]/90 via-transparent to-transparent" />
                  <span className="absolute inset-x-2 bottom-2 text-[11px] tabular-nums text-white">{formatCompactNumber(p.drapesCount ?? 0)} try-ons</span>
                </span>
                <span className="mt-2 block truncate text-sm text-white">{p.title}</span>
                <span className="block text-xs text-muted">{p.price ? formatRupee(p.price) : "Price not set"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
