
import { supabase } from "@/lib/supabase";
import { getItemCostCache } from "@/utils/profitUtils";
import {
  CUSTOM_SALE_SENTINEL_ITEM_NAME,
  formatCustomSaleNotes,
} from "@/utils/salesItemResolver";
import { toSafeSaleDateISO } from "@/utils/dateParsing";

interface ValidationParams {
  itemId?: string;
  customItemName?: string;
  isCustom?: boolean;
  quantity: string;
  selectedItem?: any;
  userId: string;
}

export const validateSaleSubmission = async ({
  itemId,
  customItemName,
  isCustom = false,
  quantity,
  selectedItem,
  userId,
}: ValidationParams) => {
  if (!userId) {
    throw new Error("Please login to record sales");
  }

  const parsedQuantity = parseInt(quantity, 10);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error("Please enter a valid quantity");
  }

  if (isCustom) {
    if (!customItemName || !customItemName.trim()) {
      throw new Error("Please enter a product or service name");
    }

    return {
      parsedQuantity,
      selectedItem: null,
    };
  }

  if (!itemId || !selectedItem) {
    throw new Error("Invalid item selected");
  }

  // Only check if there's enough quantity in stock for showroom inventory items
  if (parsedQuantity > selectedItem.Quantity) {
    throw new Error(`Not enough stock for ${selectedItem["Item Description"]}`);
  }

  return {
    parsedQuantity,
    selectedItem,
  };
};

export interface RecordSaleOptions {
  isCustom?: boolean;
  customItemName?: string;
  location?: string;
  saleDate?: Date | string | null;
}

function isNullItemConstraintError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const message = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  return (
    code === "23502" ||
    message.includes("item_id") && (message.includes("null") || message.includes("not-null")) ||
    message.includes("inventory item with id")
  );
}

async function getOrCreateCustomSaleSentinelId(
  location: string,
  quantityNeeded: number
): Promise<number> {
  const safeLocation = location.trim() || "Ikeja";
  const targetStock = Math.max(999999, quantityNeeded + 1000);

  // 1. Check if sentinel row exists for this location
  const { data: existingByLoc } = await supabase
    .from("inventory list")
    .select("id, Quantity")
    .eq("Item Description", CUSTOM_SALE_SENTINEL_ITEM_NAME)
    .eq("location", safeLocation)
    .limit(1)
    .maybeSingle();

  if (existingByLoc?.id != null) {
    if (Number(existingByLoc.Quantity ?? 0) < quantityNeeded) {
      await supabase
        .from("inventory list")
        .update({ Quantity: targetStock, Price: 0, Total: 0 })
        .eq("id", existingByLoc.id);
    }
    return existingByLoc.id;
  }

  // 2. Try creating sentinel row for this location (Price: 0 so inventory valuation is unaffected)
  const { data: created, error: insertError } = await supabase
    .from("inventory list")
    .insert({
      "Item Description": CUSTOM_SALE_SENTINEL_ITEM_NAME,
      location: safeLocation,
      Price: 0,
      Quantity: targetStock,
      Total: 0,
    })
    .select("id")
    .single();

  if (!insertError && created?.id != null) {
    return created.id;
  }

  // 3. Fallback: reuse sentinel row from any branch if location-specific insert failed
  const { data: anyExisting } = await supabase
    .from("inventory list")
    .select("id, Quantity")
    .eq("Item Description", CUSTOM_SALE_SENTINEL_ITEM_NAME)
    .limit(1)
    .maybeSingle();

  if (anyExisting?.id != null) {
    if (Number(anyExisting.Quantity ?? 0) < quantityNeeded) {
      await supabase
        .from("inventory list")
        .update({ Quantity: targetStock, Price: 0, Total: 0 })
        .eq("id", anyExisting.id);
    }
    return anyExisting.id;
  }

  throw new Error(
    "Database does not yet allow null item_id for custom sales. Please apply migration 20261105120000_support_custom_product_sales.sql in Supabase."
  );
}

export const recordSale = async (
  userId: string,
  itemId: string | null,
  quantity: number,
  salePrice: number,
  selectedItem: any,
  notes?: string,
  paymentStatus: string = 'paid',
  amountPaid?: number,
  customerId?: string | null,
  actualPurchasePrice?: number | null,
  options?: RecordSaleOptions
) => {
  const isCustom = Boolean(options?.isCustom || !itemId);
  const totalAmount = quantity * salePrice;
  const finalAmountPaid =
    paymentStatus === 'paid'
      ? totalAmount
      : paymentStatus === 'unpaid'
      ? 0
      : amountPaid ?? 0;

  // Check cached purchase cost for either inventory item ID or custom product name
  const costCache = getItemCostCache();
  const costLookupKey = !isCustom && itemId
    ? String(itemId)
    : options?.customItemName?.trim()
    ? `custom:${options.customItemName.trim().toLowerCase()}`
    : "";
  const cachedCost =
    costLookupKey && costCache[costLookupKey] ? costCache[costLookupKey] : null;
  const resolvedPurchasePrice =
    actualPurchasePrice !== undefined && actualPurchasePrice !== null
      ? actualPurchasePrice
      : cachedCost;

  const formattedNotes =
    isCustom && options?.customItemName?.trim()
      ? formatCustomSaleNotes({
          customName: options.customItemName,
          location: options.location,
          notes,
        })
      : notes?.trim() || null;

  const parsedNumericId = itemId ? Number(itemId) : NaN;
  const dbItemId = isCustom
    ? null
    : !isNaN(parsedNumericId)
    ? parsedNumericId
    : itemId;

  const sale = {
    item_id: dbItemId,
    quantity: quantity,
    sale_price: salePrice,
    total_amount: totalAmount,
    user_id: userId,
    sale_date: toSafeSaleDateISO(options?.saleDate),
    notes: formattedNotes,
    payment_status: paymentStatus,
    amount_paid: finalAmountPaid,
    customer_id: customerId || null,
    actual_purchase_price: resolvedPurchasePrice,
  };

  // Record the sale - inventory will be updated automatically by database trigger when item_id is present
  const { error: saleError } = await supabase
    .from('sales')
    .insert([sale as any]);

  if (saleError) {
    // If remote database still enforces NOT NULL on sales.item_id or an older inventory trigger,
    // automatically resolve a zero-value sentinel service row so custom product sales still succeed.
    if (isCustom && isNullItemConstraintError(saleError)) {
      const sentinelId = await getOrCreateCustomSaleSentinelId(
        options?.location || "Ikeja",
        quantity
      );
      const { error: fallbackError } = await supabase
        .from('sales')
        .insert([{ ...sale, item_id: sentinelId } as any]);

      if (!fallbackError) {
        return;
      }

      console.error('Error recording custom sale via fallback:', fallbackError);
      throw new Error(fallbackError.message || "Failed to record custom product sale");
    }

    console.error('Error recording sale:', saleError);
    throw new Error(saleError.message || "Failed to record sale");
  }
};


