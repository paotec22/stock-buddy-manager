import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileInventoryTable } from "./MobileInventoryTable";
import { DesktopInventoryTable } from "./DesktopInventoryTable";

interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (checked: boolean, itemId: number) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;

    try {
      const { error } = await supabase.rpc('delete_multiple_inventory_items', {
        item_ids: selectedItems
      });

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedItems.length} items`);
      setSelectedItems([]);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error("Failed to delete items");
    }
  };

  const handlePriceEdit = async (item: InventoryItem, e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (!e.currentTarget) return;
    const newPrice = parseFloat(e.currentTarget.value);
    if (!isNaN(newPrice)) {
      await onPriceEdit(item, newPrice);
      setEditingPrice({ ...editingPrice, [item["Item Description"]]: false });
    }
  };

  const sharedProps = {
    items,
    selectedItems,
    onSelectItem: handleSelectItem,
    onPriceEdit: handlePriceEdit,
    onDelete,
    handleBulkDelete,
    editingPrice,
    setEditingPrice,
    formatCurrency,
  };

  if (isMobile) {
    return <MobileInventoryTable {...sharedProps} />;
  }

  return (
    <DesktopInventoryTable 
      {...sharedProps}
      onSelectAll={handleSelectAll}
    />
  );
}