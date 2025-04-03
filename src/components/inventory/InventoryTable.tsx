
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { DeleteCell, EditableCell } from "./table/InventoryTableCell";

export function InventoryTable({ items, onPriceEdit, onDelete }: InventoryTableProps) {
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

  return (
    <div className="space-y-4">
      <InventoryTableActions 
        selectedItems={selectedItems}
        onBulkDelete={() => {}}
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
                  className="h-2 w-2" // Further reduced size to h-2 w-2
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
                    className="h-2 w-2" // Further reduced size to h-2 w-2
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
                    onEdit={(e) => {}}
                    onStartEdit={() => setEditingQuantity({ ...editingQuantity, [item["Item Description"]]: true })}
                  />
                </TableCell>
                <TableCell className="text-xs sm:text-sm">{item.Total}</TableCell>
                <DeleteCell onDelete={() => onDelete(item)} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
