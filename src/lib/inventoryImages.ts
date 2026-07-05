import { supabase } from "./supabase";

export const INVENTORY_IMAGES_BUCKET = "inventory-images";

/**
 * Compress + resize an image file in the browser before upload.
 * Converts to WebP (falls back to JPEG) at a max dimension so
 * uploads stay small and pages load fast.
 */
async function compressImage(
  file: File,
  { maxDim = 1200, quality = 0.8 }: { maxDim?: number; quality?: number } = {}
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  // Skip compression for SVGs (already lightweight vector) and GIFs (would lose animation).
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const ext = file.type === "image/svg+xml" ? "svg" : "gif";
    return { blob: file, ext, contentType: file.type };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Fallback: upload original if the browser can't decode it
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return { blob: file, ext, contentType: file.type || "image/jpeg" };
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { blob: file, ext: "jpg", contentType: file.type || "image/jpeg" };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // Try WebP first (smallest), fall back to JPEG
  const tryType = async (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

  let blob = await tryType("image/webp");
  let contentType = "image/webp";
  let ext = "webp";
  if (!blob) {
    blob = await tryType("image/jpeg");
    contentType = "image/jpeg";
    ext = "jpg";
  }
  if (!blob) {
    return { blob: file, ext: "jpg", contentType: file.type || "image/jpeg" };
  }
  // If compression made the file bigger (rare, e.g. tiny inputs), keep original.
  if (blob.size > file.size && file.size < 300 * 1024) {
    return { blob: file, ext: file.name.split(".").pop()?.toLowerCase() || "jpg", contentType: file.type };
  }
  return { blob, ext, contentType };
}

/**
 * Upload an inventory item image and return the storage path stored in `image_url`.
 * Images are compressed to WebP (max 1200px) client-side before upload.
 */
export async function uploadInventoryImage(file: File, itemId: number | string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be 10MB or smaller");
  }

  const { blob, ext, contentType } = await compressImage(file);
  const path = `${itemId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .upload(path, blob, { upsert: true, contentType });

  if (error) throw error;
  return path;
}

// Simple in-memory cache for signed URLs to avoid re-signing on every render.
const urlCache = new Map<string, { url: string; expires: number }>();
const SIGN_TTL = 60 * 60; // 1 hour

function cacheGet(path: string): string | null {
  const hit = urlCache.get(path);
  if (hit && hit.expires > Date.now() + 60_000) return hit.url;
  return null;
}
function cacheSet(path: string, url: string) {
  urlCache.set(path, { url, expires: Date.now() + SIGN_TTL * 1000 });
}

/**
 * Re-compress and re-upload an existing inventory image already stored in the bucket.
 * Returns the new storage path (or null if the image was already small enough / not found).
 */
export async function optimizeExistingInventoryImage(
  path: string,
  itemId: number | string
): Promise<{ newPath: string; oldSize: number; newSize: number } | null> {
  if (!path || /^https?:\/\//.test(path)) return null;

  const { data: blob, error: dlError } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .download(path);
  if (dlError || !blob) return null;

  const oldSize = blob.size;
  if (blob.type === "image/webp" && oldSize < 150 * 1024) return null;

  const file = new File([blob], path.split("/").pop() || "image", { type: blob.type || "image/jpeg" });
  const { blob: compressed, ext, contentType } = await compressImage(file);

  if (compressed.size >= oldSize * 0.9) return null;

  const newPath = `${itemId}/${Date.now()}.${ext}`;
  const { error: upError } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .upload(newPath, compressed, { upsert: true, contentType });
  if (upError) return null;

  await supabase.storage.from(INVENTORY_IMAGES_BUCKET).remove([path]).catch(() => {});
  urlCache.delete(path);

  return { newPath, oldSize, newSize: compressed.size };
}


export async function getInventoryImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const cached = cacheGet(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .createSignedUrl(path, SIGN_TTL);
  if (error) return null;
  const url = data?.signedUrl ?? null;
  if (url) cacheSet(path, url);
  return url;
}

export async function getInventoryImageUrls(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};

  const map: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of unique) {
    const cached = cacheGet(p);
    if (cached) map[p] = cached;
    else missing.push(p);
  }
  if (missing.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .createSignedUrls(missing, SIGN_TTL);
  if (error || !data) return map;
  data.forEach((entry, idx) => {
    if (entry.signedUrl) {
      map[missing[idx]] = entry.signedUrl;
      cacheSet(missing[idx], entry.signedUrl);
    }
  });
  return map;
}
