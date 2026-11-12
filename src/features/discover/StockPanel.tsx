"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/data/app-content";

/**
 * Stock-aware "Try this on your twin" (feature #20): pick a colour and size
 * that's actually available, then drape that exact variant.
 */
export function StockPanel({ variants, postImage, brandName }: { variants: ProductVariant[]; postImage: string; brandName: string }) {
  const products = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    for (const v of variants) map.set(v.productName, [...(map.get(v.productName) ?? []), v]);
    return [...map.entries()];
  }, [variants]);
  const [productName, setProductName] = useState(products[0]?.[0] ?? "");
  const rows = products.find(([name]) => name === productName)?.[1] ?? [];
  const colours = [...new Map(rows.map((v) => [v.color, v])).values()];
  const [chosenColour, setColour] = useState<string | undefined>(undefined);
  // Default to the first colour that has stock; a product switch resets the choice.
  const colour = colours.some((c) => c.color === chosenColour) ? chosenColour : (colours.find((c) => rows.some((r) => r.color === c.color && r.inStock)) ?? colours[0])?.color;
  const sizes = rows.filter((v) => v.color === colour);
  const [size, setSize] = useState<string | null>(null);
  const picked = sizes.find((v) => v.size === size) ?? null;
  const image = picked?.imageUrl ?? sizes[0]?.imageUrl ?? postImage;
  const anyInStock = rows.some((r) => r.inStock);

  if (!products.length) return null;

  const drapeUrl = `/drape?image=${encodeURIComponent(image)}&garmentUrl=${encodeURIComponent(image)}&brand=${encodeURIComponent(brandName)}&title=${encodeURIComponent(`${productName}${colour ? ` · ${colour}` : ""}${picked ? ` · ${picked.size}` : ""}`)}`;

  return (
    <div className="mx-1 mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      {products.length > 1 && (
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {products.map(([name]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setProductName(name);
                setSize(null);
                setColour(undefined);
              }}
              className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px]", name === productName ? "chip-on" : "bg-white/8 text-subtle")}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {colours.map((c) => (
          <button
            key={c.color}
            type="button"
            onClick={() => {
              setColour(c.color);
              setSize(null);
            }}
            title={c.color}
            aria-pressed={colour === c.color}
            className={cn("flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]", colour === c.color ? "border-accent-bright text-white" : "border-white/12 text-subtle")}
          >
            <span className="size-3 rounded-full border border-white/30" style={{ background: c.colorHex ?? "#888" }} />
            {c.color}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sizes.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={!v.inStock}
            onClick={() => setSize(v.size)}
            aria-pressed={size === v.size}
            title={v.inStock ? (v.stockCount != null && v.stockCount <= 3 ? `Only ${v.stockCount} left` : "In stock") : "Out of stock"}
            className={cn(
              "relative min-w-9 rounded-lg border px-2 py-1 text-xs",
              !v.inStock && "cursor-not-allowed border-white/8 text-muted line-through",
              v.inStock && size === v.size && "border-accent-bright bg-accent/25 text-white",
              v.inStock && size !== v.size && "border-white/15 text-white hover:border-white/30"
            )}
          >
            {v.size}
            {v.inStock && v.stockCount != null && v.stockCount <= 3 && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-300" />}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-subtle">
          {!anyInStock ? (
            <span className="text-red-300">Sold out</span>
          ) : picked ? (
            <>
              {picked.price != null && <span className="text-white">₹{picked.price.toLocaleString("en-IN")} · </span>}
              {picked.stockCount != null && picked.stockCount <= 3 ? `Only ${picked.stockCount} left` : "In stock"}
            </>
          ) : (
            "Pick a size"
          )}
        </span>
        <div className="flex gap-1.5">
          {picked?.productUrl && (
            <a href={picked.productUrl} target="_blank" rel="noreferrer" className="flex h-7 items-center gap-1 rounded-full border border-white/12 px-2.5 text-[11px] text-white">
              Buy <ExternalLink className="size-3" />
            </a>
          )}
          <Link
            href={drapeUrl}
            style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
            className="btn-primary flex h-7 items-center gap-1 rounded-xl px-2.5 text-[11px] font-semibold text-white"
          >
            <Shirt className="size-3" />
            Try on your twin
          </Link>
        </div>
      </div>
    </div>
  );
}
