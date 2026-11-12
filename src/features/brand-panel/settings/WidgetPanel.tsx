"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Plus, RefreshCw, X } from "lucide-react";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "../api";
import type { WidgetInfo } from "../types";
import { errorMessage, useResource } from "../useResource";

/** Where widget.js is served from: the shopper app, since that is where the try-on runs. */
const WIDGET_ORIGIN = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "https://YOUR-APP-DOMAIN";
const load = brandApi.widget;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-medium tabular-nums text-white">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export function WidgetPanel() {
  const widget = useResource(load);
  const { token } = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  if (widget.status === "loading") return <Skeleton className="h-64" />;
  if (widget.status === "error" || !widget.data) return <Notice tone="error">{widget.error || "Could not load the widget."}</Notice>;
  const w: WidgetInfo = widget.data;

  const snippet = `<script src="${WIDGET_ORIGIN}/widget.js" data-threadflank-key="${w.key}" async></script>`;

  const run = async (fn: () => Promise<WidgetInfo>) => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const next = await fn();
      widget.setData(() => next);
    } catch (e) {
      setError(errorMessage(e));
      widget.reload();
    } finally {
      setBusy(false);
    }
  };

  const saveDomains = (domains: string[]) => run(() => brandApi.setWidgetDomains(token!, domains));
  const addDomain = async () => {
    const value = draft.trim();
    if (!value) return;
    await saveDomains([...w.domains, value]);
    setDraft("");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked copying. Select the code and copy it by hand.");
    }
  };

  return (
    <div className="space-y-5">
      {w.live ? (
        <Notice tone="success">Your try-on widget is live.</Notice>
      ) : (
        <Notice tone="info">
          {w.status === "ACTIVE" ? "Your widget has been switched off by Threadflank. Contact support to turn it back on." : "Your widget goes live as soon as your brand is approved. You can set it up now."}
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Try-ons, last 30 days" value={w.last30Days.sessions} />
        <Stat label="Completed" value={w.last30Days.succeeded} />
      </div>

      <section className="space-y-2.5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">1. Add this to your product pages</h3>
        <pre className="overflow-x-auto rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-white/90 ring-1 ring-white/8">{snippet}</pre>
        {WIDGET_ORIGIN.includes("YOUR-APP-DOMAIN") && <p className="text-[11px] text-[#f6c453]">Replace YOUR-APP-DOMAIN with your Threadflank app address (or set NEXT_PUBLIC_WIDGET_ORIGIN).</p>}
        <div className="flex gap-2">
          <ActionButton variant="ghost" onClick={copy}>
            {copied ? <Check className="size-4 text-green" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy code"}
          </ActionButton>
          {confirmRotate ? (
            <>
              <ActionButton
                variant="danger"
                loading={busy}
                onClick={async () => {
                  await run(() => brandApi.rotateWidgetKey(token!));
                  setConfirmRotate(false);
                }}
              >
                Yes, replace the key
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirmRotate(false)}>
                Cancel
              </ActionButton>
            </>
          ) : (
            <ActionButton variant="ghost" onClick={() => setConfirmRotate(true)}>
              <RefreshCw className="size-4" aria-hidden /> New key
            </ActionButton>
          )}
        </div>
        {confirmRotate && (
          <p className="flex items-start gap-1.5 text-[11px] text-muted">
            <KeyRound className="mt-0.5 size-3 shrink-0" aria-hidden /> The current key stops working immediately. Update the code on your site right after.
          </p>
        )}
      </section>

      <section className="space-y-2.5 border-t border-white/8 pt-5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">2. Sites allowed to use it</h3>
        <p className="text-xs text-muted">{w.domains.length === 0 ? "No limit set: the widget works on any site. Add your store address to lock it down." : "Only these sites can open the widget."}</p>
        {w.domains.length > 0 && (
          <ul className="space-y-1.5">
            {w.domains.map((d) => (
              <li key={d} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white ring-1 ring-white/8">
                <span className="truncate">{d}</span>
                <button type="button" aria-label={`Remove ${d}`} disabled={busy} onClick={() => saveDomains(w.domains.filter((x) => x !== d))} className="rounded-full p-1 text-muted hover:text-white">
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2">
          <Field className="flex-1" label="Add a site" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://shop.yourbrand.com" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())} />
          <ActionButton loading={busy} onClick={addDomain} disabled={!draft.trim()} className="h-11">
            <Plus className="size-4" aria-hidden /> Add
          </ActionButton>
        </div>
      </section>

      {w.topOrigins.length > 0 && (
        <section className="space-y-2 border-t border-white/8 pt-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">Where it is used</h3>
          <ul className="space-y-1 text-sm">
            {w.topOrigins.map((o) => (
              <li key={o.origin} className="flex justify-between text-white/90">
                <span className="truncate">{o.origin}</span>
                <span className="tabular-nums text-muted">{o.sessions}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
