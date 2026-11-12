import { API_BASE_URL, assetUrl } from "@/lib/api/config";
import { getSessionSnapshot } from "@/features/auth/storage";
import { baseImage, type Person, type StudioScene } from "@/features/workspace/hooks";
import { skinLabel } from "@/features/profile/BodyForm";
import { ETHNIC_GARMENTS } from "@/data/garment-kinds";
import { DRAPE_SLOTS, GROUP_POSTURES, type DrapeSlot, type GroupPosture } from "@/data/studio-content";
import { isOwnAsset, readDrapeResult, throwApiError, toDataUrl } from "./tryon";
import type { Outfit } from "./OutfitPicker";

/** Everything one person wears in a Drape render. */
export type MemberSpec = { pieces: Partial<Record<DrapeSlot, Outfit>>; notes: string };

export const emptyMember = (): MemberSpec => ({ pieces: {}, notes: "" });

export const filledPieces = (m: MemberSpec | undefined) =>
  DRAPE_SLOTS.flatMap((s) => (m?.pieces[s.id] ? [{ slot: s.id, outfit: m.pieces[s.id]! }] : []));

/** Sets one slot. A full outfit and a top/bottom can't both be worn, so picking one clears the other. */
export function withPiece(m: MemberSpec, slot: DrapeSlot, outfit: Outfit | null): MemberSpec {
  const pieces = { ...m.pieces };
  if (outfit) {
    pieces[slot] = outfit;
    if (slot === "dress") {
      delete pieces.top;
      delete pieces.bottom;
    } else if (slot === "top" || slot === "bottom") {
      delete pieces.dress;
    }
  } else {
    delete pieces[slot];
  }
  return { ...m, pieces };
}

/** Which slot a wardrobe item or a garment type belongs in. */
export function slotForOutfit(outfit: Outfit, category?: string): DrapeSlot {
  const byCategory = DRAPE_SLOTS.find((s) => s.wardrobe && s.wardrobe === category);
  if (byCategory) return byCategory.id;
  if (outfit.type === "lower_body") return "bottom";
  if (outfit.type === "dresses") return "dress";
  return "top";
}

const PARTNER = ["partner", "spouse", "wife", "husband", "girlfriend", "boyfriend", "fiance", "fiancé", "fiancée"];
const FAMILY = ["parent", "child", "family", "mother", "father", "son", "daughter"];

/** Mirrors the backend: Partner → couple, Parent/Child/Family → family, all siblings → siblings, else friends. */
export function resolvePosture(people: Person[], posture: GroupPosture): Exclude<GroupPosture, "auto"> | null {
  if (people.length < 2) return null;
  if (posture !== "auto") return posture;
  const relations = people.filter((p) => !p.isSelf).map((p) => (p.relation ?? "").toLowerCase());
  if (people.length === 2 && relations.some((r) => PARTNER.includes(r))) return "couple";
  if (relations.some((r) => FAMILY.includes(r))) return "family";
  if (relations.length > 0 && relations.every((r) => r === "sibling")) return "siblings";
  return "friends";
}

export const postureLabel = (id: GroupPosture | null) => GROUP_POSTURES.find((p) => p.id === id)?.label ?? "";

/** Our own uploads and blob: previews are inlined; remote URLs are converted to data URL if possible, otherwise passed through. */
async function sendable(path: string, max: number) {
  if (path.startsWith("data:")) return path;
  if (isOwnAsset(path)) return toDataUrl(path, max);
  try {
    return await toDataUrl(path, max);
  } catch {
    return path;
  }
}

async function pieceFor(slot: DrapeSlot, outfit: Outfit) {
  const kind = outfit.kind ? ETHNIC_GARMENTS.find((k) => k.id === outfit.kind) : undefined;
  const isDescribed = outfit.source === "describe";
  return {
    slot,
    label: isDescribed ? undefined : outfit.label.slice(0, 60),
    image: isDescribed || !outfit.preview ? undefined : await sendable(outfit.preview, 1024),
    description: isDescribed ? outfit.prompt : undefined,
    kind: kind?.id,
    drape: kind?.drape,
  };
}

export type GroupDrapeInput = {
  people: Person[];
  members: Record<string, MemberSpec>;
  posture: GroupPosture;
  scene: StudioScene;
  styling: string;
};

/** The request body for POST /drape/group: one entry per person with their twin, body and every piece. */
export async function buildGroupPayload({ people, members, posture, scene, styling }: GroupDrapeInput) {
  const specs = await Promise.all(
    people.map(async (p) => {
      const member = members[p.id];
      return {
        ref: p.id,
        name: (p.isSelf ? p.name || "You" : p.name).slice(0, 60),
        relation: p.isSelf ? "You" : p.relation || undefined,
        twinImage: await sendable(baseImage(p)!, 1280),
        body: {
          gender: p.gender || undefined,
          age: p.age || undefined,
          heightCm: p.heightCm || undefined,
          weightKg: p.weightKg || undefined,
          skinTone: p.skinTone ? `${skinLabel(p.skinTone) ?? ""} (${p.skinTone})`.trim() : undefined,
        },
        outfit: await Promise.all(filledPieces(member).map((x) => pieceFor(x.slot, x.outfit))),
        notes: member?.notes.trim() || undefined,
      };
    })
  );
  return {
    people: specs,
    posture: people.length > 1 ? posture : undefined,
    scene: {
      name: scene.name,
      category: scene.category || undefined,
      imageUrl: scene.imageUrl ? await sendable(assetUrl(scene.imageUrl), 1280) : undefined,
    },
    styling: styling.trim() || undefined,
  };
}

export type GroupDrapeResult = {
  imageUrl: string | null;
  composed: boolean;
  posture: string | null;
  people: { ref: string; name: string; imageUrl: string; dressed: boolean; error?: string }[];
  composeError?: string;
};

/** Renders everyone in one request: each twin is dressed, then the group is composed into one photo. */
export async function runGroupDrape(input: GroupDrapeInput, signal?: AbortSignal): Promise<GroupDrapeResult> {
  const token = getSessionSnapshot()?.token;
  const res = await fetch(`${API_BASE_URL}/drape/group`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(await buildGroupPayload(input)),
    signal,
  });
  if (!res.ok) await throwApiError(res, "The render failed. Please try again.");
  return readDrapeResult<GroupDrapeResult>(res);
}
