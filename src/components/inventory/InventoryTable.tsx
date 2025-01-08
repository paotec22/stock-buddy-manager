import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { DeleteCell, EditableCell } from "./table/InventoryTableCell";

interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!selectedItems.length || isDeleting) return;

    try {
      setIsDeleting(true);
      console.log("Starting bulk delete operation for items:", selectedItems);

      const { error } = await supabase
        .rpc('delete_multiple_inventory_items', {
          item_ids: selectedItems
        });

      if (error) throw error;

      console.log("Bulk delete operation completed successfully");
      toast.success(`Successfully deleted ${selectedItems.length} items`);
      setSelectedItems([]);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error("Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuantityEdit = async (item: InventoryItem, e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.currentTarget.value);
    if (!isNaN(newQuantity)) {
      try {
        console.log("Updating quantity for item:", item.id, "New quantity:", newQuantity);
        
        const { error } = await supabase
          .from('inventory list')
          .update({ 
            Quantity: newQuantity,
            Total: item.Price * newQuantity 
          })
          .eq('id', item.id)
          .eq('location', item.location);

        if (error) throw error;
        
        console.log("Quantity update successful");
        toast.success("Quantity updated successfully");
        setEditingQuantity({ ...editingQuantity, [item["Item Description"]]: false });
        window.location.reload();
      } catch (error) {
        console.error('Error updating quantity:', error);
        toast.error("Failed to update quantity");
      }
    }
  };

  return (
    <div className="space-y-4">
      <InventoryTableActions 
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
      />
      
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={items.length > 0 && selectedItems.length === items.length}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
              </TableHead>
              <TableHead className="text-xs sm:text-sm">Item Description</TableHead>
              <TableHead className="text-xs sm:text-sm">Price</TableHead>
              <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
              <TableHead className="text-xs sm:text-sm">Total</TableHead>
              <TableHead className="text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow 
                key={item.id}
                className={item.Quantity < 1 ? "bg-red-100/50 dark:bg-red-950/30" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(checked === true, item.id)}
                  />
                </TableCell>
                <TableCell className="min-w-[200px] text-xs sm:text-sm">{item["Item Description"]}</TableCell>
                <TableCell>
                  <EditableCell
                    isEditing={editingPrice[item["Item Description"]]}
                    value={item.Price}
                    onEdit={(e) => onPriceEdit(item, parseFloat(e.currentTarget.value))}
                    onStartEdit={() => setEditingPrice({ ...editingPrice, [item["Item Description"]]: true })}
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    isEditing={editingQuantity[item["Item Description"]]}
                    value={item.Quantity}
                    onEdit={(e) => handleQuantityEdit(item, e)}
                    onStartEdit={() => setEditingQuantity({ ...editingQuantity, [item["Item Description"]]: true })}
                  />
                </TableCell>
                <TableCell className="text-xs sm:text-sm">{formatCurrency(item.Total)}</TableCell>
                <DeleteCell onDelete={() => onDelete(item)} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}