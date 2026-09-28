import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { validateSaleSubmission, recordSale } from "./useSaleFormValidation";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerSelector, type CustomerLite } from "@/components/customers/CustomerSelector";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Receipt, Sparkles, X, CheckCircle2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { PaymentStatus } from "./types";
import { ImportInvoiceDialog, type InvoiceRecord, type InvoiceItemRecord } from "./ImportInvoiceDialog";

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialInvoiceId?: number | null;
}

interface LineItem {
  key: string;
  itemId: string;
  quantity: string;
  salePrice: string;
}

const newLine = (): LineItem => ({
  key: Math.random().toString(36).slice(2),
  itemId: "",
  quantity: "1",
  salePrice: "",
});

const LOCATIONS = ["Ikeja", "Lekki", "Abuja", "Port Harcourt"];

export function AddSaleForm({ open, onOpenChange, onSuccess, initialInvoiceId }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedInvoice, setImportedInvoice] = useState<InvoiceRecord | null>(null);

  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', selectedLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .eq('location', selectedLocation);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
  });

  const updateLine = (key: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleItemSelect = (key: string, itemId: string) => {
    const selectedItem = inventoryItems.find((item) => item.id.toString() === itemId);
    updateLine(key, {
      itemId,
      salePrice: selectedItem?.Price != null ? selectedItem.Price.toString() : "",
    });
  };

  const grandTotal = lines.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.salePrice) || 0),
    0
  );

  const resetForm = () => {
    setLines([newLine()]);
    setCustomer(null);
    setPaymentStatus("paid");
    setAmountPaid("");
    setNotes("");
    setImportedInvoice(null);
  };

  // Handle Auto-populating Record Sales from Selected Invoice
  const handleSelectInvoice = async (
    invoice: InvoiceRecord,
    items: InvoiceItemRecord[]
  ) => {
    setImportedInvoice(invoice);

    // 1. Resolve & Auto-Populate Customer
    if (invoice.customer_id) {
      const { data: custData } = await supabase
        .from("customers")
        .select("id, name, phone, email, address")
        .eq("id", invoice.customer_id)
        .maybeSingle();

      if (custData) {
        setCustomer({
          id: custData.id,
          name: custData.name,
          phone: custData.phone,
          email: custData.email,
          address: custData.address,
        });
      } else {
        setCustomer({
          id: invoice.customer_id,
          name: invoice.customer_name,
          phone: invoice.customer_phone,
          email: invoice.customer_email,
          address: invoice.customer_address,
        });
      }
    } else if (invoice.customer_name) {
      const { data: matchedCust } = await supabase
        .from("customers")
        .select("id, name, phone, email, address")
        .ilike("name", invoice.customer_name.trim())
        .maybeSingle();

      if (matchedCust) {
        setCustomer({
          id: matchedCust.id,
          name: matchedCust.name,
          phone: matchedCust.phone,
          email: matchedCust.email,
          address: matchedCust.address,
        });
      } else {
        setCustomer({
          id: "",
          name: invoice.customer_name,
          phone: invoice.customer_phone,
          email: invoice.customer_email,
          address: invoice.customer_address,
        });
      }
    }

    // 2. Resolve & Auto-Populate Line Items
    if (items && items.length > 0) {
      let matchedCount = 0;
      const mappedLines: LineItem[] = items.map((invItem) => {
        let matchedId = "";

        // 1) Direct item_id match in inventory
        if (invItem.item_id) {
          const found = inventoryItems.find(
            (it) => it.id === invItem.item_id || it.id.toString() === invItem.item_id?.toString()
          );
          if (found) matchedId = found.id.toString();
        }

        // 2) Match by description
        if (!matchedId && invItem.description) {
          const targetDesc = invItem.description.trim().toLowerCase();
          const found = inventoryItems.find(
            (it) => it["Item Description"]?.trim().toLowerCase() === targetDesc
          );
          if (found) {
            matchedId = found.id.toString();
          } else {
            // Try partial match
            const partial = inventoryItems.find((it) => {
              const desc = it["Item Description"]?.trim().toLowerCase() || "";
              return desc.includes(targetDesc) || targetDesc.includes(desc);
            });
            if (partial) matchedId = partial.id.toString();
          }
        }

        if (matchedId) matchedCount++;

        return {
          key: Math.random().toString(36).slice(2),
          itemId: matchedId,
          quantity: (invItem.quantity || 1).toString(),
          salePrice: (invItem.unit_price != null ? invItem.unit_price : "").toString(),
        };
      });

      setLines(mappedLines.length > 0 ? mappedLines : [newLine()]);

      if (matchedCount < items.length) {
        toast.info(
          `Imported ${items.length} item(s). ${matchedCount} matched directly to ${selectedLocation} showroom inventory. Please confirm any unselected item dropdowns.`
        );
      }
    }

    // 3. Pre-populate Notes with Invoice Reference
    const invPrefix = `Imported from Invoice #${invoice.invoice_number}`;
    setNotes(invoice.notes ? `${invPrefix} • ${invoice.notes}` : invPrefix);

    // 4. Default payment status
    setPaymentStatus("paid");

    toast.success(`Auto-populated from Invoice #${invoice.invoice_number}`);
  };

  const handleClearImportedInvoice = () => {
    setImportedInvoice(null);
    toast.info("Invoice link cleared.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to record sales");
      return;
    }

    const filled = lines.filter((l) => l.itemId);
    if (filled.length === 0) {
      toast.error("Please select at least one item from inventory");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate everything first so we don't record a partial sale
      const prepared = [];
      for (const line of filled) {
        const selectedItem = inventoryItems.find((item) => item.id.toString() === line.itemId);
        if (!selectedItem) throw new Error("Please select a valid item");

        const { parsedQuantity } = await validateSaleSubmission({
          itemId: line.itemId,
          quantity: line.quantity,
          selectedItem,
          userId: session.user.id,
        });

        const price = parseFloat(line.salePrice);
        if (isNaN(price) || price < 0) {
          throw new Error(`Enter a valid price for ${selectedItem["Item Description"]}`);
        }

        prepared.push({ line, selectedItem, parsedQuantity, price });
      }

      const total = prepared.reduce((sum, p) => sum + p.parsedQuantity * p.price, 0);
      const paidTotal = parseFloat(amountPaid) || 0;

      for (const p of prepared) {
        const lineTotal = p.parsedQuantity * p.price;
        // Split part-payment proportionally across items
        const linePaid =
          paymentStatus === 'part_paid' && total > 0
            ? (lineTotal / total) * paidTotal
            : undefined;

        await recordSale(
          session.user.id,
          p.line.itemId,
          p.parsedQuantity,
          p.price,
          p.selectedItem,
          notes,
          paymentStatus,
          linePaid,
          customer?.id || null
        );
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      toast.success(
        prepared.length > 1
          ? `${prepared.length} sales recorded successfully`
          : "Sale recorded successfully"
      );
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error recording sale:', error);
      toast.error(error.message || "Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <p>Please login to record sales.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
          {/* Header */}
          <DialogHeader className="pb-2 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Record Sale
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                  Record sales transactions, decrement showroom stock, and update customer receivables.
                </p>
              </div>

              {/* Import from Invoice Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="h-10 px-3.5 rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98] shadow-2xs"
                title="Select a saved invoice to auto-populate customer, items, quantities, and prices"
              >
                <Receipt className="h-4 w-4" />
                <span>Import from Invoice</span>
                <Sparkles className="h-3 w-3 opacity-70" />
              </Button>
            </div>
          </DialogHeader>

          {/* Imported Invoice Active Notification Banner */}
          {importedInvoice && (
            <div className="p-3.5 rounded-2xl bg-linear-to-r from-primary/10 via-primary/5 to-card border border-primary/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-xs">
                  <span className="font-bold text-foreground">
                    Auto-populated from Invoice #{importedInvoice.invoice_number}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Client: {importedInvoice.customer_name} • Total: {formatCurrency(Number(importedInvoice.total_amount || 0))}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearImportedInvoice}
                className="h-8 px-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                title="Clear imported invoice details"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">
                  Customer (Optional)
                </Label>
                <CustomerSelector value={customer?.id ?? null} onChange={setCustomer} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">Showroom Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={(v) => {
                    setSelectedLocation(v);
                    setLines([newLine()]);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/80">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 rounded-xl">
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold text-foreground">Inventory Items</Label>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                    {lines.length} {lines.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((prev) => [...prev, newLine()])}
                  className="h-8 px-3 rounded-xl border-border/80 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add item
                </Button>
              </div>

              {lines.map((line, index) => {
                const lineTotal =
                  (parseFloat(line.quantity) || 0) * (parseFloat(line.salePrice) || 0);
                return (
                  <div
                    key={line.key}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs"
                  >
                    <div className="md:col-span-6">
                      <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        Item {index + 1}
                      </Label>
                      <Select
                        value={line.itemId}
                        onValueChange={(v) => handleItemSelect(line.key, v)}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm">
                          <SelectValue placeholder="Select item from inventory" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[240px] overflow-y-auto bg-background border z-50 rounded-xl">
                          {[...inventoryItems]
                            .sort((a, b) =>
                              a["Item Description"].localeCompare(b["Item Description"])
                            )
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                <div className="flex items-center justify-between gap-2">
                                  <span>{item["Item Description"]}</span>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    (Stock: {item.Quantity ?? 0})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Unit Price (₦)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={line.salePrice}
                        onChange={(e) => updateLine(line.key, { salePrice: e.target.value })}
                        className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm font-mono font-bold"
                      />
                    </div>

                    <div className="md:col-span-1 flex md:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.key !== line.key))
                        }
                        aria-label="Remove item"
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {lineTotal > 0 && (
                      <div className="md:col-span-12 text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
                        <span>Line item subtotal</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Grand Total
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/80 text-xs sm:text-sm">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 rounded-xl">
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="part_paid">Part Paid (Deposit)</SelectItem>
                    <SelectItem value="unpaid">Not Paid (Credit / Debt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus === 'part_paid' && (
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">Amount Paid (Deposit)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount paid so far"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="h-10 rounded-xl bg-card border-border/80 font-mono"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-foreground">Notes &amp; Reference (Optional)</Label>
              <Textarea
                placeholder="Add customer reference, invoice number, delivery instructions..."
                className="resize-none rounded-xl text-xs sm:text-sm bg-card border-border/80"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 px-4 rounded-xl font-semibold border-border/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98]"
              >
                {isSubmitting ? "Recording..." : "Complete & Record Sale"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Separate Invoice Import Selector Dialog ── */}
      <ImportInvoiceDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSelectInvoice={handleSelectInvoice}
      />
    </>
  );
}
