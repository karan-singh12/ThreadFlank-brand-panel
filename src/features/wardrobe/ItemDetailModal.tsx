"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  Edit2,
  ExternalLink,
  IndianRupee,
  LoaderCircle,
  Repeat2,
  Shirt,
  Sparkles,
  Tag,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { ActionButton } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { type WardrobeItem } from "@/features/workspace/api";
import { isUnworn, rupees } from "./WardrobeView";
import { cn } from "@/lib/utils";

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  onClose: () => void;
  onWorn: (item: WardrobeItem) => void;
  onUndo: (item: WardrobeItem) => void;
  onEditPrice: (item: WardrobeItem) => void;
  onRemove: (item: WardrobeItem) => void;
  busy: boolean;
}

export function ItemDetailModal({
  item,
  onClose,
  onWorn,
  onUndo,
  onEditPrice,
  onRemove,
  busy,
}: ItemDetailModalProps) {
  if (!item) return null;

  const unworn = isUnworn(item);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-[#090b1e] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-muted transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col gap-6">
          {/* Garment Image Showcase */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
            <Photo src={item.image} alt={item.name} fit="contain" />
            {unworn && (
              <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-canvas">
                Unworn 90+ days
              </span>
            )}
          </div>

          {/* Title & Metadata */}
          <div>
            <h2 className="text-xl font-bold text-white">{item.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {item.brand && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/90">
                  {item.brand}
                </span>
              )}
              {item.category && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/90">
                  {item.category}
                </span>
              )}
              {item.color && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted">
                  {item.color}
                </span>
              )}
            </div>
          </div>

          {/* Cost-per-wear Insights Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-bright">
                Cost-per-wear Insights
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPrice(item);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-bright hover:underline"
              >
                <Edit2 className="size-3" />
                {item.costPaid != null ? "Edit Price" : "Add Price"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-left">
                <p className="text-[10px] uppercase tracking-wider text-muted">Cost / Wear</p>
                <p className="mt-1 text-base font-bold text-white">
                  {item.costPerWear != null ? `${rupees(item.costPerWear)}` : "—"}
                </p>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-left">
                <p className="text-[10px] uppercase tracking-wider text-muted">Times Worn</p>
                <p className="mt-1 text-base font-bold text-white">{item.wornCount}×</p>
              </div>

              <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-left col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-muted">Purchase Price</p>
                <p className="mt-1 text-base font-bold text-white">
                  {item.costPaid != null ? rupees(item.costPaid) : "Not set"}
                </p>
              </div>
            </div>

            {item.lastWornAt && (
              <p className="mt-3 text-[11px] text-muted">
                Last worn on {new Date(item.lastWornAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="size-3.5 text-muted" />
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/6 bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onWorn(item)}
                disabled={busy}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Repeat2 className="size-4" />}
                Wore it today
              </button>

              {item.wornCount > 0 && (
                <button
                  type="button"
                  onClick={() => onUndo(item)}
                  disabled={busy}
                  title="Undo last wear"
                  className="flex size-11 items-center justify-center rounded-xl border border-white/10 text-muted transition hover:bg-white/10 hover:text-white"
                >
                  <Undo2 className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/drape?item=${item.id}`}
                className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition hover:brightness-110"
              >
                <Shirt className="size-4 text-white" />
                Try on in Drape Studio
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove "${item.name}" from your wardrobe?`)) {
                    onRemove(item);
                    onClose();
                  }
                }}
                disabled={busy}
                title="Remove item"
                className="flex size-11 items-center justify-center rounded-xl border border-red-500/20 text-red-400 transition hover:bg-red-500/15"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
