import { supabase } from "@/lib/supabase";
import { AccessoryItem, DEFAULT_ACCESSORIES, NewAccessoryItem } from "@/types/accessories";

const STORAGE_KEY = "si_manager_accessories_v1";

// In-memory cache to ensure instant reactivity across renders
let cachedAccessories: AccessoryItem[] | null = null;
let supabaseAvailable: boolean | null = null;

export function getLocalAccessories(): AccessoryItem[] {
  if (cachedAccessories) return cachedAccessories;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedAccessories = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load accessories from localStorage:", err);
  }

  // Fallback to default accessories
  cachedAccessories = [...DEFAULT_ACCESSORIES];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAccessories));
  } catch (e) {
    console.warn("Could not save initial accessories to localStorage", e);
  }
  return cachedAccessories;
}

export function saveLocalAccessories(items: AccessoryItem[]): void {
  cachedAccessories = [...items];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("accessories-updated", { detail: items }));
  } catch (err) {
    console.warn("Failed to save accessories to localStorage:", err);
  }
}

/**
 * Check if the accessories table exists in Supabase
 */
export async function checkSupabaseTable(): Promise<boolean> {
  if (supabaseAvailable !== null) return supabaseAvailable;
  try {
    const { error } = await supabase.from("accessories").select("id").limit(1);
    if (error) {
      // 42P01 means table does not exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        supabaseAvailable = false;
        return false;
      }
    }
    supabaseAvailable = true;
    return true;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

/**
 * Fetch accessories: tries Supabase first, falls back to local storage
 */
export async function fetchAccessories(location?: string): Promise<AccessoryItem[]> {
  const isTableAvailable = await checkSupabaseTable();

  if (isTableAvailable) {
    try {
      let query = supabase.from("accessories").select("*").order("name", { ascending: true });
      if (location && location !== "All Locations") {
        query = query.eq("location", location);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Sync fetched data with local cache
        const items = data as AccessoryItem[];
        saveLocalAccessories(items);
        return items;
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using local accessories cache", err);
    }
  }

  // Fallback to local storage
  const allLocal = getLocalAccessories();
  if (location && location !== "All Locations") {
    return allLocal.filter((item) => item.location.toLowerCase() === location.toLowerCase());
  }
  return allLocal;
}

/**
 * Add a new accessory
 */
export async function addAccessory(item: NewAccessoryItem): Promise<AccessoryItem> {
  const newId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newItem: AccessoryItem = {
    ...item,
    id: item.id || newId,
    price: item.price !== null && !isNaN(Number(item.price)) && Number(item.price) > 0 ? Number(item.price) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try Supabase if available
  const isTableAvailable = await checkSupabaseTable();
  if (isTableAvailable) {
    try {
      const { data, error } = await supabase
        .from("accessories")
        .insert([{
          name: newItem.name,
          part_number: newItem.part_number || null,
          category: newItem.category,
          compatible_with: newItem.compatible_with || null,
          quantity: newItem.quantity,
          unit: newItem.unit,
          price: newItem.price,
          location: newItem.location,
          condition: newItem.condition,
          notes: newItem.notes || null,
          image_url: newItem.image_url || null,
        }])
        .select()
        .single();

      if (!error && data) {
        newItem.id = data.id;
      }
    } catch (err) {
      console.warn("Supabase insert failed, saving locally:", err);
    }
  }

  // Save in local storage
  const current = getLocalAccessories();
  const updated = [newItem, ...current];
  saveLocalAccessories(updated);
  return newItem;
}

/**
 * Update an existing accessory
 */
export async function updateAccessory(
  id: string | number,
  updates: Partial<AccessoryItem>
): Promise<AccessoryItem> {
  const current = getLocalAccessories();
  const index = current.findIndex((item) => String(item.id) === String(id));
  
  if (index === -1) {
    throw new Error("Accessory item not found");
  }

  const updatedItem: AccessoryItem = {
    ...current[index],
    ...updates,
    price: updates.price !== undefined
      ? (updates.price !== null && !isNaN(Number(updates.price)) && Number(updates.price) > 0 ? Number(updates.price) : null)
      : current[index].price,
    updated_at: new Date().toISOString(),
  };

  // Try Supabase if available
  const isTableAvailable = await checkSupabaseTable();
  if (isTableAvailable) {
    try {
      await supabase
        .from("accessories")
        .update({
          name: updatedItem.name,
          part_number: updatedItem.part_number,
          category: updatedItem.category,
          compatible_with: updatedItem.compatible_with,
          quantity: updatedItem.quantity,
          unit: updatedItem.unit,
          price: updatedItem.price,
          location: updatedItem.location,
          condition: updatedItem.condition,
          notes: updatedItem.notes,
          updated_at: updatedItem.updated_at,
        })
        .eq("id", id);
    } catch (err) {
      console.warn("Supabase update failed, updated locally:", err);
    }
  }

  current[index] = updatedItem;
  saveLocalAccessories(current);
  return updatedItem;
}

/**
 * Delete an accessory
 */
export async function deleteAccessory(id: string | number): Promise<void> {
  // Try Supabase if available
  const isTableAvailable = await checkSupabaseTable();
  if (isTableAvailable) {
    try {
      await supabase.from("accessories").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete failed, removing locally:", err);
    }
  }

  const current = getLocalAccessories();
  const updated = current.filter((item) => String(item.id) !== String(id));
  saveLocalAccessories(updated);
}

/**
 * Quick quantity adjuster (+1, -1, or set value)
 */
export async function adjustAccessoryQuantity(
  id: string | number,
  delta: number
): Promise<AccessoryItem> {
  const current = getLocalAccessories();
  const item = current.find((i) => String(i.id) === String(id));
  if (!item) throw new Error("Item not found");

  const newQuantity = Math.max(0, (item.quantity || 0) + delta);
  return updateAccessory(id, { quantity: newQuantity });
}
