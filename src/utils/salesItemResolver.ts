export interface RawSaleRecord {
  item_id?: string | number | null;
  notes?: string | null;
  "inventory list"?: {
    id?: number;
    "Item Description"?: string | null;
    location?: string | null;
  } | null;
}

export interface ResolvedSaleDisplay {
  itemName: string;
  location: string;
  notes: string | null;
  rawNotes: string | null;
  isCustomItem: boolean;
}

const CUSTOM_SALE_PREFIX_REGEX =
  /^\s*\[Product:\s*(.+?)(?:\s*\|\s*Location:\s*(.+?))?\]\s*(.*)$/s;

const CUSTOM_SALE_PREFIX_ONLY_REGEX =
  /^\s*(\[Product:\s*[^\]]+\])\s*/s;

export const CUSTOM_SALE_SENTINEL_ITEM_NAME = "__Custom Product Entry__";

export function isSystemSentinelInventoryItem(description?: string | null): boolean {
  return Boolean(
    description &&
      description.trim().toLowerCase() === CUSTOM_SALE_SENTINEL_ITEM_NAME.toLowerCase()
  );
}

/**
 * Formats notes for a non-inventory / custom product sale so product name
 * and showroom location persist cleanly alongside any optional user notes.
 */
export function formatCustomSaleNotes({
  customName,
  location,
  notes,
}: {
  customName: string;
  location?: string | null;
  notes?: string | null;
}): string {
  const safeName = customName
    .trim()
    .replace(/\]/g, ")")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ");

  const safeLocation = (location || "Showroom")
    .trim()
    .replace(/\]/g, ")")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ");

  const prefix = `[Product: ${safeName || "Custom Product"} | Location: ${safeLocation || "Showroom"}]`;
  const cleanNotes = notes?.trim();

  return cleanNotes ? `${prefix} ${cleanNotes}` : prefix;
}

/**
 * Preserves the `[Product: ... | Location: ...]` header when updating human
 * payment/sale notes in modals so editing status or notes never erases the product title.
 */
export function preserveSaleNotesMetadata(
  rawNotes: string | null | undefined,
  updatedCleanNotes: string
): string | null {
  const trimmedUserNotes = updatedCleanNotes.trim();
  const prefixMatch = (rawNotes || "").match(CUSTOM_SALE_PREFIX_ONLY_REGEX);

  if (prefixMatch?.[1]) {
    return trimmedUserNotes ? `${prefixMatch[1]} ${trimmedUserNotes}` : prefixMatch[1];
  }

  return trimmedUserNotes || null;
}

/**
 * Resolves display name, showroom location, and clean human notes for any sale
 * (linked inventory items, custom/other products, installation charges, or legacy records).
 */
export function resolveSaleItemDisplay(
  sale: RawSaleRecord,
  fallbackItemName = "Unknown Item",
  fallbackLocation = "Unknown Location"
): ResolvedSaleDisplay {
  const rawNotes = sale.notes ?? null;
  const trimmedRawNotes = rawNotes?.trim() || null;

  let parsedCustomName = "";
  let parsedCustomLocation = "";
  let strippedCustomNotes: string | null = trimmedRawNotes;

  if (trimmedRawNotes) {
    const match = trimmedRawNotes.match(CUSTOM_SALE_PREFIX_REGEX);
    if (match) {
      parsedCustomName = (match[1] || "").trim();
      parsedCustomLocation = (match[2] || "").trim();
      const rest = (match[3] || "").trim();
      strippedCustomNotes = rest.length > 0 ? rest : null;
    }
  }

  const rawInventoryDesc = sale["inventory list"]?.["Item Description"]?.trim();
  const inventoryDesc = isSystemSentinelInventoryItem(rawInventoryDesc)
    ? ""
    : rawInventoryDesc;
  const inventoryLoc = sale["inventory list"]?.location?.trim();

  // Always prefer explicit `[Product: ... | Location: ...]` metadata for custom product sales
  // (works seamlessly both when `item_id` is NULL and when linked to a sentinel service row).
  if (parsedCustomName) {
    return {
      itemName: parsedCustomName,
      location: parsedCustomLocation || inventoryLoc || fallbackLocation,
      notes: strippedCustomNotes,
      rawNotes,
      isCustomItem: true,
    };
  }

  if (inventoryDesc) {
    return {
      itemName: inventoryDesc,
      location: inventoryLoc || parsedCustomLocation || fallbackLocation,
      notes: trimmedRawNotes,
      rawNotes,
      isCustomItem: false,
    };
  }

  if (trimmedRawNotes && trimmedRawNotes.toLowerCase().startsWith("installation:")) {
    const body = trimmedRawNotes.slice("installation:".length).trim();
    const firstSegment = body.split(/\s+-\s+|\n/)[0]?.trim();
    return {
      itemName: firstSegment || "Installation Service",
      location: inventoryLoc || fallbackLocation,
      notes: trimmedRawNotes,
      rawNotes,
      isCustomItem: true,
    };
  }

  return {
    itemName: fallbackItemName,
    location: inventoryLoc || fallbackLocation,
    notes: trimmedRawNotes,
    rawNotes,
    isCustomItem: false,
  };
}
