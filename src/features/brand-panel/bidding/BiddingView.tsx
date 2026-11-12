"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Award, CheckCircle2 } from "lucide-react";
import { ActionButton, Label, Notice } from "@/components/ui/Controls";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandPageHeader } from "../BrandPageHeader";
import { useReadyPanel } from "../BrandPanelProvider";
import { cn, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import type { BidSlot } from "../types";
import { errorMessage, useResource } from "../useResource";

const loadSlots = brandApi.slots;
/** Fallback if the server does not say what the least bid is. */
const MIN_BID = 1000;
const nextMin = (s: BidSlot) => s.minimumBid ?? Math.max(MIN_BID, s.currentHighestBid + 1);
const QUICK_ADD = [2000, 5000, 10000];

export function BiddingView() {
  const slots = useResource(loadSlots);
  const { brand } = useReadyPanel();
  const approved = brand.status === "ACTIVE";
  const [selected, setSelected] = useState<BidSlot | null>(null);
  const [notice, setNotice] = useState("");
  const list = slots.data ?? [];

  const winning = list.filter((s) => s.status === "winning").length;
  const hours = list.map((s) => s.endsInHours).filter((h): h is number => typeof h === "number");
  const remaining = hours.length ? Math.min(...hours) : null;

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="Bidding"
        title="Runway spotlight"
        blurb={`Bid for featured placements on Discover. The highest bid when the auction ends wins the slot, and our team will contact you to settle payment${remaining != null ? `. ${remaining}h remaining.` : "."}`}
        actions={
          slots.status === "ready" && (
            <p className="glass-pill flex h-11 items-center gap-2 rounded-full px-5 text-sm text-white">
              <span className="size-2 rounded-full bg-green" aria-hidden />
              {winning} leading {winning === 1 ? "slot" : "slots"}
            </p>
          )
        }
      />

      {!approved && <Notice tone="info">Your brand is still being reviewed. You can look at the auctions now and bid once you are approved.</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {slots.status === "loading" ? (
        <div className="space-y-3" aria-busy>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : slots.status === "error" ? (
        <ErrorState message={slots.error} onRetry={slots.reload} className="py-16" />
      ) : list.length === 0 ? (
        <EmptyState icon={Award} title="No auction is open right now" description="Runway spotlight auctions appear here when Threadflank opens a new round. Check back soon." className="py-16" />
      ) : (
        <div className="card-violet overflow-hidden rounded-(--radius-panel)">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3.5 text-[11px] uppercase tracking-wider text-muted md:grid">
            <div className="col-span-4">Spotlight slot</div>
            <div className="col-span-3">Projected reach</div>
            <div className="col-span-2">Top bid</div>
            <div className="col-span-3 text-right">Your standing</div>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {list.map((slot) => (
              <li key={slot.rankPosition} className="grid grid-cols-1 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:px-6 md:grid-cols-12">
                <div className="flex items-center gap-3.5 md:col-span-4">
                  <span className="keycap flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-medium text-white">#{slot.rankPosition}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{slot.title || slot.category}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {slot.category} · {slot.period}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs md:col-span-3 md:flex-col md:justify-center">
                  <span className="text-muted md:hidden">Reach</span>
                  <span className="font-medium text-white/90">{slot.impressionsEstimate || "—"}</span>
                  <span className="hidden text-[11px] text-muted md:block">Estimated footprint</span>
                </div>

                <div className="flex justify-between text-xs md:col-span-2 md:flex-col md:justify-center">
                  <span className="text-muted md:hidden">Highest bid</span>
                  <span className="font-medium tabular-nums text-white">{slot.currentHighestBid > 0 ? formatRupee(slot.currentHighestBid) : "No bids yet"}</span>
                  <span className="hidden text-[10px] text-muted md:block">{slot.currentHighestBid > 0 ? "Current leader" : `Starts at ${formatRupee(nextMin(slot))}`}</span>
                </div>

                <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
                  {slot.status === "winning" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-2.5 py-1 text-xs text-green ring-1 ring-green/30">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Winning {formatRupee(slot.yourCurrentBid ?? slot.currentHighestBid)}
                    </span>
                  ) : slot.status === "outbid" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6c453]/10 px-2.5 py-1 text-xs text-[#f6c453] ring-1 ring-[#f6c453]/30">
                      <AlertTriangle className="size-3.5" aria-hidden />
                      Outbid
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Open</span>
                  )}
                  <ActionButton
                    variant={slot.status === "winning" ? "ghost" : "primary"}
                    className="h-9 px-4"
                    disabled={!approved}
                    title={approved ? undefined : "Available once your brand is approved"}
                    onClick={() => {
                      setNotice("");
                      setSelected(slot);
                    }}
                  >
                    {slot.status === "winning" ? "Raise bid" : "Place bid"}
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Spotlight #${selected.rankPosition}` : "Place a bid"}>
        {selected && (
          <BidForm
            key={selected.rankPosition}
            slot={selected}
            onPlaced={(slot, message) => {
              slots.setData((prev) => (prev ?? []).map((s) => (s.rankPosition === slot.rankPosition ? { ...s, ...slot } : s)));
              setNotice(message);
              setSelected(null);
            }}
            onCancel={() => setSelected(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function BidForm({ slot, onPlaced, onCancel }: { slot: BidSlot; onPlaced: (slot: BidSlot, message: string) => void; onCancel: () => void }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState(String(slot.currentHighestBid > 0 ? slot.currentHighestBid + 2000 : nextMin(slot)));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const value = Number(amount);
    const least = nextMin(slot);
    if (!Number.isFinite(value) || value < least) {
      return setError(slot.currentHighestBid > 0 ? `Your bid must be higher than the current top bid of ${formatRupee(slot.currentHighestBid)}.` : `The starting bid is ${formatRupee(least)}.`);
    }
    setBusy(true);
    setError("");
    try {
      const res = await brandApi.placeBid(token, slot.rankPosition, value);
      onPlaced(res.slot, res.message || `Bid of ${formatRupee(value)} placed.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="-mt-2">
        <p className="text-sm text-white">{slot.category}</p>
        <p className="mt-1 text-xs text-muted">
          {slot.currentHighestBid > 0 ? (
            <>
              Highest bid right now: <span className="font-medium tabular-nums text-white">{formatRupee(slot.currentHighestBid)}</span>
            </>
          ) : (
            <>
              No bids yet. Starting bid: <span className="font-medium tabular-nums text-white">{formatRupee(nextMin(slot))}</span>
            </>
          )}
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="bid-amount">Your bid (₹)</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">₹</span>
          <input
            id="bid-amount"
            type="number"
            inputMode="numeric"
            autoFocus
            min={nextMin(slot)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3.5 text-sm tabular-nums text-white outline-none transition hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">Quick add</span>
        {QUICK_ADD.map((inc) => (
          <button
            key={inc}
            type="button"
            onClick={() => setAmount(String((Number(amount) || nextMin(slot) - 1) + inc))}
            className={cn("h-8 rounded-full border border-white/12 px-3 text-xs text-subtle transition-colors hover:border-white/25 hover:text-white")}
          >
            +{formatRupee(inc)}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <ActionButton variant="ghost" onClick={onCancel}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={busy}>
          Confirm bid
        </ActionButton>
      </div>
    </form>
  );
}
