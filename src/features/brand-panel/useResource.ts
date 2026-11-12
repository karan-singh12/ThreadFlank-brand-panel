"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

type State<T> = { data: T | null; status: "loading" | "ready" | "error"; error: string };

/** Loads one resource for the signed-in user. `setData` applies a server response after a write. */
export function useResource<T>(load: (token: string, signal: AbortSignal) => Promise<T>) {
  const { token } = useAuth();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ data: null, status: "loading", error: "" });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    load(token, controller.signal)
      .then((data) => setState({ data, status: "ready", error: "" }))
      .catch((e) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, status: "error", error: errorMessage(e) }));
      });
    return () => controller.abort();
  }, [token, load, version]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    setVersion((v) => v + 1);
  }, []);

  const setData = useCallback((update: (prev: T | null) => T | null) => setState((s) => ({ ...s, data: update(s.data) })), []);

  return { ...state, reload, setData };
}
