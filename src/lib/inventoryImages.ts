import { supabase } from "./supabase";

export const INVENTORY_IMAGES_BUCKET = "inventory-images";

/**
 * Compress + resize an image file in the browser before upload.
 * Converts to WebP (falls back to JPEG) at a max dimension so
 * uploads stay small and catalogue pages load fast.
 */
async function compressImage(
  file: File,
  { maxDim = 1200, quality = 0.82 }: { maxDim?: number; quality?: number } = {}
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
  if (blob.size > file.size && file.size < 200 * 1024) {
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

// Multi-tier cache for signed URLs (memory Map + persistent localStorage)
// Using a 24h signed URL TTL keeps the URL token identical across page reloads
// and sessions so the browser's native HTTP disk cache serves images in <2ms.
const urlCache = new Map<string, { url: string; expires: number }>();
const SIGN_TTL = 60 * 60 * 24; // 24 hours in seconds
const CACHE_SAFETY_BUFFER_MS = 60 * 60 * 1000; // Refresh if < 1 hour remaining
const STORAGE_CACHE_PREFIX = "puido_img_url_";

// Deduplicate concurrent single-path signing requests
const inflightSingleRequests = new Map<string, Promise<string | null>>();

// Track preloaded URLs so we don't redundantly trigger Image fetches
const preloadedUrls = new Set<string>();

function pruneLocalStorageImageCache() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const now = Date.now();
    const entries: { key: string; expires: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(k) || "{}");
          if (!parsed?.expires || parsed.expires <= now + CACHE_SAFETY_BUFFER_MS) {
            window.localStorage.removeItem(k);
          } else {
            entries.push({ key: k, expires: parsed.expires });
          }
        } catch {
          window.localStorage.removeItem(k);
        }
      }
    }
    // If still tight on space, evict oldest 25%
    if (entries.length > 40) {
      entries.sort((a, b) => a.expires - b.expires);
      const removeCount = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < removeCount; i++) {
        window.localStorage.removeItem(entries[i].key);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

function cacheGet(path: string): string | null {
  const now = Date.now();

  // 1. In-memory check
  const hit = urlCache.get(path);
  if (hit && hit.expires > now + CACHE_SAFETY_BUFFER_MS) return hit.url;

  // 2. Persistent localStorage check (survives page reloads & tab switches)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_CACHE_PREFIX + path);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url && parsed?.expires > now + CACHE_SAFETY_BUFFER_MS) {
          urlCache.set(path, parsed);
          return parsed.url;
        } else {
          window.localStorage.removeItem(STORAGE_CACHE_PREFIX + path);
        }
      }
    }
  } catch {
    // Ignore storage errors
  }

  return null;
}

function cacheSet(path: string, url: string) {
  const expires = Date.now() + SIGN_TTL * 1000;
  const entry = { url, expires };
  urlCache.set(path, entry);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_CACHE_PREFIX + path, JSON.stringify(entry));
      } catch {
        pruneLocalStorageImageCache();
        window.localStorage.setItem(STORAGE_CACHE_PREFIX + path, JSON.stringify(entry));
      }
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateInventoryImageCache(path: string | null | undefined) {
  if (!path) return;
  urlCache.delete(path);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_CACHE_PREFIX + path);
    }
  } catch {
    // Ignore
  }
}

/**
 * Synchronous cache lookup for a single image path (0ms when cached).
 */
export function getCachedInventoryImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return cacheGet(path);
}

/**
 * Synchronous batch cache lookup for multiple image paths (0ms for cached items).
 */
export function getCachedInventoryImageUrls(paths: (string | null | undefined)[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of paths) {
    if (!p) continue;
    if (/^https?:\/\//.test(p)) {
      result[p] = p;
    } else {
      const hit = cacheGet(p);
      if (hit) result[p] = hit;
    }
  }
  return result;
}

/**
 * Warm the browser's image cache for above-the-fold image URLs.
 */
