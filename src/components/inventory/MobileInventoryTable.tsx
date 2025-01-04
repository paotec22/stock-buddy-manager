import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash, Trash2 } from "lucide-react";
import { InventoryItem } from "@/utils/inventoryUtils";

interface MobileInventoryTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onSelectItem: (checked: boolean, itemId: number) => void;
  onPriceEdit: (item: InventoryItem, e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  onDelete: (item: InventoryItem) => void;
  handleBulkDelete: () => void;
  editingPrice: { [key: string]: boolean };
  setEditingPrice: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  formatCurrency: (amount: number) => string;
}

export function MobileInventoryTable({
  items,
  selectedItems,
  onSelectItem,
  onPriceEdit,
  onDelete,
  handleBulkDelete,
  editingPrice,
  setEditingPrice,
  formatCurrency
}: MobileInventoryTableProps) {
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
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </div>
          </Button>
        </div>
      )}
      
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`p-4 rounded-lg border ${item.Quantity < 1 ? "bg-red-50" : "bg-card"}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => onSelectItem(checked === true, item.id)}
                />
                <h3 className="font-medium">{item["Item Description"]}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
              >
                <div className="flex items-center justify-center">
                  <span className="sr-only">Delete item</span>
                  <Trash className="h-4 w-4 text-red-500" />
                </div>
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
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
                      <div className="flex items-center justify-center">
                        <span className="sr-only">Edit price</span>
                        <Edit2 className="h-4 w-4" />
                      </div>
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span>{item.Quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span>{formatCurrency(item.Total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}