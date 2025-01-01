import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash, Trash2 } from "lucide-react";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <span>{selectedItems.length} items selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}
      
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
              <TableHead>Item Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow 
                key={item.id}
                className={item.Quantity < 1 ? "bg-red-50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(checked === true, item.id)}
                  />
                </TableCell>
                <TableCell className="min-w-[200px]">{item["Item Description"]}</TableCell>
                <TableCell>
                  {editingPrice[item["Item Description"]] ? (
                    <Input
                      type="number"
                      defaultValue={item.Price}
                      className="w-24"
                      autoFocus
                      onBlur={(e) => {
                        onPriceEdit(item, parseFloat(e.target.value));
                        setEditingPrice({ ...editingPrice, [item["Item Description"]]: false });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onPriceEdit(item, parseFloat((e.target as HTMLInputElement).value));
                          setEditingPrice({ ...editingPrice, [item["Item Description"]]: false });
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{formatCurrency(item.Price)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPrice({ ...editingPrice, [item["Item Description"]]: true })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>{item.Quantity}</TableCell>
                <TableCell>{formatCurrency(item.Total)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}