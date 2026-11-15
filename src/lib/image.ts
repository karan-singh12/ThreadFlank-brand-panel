/**
 * Shrinks a photo in the browser before it is uploaded: phone photos are several MB, and a brand adding
 * a hundred pieces should not have to upload gigabytes. Returns a JPEG data URL at most `max` px on the long side.
 */
export async function resizeImage(file: File, max = 1400, quality = 0.86): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name} could not be read as an image.`);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot resize images.");
  // Garment photos with transparency would turn black as JPEG, so paint white first.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
