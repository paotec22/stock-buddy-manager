
import { supabase } from "@/lib/supabase";
import { getItemCostCache } from "@/utils/profitUtils";

interface ValidationParams {
  itemId: string;
  quantity: string;
  selectedItem: any;
  userId: string;
}

export const validateSaleSubmission = async ({ 
  itemId, 
  quantity, 
  selectedItem, 
  userId 
}: ValidationParams) => {
  console.log('Validating sale submission:', { itemId, quantity, selectedItem, userId });
  
  if (!userId) {
    throw new Error("Please login to record sales");
  }

  if (!selectedItem) {
    throw new Error("Invalid item selected");
  }

  const parsedQuantity = parseInt(quantity);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error("Please enter a valid quantity");
  }

  // Only check if there's enough quantity in stock
  if (parsedQuantity > selectedItem.Quantity) {
    throw new Error("Not enough items in inventory");
  }

  return {
    parsedQuantity,
    selectedItem
  };
};

export const recordSale = async (
  userId: string,
  itemId: string,
  quantity: number,
  salePrice: number,
  selectedItem: any,
  notes?: string,
  paymentStatus: string = 'paid',
  amountPaid?: number,
  customerId?: string | null,
  actualPurchasePrice?: number | null
) => {
  console.log('Recording sale:', { userId, itemId, quantity, salePrice, selectedItem, notes, paymentStatus, amountPaid, customerId, actualPurchasePrice });

  const totalAmount = quantity * salePrice;
  const finalAmountPaid = paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'unpaid' ? 0 : (amountPaid ?? 0));

  // If purchase cost is not explicitly provided, check item cost cache
  const costCache = getItemCostCache();
  const cachedCost = itemId && costCache[String(itemId)] ? costCache[String(itemId)] : null;
  const resolvedPurchasePrice =
    actualPurchasePrice !== undefined && actualPurchasePrice !== null
      ? actualPurchasePrice
      : cachedCost;

  const sale = {
    item_id: itemId,
    quantity: quantity,
    sale_price: salePrice,
    total_amount: totalAmount,
    user_id: userId,
    sale_date: new Date().toISOString(),
    notes: notes || null,
    payment_status: paymentStatus,
    amount_paid: finalAmountPaid,
    customer_id: customerId || null,
    actual_purchase_price: resolvedPurchasePrice,
  };

  // Record the sale - inventory will be updated automatically by database trigger
  const { error: saleError } = await supabase
    .from('sales')
    .insert([sale]);

  if (saleError) {
    console.error('Error recording sale:', saleError);
    throw new Error("Failed to record sale");
  }
};

