
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ItemDescriptionAutocomplete } from "./ItemDescriptionAutocomplete";
import { formatCurrency } from "@/utils/formatters";
import type { Currency } from "./CurrencyChanger";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  totals: {
    subtotal: number;
    total: number;
  };
  currency: Currency;
  amountPaid: number;
  onAmountPaidChange: (amount: number) => void;
}

export const InvoiceItemsTable = ({ 
  items, 
  setItems, 
  totals, 
  currency, 
  amountPaid, 
  onAmountPaidChange 
}: InvoiceItemsTableProps) => {
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 0,
    unit_price: 0,
    amount: 0
  });

  useEffect(() => {
    // Automatically calculate amount when quantity or unit_price changes
    const amount = newItem.quantity * newItem.unit_price;
    setNewItem(prev => ({ ...prev, amount }));
  }, [newItem.quantity, newItem.unit_price]);

  const handleAddItem = () => {
    // Allow zero as a valid unit price, but description and quantity validations remain
    if (!newItem.description || newItem.quantity <= 0) {
      return;
    }

    setItems([...items, {
      ...newItem,
      amount: newItem.quantity * newItem.unit_price
    }]);
    
    setNewItem({
      description: "",
      quantity: 0,
      unit_price: 0,
      amount: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemSelect = (selectedItem: any) => {
    console.log('Selected item:', selectedItem);
    setNewItem(prev => ({
      ...prev,
      description: selectedItem["Item Description"], // Ensure description is set
      unit_price: selectedItem.Price || 0
    }));
  };

  const balance = totals.total - amountPaid;

  return (
    <div className="space-y-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="w-[100px] print:hidden">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="break-words">{item.description}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatCurrency(item.unit_price, currency)}</TableCell>
              <TableCell>{formatCurrency(item.amount, currency)}</TableCell>
              <TableCell className="print:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {/* New item row - hidden when printing */}
          <TableRow className="print:hidden">
            <TableCell>
              <ItemDescriptionAutocomplete
                value={newItem.description}
                onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
                onSelect={handleItemSelect}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                value={newItem.quantity || ""}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-full"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                value={newItem.unit_price === 0 ? "0" : newItem.unit_price || ""}
                onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                className="w-full"
              />
            </TableCell>
            <TableCell>{formatCurrency(newItem.amount, currency)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 items-end">
        <div className="flex justify-between w-full md:w-64">
          <span>Total:</span>
          <span>{formatCurrency(totals.total, currency)}</span>
        </div>
        
        <div className="flex justify-between w-full md:w-64 print:hidden">
          <Label htmlFor="amountPaid">Amount Paid:</Label>
          <Input
            id="amountPaid"
            type="number"
            min="0"
            value={amountPaid || ""}
            onChange={(e) => onAmountPaidChange(Number(e.target.value) || 0)}
            className="w-32"
          />
        </div>
        
        <div className="flex justify-between w-full md:w-64 font-bold text-lg border-t pt-2">
          <span>Balance:</span>
          <span>{formatCurrency(balance, currency)}</span>
        </div>
      </div>
    </div>
  );
};
