"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, LoaderCircle, Shirt, Shuffle, Sparkles } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { cn } from "@/lib/utils";
import { OCCASIONS, wardrobeContent as copy } from "@/data/studio-content";
import { buildCombos } from "./combos";

type ShownCombo = { id: string; name: string; occasion: string; reason?: string; pieces: WardrobeItem[] };

/**
 * New outfits from what you already own (feature #4). The AI stylist builds
 * them on the server, favouring under-used pieces; if it's unavailable we fall
 * back to the local rule-based mix so the panel always has something.
 */
export function CombosPanel({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();
  const [occasion, setOccasion] = useState<string>("");
  const [focusUnderused, setFocusUnderused] = useState(true);
  const [aiCombos, setAiCombos] = useState<ShownCombo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(1);
  const [saved, setSaved] = useState<Record<string, "saving" | "saved">>({});
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const enough = items.length >= 2;

  const localCombos = useCallback(
    (s: number): ShownCombo[] =>
      buildCombos(items, s).map((c, i) => ({ id: c.id, name: `Wardrobe mix ${i + 1}`, occasion: c.occasion, pieces: c.pieces })),
    [items]
  );

  const generate = useCallback(async () => {
    if (!token || !enough) return;
    setLoading(true);
    try {
      const ai = await workspaceApi.aiCombos(token, { occasion: occasion || undefined, count: 3, focusUnderused });
      const shaped = ai
        .map((c, i) => ({ id: `${c.itemIds.join("+")}-${i}`, name: c.name, occasion: c.occasion, reason: c.reason, pieces: c.itemIds.map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p)) }))
        .filter((c) => c.pieces.length >= 2);
      if (!shaped.length) throw new Error("empty");
      setAiCombos(shaped);
    } catch {
      setSeed((s) => s + 1);
      setAiCombos(null);
    } finally {
      setLoading(false);
    }
  }, [token, enough, occasion, focusUnderused, byId]);

  // The instant local mix shows until the AI stylist answers (and again if it fails).
  const source: "ai" | "local" = aiCombos ? "ai" : "local";
  const combos = useMemo(() => aiCombos ?? localCombos(seed), [aiCombos, localCombos, seed]);

  const save = async (combo: ShownCombo) => {
    if (!token) return;
    setSaved((s) => ({ ...s, [combo.id]: "saving" }));
    try {
      await workspaceApi.saveLook(token, { name: combo.name, occasion: combo.occasion, image: combo.pieces[0].image, pieces: combo.pieces.map((p) => p.name) });
      setSaved((s) => ({ ...s, [combo.id]: "saved" }));
    } catch {
      setSaved((s) => {
        const next = { ...s };
        delete next[combo.id];
        return next;
      });
    }
  };

  return (
    <section className="card-violet rounded-(--radius-panel) p-5">
      <div>
        <h2 className="flex items-center gap-2 text-body font-medium text-white">
          <Sparkles className="size-4 text-accent-bright" />
          {copy.combosTitle}
        </h2>
        <p className="mt-1 text-xs text-muted">{copy.combosDescription}</p>
      </div>

      {!enough ? (
        <p className="mt-4 text-sm text-muted">{copy.combosNeedMore}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              aria-label="Occasion"
              className="h-8 rounded-full border border-white/12 bg-transparent px-3 text-xs text-white [&>option]:bg-[#0b0b1e]"
            >
              <option value="">Any occasion</option>
              {OCCASIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-subtle">
              <input type="checkbox" checked={focusUnderused} onChange={(e) => setFocusUnderused(e.target.checked)} className="size-3.5 accent-[#6645eb]" />
              Use forgotten pieces
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-full bg-accent-bright px-3 text-xs font-medium text-white hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Shuffle className="size-3.5" />}
              {source === "ai" && combos.length ? "More ideas" : "Ask the AI stylist"}
            </button>
          </div>
          {source === "local" && combos.length > 0 && <p className="mt-2 text-[11px] text-muted">Quick mixes shown — ask the AI stylist for smarter pairings.</p>}

          {combos.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{copy.combosNeedMore}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {combos.map((combo) => (
                <li key={combo.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="mb-2 truncate text-sm text-white">{combo.name}</p>
                  <div className="flex gap-1.5">
                    {combo.pieces.map((p) => (
                      <div key={p.id} title={p.name} className="aspect-square w-14 overflow-hidden rounded-lg bg-white/[0.05]">
                        <Photo src={p.image} alt={p.name} fit="contain" />
                      </div>
                    ))}
                  </div>
                  {combo.reason && <p className="mt-2 text-xs text-subtle">{combo.reason}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-muted">{OCCASIONS.find((o) => o.id === combo.occasion)?.label ?? combo.occasion}</span>
                    <div className="flex gap-1.5">
                      <Link href={`/drape?item=${combo.pieces[0].id}`} className="flex h-7 items-center gap-1 rounded-full bg-white/8 px-2.5 text-xs text-white hover:bg-white/12">
                        <Shirt className="size-3" />
                        {copy.drape}
                      </Link>
                      <button
                        type="button"
                        onClick={() => save(combo)}
                        disabled={Boolean(saved[combo.id])}
                        className={cn("flex h-7 items-center gap-1 rounded-full bg-white/8 px-2.5 text-xs text-white hover:bg-white/12 disabled:opacity-70")}
                      >
                        {saved[combo.id] === "saved" ? <Check className="size-3" /> : saved[combo.id] === "saving" ? <LoaderCircle className="size-3 animate-spin" /> : <Bookmark className="size-3" />}
                        {saved[combo.id] === "saved" ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
