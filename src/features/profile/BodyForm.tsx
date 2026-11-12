"use client";

import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, LoaderCircle, ScanFace, X } from "lucide-react";
import { Field, Label, Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/features/workspace/hooks";
import { workspaceApi } from "@/features/workspace/api";
import { cn } from "@/lib/utils";
import { GENDERS, SKIN_TONES, profileContent as copy } from "@/data/studio-content";
import { SelfieCamera } from "./SelfieCamera";

export type BodyValues = {
  /** The person's selfie (upload path). Drape keeps their face from it. */
  photo: string;
  gender: string;
  age: string;
  heightCm: string;
  weightKg: string;
  skinTone: string;
};

export const EMPTY_BODY: BodyValues = { photo: "", gender: "", age: "", heightCm: "", weightKg: "", skinTone: "" };

export const toNumber = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

export function skinLabel(hex?: string | null) {
  return SKIN_TONES.find((t) => t.hex === hex)?.label;
}

/**
 * A selfie plus body details, shared by your own profile and circle members. Drape renders the
 * person from these directly: the face from the selfie, the build from the details.
 */
export function BodyForm({ value, onChange }: { value: BodyValues; onChange: (next: BodyValues) => void }) {
  const set = <K extends keyof BodyValues>(key: K, v: BodyValues[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-6">
      <SelfiePicker value={value.photo} onChange={(photo) => set("photo", photo)} />

      <div className="flex flex-col gap-2">
        <Label>{copy.gender}</Label>
        <Segmented label={copy.gender} value={value.gender} onChange={(g) => set("gender", g)} options={GENDERS} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label={copy.age} type="number" inputMode="numeric" min={1} max={120} value={value.age} onChange={(e) => set("age", e.target.value)} />
        <Field label={copy.height} type="number" inputMode="numeric" min={50} max={250} value={value.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
        <Field label={copy.weight} type="number" inputMode="numeric" min={10} max={300} value={value.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
      </div>
      <p className="-mt-3 text-xs text-muted">{copy.bodyHint}</p>

      <div className="flex flex-col gap-2">
        <Label>{copy.skinTone}</Label>
        <div role="radiogroup" aria-label={copy.skinTone} className="flex flex-wrap gap-2.5">
          {SKIN_TONES.map((t) => {
            const active = value.skinTone === t.hex;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={t.label}
                title={t.label}
                onClick={() => set("skinTone", t.hex)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-[#0b0b1e] transition",
                  active ? "ring-2 ring-white/90" : "hover:scale-105"
                )}
                style={{ background: t.hex }}
              >
                {active && <Check className="size-4 text-black/70" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The selfie: taken live with the front camera, or picked from the gallery. */
function SelfiePicker({ value, onChange }: { value: string; onChange: (photo: string) => void }) {
  const { token } = useAuth();
  const galleryRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file || !token) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError(copy.selfieType);
      return;
    }
    setError("");
    setUploading(true);
    try {
      onChange(await workspaceApi.upload(token, file, "twins"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{copy.photo}</Label>
      <div className="flex items-center gap-4">
        <div className="relative flex aspect-[3/4] w-28 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-card) border border-dashed border-white/20 bg-white/[0.03] text-muted">
          {value ? <Photo src={value} alt="Selfie" className="absolute inset-0" /> : !uploading && <ScanFace className="size-8" strokeWidth={1.5} />}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <LoaderCircle className="size-6 animate-spin text-white" />
            </span>
          )}
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={copy.removeSelfie}
              title={copy.removeSelfie}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCamera(true)} disabled={uploading} className="btn-primary inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[filter] hover:brightness-110 disabled:opacity-60">
              <Camera className="size-4" />
              {copy.takeSelfie}
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm text-subtle transition-colors hover:border-white/25 hover:text-white disabled:opacity-60"
            >
              <ImagePlus className="size-4" />
              {copy.fromGallery}
            </button>
          </div>
          <p className={cn("text-xs", error ? "text-red-300" : "text-muted")} role={error ? "alert" : undefined}>
            {error || copy.photoHint}
          </p>
        </div>
        <input ref={galleryRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {camera && <SelfieCamera onClose={() => setCamera(false)} onCapture={upload} />}
    </div>
  );
}