export function preloadImageUrls(urls: (string | null | undefined)[], limit = 12) {
  if (typeof window === "undefined" || typeof Image === "undefined") return;
  let count = 0;
  for (const url of urls) {
    if (!url || preloadedUrls.has(url)) continue;
    if (preloadedUrls.size > 600) {
      preloadedUrls.clear();
    }
    preloadedUrls.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    count++;
    if (count >= limit) break;
  }
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
  if (blob.type === "image/webp" && oldSize < 90 * 1024) return null;

  const file = new File([blob], path.split("/").pop() || "image", { type: blob.type || "image/jpeg" });
  const { blob: compressed, ext, contentType } = await compressImage(file);

  if (compressed.size >= oldSize * 0.9) return null;

  const newPath = `${itemId}/${Date.now()}.${ext}`;
  const { error: upError } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .upload(newPath, compressed, { upsert: true, contentType });
  if (upError) return null;

  await supabase.storage.from(INVENTORY_IMAGES_BUCKET).remove([path]).catch(() => {});
  invalidateInventoryImageCache(path);

  return { newPath, oldSize, newSize: compressed.size };
}

export async function getInventoryImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const cached = cacheGet(path);
  if (cached) return cached;

  const existing = inflightSingleRequests.get(path);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(INVENTORY_IMAGES_BUCKET)
        .createSignedUrl(path, SIGN_TTL);
      if (error) return null;
      const url = data?.signedUrl ?? null;
      if (url) cacheSet(path, url);
      return url;
    } catch {
      return null;
    } finally {
      inflightSingleRequests.delete(path);
    }
  })();

  inflightSingleRequests.set(path, promise);
  return promise;
}

export interface GetInventoryImageUrlsOptions {
  /**
   * Called immediately as each chunk of signed URLs resolves,
   * so visible viewport images render right away without waiting for slower chunks.
   */
  onBatchResolved?: (batchMap: Record<string, string>) => void;
  /**
   * Size of the first high-priority chunk (defaults to 12 for fast above-the-fold paint).
   */
  priorityCount?: number;
}

export async function getInventoryImageUrls(
  paths: string[],
  options?: GetInventoryImageUrlsOptions
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};

  const map: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of unique) {
    if (/^https?:\/\//.test(p)) {
      map[p] = p;
      continue;
    }
    const cached = cacheGet(p);
    if (cached) map[p] = cached;
    else missing.push(p);
  }

  if (Object.keys(map).length > 0) {
    options?.onBatchResolved?.({ ...map });
  }

  if (missing.length === 0) return map;

  // Build chunks: small first chunk (12) for instant above-the-fold load, then chunks of 30
  const firstChunkSize = Math.max(1, options?.priorityCount ?? 12);
  const regularChunkSize = 30;
  const chunks: string[][] = [];

  if (missing.length <= firstChunkSize) {
    chunks.push(missing);
  } else {
    chunks.push(missing.slice(0, firstChunkSize));
    for (let i = firstChunkSize; i < missing.length; i += regularChunkSize) {
      chunks.push(missing.slice(i, i + regularChunkSize));
    }
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const { data, error } = await supabase.storage
          .from(INVENTORY_IMAGES_BUCKET)
          .createSignedUrls(chunk, SIGN_TTL);
        if (!error && data) {
          const batchMap: Record<string, string> = {};
          data.forEach((entry, idx) => {
            if (entry?.signedUrl && chunk[idx]) {
              map[chunk[idx]] = entry.signedUrl;
              batchMap[chunk[idx]] = entry.signedUrl;
              cacheSet(chunk[idx], entry.signedUrl);
            }
          });
          if (Object.keys(batchMap).length > 0) {
            options?.onBatchResolved?.(batchMap);
          }
        }
      } catch (err) {
        console.warn("Error signing image chunk:", err);
      }
    })
  );

  return map;
}
