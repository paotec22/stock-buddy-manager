import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash, Trash2 } from "lucide-react";
import { InventoryItem } from "@/utils/inventoryUtils";

interface DesktopInventoryTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (checked: boolean, itemId: number) => void;
  onPriceEdit: (item: InventoryItem, e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  onDelete: (item: InventoryItem) => void;
  handleBulkDelete: () => void;
  editingPrice: { [key: string]: boolean };
  setEditingPrice: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  formatCurrency: (amount: number) => string;
}

export function DesktopInventoryTable({
  items,
  selectedItems,
  onSelectAll,
  onSelectItem,
  onPriceEdit,
  onDelete,
  handleBulkDelete,
  editingPrice,
  setEditingPrice,
  formatCurrency
}: DesktopInventoryTableProps) {
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
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </span>
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
                  onCheckedChange={(checked) => onSelectAll(checked === true)}
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
                    onCheckedChange={(checked) => onSelectItem(checked === true, item.id)}
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
                      onBlur={(e) => onPriceEdit(item, e)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onPriceEdit(item, e);
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
                        <span className="sr-only">Edit price</span>
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
                    <span className="sr-only">Delete item</span>
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