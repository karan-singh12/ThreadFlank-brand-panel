"use client";

import { useCallback, useSyncExternalStore } from "react";

// Per-browser JSON store for data the backend doesn't model yet (Twin Circle
// members, scene preference). Swap these hooks for API calls once it does.

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `fallback` must be referentially stable (a module constant). */
export function useLocalStore<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback
  );

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage full or blocked: keep the in-memory value so the UI still updates this session.
        cache.set(key, { raw: null, value: resolved });
      }
      listeners.forEach((l) => l());
    },
    [key, fallback]
  );

  return [value, update] as const;
}
