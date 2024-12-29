import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash } from "lucide-react";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useState } from "react";

interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={index}
              className={item.Quantity < 1 ? "bg-red-50" : ""}
            >
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
                    <span>${item.Price?.toFixed(2)}</span>
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
              <TableCell>${item.Total?.toFixed(2)}</TableCell>
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
  );
}