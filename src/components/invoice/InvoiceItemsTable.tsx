
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  includeVat: boolean;
  onVatChange: (include: boolean) => void;
  discountPercent: number;
  onDiscountChange: (percent: number) => void;
}

const VAT_RATE = 7.5; // Nigerian VAT rate

export const InvoiceItemsTable = ({ 
  items, 
  setItems, 
  totals, 
  currency, 
  amountPaid, 
  onAmountPaidChange,
  includeVat,
  onVatChange,
  discountPercent,
  onDiscountChange
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

  // Calculate amounts
  const discountAmount = (totals.subtotal * discountPercent) / 100;
  const afterDiscount = totals.subtotal - discountAmount;
  const vatAmount = includeVat ? (afterDiscount * VAT_RATE) / 100 : 0;
  const grandTotal = afterDiscount + vatAmount;
  const balance = grandTotal - amountPaid;

  return (
    <div className="space-y-4">
      {/* Desktop/Print table */}
      <div className="hidden md:block print:block">
        <div className="overflow-x-auto">
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
                      aria-label={`Remove ${item.description || 'item'}`}
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
                    inputMode="numeric"
                    min="0"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full"
                    aria-label="Quantity"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={newItem.unit_price === 0 ? "0" : newItem.unit_price || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    className="w-full"
                    aria-label="Unit price"
                  />
                </TableCell>
                <TableCell>{formatCurrency(newItem.amount, currency)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddItem}
                    aria-label="Add item"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile list layout */}
      <div className="md:hidden print:hidden space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border bg-background p-4 shadow-sm"
            role="group"
            aria-label={`Invoice item ${index + 1}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium leading-snug break-words flex-1">{item.description}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                aria-label={`Remove ${item.description || 'item'}`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Quantity</div>
              <div className="text-right">{item.quantity}</div>
              <div className="text-muted-foreground">Unit Price</div>
              <div className="text-right">{formatCurrency(item.unit_price, currency)}</div>
              <div className="text-muted-foreground font-medium">Amount</div>
              <div className="text-right font-medium">{formatCurrency(item.amount, currency)}</div>
            </div>
          </div>
        ))}

        {/* Add new item - mobile */}
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Description</Label>
              <ItemDescriptionAutocomplete
                value={newItem.description}
                onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
                onSelect={handleItemSelect}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qty" className="mb-1 block">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={newItem.quantity || ""}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  aria-label="Quantity"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="mb-1 block">Unit Price</Label>
                <Input
                  id="unit"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={newItem.unit_price === 0 ? "0" : newItem.unit_price || ""}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                  aria-label="Unit price"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrency(newItem.amount, currency)}</span>
            </div>
            <Button className="w-full min-h-11" onClick={handleAddItem} aria-label="Add item">
              Add item
            </Button>
          </div>
        </div>
      </div>

      {/* VAT and Discount Controls */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* VAT Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="vat-toggle"
              checked={includeVat}
              onCheckedChange={onVatChange}
            />
            <Label htmlFor="vat-toggle" className="cursor-pointer">
              Include VAT ({VAT_RATE}%)
            </Label>
          </div>
          
          {/* Discount Input */}
          <div className="flex items-center gap-2">
            <Label htmlFor="discount" className="whitespace-nowrap">Discount (%):</Label>
            <Input
              id="discount"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.5"
              value={discountPercent || ""}
              onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Totals/Payments */}
      <div className="flex flex-col gap-2 items-end">
        <div className="flex justify-between w-full md:w-72">
          <span>Subtotal:</span>
          <span>{formatCurrency(totals.subtotal, currency)}</span>
        </div>
        
        {discountPercent > 0 && (
          <div className="flex justify-between w-full md:w-72 text-success">
            <span>Discount ({discountPercent}%):</span>
            <span>-{formatCurrency(discountAmount, currency)}</span>
          </div>
        )}
        
        {includeVat && (
          <div className="flex justify-between w-full md:w-72">
            <span>VAT ({VAT_RATE}%):</span>
            <span>{formatCurrency(vatAmount, currency)}</span>
          </div>
        )}
        
        <div className="flex justify-between w-full md:w-72 font-semibold border-t pt-2">
          <span>Total:</span>
          <span>{formatCurrency(grandTotal, currency)}</span>
        </div>
        
        <div className="flex justify-between w-full md:w-72">
          <span className="print:hidden">
            <Label htmlFor="amountPaid">Amount Paid:</Label>
          </span>
          <span className="print:block hidden">Amount Paid:</span>
          <span className="print:hidden">
            <Input
              id="amountPaid"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amountPaid || ""}
              onChange={(e) => onAmountPaidChange(Number(e.target.value) || 0)}
              className="w-32"
            />
          </span>
          <span className="print:block hidden">{formatCurrency(amountPaid, currency)}</span>
        </div>
        
        <div className="flex justify-between w-full md:w-72 font-bold text-lg border-t pt-2">
          <span>Balance:</span>
          <span className={balance < 0 ? "text-success" : ""}>{formatCurrency(balance, currency)}</span>
        </div>
      </div>
    </div>
  );
};
