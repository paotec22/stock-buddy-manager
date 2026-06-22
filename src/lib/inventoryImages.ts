import { supabase } from "./supabase";

export const INVENTORY_IMAGES_BUCKET = "inventory-images";

/**
 * Upload an inventory item image and return the storage path stored in `image_url`.
 */
export async function uploadInventoryImage(file: File, itemId: number | string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or smaller");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${itemId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  return path;
}

/**
 * Resolve a stored inventory image path to a temporary signed URL.
 */
export async function getInventoryImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  // If we ever stored a full URL, just return it
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Resolve many paths to signed URLs in a single round-trip.
 */
export async function getInventoryImageUrls(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .createSignedUrls(unique, 60 * 60);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((entry, idx) => {
    if (entry.signedUrl) map[unique[idx]] = entry.signedUrl;
  });
  return map;
}
