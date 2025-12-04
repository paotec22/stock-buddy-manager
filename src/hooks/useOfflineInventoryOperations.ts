import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useOnlineStatus } from "./useOnlineStatus";
import { useSyncQueue } from "./useSyncQueue";
import { STORES } from "@/lib/indexedDB";

export function useOfflineInventoryOperations(refetch: () => void) {
  const isOnline = useOnlineStatus();
  const { queueOperation, getPendingCount } = useSyncQueue();

  const handlePriceEdit = async (item: InventoryItem, newPrice: number) => {
    try {
      if (isNaN(newPrice) || newPrice < 0) {
        throw new Error("Price must be a positive number");
      }

      const newTotal = newPrice * item.Quantity;
      const updatedItem = { ...item, Price: newPrice, Total: newTotal };

      if (isOnline) {
        // Online: Update directly in Supabase
        const { error } = await supabase
          .from('inventory list')
          .update({ Price: newPrice, Total: newTotal })
          .eq('id', item.id)
          .eq('location', item.location);

        if (error) throw error;
        toast.success("Price updated successfully");
      } else {
        // Offline: Queue the operation
        await queueOperation(STORES.INVENTORY, 'update', updatedItem);
        toast.success("Price updated (will sync when online)");
      }

      refetch();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update price");
    }
  };

  const handleQuantityEdit = async (item: InventoryItem, newQuantity: number) => {
    try {
      if (isNaN(newQuantity) || newQuantity < 0 || !Number.isInteger(newQuantity)) {
        throw new Error("Quantity must be a positive whole number");
      }

      const newTotal = item.Price * newQuantity;
      const updatedItem = { ...item, Quantity: newQuantity, Total: newTotal };

      if (isOnline) {
        const { error } = await supabase
          .from('inventory list')
          .update({ Quantity: newQuantity, Total: newTotal })
          .eq('id', item.id)
          .eq('location', item.location);

        if (error) throw error;
        toast.success("Quantity updated successfully");
      } else {
        await queueOperation(STORES.INVENTORY, 'update', updatedItem);
        toast.success("Quantity updated (will sync when online)");
      }

      refetch();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      if (isOnline) {
        const { error } = await supabase
          .from('inventory list')
          .delete()
          .eq('id', item.id)
          .eq('location', item.location);

        if (error) throw error;
        toast.success("Item deleted successfully");
      } else {
        await queueOperation(STORES.INVENTORY, 'delete', { id: item.id, location: item.location });
        toast.success("Item deleted (will sync when online)");
      }

      refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  return {
    handlePriceEdit,
    handleQuantityEdit,
    handleDelete,
    pendingCount: getPendingCount(STORES.INVENTORY),
    isOnline
  };
}
