"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, PenLine, Shirt, Sparkles, Users } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { SELF_ID, baseImage, usePeople, useScenePreference, useScenes, useWardrobe, type Person, type StudioScene } from "@/features/workspace/hooks";
import { LOOK_MAX_PEOPLE, drapeContent as copy, type GroupPosture } from "@/data/studio-content";
import { outfitFromItem, type Outfit } from "./OutfitPicker";
import { DrapeStage, type Result, type RunState, type View } from "./DrapeStage";
import { ResultStudio } from "./ResultStudio";
import { SceneGrid, SceneTabs, Step, type Mode } from "./StudioParts";
import { MemberOutfits, MemberPicker, PosturePicker } from "./GroupControls";
import { emptyMember, filledPieces, runGroupDrape, slotForOutfit, withPiece, type MemberSpec } from "./group";
import { composeGroup, fetchStudioEngines, type StudioEngines } from "./tryon";
import { cutoutFor } from "./cutout";
import { OutOfCreditsError, useWallet } from "@/features/billing/api";

/** Maximum people in one look (you plus one circle member). */
const GROUP_MAX = LOOK_MAX_PEOPLE;
/** How often the progress copy advances while a render runs. */
const STEP_MS = 5000;

/** Colour stops for compositing group renders, pulled from the scene's CSS gradient. */
function sceneStops(scene: StudioScene) {
  const stops = scene.cssGradient?.match(/#[0-9a-f]{6}\b/gi);
  return stops && stops.length >= 2 ? stops : ["#2a2548", "#0d0c1f"];
}

const nameOf = (p: Person) => (p.isSelf ? "You" : p.name);

/** Render engines on the server; `undefined` while loading, `null` if the check failed. `refresh` re-checks after a render. */
function useStudioEngines() {
  const [engines, setEngines] = useState<StudioEngines | null | undefined>(undefined);
  const refresh = useCallback(() => {
    fetchStudioEngines()
      .then(setEngines)
      .catch(() => setEngines(null));
  }, []);
  useEffect(refresh, [refresh]);
  return [engines, refresh] as const;
}

export function DrapeView() {
  const { token } = useAuth();
  const params = useSearchParams();
  const { people } = usePeople();
  const wardrobe = useWardrobe();
  const scenes = useScenes();
  const [engines, refreshEngines] = useStudioEngines();
  const wallet = useWallet();
  const [sceneId, chooseScene] = useScenePreference();

  // You're in the look by default; circle members are added from the dropdown.
  const initialPerson = params.get("person") || SELF_ID;
  const [selectedIds, setSelectedIds] = useState<string[]>([initialPerson]);
  const [activeMemberId, setActiveMemberId] = useState<string>(initialPerson);
  const [members, setMembers] = useState<Record<string, MemberSpec>>({});
  const [posture, setPosture] = useState<GroupPosture>("auto");

  const [sceneCategory, setSceneCategory] = useState<string>("all");
  const [prompt, setPrompt] = useState("");
  const [run, setRun] = useState<RunState>({ status: "idle" });
  const [view, setView] = useState<View>({ kind: "main" });
  const [step, setStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => ["all", ...Array.from(new Set(scenes.map((s) => s.category).filter(Boolean)))], [scenes]);
  const displayedScenes = useMemo(() => (sceneCategory === "all" ? scenes : scenes.filter((s) => s.category === sceneCategory)), [scenes, sceneCategory]);

  const scene: StudioScene = (scenes.length > 0
    ? (scenes.find((b) => b.id === sceneId) ?? scenes.find((b) => b.isDefault) ?? scenes[0])
    : { id: "studio", name: "Studio", category: "Studio", cssGradient: "radial-gradient(circle at 50% 30%, #2a2548 0%, #0d0c1f 70%)" }) ?? {
    id: "studio",
    name: "Studio",
    category: "Studio",
    cssGradient: "radial-gradient(circle at 50% 30%, #2a2548 0%, #0d0c1f 70%)",
  };

  // A piece passed in the URL (?item= from the wardrobe, ?image= or ?garmentUrl= from Discover/Brands)
  const preload = useMemo((): Outfit | null => {
    const paramItem = wardrobe.items.find((i) => i.id === params.get("item"));
    const paramImage = params.get("image") ?? params.get("lookImage") ?? params.get("garmentUrl");
    if (paramItem) return outfitFromItem(paramItem);
    if (!paramImage) return null;

    const rawType = (params.get("type") || params.get("category") || "").toLowerCase();
    const type =
      rawType.includes("bottom") || rawType.includes("lower") || rawType.includes("pant") || rawType.includes("trouser") || rawType.includes("jean") || rawType.includes("skirt")
        ? "lower_body"
        : rawType.includes("top") || rawType.includes("upper") || rawType.includes("shirt") || rawType.includes("t-shirt") || rawType.includes("hoodie") || rawType.includes("jacket")
        ? "upper_body"
        : "dresses";

    return {
      source: "link",
      label: params.get("title") || (params.get("brand") ? `${params.get("brand")} Look` : "Discover Look"),
      preview: paramImage,
      type,
    };
  }, [params, wardrobe.items]);
  // Applied once when it appears (the wardrobe loads after the first render), setting or updating the slot for that person.
  const [preloaded, setPreloaded] = useState<string | null>(null);
  if (preload && preload.preview !== preloaded) {
    setPreloaded(preload.preview);
    const category = wardrobe.items.find((i) => i.id === preload.itemId)?.category;
    const targetSlot = slotForOutfit(preload, category);
    setMembers((prev) => ({
      ...prev,
      [initialPerson]: withPiece(prev[initialPerson] ?? emptyMember(), targetSlot, preload),
    }));
  }

  const selectedPeople = useMemo(() => {
    const list = selectedIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p));
    return list.length > 0 ? list : [people[0] ?? { id: SELF_ID, name: "You", relation: "You", isSelf: true }];
  }, [selectedIds, people]);

  const isGroup = selectedPeople.length > 1;
  const mode: Mode = isGroup ? "group" : "single";
  const activeId = selectedPeople.some((p) => p.id === activeMemberId) ? activeMemberId : selectedPeople[0].id;

  const addPerson = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) || prev.length >= GROUP_MAX ? prev : [...prev, id]));
    setActiveMemberId(id);
  };
  const removePerson = (id: string) => setSelectedIds((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== id)));
  const updateMember = (id: string, next: MemberSpec) => setMembers((prev) => ({ ...prev, [id]: next }));

  const missingTwins = selectedPeople.filter((p) => !baseImage(p));
  const anyOutfit = selectedPeople.some((p) => filledPieces(members[p.id]).length > 0);
  const offline = Boolean(engines && engines.image.length === 0);
  const running = run.status === "running";
  // 1 credit per finished image, and a group look is one image (rendered in one request).
  const cost = 1;
  const shortOfCredits = Boolean(wallet && wallet.balance < cost);
  const canRun = !running && !offline && missingTwins.length === 0 && anyOutfit && !shortOfCredits;
  const blocker = missingTwins.length
    ? copy.group.needTwins(missingTwins.map(nameOf).join(", "))
    : !anyOutfit
      ? isGroup
        ? copy.group.needOutfit
        : copy.needOutfit
      : "";

  const progressSteps = isGroup ? copy.group.generating : copy.generating;

  // Advance progress copy while a render runs
  useEffect(() => {
    if (run.status !== "running") return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, progressSteps.length - 1)), STEP_MS);
    return () => window.clearInterval(id);
  }, [run.status, progressSteps.length]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStep(0);
    setView({ kind: "main" });
    const top = stageRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.5) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return controller;
  };

  const cancel = () => {
    abortRef.current?.abort();
    setRun({ status: "idle" });
  };

  const finish = (image: string, extra: Partial<Result> = {}) => setRun({ status: "done", result: { image, poses: [], history: [], ...extra } });

  /**
   * One request for everyone: the backend dresses each twin in all of their pieces and places
   * them in the scene (one person in a single pass; a group is composed and posed for their relations).
   * If composing fails, the individual renders come back and are collaged here instead.
   */
  const generate = async () => {
    const controller = start();
    setRun({ status: "running", label: "" });
    try {
      const res = await runGroupDrape({ people: selectedPeople, members, posture, scene, styling: prompt }, controller.signal);
      if (controller.signal.aborted) return;
      const failed = res.people.filter((p) => p.error).map((p) => p.name);
      const partial = failed.length ? copy.group.partial(failed.join(", ")) : undefined;

      if (res.imageUrl) {
        finish(res.imageUrl, { note: partial });
        return;
      }

      setRun({ status: "running", label: copy.group.composing });
      const figures = await Promise.all(res.people.map(async (p) => (await cutoutFor(p.imageUrl))?.url ?? p.imageUrl));
      const blob = await composeGroup(figures, sceneStops(scene));
      if (controller.signal.aborted) return;
      if (blob) finish(URL.createObjectURL(blob), { blob, note: [copy.group.collage, partial].filter(Boolean).join(" ") });
      else setRun({ status: "error", message: res.composeError || "Couldn't combine the renders into one image. Try again." });
    } catch (e) {
      if (!controller.signal.aborted) setRun({ status: "error", message: e instanceof Error ? e.message : String(e), outOfCredits: e instanceof OutOfCreditsError });
    } finally {
      refreshEngines();
    }
  };

  const updateResult = (fn: (r: Result) => Result) => setRun((r) => (r.status === "done" ? { status: "done", result: fn(r.result) } : r));

  const labelsFor = (p: Person) => filledPieces(members[p.id]).map((x) => x.outfit.label);
  const pieces = isGroup
    ? selectedPeople.filter((p) => labelsFor(p).length).map((p) => `${nameOf(p)}: ${labelsFor(p).join(", ")}`)
    : labelsFor(selectedPeople[0]);

  const defaultName = isGroup
    ? `${selectedPeople.map((p) => (p.isSelf ? "Me" : p.name)).join(" & ")} look`
    : `${selectedPeople[0]?.isSelf ? "My" : `${selectedPeople[0]?.name}'s`} ${labelsFor(selectedPeople[0])[0] ?? "look"}`;

  const result = run.status === "done" ? run.result : null;
  const board = selectedPeople.map((p) => ({ id: p.id, name: nameOf(p), pieces: filledPieces(members[p.id]).map((x) => x.outfit) }));

  return (
    <main className="relative isolate mx-auto max-w-[1440px] sm:px-6 sm:pt-3 lg:h-[calc(100dvh-var(--app-header))] lg:overflow-hidden lg:py-3">
      <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-6">
        {/* Stage: edge to edge on phones, like an app's media view; on desktop it fills the left column and never scrolls. */}
        <div className="flex min-w-0 flex-col gap-3 lg:h-full lg:overflow-hidden">
          <div className="relative lg:min-h-0 lg:flex-1">
            <DrapeStage
              ref={stageRef}
              mode={mode}
              scene={scene}
              person={selectedPeople[0]}
              group={selectedPeople}
              board={board}
              run={run}
              view={view}
              onView={setView}
              progress={run.status === "running" ? (run.label || progressSteps[step]) : ""}
              estimate={isGroup ? copy.group.estimate : undefined}
              onCancel={cancel}
            />
          </div>
          {(run.status === "error" || result?.note) && (
            <div className="flex flex-col gap-2 px-3 sm:px-0">
              {run.status === "error" && (
                <Notice tone="error">
                  {run.message}
                  {run.outOfCredits && (
                    <Link href="/pricing" className="ml-2 font-medium text-white underline underline-offset-2">
                      {copy.credits.buy}
                    </Link>
                  )}
                </Notice>
              )}
              {result?.note && <Notice>{result.note}</Notice>}
            </div>
          )}
        </div>

        {/* Controls: their own scroll on desktop; on phones they follow the stage, with room at the end for the docked button. */}
        <div className="no-scrollbar flex min-w-0 flex-col gap-3 px-3 pb-24 sm:px-0 lg:h-full lg:overflow-y-auto lg:pb-0">
          {result && token && (
            <ResultStudio
              key={result.history[0] ?? result.image}
              result={result}
              pieces={pieces}
              defaultName={defaultName.slice(0, 60)}
              videoAvailable={engines?.video !== false}
              onChange={updateResult}
              onView={setView}
              onReset={() => {
                setRun({ status: "idle" });
                setView({ kind: "main" });
              }}
            />
          )}

          <Step
            label={copy.steps.who}
            icon={Users}
            glow={{ color: "#1f8fff", at: "top-right" }}
            className="z-10"
            aside={<span className="text-xs tabular-nums text-muted">{selectedPeople.length}/{GROUP_MAX}</span>}
          >
            <MemberPicker people={people} selected={selectedPeople} max={GROUP_MAX} onAdd={addPerson} onRemove={removePerson} />
            {/* Group pose, from their relations */}
            {isGroup && (
              <div className="mt-3 border-t border-white/8 pt-3">
                <PosturePicker people={selectedPeople} value={posture} onChange={setPosture} />
              </div>
            )}
          </Step>

          <Step label={isGroup ? copy.steps.outfits : copy.steps.source} icon={Shirt} glow={{ color: "#d61fff", at: "bottom-left" }}>
            <MemberOutfits
              people={selectedPeople}
              members={members}
              activeId={activeId}
              onActive={setActiveMemberId}
              onChange={updateMember}
              wardrobe={wardrobe.items}
              wardrobeLoading={wardrobe.status === "loading"}
            />
          </Step>

          <Step
            label={copy.steps.prompt}
            icon={PenLine}
            glow={{ color: "#abb2fc", at: "bottom-right" }}
            aside={<span className="text-xs text-muted">{copy.optional}</span>}
          >
            <textarea
              rows={2}
              maxLength={300}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={copy.promptPlaceholder}
              aria-label={copy.steps.prompt}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20"
            />
          </Step>

          <Step label={copy.steps.scene} icon={Camera} glow={{ color: "#1fffec", at: "top-left" }}>
            <SceneTabs categories={categories} value={sceneCategory} onChange={setSceneCategory} />
            <SceneGrid scenes={displayedScenes} selectedId={scene.id} onSelect={chooseScene} />
          </Step>

          {/* Just the Drape button, docked: floating above the tab bar on phones, at the foot of the
              scrolling panel on desktop. Out of credits, it becomes a link to buy more. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabbar)+0.75rem)] z-30 px-3 sm:px-6 md:bottom-4 lg:sticky lg:inset-x-auto lg:bottom-3 lg:z-20 lg:mt-auto lg:px-0">
            {!running && shortOfCredits ? (
              <Link
                href="/pricing"
                className="btn-primary pointer-events-auto flex h-12 w-full items-center justify-center gap-2 rounded-full text-body font-medium shadow-[0_14px_36px_-10px_rgba(0,0,0,0.9)] transition-[filter] hover:brightness-110"
              >
                <Sparkles className="size-4" />
                {copy.credits.buy}
              </Link>
            ) : (
              <span className="pointer-events-auto block" title={!running && blocker ? blocker : undefined}>
                <ActionButton onClick={generate} disabled={!canRun} loading={running} className="h-12 w-full text-body shadow-[0_14px_36px_-10px_rgba(0,0,0,0.9)] disabled:opacity-100 disabled:brightness-75 disabled:saturate-50">
                  {!running && <Sparkles className="size-4" />}
                  {running ? "Draping…" : isGroup ? "Drape group look" : "Drape it"}
                  {!running && <span className="text-sm font-normal opacity-70">· {copy.credits.cost(cost)}</span>}
                </ActionButton>
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
