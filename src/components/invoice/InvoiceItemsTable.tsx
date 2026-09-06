import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShoppingBag, Percent, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ItemDescriptionAutocomplete } from "./ItemDescriptionAutocomplete";
import { formatCurrency } from "@/utils/formatters";
import type { Currency } from "./CurrencyChanger";
import { Badge } from "@/components/ui/badge";

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
  notes?: string;
  onNotesChange?: (notes: string) => void;
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
  onDiscountChange,
  notes = "",
  onNotesChange
}: InvoiceItemsTableProps) => {
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 1,
    unit_price: 0,
    amount: 0
  });

  const [enableNotes, setEnableNotes] = useState(Boolean(notes && notes.trim() !== ""));

  useEffect(() => {
    if (notes && notes.trim() !== "") {
      setEnableNotes(true);
    }
  }, [notes]);

  const handleToggleNotes = (enabled: boolean) => {
    setEnableNotes(enabled);
    if (!enabled) {
      onNotesChange?.("");
    }
  };

  useEffect(() => {
    const amount = (newItem.quantity || 0) * (newItem.unit_price || 0);
    setNewItem(prev => ({ ...prev, amount }));
  }, [newItem.quantity, newItem.unit_price]);

  const handleAddItem = () => {
    if (!newItem.description.trim() || newItem.quantity <= 0) {
      return;
    }

    setItems([...items, {
      ...newItem,
      amount: newItem.quantity * newItem.unit_price
    }]);
    
    setNewItem({
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemSelect = (selectedItem: any) => {
    setNewItem(prev => ({
      ...prev,
      description: selectedItem["Item Description"] || "",
      unit_price: selectedItem.Price || 0
    }));
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const qty = Math.max(1, newQty);
        return { ...item, quantity: qty, amount: qty * item.unit_price };
      }
      return item;
    }));
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const price = Math.max(0, newPrice);
        return { ...item, unit_price: price, amount: item.quantity * price };
      }
      return item;
    }));
  };

  // Calculate amounts
  const subtotal = totals.subtotal;
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = includeVat ? (afterDiscount * VAT_RATE) / 100 : 0;
  const grandTotal = afterDiscount + vatAmount;
  const balance = grandTotal - amountPaid;

  const getPaymentBadge = () => {
    if (grandTotal === 0) return null;
    if (balance <= 0 && amountPaid > 0) {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 font-semibold text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Paid in Full
        </Badge>
      );
    }
    if (amountPaid > 0 && balance > 0) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 font-semibold text-xs">
          <AlertCircle className="h-3 w-3" />
          Partially Paid
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 flex items-center gap-1 font-semibold text-xs">
        Unpaid
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Desktop/Print Table Card */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">Line Items</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems([])}
              className="h-7 text-xs text-muted-foreground hover:text-destructive print:hidden"
            >
              Clear All Items
            </Button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block print:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[45%] font-semibold text-xs text-muted-foreground uppercase">Item Description</TableHead>
                <TableHead className="w-[15%] text-center font-semibold text-xs text-muted-foreground uppercase">Quantity</TableHead>
                <TableHead className="w-[20%] text-right font-semibold text-xs text-muted-foreground uppercase">Unit Price</TableHead>
                <TableHead className="w-[20%] text-right font-semibold text-xs text-muted-foreground uppercase">Line Total</TableHead>
                <TableHead className="w-[50px] print:hidden"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs sm:text-sm">
                    No items added yet. Use the row below to add items from inventory or type manually.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-xs sm:text-sm text-foreground break-words">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemQuantity(index, Number(e.target.value))}
                        className="w-16 h-8 text-center text-xs font-mono mx-auto print:hidden"
                      />
                      <span className="hidden print:inline">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItemPrice(index, Number(e.target.value))}
                        className="w-28 h-8 text-right text-xs font-mono ml-auto print:hidden"
                      />
                      <span className="hidden print:inline">{formatCurrency(item.unit_price, currency)}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                      {formatCurrency(item.amount, currency)}
                    </TableCell>
                    <TableCell className="print:hidden text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Add New Item Input Row - Print Hidden */}
              <TableRow className="bg-muted/20 print:hidden border-t-2 border-primary/20">
                <TableCell>
                  <ItemDescriptionAutocomplete
                    value={newItem.description}
                    onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
                    onSelect={handleItemSelect}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-16 h-9 text-center font-mono text-xs mx-auto"
                    placeholder="1"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={newItem.unit_price === 0 ? "" : newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    className="w-28 h-9 text-right font-mono text-xs ml-auto"
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                  {formatCurrency(newItem.amount, currency)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.description.trim() || newItem.quantity <= 0}
                    size="sm"
                    className="h-9 px-3 bg-primary text-primary-foreground font-semibold shadow-xs"
                    title="Add to Invoice"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Mobile List Layout */}
        <div className="md:hidden print:hidden p-3.5 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-border/80 bg-background p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-foreground leading-snug">{item.description}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Quantity</span>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItemQuantity(index, Number(e.target.value))}
                    className="h-7 w-20 text-xs font-mono mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Unit Price</span>
                  <Input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => handleUpdateItemPrice(index, Number(e.target.value))}
                    className="h-7 w-full text-xs font-mono mt-0.5"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t text-xs font-semibold">
                <span className="text-muted-foreground">Line Total:</span>
                <span className="font-mono text-foreground">{formatCurrency(item.amount, currency)}</span>
              </div>
            </div>
          ))}

          {/* Mobile Add New Item Form */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-3">
            <span className="text-xs font-bold text-primary block">Add Item</span>
            <ItemDescriptionAutocomplete
              value={newItem.description}
              onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
              onSelect={handleItemSelect}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity || ""}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                  placeholder="1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.unit_price === 0 ? "" : newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Calculated Amount</span>
              <span className="text-xs font-bold font-mono">{formatCurrency(newItem.amount, currency)}</span>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.description.trim() || newItem.quantity <= 0}
              className="w-full h-9 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Item to List
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Notes / Terms on Left, Totals / VAT / Balance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Notes & Terms (Screen edit control) */}
        <div className={`rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-3 shadow-xs ${!enableNotes ? 'print:hidden' : (notes && notes.trim() ? '' : 'print:hidden')}`}>
          <div className="flex items-center justify-between border-b pb-2.5 print:hidden">
            <Label htmlFor="enable-notes-toggle" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
              <Receipt className="h-4 w-4 text-primary" />
              Terms & Payment Instructions / Notes
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium">
                {enableNotes ? "Enabled" : "Disabled"}
              </span>
              <Switch
                id="enable-notes-toggle"
                checked={enableNotes}
                onCheckedChange={handleToggleNotes}
              />
            </div>
          </div>

          {enableNotes && (
            <div className="space-y-2 pt-1 print:hidden">
              <Textarea
                id="notes"
                rows={4}
                placeholder="e.g. Payment due within 14 days. Goods received in good condition are non-refundable."
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                className="text-xs sm:text-sm bg-background resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                These terms will appear at the bottom of the invoice document.
              </p>
            </div>
          )}

          {/* Print representation if notes enabled and filled */}
          {enableNotes && notes && notes.trim().length > 0 && (
            <div className="hidden print:block text-xs pt-1">
              <span className="font-bold text-foreground block mb-1 uppercase tracking-wider text-[11px]">Terms & Payment Notes:</span>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Calculations & Controls */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Financial Summary
            </span>
            {getPaymentBadge()}
          </div>

          {/* Adjustments: VAT & Discount Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 print:hidden">
            {/* VAT Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="vat-toggle" className="text-xs font-medium cursor-pointer">
                Apply VAT ({VAT_RATE}%)
              </Label>
              <Switch
                id="vat-toggle"
                checked={includeVat}
                onCheckedChange={onVatChange}
              />
            </div>

            {/* Discount % Input */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="discount" className="text-xs font-medium flex items-center gap-1">
                <Percent className="h-3 w-3 text-primary" />
                Discount (%):
              </Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountPercent || ""}
                onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-16 h-7 text-xs font-mono text-right"
                placeholder="0"
              />
            </div>
          </div>

          {/* Breakdown Lines */}
          <div className="space-y-2 text-xs sm:text-sm pt-1">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-foreground">{formatCurrency(subtotal, currency)}</span>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span>Discount ({discountPercent}%)</span>
                <span className="font-mono font-medium">-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}

            {includeVat && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>VAT ({VAT_RATE}%)</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(vatAmount, currency)}</span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-sm sm:text-base text-foreground border-t pt-2">
              <span>Grand Total</span>
              <span className="font-mono text-primary text-base sm:text-lg">{formatCurrency(grandTotal, currency)}</span>
            </div>

            {/* Amount Paid */}
            <div className="flex justify-between items-center pt-2 print:hidden">
              <Label htmlFor="amountPaid" className="text-xs font-semibold text-foreground">
                Amount Paid
              </Label>
              <Input
                id="amountPaid"
                type="number"
                min="0"
                step="any"
                value={amountPaid || ""}
                onChange={(e) => onAmountPaidChange(Number(e.target.value) || 0)}
                className="w-32 h-8 text-right font-mono font-semibold text-xs sm:text-sm bg-background"
                placeholder="0.00"
              />
            </div>

            {/* Balance */}
            <div className="flex justify-between items-center font-bold text-sm sm:text-base border-t pt-2">
              <span>Outstanding Balance</span>
              <span className={`font-mono text-base sm:text-lg ${balance <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatCurrency(balance, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
