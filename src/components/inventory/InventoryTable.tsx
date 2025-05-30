
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { DeleteCell, EditableCell } from "./table/InventoryTableCell";
import { formatCurrency } from "@/utils/formatters";

export interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onQuantityEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedItems.length === 0) return Promise.resolve();
    
    setIsDeleting(true);
    try {
      // Get the location of the first item (all selected items should be from the same location)
      const location = items.find(item => item.id === selectedItems[0])?.location;
      
      if (!location) {
        throw new Error("Could not determine location for bulk delete");
      }
      
      const { error } = await supabase
        .from('inventory list')
        .delete()
        .in('id', selectedItems)
        .eq('location', location);
        
      if (error) throw error;
      
      toast.success(`Successfully deleted ${selectedItems.length} items`);
      setSelectedItems([]);
      
      // Force a page refresh to show updated inventory
      window.location.reload();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      toast.error("Failed to delete selected items");
      return Promise.resolve();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <InventoryTableActions 
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
      />
      
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card glass-effect">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={items.length > 0 && selectedItems.length === items.length}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  className="h-3 w-3"
                />
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Item Description</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Price</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Quantity</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Total</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow 
                key={item.id}
                className={`transition-colors ${item.Quantity < 1 ? "bg-red-50/70 dark:bg-red-950/30" : "hover:bg-muted/30"}`}
              >
                <TableCell className="p-2 pl-4">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(checked === true, item.id)}
                    className="h-3 w-3"
                  />
                </TableCell>
                <TableCell className="min-w-[200px] text-xs sm:text-sm p-2">{item["Item Description"]}</TableCell>
                <TableCell className="p-2">
                  <EditableCell
                    isEditing={editingPrice[item["Item Description"]]}
                    value={item.Price}
                    onEdit={(e) => {
                      const value = parseFloat(e.currentTarget.value);
                      if (isNaN(value) || value < 0) {
                        toast.error("Price must be a positive number");
                        return;
                      }
                      onPriceEdit(item, value);
                      setEditingPrice({ ...editingPrice, [item["Item Description"]]: false });
                    }}
                    onStartEdit={() => setEditingPrice({ ...editingPrice, [item["Item Description"]]: true })}
                    isCurrency={true}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <EditableCell
                    isEditing={editingQuantity[item["Item Description"]]}
                    value={item.Quantity}
                    onEdit={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      if (isNaN(value) || value < 0 || !Number.isInteger(parseFloat(e.currentTarget.value))) {
                        toast.error("Quantity must be a positive whole number");
                        return;
                      }
                      onQuantityEdit(item, value);
                      setEditingQuantity({ ...editingQuantity, [item["Item Description"]]: false });
                    }}
                    onStartEdit={() => setEditingQuantity({ ...editingQuantity, [item["Item Description"]]: true })}
                  />
                </TableCell>
                <TableCell className="text-xs sm:text-sm font-medium p-2">{formatCurrency(Number(item.Total))}</TableCell>
                <DeleteCell onDelete={() => onDelete(item)} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
