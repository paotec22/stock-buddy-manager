
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

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
  selectedItem: any
) => {
  console.log('Recording sale:', { userId, itemId, quantity, salePrice, selectedItem });
  
  const sale = {
    item_id: itemId,
    quantity: quantity,
    sale_price: salePrice,
    total_amount: quantity * salePrice,
    user_id: userId,
    sale_date: new Date().toISOString(),
  };

  // Record the sale - inventory will be updated automatically by database trigger
  const { error: saleError } = await supabase
    .from('sales')
    .insert([{
      ...sale,
      // ensure item_id is stored as an integer (not a string)
      item_id: parseInt(sale.item_id as unknown as string, 10)
    }]);

  if (saleError) {
    console.error('Error recording sale:', saleError);
    throw new Error(`Failed to record sale: ${saleError.message}`);
  }

  console.log('Sale recorded successfully - inventory updated automatically by trigger');
};

