"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/config";

/** Pings the backend's health endpoint once on load so a sleeping host is awake by the time the user acts. */
export function BackendWarmup() {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health/live`, { signal: controller.signal, cache: "no-store" }).catch(() => {});
    return () => controller.abort();
  }, []);

  return null;
}
