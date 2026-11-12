"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, ImagePlus, LoaderCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { ActionButton, Notice, Segmented } from "@/components/ui/Controls";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import { GARMENT_TYPES, type GarmentType } from "@/data/studio-content";

type Config = { brand: { id: string; name: string; logoUrl: string | null; isVerified: boolean } };

/**
 * The iframe behind public/widget.js (D2C try-on widget): a shopper uploads a
 * photo and sees the brand's product on themselves. Metered per brand key.
 */
export function WidgetTryOn() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const garment = params.get("image") ?? "";
  const product = params.get("product") ?? "";
  const origin = params.get("origin") ?? "";
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [type, setType] = useState<GarmentType>("upper_body");
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiRequest<Config>(`${ENDPOINTS.widget.config}?key=${encodeURIComponent(key)}&origin=${encodeURIComponent(origin)}`)
      .then((res) => setConfig(res.data))
      .catch((e) => setConfigError(e instanceof Error ? e.message : "This try-on isn't available."));
  }, [key, origin]);

  const close = () => window.parent?.postMessage("threadflank:close", "*");

  const run = async () => {
    if (!photo || !garment) return;
    setRunning(true);
    setError("");
    try {
      const form = new FormData();
      form.append("selfie", photo);
      form.append("garmentUrl", garment);
      form.append("garmentCategory", type);
      form.append("productUrl", product);
      const res = await fetch("/api/tryon", { method: "POST", body: form, headers: { "x-widget-key": key, "x-widget-origin": origin } });
      const body = (await res.json().catch(() => ({}))) as { resultImageUrl?: string; error?: string };
      if (!res.ok || !body.resultImageUrl) throw new Error(body.error || "The try-on failed. Please try again.");
      setResult(body.resultImageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col gap-4 bg-canvas p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Virtual try-on</p>
          <p className="truncate text-body font-medium text-white">{config?.brand.name ?? "…"}</p>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full border border-white/12 text-white">
          <X className="size-4" />
        </button>
      </header>

      {configError ? (
        <Notice tone="error">{configError}</Notice>
      ) : !garment ? (
        <Notice tone="error">No product image was found on this page.</Notice>
      ) : (
        <>
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {result ? <img src={result} alt="You wearing the product" className="size-full object-contain" /> : preview ? <img src={preview} alt="Your photo" className="size-full object-contain" /> : null}
            {!result && !preview && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted hover:text-white">
                <ImagePlus className="size-8" strokeWidth={1.5} />
                Upload a full-length photo of yourself
              </button>
            )}
            {!result && (
              <div className="absolute bottom-3 right-3 aspect-square w-20 overflow-hidden rounded-xl border border-white/20 bg-black/50 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={garment} alt="Product" className="size-full object-contain" />
              </div>
            )}
            {running && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas/70 backdrop-blur" role="status">
                <LoaderCircle className="size-7 animate-spin text-accent-bright" />
                <p className="text-sm text-white">Fitting it to you… (up to a minute)</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPhoto(f);
                setPreview(URL.createObjectURL(f));
                setResult("");
              }
            }}
          />
          {!result && <Segmented label="Garment type" value={type} onChange={setType} options={GARMENT_TYPES} />}
          {error && <Notice tone="error">{error}</Notice>}
          {result ? (
            <div className="flex gap-2">
              <a href={result} download="try-on.jpg" target="_blank" rel="noreferrer" className="btn-primary inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium">
                <Download className="size-4" />
                Save
              </a>
              <ActionButton variant="ghost" onClick={() => setResult("")}>
                <RotateCcw className="size-4" />
                Again
              </ActionButton>
            </div>
          ) : (
            <div className="flex gap-2">
              {photo && (
                <ActionButton variant="ghost" onClick={() => fileRef.current?.click()}>
                  Change photo
                </ActionButton>
              )}
              <ActionButton onClick={photo ? run : () => fileRef.current?.click()} loading={running} className="flex-1">
                {!running && <Sparkles className="size-4" />}
                {photo ? "Try it on" : "Upload photo"}
              </ActionButton>
            </div>
          )}
          <p className="text-center text-[11px] text-muted">Powered by Threadflank · your photo is only used for this preview</p>
        </>
      )}
    </main>
  );
}
