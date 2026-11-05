
import { supabase } from "@/lib/supabase";
import { getItemCostCache } from "@/utils/profitUtils";
import { formatCustomSaleNotes } from "@/utils/salesItemResolver";

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
    sale_date: new Date().toISOString(),
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
    console.error('Error recording sale:', saleError);
    throw new Error(saleError.message || "Failed to record sale");
  }
};


