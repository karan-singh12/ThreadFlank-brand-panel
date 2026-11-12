"use client";

import { ExternalLink, Pencil, Shirt, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatCompactNumber, formatRupee } from "@/lib/utils";
import { brandApi } from "../api";
import type { ProductItem } from "../types";
import { LOW_STOCK_AT } from "./constants";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** One garment: photo first, then price, the buy-redirect and its numbers. */
export function ProductCard({ product, onEdit, onDelete }: { product: ProductItem; onEdit: () => void; onDelete: () => void }) {
  const { token } = useAuth();
  const image = product.images?.[0];
  const host = hostOf(product.buyUrl);
  const out = product.stock <= 0;
  const low = !out && product.stock <= LOW_STOCK_AT;

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_50%_30%,#1c1840_0%,#0b0c22_75%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-30px_rgba(0,0,0,0.9)] transition-[transform,box-shadow] duration-300 md:group-hover:-translate-y-1.5 md:group-hover:shadow-[inset_0_0_0_1px_rgba(171,154,255,0.45),0_30px_60px_-24px_rgba(102,69,235,0.5)]">
        {image ? (
          <Photo src={image} alt={product.title} className="object-top transition-transform duration-500 md:group-hover:scale-[1.04]" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-muted">
            <Shirt className="size-8" strokeWidth={1.5} aria-label="No image" />
          </span>
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#010214]/80 via-transparent to-transparent" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {product.isDrapeReady ? <Badge tone="success" className="bg-canvas/80 backdrop-blur-md">Try-on ready</Badge> : <Badge className="bg-canvas/80 backdrop-blur-md">Not ready</Badge>}
        </div>
        {(out || low) && (
          <div className="absolute right-2.5 top-2.5">
            <Badge tone={out ? "warning" : "neutral"} className="bg-canvas/80 backdrop-blur-md">
              {out ? "Out of stock" : `${product.stock} left`}
            </Badge>
          </div>
        )}
        <p className="absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[11px] tabular-nums text-white">
          <span>{formatCompactNumber(product.drapesCount ?? 0)} try-ons</span>
          <span>{formatCompactNumber(product.clicksCount ?? 0)} buy clicks</span>
        </p>
      </div>

      <div className="px-1 pt-3">
        <h3 className="truncate text-sm text-white">{product.title}</h3>
        <p className="mt-0.5 flex items-center justify-between text-xs">
          <span className="font-medium text-ink-soft">{formatRupee(product.price)}</span>
          <span className="truncate pl-2 text-muted">{product.category}</span>
        </p>

        <div className="mt-3 flex items-center gap-2">
          {host ? (
            <a
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (token) void brandApi.trackBuyClick(token, product.id).catch(() => undefined);
              }}
              title={`Opens ${product.buyUrl}`}
              className="glass-pill flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-full px-4 text-xs text-white/90 transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
            >
              <span className="truncate">{host}</span>
              <ExternalLink className="size-3.5 shrink-0 text-accent-bright" aria-hidden />
            </a>
          ) : (
            <span className="flex h-10 flex-1 items-center rounded-full bg-[#f6c453]/10 px-4 text-xs text-[#f6c453] ring-1 ring-[#f6c453]/25">No buy link set</span>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${product.title}`}
            className="glass-pill flex size-10 shrink-0 items-center justify-center rounded-full text-subtle transition-[filter] hover:text-white hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
          >
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${product.title}`}
            className="glass-pill flex size-10 shrink-0 items-center justify-center rounded-full text-subtle transition-[filter] hover:text-white hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
