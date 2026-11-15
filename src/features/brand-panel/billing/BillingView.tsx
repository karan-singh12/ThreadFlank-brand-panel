"use client";

import { useState } from "react";
import { Check, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { brandApi } from "../api";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import type { BillingPlan, BillingQuote, PlanLimits } from "../types";
import { errorMessage, useResource } from "../useResource";
import { buyPack } from "./checkout";

const loadOverview = (token: string, signal: AbortSignal) => brandApi.billing(token, signal);
const loadHistory = (token: string, signal: AbortSignal) => brandApi.billingPayments(token, signal);

/** Rupees with paise only when there are some: 1,499 and 1,199.20. */
const formatRupee = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

const USAGE: { key: keyof PlanLimits; label: string }[] = [
  { key: "garments", label: "Pieces in catalog" },
  { key: "drops", label: "Launches at a time" },
  { key: "team", label: "Team members" },
];

const limitText = (l: PlanLimits) => `${l.garments.toLocaleString("en-IN")} pieces · ${l.drops} launch${l.drops === 1 ? "" : "es"} · ${l.team} team member${l.team === 1 ? "" : "s"}`;

const when = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Credits and billing: the balance, packs, a promo code, and past purchases. Only the owner can pay. */
export function BillingView() {
  const { token, user } = useAuth();
  const { brand, setCredits } = useReadyPanel();
  const overview = useResource(loadOverview);
  const history = useResource(loadHistory);
  const team = useResource(brandApi.team);

  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<BillingQuote | null>(null);
  const [codeError, setCodeError] = useState("");
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const me = (team.data ?? []).find((m) => m.email.toLowerCase() === (user?.email ?? "").toLowerCase());
  const isOwner = me?.role === "OWNER";
  const data = overview.data;

  const applyCode = async () => {
    if (!token || !code.trim() || !data) return;
    setChecking(true);
    setCodeError("");
    setQuote(null);
    try {
      // Any pack works for validating: the discount is the same percentage on all of them.
      setQuote(await brandApi.billingQuote(token, data.packs[0].id, code.trim()));
    } catch (e) {
      setCodeError(errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const priceOf = (p: { price: number }) => (quote?.percentOff ? Math.max(1, Math.round(p.price * (100 - quote.percentOff)) / 100) : p.price);
  const creditsOf = (p: { credits: number }) => p.credits + (quote?.bonusCredits ?? 0);

  const buy = async (pack: { id: string; name: string }) => {
    if (!token) return;
    setBusy(pack.id);
    setError("");
    setNotice("");
    try {
      const res = await buyPack(token, pack, quote?.code ?? undefined, { email: user?.email, name: brand.name });
      if (res.status === "paid") {
        setCredits(res.balance);
        overview.reload();
        history.reload();
        setQuote(null);
        setCode("");
        setNotice(
          res.plan && res.plan.id !== "FREE"
            ? `Payment received. Your ${res.plan.name} plan is active until ${when(res.plan.until ?? new Date().toISOString())}, and ${res.credits} credits were added. You now have ${res.balance}.`
            : `Payment received. ${res.credits} credits were added. You now have ${res.balance}.`
        );
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <BrandPageHeader
        eyebrow="Billing"
        title="Credits and billing"
        blurb="AI credits pay for the writing tools in AI Studio. Buy a pack when you need more; credits never expire."
        actions={
          <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white tabular-nums">
            Balance · <span className="font-medium">{data?.credits ?? brand.aiCredits} credits</span>
          </p>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {overview.status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : overview.status === "error" || !data ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : (
        <>
          {!data.paymentsEnabled && <Notice tone="info">Online payments are being switched on. Packs can&apos;t be bought yet. Your free credits still work.</Notice>}
          {team.status === "ready" && !isOwner && <Notice tone="info">Only the brand owner can buy credits. You can see the packs and your balance.</Notice>}

          <section className="space-y-3">
            <SectionHeader title="Your plan" hint="Plans are paid for 30 days at a time. When one ends, your account goes back to Free; nothing is deleted." />
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-medium text-white">
                  {data.plan.name} plan
                  {data.plan.until && <span className="ml-3 text-sm font-normal text-muted">active until {when(data.plan.until)}</span>}
                </p>
                <p className="text-xs text-muted">{limitText(data.plan.limits)}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {USAGE.map(({ key, label }) => {
                  const used = data.plan.usage[key];
                  const max = data.plan.limits[key];
                  const pct = Math.min(100, Math.round((used / max) * 100));
                  return (
                    <div key={key}>
                      <p className="flex justify-between text-xs text-muted">
                        <span>{label}</span>
                        <span className="tabular-nums text-white">{used} / {max}</span>
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={label} aria-valuenow={used} aria-valuemin={0} aria-valuemax={max}>
                        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-300" : "bg-accent-bright")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <section className="grid gap-4 md:grid-cols-3" aria-label="Monthly plans">
              {data.plans.map((p: BillingPlan) => {
                const isCurrent = data.plan.id === p.id;
                return (
                  <Card key={p.id} strong={p.featured} className={cn("flex flex-col gap-3", p.featured && "ring-1 ring-accent-bright/50")}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">{p.name}</h3>
                      {isCurrent ? <Badge>Your plan</Badge> : p.featured ? <Badge>Most popular</Badge> : null}
                    </div>
                    <p className="text-3xl font-medium tabular-nums text-white">
                      {formatRupee(p.price === 0 ? 0 : priceOf(p))}
                      <span className="ml-1 text-sm font-normal text-muted">/ month</span>
                      {p.price > 0 && quote?.percentOff ? <span className="ml-2 text-sm font-normal text-muted line-through">{formatRupee(p.price)}</span> : null}
                    </p>
                    <ul className="space-y-1.5 text-sm text-white/90">
                      <li className="flex items-center gap-1.5"><Check className="size-3.5 text-green" aria-hidden /> Up to {p.limits.garments.toLocaleString("en-IN")} pieces in your catalog</li>
                      <li className="flex items-center gap-1.5"><Check className="size-3.5 text-green" aria-hidden /> {p.limits.drops} launch{p.limits.drops === 1 ? "" : "es"} at a time</li>
                      <li className="flex items-center gap-1.5"><Check className="size-3.5 text-green" aria-hidden /> {p.limits.team} team member{p.limits.team === 1 ? "" : "s"}</li>
                      {p.credits > 0 && <li className="flex items-center gap-1.5"><Check className="size-3.5 text-green" aria-hidden /> {creditsOf(p)} AI credits every month</li>}
                    </ul>
                    {p.price === 0 ? (
                      <p className="mt-auto pt-2 text-xs text-muted">{isCurrent ? "You are on this plan." : "Where you land when a paid plan ends."}</p>
                    ) : (
                      <ActionButton className="mt-auto" loading={busy === p.orderId} disabled={!data.paymentsEnabled || !isOwner || (busy !== null && busy !== p.orderId)} onClick={() => buy({ id: p.orderId, name: p.name + " plan" })}>
                        {isCurrent ? `Renew ${p.name}` : `Get ${p.name}`}
                      </ActionButton>
                    )}
                  </Card>
                );
              })}
            </section>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Promo code" hint="Have a code? Apply it to see the new prices on plans and credit packs." />
            <div className="flex max-w-md items-end gap-2">
              <div className="flex-1">
                <Field label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LAUNCH20" maxLength={32} />
              </div>
              <ActionButton variant="ghost" loading={checking} onClick={applyCode} disabled={!code.trim()}>
                <Tag className="size-4" aria-hidden /> Apply
              </ActionButton>
            </div>
            {codeError && <p className="text-xs text-red-300">{codeError}</p>}
            {quote && (
              <p className="flex items-center gap-1.5 text-xs text-green">
                <Check className="size-3.5" aria-hidden /> {quote.code} applied
                {quote.percentOff ? ` · ${quote.percentOff}% off` : ""}
                {quote.bonusCredits ? ` · +${quote.bonusCredits} bonus credits` : ""}
              </p>
            )}
          </section>

          <div className="space-y-3">
            <SectionHeader title="AI credit packs" hint="Need more AI credits than your plan includes? Packs never expire." />
          <section className="grid gap-4 md:grid-cols-3" aria-label="Credit packs">
            {data.packs.map((p) => (
              <Card key={p.id} strong={p.featured} className={cn("flex flex-col gap-4", p.featured && "ring-1 ring-accent-bright/50")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{p.name}</h3>
                  {p.featured && <Badge>Most popular</Badge>}
                </div>
                <div>
                  <p className="text-3xl font-medium tabular-nums text-white">
                    {formatRupee(priceOf(p))}
                    {quote?.percentOff ? <span className="ml-2 text-sm font-normal text-muted line-through">{formatRupee(p.price)}</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-muted">{data.gstNote}</p>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-white">
                  <Sparkles className="size-4 text-accent-bright" aria-hidden />
                  <span className="tabular-nums">{creditsOf(p)}</span> credits
                  {quote?.bonusCredits ? <span className="text-xs text-green">(+{quote.bonusCredits} bonus)</span> : null}
                </p>
                <p className="text-xs text-muted">
                  {p.blurb} · about ₹{p.perCredit.toFixed(2)} per credit
                </p>
                <ActionButton className="mt-auto" loading={busy === p.id} disabled={!data.paymentsEnabled || !isOwner || (busy !== null && busy !== p.id)} onClick={() => buy(p)}>
                  Buy {p.name}
                </ActionButton>
              </Card>
            ))}
          </section>
          </div>

          <section className="space-y-3">
            <SectionHeader title="Past purchases" hint="Receipts are emailed by Razorpay." />
            <Card className="overflow-x-auto p-0 sm:p-0">
              {history.status !== "ready" ? (
                <Skeleton className="h-24" />
              ) : (history.data ?? []).length === 0 ? (
                <p className="p-5 text-sm text-muted">No purchases yet.</p>
              ) : (
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      {["Date", "Pack", "Credits", "Paid", "Status"].map((h, i) => (
                        <th key={h} scope="col" className={cn("px-4 py-3 font-medium", i >= 2 && i <= 3 && "text-right")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.data!.map((p) => (
                      <tr key={p.id} className="border-t border-white/10 text-white/90">
                        <td className="px-4 py-3">{when(p.paidAt ?? p.createdAt)}</td>
                        <td className="px-4 py-3">
                          {p.pack}
                          {p.coupon && <span className="ml-2 text-xs text-muted">{p.coupon}</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.credits}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatRupee(p.amount)}</td>
                        <td className="px-4 py-3">{p.status === "PAID" ? <Badge>Paid</Badge> : p.status === "FAILED" ? <Badge tone="warning">Failed</Badge> : <Badge tone="warning">Not completed</Badge>}</td>
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
