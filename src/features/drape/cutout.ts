"use client";

import { useEffect, useState } from "react";
import { toFile } from "./tryon";

/** A person with the studio backdrop removed, plus where they sit in the frame (fractions). */
export type CutoutResult = { url: string; box: { x: number; y: number; w: number; h: number } | null };

// One request per image per session; null means "couldn't cut out, show the original".
const cutouts = new Map<string, Promise<CutoutResult | null>>();

export function cutoutFor(src: string): Promise<CutoutResult | null> {
  let pending = cutouts.get(src);
  if (!pending) {
    pending = (async () => {
      try {
        const file = await toFile(src, "image");
        const res = await fetch("/api/cutout", { method: "POST", body: file });
        if (!res.ok) return null;
        let box: CutoutResult["box"] = null;
        try {
          box = JSON.parse(res.headers.get("X-Subject-Box") ?? "null");
        } catch {
          box = null;
        }
        return { url: URL.createObjectURL(await res.blob()), box };
      } catch {
        return null;
      }
    })();
    cutouts.set(src, pending);
  }
  return pending;
}

/**
 * Starts the cut-out and waits for it (at most `maxMs`), so a new render can be
 * revealed already standing in the scene instead of flashing its studio backdrop.
 */
export async function prepareCutout(src: string, maxMs = 10_000) {
  await Promise.race([cutoutFor(src), new Promise((resolve) => setTimeout(resolve, maxMs))]);
}

/** `undefined` while working, `null` if the cut-out failed, otherwise the cut-out. */
export function useCutout(src: string | undefined, enabled = true) {
  const [state, setState] = useState<{ src?: string; result: CutoutResult | null | undefined }>({ result: undefined });

  useEffect(() => {
    if (!src || !enabled) return;
    let live = true;
    cutoutFor(src).then((result) => live && setState({ src, result }));
    return () => {
      live = false;
    };
  }, [src, enabled]);

  return state.src === src ? state.result : undefined;
}
