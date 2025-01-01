import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ValidationParams {
  itemId: string;
  quantity: string;
  selectedItem: any;
  userId: string | undefined;
}

export const validateSaleSubmission = async ({ 
  itemId, 
  quantity, 
  selectedItem, 
  userId 
}: ValidationParams) => {
  if (!userId) {
    throw new Error("Please login to record sales");
  }

  if (!selectedItem) {
    throw new Error("Invalid item selected");
  }

  const parsedQuantity = parseInt(quantity);
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
  selectedItem: any
) => {
  const sale = {
    item_id: itemId,
    quantity: quantity,
    sale_price: salePrice,
    total_amount: quantity * salePrice,
    user_id: userId,
    sale_date: new Date().toISOString(),
  };

  const { error: saleError } = await supabase
    .from('sales')
    .insert([sale]);

  if (saleError) {
    console.error('Error recording sale:', saleError);
    throw new Error("Failed to record sale");
  }

  // Update inventory quantity
  const { error: updateError } = await supabase
    .from('inventory list')
    .update({ Quantity: selectedItem.Quantity - quantity })
    .eq('id', selectedItem.id);

  if (updateError) {
    console.error('Error updating inventory:', updateError);
    throw new Error("Failed to update inventory");
  }
};