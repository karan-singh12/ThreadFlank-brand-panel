import { API_BASE_URL, ASSET_ORIGIN, assetUrl } from "@/lib/api/config";
import { workspaceApi } from "@/features/workspace/api";
import { getSessionSnapshot } from "@/features/auth/storage";
import type { GarmentType } from "@/data/studio-content";
import type { PoseId } from "@/data/look-edits";
import { OutOfCreditsError, setCreditBalance } from "@/features/billing/api";

/** Lets the AI routes attribute usage to the signed-in user. */
function authHeaders(): Record<string, string> {
  const token = getSessionSnapshot()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The API's error message (its `error` field is only a code such as "Bad Request"). */
async function readError(res: Response, fallback: string) {
  const body = (await res.json().catch(() => null)) as { error?: string; message?: string | string[] } | null;
  if (Array.isArray(body?.message)) return body.message.join(", ");
  return (typeof body?.message === "string" && body.message) || body?.error || fallback;
}

/** Throws the API's error; a 402 becomes OutOfCreditsError so the UI can offer a credit pack. */
export async function throwApiError(res: Response, fallback: string): Promise<never> {
  const message = await readError(res, fallback);
  throw res.status === 402 ? new OutOfCreditsError(message) : new Error(message);
}

/**
 * Drape responses are wrapped by the API ({ success, data: { …, creditsLeft } }). Returns the
 * inner result and updates the shared credit balance.
 */
export async function readDrapeResult<T>(res: Response): Promise<T & { creditsLeft?: number }> {
  const body = (await res.json()) as { data?: T & { creditsLeft?: number } } & T & { creditsLeft?: number };
  const result = body.data ?? body;
  setCreditBalance(result.creditsLeft);
  return result;
}

/** Render engines with keys on the server. */
export type StudioEngines = { image: string[]; cooling?: string[]; video: boolean };

export const enginesExhausted = (e: StudioEngines | null | undefined) =>
  Boolean(e && e.image.length > 0 && e.image.every((id) => e.cooling?.includes(id)));

export async function fetchStudioEngines(): Promise<StudioEngines> {
  const res = await fetch("/api/studio/engines");
  if (!res.ok) throw new Error("Couldn't check the studio engines.");
  return (await res.json()) as StudioEngines;
}

/** Finds the main product image on a store page (server-side scrape). */
export async function fetchGarmentImage(url: string) {
  const res = await fetch("/api/fetch-garment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res, "Couldn't read that product link."));
  const data = (await res.json()) as { garmentImageUrl: string };
  return data.garmentImageUrl;
}

/** Our own uploads (backend origin) are fetched in the browser; the try-on server can't reach localhost/private hosts. */
export function isOwnAsset(path: string) {
  return !/^https?:/.test(path) || path.startsWith(ASSET_ORIGIN);
}

export async function toFile(path: string, name: string) {
  const res = await fetch(assetUrl(path));
  if (!res.ok) throw new Error("Couldn't load the image.");
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/png" });
}

export type TryOnInput = {
  person: File;
  garment: File | string;
  garmentType: GarmentType;
  prompt?: string;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  garmentKind?: string;
  signal?: AbortSignal;
};

/** Convert a File to base64 Data URI */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mapGarmentTypeToSlot(garmentType: GarmentType): string {
  switch (garmentType) {
    case "upper_body":
      return "top";
    case "lower_body":
      return "bottom";
    case "dresses":
      return "dress";
    default:
      return "top";
  }
}

/** Runs the Drape render on the NestJS backend and resolves with the result image URL. */
export async function runTryOn(input: TryOnInput) {
  const modelImageUrl = await fileToDataUrl(input.person);
  const garmentUrl = typeof input.garment === "string" ? input.garment : await fileToDataUrl(input.garment);
  const slot = mapGarmentTypeToSlot(input.garmentType);

  const payload = {
    modelImageUrl,
    slots: [{ slot, garmentUrl }],
    prompt: input.prompt,
  };

  const res = await fetch(`${API_BASE_URL}/drape/tryon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    signal: input.signal,
  });

  if (!res.ok) await throwApiError(res, "The render failed. Please try again.");
  return (await readDrapeResult<{ imageUrl: string }>(res)).imageUrl;
}

/** Loads an image (resized so its longest side is at most `max`) and returns it as a JPEG data: URI. */
export async function toDataUrl(path: string, max = 1024) {
  const file = await toFile(path, "photo");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Places several people's renders side by side on one scene. Returns a PNG blob,
 * or null when a source image can't be read.
 */
export async function composeGroup(images: string[], stops: readonly string[]): Promise<Blob | null> {
  try {
    const bitmaps = await Promise.all(images.map(async (src) => createImageBitmap(await toFile(src, "part"))));
    const slotW = 600;
    const H = 900;
    const canvas = document.createElement("canvas");
    canvas.width = slotW * bitmaps.length;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach((c, i) => bg.addColorStop(i / Math.max(1, stops.length - 1), c));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, H);
    bitmaps.forEach((bmp, i) => {
      const scale = Math.min((slotW - 24) / bmp.width, (H - 24) / bmp.height);
      const w = bmp.width * scale;
      const h = bmp.height * scale;
      ctx.drawImage(bmp, i * slotW + (slotW - w) / 2, H - h - 12, w, h);
      bmp.close();
    });
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } catch {
    return null;
  }
}

/** Sends an image the edit/video routes can read: our own uploads are inlined, public URLs pass through. */
async function editableImage(path: string) {
  return isOwnAsset(path) || path.startsWith("blob:") ? toDataUrl(path, 1280) : path;
}

export type LookEdit =
  | { mode: "pose"; pose: PoseId }
  | { mode: "makeup"; makeup: { lipstick?: string; eyeshadow?: string; blush?: number; finish?: string } }
  | { mode: "describe"; prompt: string };

/** Re-poses a look, applies makeup, or dresses a person from a text prompt via backend API. */
export async function editLook(image: string, edit: LookEdit, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE_URL}/drape/look-edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ image: await editableImage(image), ...edit }),
    signal,
  });
  if (!res.ok) await throwApiError(res, "The edit failed. Please try again.");
  return (await readDrapeResult<{ imageUrl: string }>(res)).imageUrl;
}

/** "Make it move": turns a look into a short video via backend API. */
export async function animateLook(image: string, motion: string, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE_URL}/drape/animate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ image: await editableImage(image), motion }),
    signal,
  });
  if (!res.ok) await throwApiError(res, "Couldn't animate this look. Please try again.");
  return (await readDrapeResult<{ videoUrl: string }>(res)).videoUrl;
}

/** Keeps our own copy of a generated video; falls back to the original URL. */
export async function persistVideo(token: string, url: string, folder = "looks") {
  try {
    const res = await fetch(assetUrl(url));
    if (!res.ok) throw new Error("download failed");
    const blob = await res.blob();
    return await workspaceApi.upload(token, new File([blob], "look.mp4", { type: blob.type || "video/mp4" }), folder);
  } catch {
    return url;
  }
}

/** Keeps our own copy of a generated image; falls back to the original URL. */
export async function persistImage(token: string, url: string, folder: string) {
  try {
    return await workspaceApi.upload(token, await toFile(url, "image.jpg"), folder);
  } catch {
    return url;
  }
}
