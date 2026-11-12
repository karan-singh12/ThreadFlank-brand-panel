"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Download, Film, LoaderCircle, Palette, RotateCcw, Share2, Undo2 } from "lucide-react";
import { ActionButton, Field, Label, Notice, Segmented, SelectField } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi } from "@/features/workspace/api";
import { errorMessage } from "@/features/workspace/hooks";
import { ShareSheet } from "@/features/share/ShareSheet";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { OCCASIONS, drapeContent as copy } from "@/data/studio-content";
import { EYESHADOWS, FINISHES, LIPSTICKS, MOTIONS, POSES, type PoseId } from "@/data/look-edits";
import { animateLook, editLook, persistImage, persistVideo } from "./tryon";
import { Swatches } from "./StudioParts";
import { OutOfCreditsError } from "@/features/billing/api";
import type { Result, View } from "./DrapeStage";

type Tool = "poses" | "makeup" | "motion";
const TOOLS: { id: Tool; label: string }[] = [
  { id: "poses", label: copy.posesLabel },
  { id: "makeup", label: copy.makeupLabel },
  { id: "motion", label: copy.livenessLabel },
];

/** Everything you can do with a finished render: save, share, poses, makeup and video. */
export function ResultStudio({
  result,
  pieces,
  defaultName,
  videoAvailable,
  onChange,
  onView,
  onReset,
}: {
  result: Result;
  pieces: string[];
  defaultName: string;
  videoAvailable: boolean;
  onChange: (fn: (r: Result) => Result) => void;
  onView: (v: View) => void;
  onReset: () => void;
}) {
  const { token } = useAuth();
  const [tool, setTool] = useState<Tool>("poses");
  const [busy, setBusy] = useState<string | null>(null);
  const [toolError, setToolError] = useState("");
  const [toolNeedsCredits, setToolNeedsCredits] = useState(false);
  const [lipstick, setLipstick] = useState<string>(LIPSTICKS[2].hex);
  const [eyeshadow, setEyeshadow] = useState<string | null>(null);
  const [blush, setBlush] = useState(30);
  const [finish, setFinish] = useState<string>(FINISHES[0].id);
  const [motion, setMotion] = useState<string>(MOTIONS[0].id);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [lookId, setLookId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const occasionOptions = useMemo(() => OCCASIONS.map((o) => ({ value: o.id, label: o.label })), []);

  const tryTool = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setToolError("");
    setToolNeedsCredits(false);
    try {
      await fn();
    } catch (e) {
      setToolError(e instanceof Error ? e.message : String(e));
      setToolNeedsCredits(e instanceof OutOfCreditsError);
    } finally {
      setBusy(null);
    }
  };

  const makePose = (pose: PoseId) =>
    tryTool(`pose:${pose}`, async () => {
      const existing = result.poses.find((p) => p.pose === pose);
      if (existing) return onView({ kind: "pose", pose });
      const source = result.history[0] ?? result.image;
      const imageUrl = await editLook(source, { mode: "pose", pose });
      onChange((r) => ({ ...r, poses: [...r.poses.filter((p) => p.pose !== pose), { pose, imageUrl }] }));
      onView({ kind: "pose", pose });
    });

  const applyMakeup = () =>
    tryTool("makeup", async () => {
      const imageUrl = await editLook(result.image, { mode: "makeup", makeup: { lipstick, eyeshadow: eyeshadow ?? undefined, blush, finish } });
      onChange((r) => ({ ...r, image: imageUrl, history: [...r.history, r.image] }));
      onView({ kind: "main" });
    });

  const undoMakeup = () => {
    onChange((r) => (r.history.length ? { ...r, image: r.history[r.history.length - 1], history: r.history.slice(0, -1) } : r));
    onView({ kind: "main" });
  };

  const animate = () =>
    tryTool("motion", async () => {
      const video = await animateLook(result.image, motion);
      onChange((r) => ({ ...r, video }));
      onView({ kind: "video" });
    });

  /** Uploads the render (and its poses/video) and saves the look. Returns its id. */
  const save = async (lookName = name) => {
    if (!token) throw new Error("Sign in to save looks");
    if (lookId) return lookId;
    setState("saving");
    setError("");
    try {
      const stored = result.blob
        ? await workspaceApi.upload(token, new File([result.blob], "look.png", { type: "image/png" }), "looks")
        : await persistImage(token, result.image, "looks");
      const poseVariants = await Promise.all(result.poses.map(async (p) => ({ pose: p.pose, imageUrl: await persistImage(token, p.imageUrl, "looks") })));
      const videoUrl = result.video ? await persistVideo(token, result.video) : undefined;
      const look = await workspaceApi.saveLook(token, { name: lookName.trim() || defaultName, occasion, image: stored, pieces, poseVariants, videoUrl });
      setLookId(look.id);
      setState("saved");
      setOpen(false);
      return look.id;
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
      throw e;
    }
  };

  const secondary =
    "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/12 px-3 text-sm text-subtle transition-colors hover:border-white/25 hover:text-white";

  return (
    <section className="card-violet-strong relative isolate flex flex-col gap-4 rounded-(--radius-panel) p-4 backdrop-blur-xl sm:p-5">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        <span className="absolute -right-12 -top-16 size-44 rounded-full bg-[#1fffec] opacity-20 blur-[64px]" />
      </span>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-green">
            <Check className="size-3.5" strokeWidth={2.5} />
            {copy.resultTitle}
          </p>
          <h2 className="mt-1 truncate text-title font-medium text-white">{name || defaultName}</h2>
        </div>
        <button type="button" onClick={onReset} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-subtle transition-colors hover:bg-white/10 hover:text-white">
          <RotateCcw className="size-3.5" />
          {copy.retry}
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <ActionButton onClick={() => setOpen((v) => !v)} disabled={state === "saved"} className="h-10 px-3">
          {state === "saved" ? <Check className="size-4" /> : <Bookmark className="size-4" />}
          {state !== "saved" && "Save"}
        </ActionButton>
        <button type="button" onClick={() => setSharing(true)} className={secondary}>
          <Share2 className="size-4" />
          {copy.share}
        </button>
        <a href={assetUrl(result.image)} target="_blank" rel="noreferrer" download="look.png" className={secondary}>
          <Download className="size-4" />
          {copy.download}
        </a>
      </div>

      {open && (
        <div className="grid gap-3 rounded-(--radius-card) border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_140px]">
          <Field label={copy.lookName} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <SelectField label={copy.occasion} value={occasion} onChange={(e) => setOccasion(e.target.value)} options={occasionOptions} />
          <ActionButton onClick={() => save().catch(() => undefined)} loading={state === "saving"} className="sm:col-span-2">
            {copy.confirmSave}
          </ActionButton>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {state === "saved" && (
        <Link href="/saved" className="-mt-1 text-sm text-accent-bright hover:text-white">
          {copy.saved} — view saved looks →
        </Link>
      )}

      <div className="border-t border-white/8 pt-4">
        <div role="tablist" aria-label="Look tools" className="grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-canvas/40 p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tool === t.id}
              onClick={() => setTool(t.id)}
              className={cn("h-8 rounded-full text-xs font-medium transition-colors", tool === t.id ? "chip-on" : "text-subtle hover:text-white")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tool === "poses" && (
          <div className="mt-4">
            <p className="mb-3 text-xs text-muted">{copy.posesHint}</p>
            <div className="grid grid-cols-3 gap-2">
              {POSES.map((p) => {
                const made = result.poses.some((x) => x.pose === p.id);
                const loading = busy === `pose:${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => makePose(p.id)}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:opacity-60",
                      made ? "chip-on border-transparent" : "border-white/12 text-subtle hover:border-white/25 hover:text-white"
                    )}
                  >
                    {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : made && <Check className="size-3.5" />}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tool === "makeup" && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-xs text-muted">{copy.makeupHint}</p>
            <Swatches label={copy.lipstick} options={LIPSTICKS} value={lipstick} onChange={(v) => setLipstick(v ?? LIPSTICKS[0].hex)} />
            <Swatches label={copy.eyeshadow} options={EYESHADOWS} value={eyeshadow} onChange={setEyeshadow} allowNone />
            <div className="flex flex-col gap-2">
              <Label>
                {copy.blush} · {blush}%
              </Label>
              <input type="range" min={0} max={100} step={5} value={blush} onChange={(e) => setBlush(Number(e.target.value))} className="accent-accent-bright" aria-label={copy.blush} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{copy.finish}</Label>
              <Segmented label={copy.finish} value={finish} onChange={setFinish} options={FINISHES} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={applyMakeup} loading={busy === "makeup"} disabled={Boolean(busy)}>
                {busy !== "makeup" && <Palette className="size-4" />}
                {copy.applyMakeup}
              </ActionButton>
              {result.history.length > 0 && (
                <ActionButton variant="ghost" onClick={undoMakeup} disabled={Boolean(busy)}>
                  <Undo2 className="size-4" />
                  {copy.undo}
                </ActionButton>
              )}
            </div>
          </div>
        )}

        {tool === "motion" && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs text-muted">{videoAvailable ? copy.livenessHint : copy.videoUnavailable}</p>
            <Segmented label={copy.livenessLabel} value={motion} onChange={setMotion} options={MOTIONS} />
            <ActionButton onClick={animate} loading={busy === "motion"} disabled={Boolean(busy) || !videoAvailable} className="self-start">
              {busy !== "motion" && <Film className="size-4" />}
              {result.video ? "Re-animate" : copy.animate}
            </ActionButton>
          </div>
        )}
        {toolError && (
          <div className="mt-3">
            <Notice tone="error">
              {toolError}
              {toolNeedsCredits && (
                <Link href="/pricing" className="ml-2 font-medium text-white underline underline-offset-2">
                  {copy.credits.buy}
                </Link>
              )}
            </Notice>
          </div>
        )}
      </div>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} lookId={lookId} ensureLookId={() => save()} image={result.image} video={result.video} name={name || defaultName} />
    </section>
  );
}
