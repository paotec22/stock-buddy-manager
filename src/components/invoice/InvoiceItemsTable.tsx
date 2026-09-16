import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Trash2, ShoppingBag, Percent, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ItemDescriptionAutocomplete } from "./ItemDescriptionAutocomplete";
import { formatCurrency } from "@/utils/formatters";
import type { Currency } from "./CurrencyChanger";
import { Badge } from "@/components/ui/badge";
import { BankDetails } from "./BankDetails";

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
}: InvoiceItemsTableProps) => {
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 1,
    unit_price: 0,
    amount: 0
  });

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
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 font-semibold text-[11px] py-0 px-2">
          <CheckCircle2 className="h-3 w-3" />
          Paid in Full
        </Badge>
      );
    }
    if (amountPaid > 0 && balance > 0) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 font-semibold text-[11px] py-0 px-2">
          <AlertCircle className="h-3 w-3" />
          Partially Paid
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 flex items-center gap-1 font-semibold text-[11px] py-0 px-2">
        Unpaid
      </Badge>
    );
  };

  return (
    <div className="space-y-3 print:space-y-1.5">
      {/* Desktop/Print Table Card */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none">
        <div className="py-2 px-3 sm:px-4 border-b border-border/60 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-xs sm:text-sm text-foreground">Line Items</h3>
            <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems([])}
              className="!min-h-0 h-6 text-xs text-muted-foreground hover:text-destructive px-2"
            >
              Clear All Items
            </Button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block print:block overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/40 print:bg-slate-100">
              <TableRow className="hover:bg-transparent border-b border-border/70">
                <TableHead className="w-[46%] h-11 py-3 px-4 font-bold text-xs text-muted-foreground uppercase tracking-wider print:px-3 print:py-2 print:text-[11px] print:text-black">Item Description</TableHead>
                <TableHead className="w-[12%] h-11 py-3 px-3 text-center font-bold text-xs text-muted-foreground uppercase tracking-wider print:px-2 print:py-2 print:text-[11px] print:text-black">Qty</TableHead>
                <TableHead className="w-[20%] h-11 py-3 px-4 text-right font-bold text-xs text-muted-foreground uppercase tracking-wider print:px-3 print:py-2 print:text-[11px] print:text-black">Unit Price</TableHead>
                <TableHead className="w-[18%] h-11 py-3 px-4 text-right font-bold text-xs text-muted-foreground uppercase tracking-wider print:px-3 print:py-2 print:text-[11px] print:text-black">Line Total</TableHead>
                <TableHead className="w-[50px] h-11 py-3 px-2 print:hidden"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-xs sm:text-sm">
                    No items added yet. Use the row below to add items from inventory or type manually.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 border-b border-border/60 transition-colors">
                    <TableCell className="py-3.5 px-4 font-medium text-xs sm:text-sm text-foreground break-words print:py-2.5 print:px-3 print:text-xs">
                      {item.description}
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-center print:py-2.5 print:px-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemQuantity(index, Number(e.target.value))}
                        className="!min-h-0 w-16 h-8 text-center text-xs sm:text-sm font-mono font-medium mx-auto print:hidden"
                      />
                      <span className="hidden print:inline font-mono text-xs">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right print:py-2.5 print:px-3">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItemPrice(index, Number(e.target.value))}
                        className="!min-h-0 w-28 h-8 text-right text-xs sm:text-sm font-mono font-medium ml-auto print:hidden"
                      />
                      <span className="hidden print:inline font-mono text-xs">{formatCurrency(item.unit_price, currency)}</span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right font-mono font-semibold text-xs sm:text-sm text-foreground print:py-2.5 print:px-3 print:text-xs">
                      {formatCurrency(item.amount, currency)}
                    </TableCell>
                    <TableCell className="py-3.5 px-2 print:hidden text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="!min-h-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                <TableCell className="py-3 px-4">
                  <ItemDescriptionAutocomplete
                    value={newItem.description}
                    onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
                    onSelect={handleItemSelect}
                    className="!min-h-0 h-8 text-xs sm:text-sm bg-background"
                  />
                </TableCell>
                <TableCell className="py-3 px-3 text-center">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="!min-h-0 w-16 h-8 text-center font-mono text-xs sm:text-sm mx-auto"
                    placeholder="1"
                  />
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={newItem.unit_price === 0 ? "" : newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    className="!min-h-0 w-28 h-8 text-right font-mono text-xs sm:text-sm ml-auto"
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                  {formatCurrency(newItem.amount, currency)}
                </TableCell>
                <TableCell className="py-3 px-2 text-center">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.description.trim() || newItem.quantity <= 0}
                    size="sm"
                    className="!min-h-0 h-8 px-3 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
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
        <div className="md:hidden print:hidden p-2.5 sm:p-3 space-y-2.5">
          {items.length === 0 && (
            <div className="text-center py-6 px-4 bg-muted/20 rounded-xl border border-dashed border-border/80">
              <ShoppingBag className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-foreground">No items added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use the form below to quickly add items from inventory or enter custom pricing.</p>
            </div>
          )}

          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/80 bg-background p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-start justify-between gap-2.5">
                <span className="font-semibold text-xs sm:text-sm text-foreground leading-snug break-words flex-1">
                  {item.description}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="!min-h-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 active:scale-90 transition-transform"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs pt-0.5">
                {/* Quantity with mobile stepper */}
                <div>
                  <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider mb-1">Quantity</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateItemQuantity(index, Math.max(1, item.quantity - 1))}
                      className="!min-h-0 h-9 w-9 shrink-0 text-muted-foreground active:scale-95 bg-background"
                      title="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQuantity(index, Number(e.target.value))}
                      className="!min-h-0 h-9 w-full text-center text-sm font-mono font-medium bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateItemQuantity(index, item.quantity + 1)}
                      className="!min-h-0 h-9 w-9 shrink-0 text-muted-foreground active:scale-95 bg-background"
                      title="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Unit Price */}
                <div>
                  <span className="text-muted-foreground block text-[11px] font-medium uppercase tracking-wider mb-1">Unit Price</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => handleUpdateItemPrice(index, Number(e.target.value))}
                    className="!min-h-0 h-9 w-full text-sm font-mono font-medium text-right bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground text-xs font-medium">Line Total:</span>
                <span className="font-mono font-bold text-sm text-foreground">{formatCurrency(item.amount, currency)}</span>
              </div>
            </div>
          ))}

          {/* Mobile Add New Item Form */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
            <span className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Item to Invoice
            </span>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Item Description</Label>
              <ItemDescriptionAutocomplete
                value={newItem.description}
                onChange={(value) => setNewItem(prev => ({ ...prev, description: value }))}
                onSelect={handleItemSelect}
                className="!min-h-0 h-10 text-sm bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Quantity</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewItem(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                    className="!min-h-0 h-10 w-9 shrink-0 text-muted-foreground active:scale-95 bg-background"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="!min-h-0 h-10 text-center text-sm font-mono bg-background"
                    placeholder="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewItem(prev => ({ ...prev, quantity: (prev.quantity || 0) + 1 }))}
                    className="!min-h-0 h-10 w-9 shrink-0 text-muted-foreground active:scale-95 bg-background"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Unit Price</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={newItem.unit_price === 0 ? "" : newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                  className="!min-h-0 h-10 text-sm font-mono bg-background text-right"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-primary/15">
              <span className="text-xs text-muted-foreground font-medium">Calculated Amount:</span>
              <span className="text-sm font-bold font-mono text-primary">{formatCurrency(newItem.amount, currency)}</span>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.description.trim() || newItem.quantity <= 0}
              className="w-full !min-h-0 h-10 text-sm font-semibold shadow-xs active:scale-[0.99] transition-transform"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Item to List
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Summary & Payment Instructions Section */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-6 pt-4 print:pt-2">
        {/* Payment Instructions taking up the empty space */}
        <div className="flex-1 w-full order-2 lg:order-1 flex flex-col">
          <BankDetails />
        </div>

        {/* Financial Summary Block */}
        <div className="w-full lg:w-[420px] shrink-0 order-1 lg:order-2 rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-3 shadow-xs print:border-none print:shadow-none print:p-0 print:max-w-xs print:mt-1">
          <div className="flex items-center justify-between border-b pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Financial Summary
            </span>
            {getPaymentBadge()}
          </div>

          {/* Adjustments: VAT & Discount Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/60 print:hidden">
            {/* VAT Switch */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="vat-toggle" className="text-xs font-medium cursor-pointer">
                Apply VAT ({VAT_RATE}%)
              </Label>
              <Switch
                id="vat-toggle"
                checked={includeVat}
                onCheckedChange={onVatChange}
                className="scale-90 shrink-0"
              />
            </div>

            {/* Discount % Input */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="discount" className="text-xs font-medium flex items-center gap-1">
                <Percent className="h-3 w-3 text-primary shrink-0" />
                Discount (%):
              </Label>
              <Input
                id="discount"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.5"
                value={discountPercent || ""}
                onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-20 sm:w-16 !min-h-0 h-8 sm:h-7 text-sm sm:text-xs font-mono text-right bg-background"
                placeholder="0"
              />
            </div>
          </div>

          {/* Breakdown Lines */}
          <div className="space-y-2 text-xs pt-0.5">
            <div className="flex justify-between items-center text-muted-foreground py-0.5">
              <span className="text-xs sm:text-sm">Subtotal</span>
              <span className="font-mono font-medium text-xs sm:text-sm text-foreground">{formatCurrency(subtotal, currency)}</span>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 py-0.5">
                <span className="text-xs sm:text-sm">Discount ({discountPercent}%)</span>
                <span className="font-mono font-medium text-xs sm:text-sm">-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}

            {includeVat && (
              <div className="flex justify-between items-center text-muted-foreground py-0.5">
                <span className="text-xs sm:text-sm">VAT ({VAT_RATE}%)</span>
                <span className="font-mono font-medium text-xs sm:text-sm text-foreground">{formatCurrency(vatAmount, currency)}</span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-sm sm:text-base text-foreground border-t pt-2">
              <span>Grand Total</span>
              <span className="font-mono text-primary text-base sm:text-lg font-bold">{formatCurrency(grandTotal, currency)}</span>
            </div>

            {/* Amount Paid */}
            <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-1.5 pt-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="amountPaid" className="text-xs sm:text-sm font-semibold text-foreground">
                  Amount Paid
                </Label>
                {grandTotal > 0 && balance > 0 && (
                  <button
                    type="button"
                    onClick={() => onAmountPaidChange(grandTotal)}
                    className="print:hidden text-xs sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded cursor-pointer transition-colors active:scale-95"
                    title="Mark invoice as paid in full (switches to Receipt)"
                  >
                    Pay in Full
                  </button>
                )}
              </div>
              <div className="print:hidden">
                <Input
                  id="amountPaid"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={amountPaid || ""}
                  onChange={(e) => onAmountPaidChange(Number(e.target.value) || 0)}
                  className="w-full sm:w-28 !min-h-0 h-9 sm:h-8 text-right font-mono font-semibold text-sm bg-background"
                  placeholder="0.00"
                />
              </div>
              <span className="hidden print:inline font-mono font-medium text-foreground">
                {formatCurrency(amountPaid, currency)}
              </span>
            </div>

            {/* Balance */}
            <div className="flex justify-between items-center font-bold text-xs sm:text-sm border-t pt-2">
              <span>{balance <= 0 && grandTotal > 0 ? "Balance Settled" : "Outstanding Balance"}</span>
              <span className={`font-mono text-base sm:text-lg font-bold ${balance <= 0 && grandTotal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatCurrency(balance, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
