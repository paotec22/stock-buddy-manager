
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";

export function useInventoryOperations(refetch: () => void) {
  const handlePriceEdit = async (item: InventoryItem, newPrice: number) => {
    try {
      // Validate the new price
      if (isNaN(newPrice) || newPrice < 0) {
        throw new Error("Price must be a positive number");
      }
      
      console.log('Updating price for item:', item.id);
      
      // Calculate the new total based on the new price and current quantity
      const newTotal = newPrice * item.Quantity;
      
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Price: newPrice,
          Total: newTotal 
        })
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Price updated successfully");
      refetch();
    } catch (error) {
      console.error('Error updating price:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update price");
      }
    }
  };

  const handleQuantityEdit = async (item: InventoryItem, newQuantity: number) => {
    try {
      // Validate the new quantity
      if (isNaN(newQuantity) || newQuantity < 0 || !Number.isInteger(newQuantity)) {
        throw new Error("Quantity must be a positive whole number");
      }
      
      console.log('Updating quantity for item:', item.id);
      
      // Calculate the new total based on the current price and new quantity
      const newTotal = item.Price * newQuantity;
      
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Quantity: newQuantity,
          Total: newTotal 
        })
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Quantity updated successfully");
      refetch();
    } catch (error) {
      console.error('Error updating quantity:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update quantity");
      }
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      console.log('Deleting item:', item.id);
      const { error } = await supabase
        .from('inventory list')
        .delete()
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Item deleted successfully");
      refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  return {
    handlePriceEdit,
    handleQuantityEdit,
    handleDelete
  };
}
