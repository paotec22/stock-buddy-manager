import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, endOfDay, isSameDay, subDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { validateSaleSubmission, recordSale } from "./useSaleFormValidation";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerSelector, type CustomerLite } from "@/components/customers/CustomerSelector";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Receipt, Sparkles, X, CheckCircle2, PenLine, Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { safeParseDate } from "@/utils/dateParsing";
import { isSystemSentinelInventoryItem } from "@/utils/salesItemResolver";
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
  isCustom: boolean;
  itemId: string;
  customName: string;
  quantity: string;
  salePrice: string;
}

const newLine = (isCustom = false): LineItem => ({
  key: Math.random().toString(36).slice(2),
  isCustom,
  itemId: "",
  customName: "",
  quantity: "1",
  salePrice: "",
});

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

export function AddSaleForm({ open, onOpenChange, onSuccess, initialInvoiceId }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [saleDate, setSaleDate] = useState<Date>(() => new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
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
      return (data || []).filter(
        (item) => !isSystemSentinelInventoryItem(item["Item Description"])
      );
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
    setSaleDate(new Date());
    setDatePopoverOpen(false);
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

        const isCustom = !matchedId && Boolean(invItem.description?.trim());
        if (matchedId) matchedCount++;

        return {
          key: Math.random().toString(36).slice(2),
          isCustom,
          itemId: matchedId,
          customName: isCustom ? (invItem.description || "").trim() : "",
          quantity: (invItem.quantity || 1).toString(),
          salePrice: (invItem.unit_price != null ? invItem.unit_price : "").toString(),
        };
      });

      setLines(mappedLines.length > 0 ? mappedLines : [newLine()]);

      if (matchedCount < items.length) {
        toast.info(
          `Imported ${items.length} item(s). ${matchedCount} matched directly to ${selectedLocation} showroom inventory and ${
            items.length - matchedCount
          } set as custom product(s).`
        );
      }
    }

    // 3. Pre-populate Notes with Invoice Reference & Date if valid
    const invPrefix = `Imported from Invoice #${invoice.invoice_number}`;
    setNotes(invoice.notes ? `${invPrefix} • ${invoice.notes}` : invPrefix);

    const parsedInvDate = safeParseDate(invoice.invoice_date);
    if (parsedInvDate && parsedInvDate <= endOfDay(new Date())) {
      setSaleDate(parsedInvDate);
    }

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

    const incompleteCustom = lines.find(
      (l) =>
        l.isCustom &&
        !l.customName.trim() &&
        (parseFloat(l.salePrice) > 0 || parseInt(l.quantity, 10) > 1)
    );
    if (incompleteCustom) {
      toast.error("Please enter a product name for your custom item line");
      return;
    }

    const filled = lines.filter((l) =>
      l.isCustom ? l.customName.trim().length > 0 : Boolean(l.itemId)
    );
    if (filled.length === 0) {
      toast.error("Please select an inventory item or enter a custom product name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate everything first so we don't record a partial sale
      const prepared: Array<{
        line: LineItem;
        selectedItem: any;
        parsedQuantity: number;
        price: number;
      }> = [];

      for (const line of filled) {
        if (line.isCustom) {
          const customName = line.customName.trim();
          const { parsedQuantity } = await validateSaleSubmission({
            isCustom: true,
            customItemName: customName,
            quantity: line.quantity,
            userId: session.user.id,
          });

          const price = parseFloat(line.salePrice);
          if (isNaN(price) || price < 0) {
            throw new Error(`Enter a valid price for ${customName}`);
          }

          prepared.push({ line, selectedItem: null, parsedQuantity, price });
        } else {
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
          p.line.isCustom ? null : p.line.itemId,
          p.parsedQuantity,
          p.price,
          p.selectedItem,
          notes,
          paymentStatus,
          linePaid,
          customer?.id || null,
          undefined,
          {
            isCustom: p.line.isCustom,
            customItemName: p.line.customName,
            location: selectedLocation,
            saleDate,
          }
        );
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['salesForProfit'] });
      queryClient.invalidateQueries({ queryKey: ['salesForReconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['location-sales'] });

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    setLines((prev) =>
                      prev.map((l) => (l.isCustom ? l : { ...l, itemId: "", salePrice: "" }))
                    );
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
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="sale-date-trigger" className="mb-1.5 block text-xs font-bold text-foreground">
                  Sale Date
                </Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="sale-date-trigger"
                      type="button"
                      variant="outline"
                      aria-label="Sale Date"
                      className="w-full h-10 px-3 justify-between rounded-xl bg-card border-border/80 font-normal text-xs sm:text-sm"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">
                          {format(saleDate, "EEE, MMM d, yyyy")}
                        </span>
                      </span>
                      {isSameDay(saleDate, new Date()) && (
                        <span className="ml-2 shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          Today
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60] rounded-2xl" align="start">
                    <div className="flex items-center gap-1.5 p-2 border-b border-border/60 bg-muted/30">
                      <Button
                        type="button"
                        variant={isSameDay(saleDate, new Date()) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2.5 text-xs rounded-lg"
                        onClick={() => {
                          setSaleDate(new Date());
                          setDatePopoverOpen(false);
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        type="button"
                        variant={isSameDay(saleDate, subDays(new Date(), 1)) ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2.5 text-xs rounded-lg"
                        onClick={() => {
                          setSaleDate(subDays(new Date(), 1));
                          setDatePopoverOpen(false);
                        }}
                      >
                        Yesterday
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={(date) => {
                        if (date) {
                          setSaleDate(date);
                          setDatePopoverOpen(false);
                        }
                      }}
                      disabled={(date) => date > endOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <Label className="text-xs font-bold text-foreground">Sale Items</Label>
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    · {lines.length} {lines.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines((prev) => [...prev, newLine(false)])}
                    className="h-9 px-3 rounded-xl border-border/80 text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Inventory Item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines((prev) => [...prev, newLine(true)])}
                    className="h-9 px-3 rounded-xl border-border/80 text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                    Add Custom Product
                  </Button>
                </div>
              </div>

              {lines.map((line, index) => {
                const lineTotal =
                  (parseFloat(line.quantity) || 0) * (parseFloat(line.salePrice) || 0);
                return (
                  <div
                    key={line.key}
                    className="rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-2xs space-y-3"
                  >
                    {/* Item Row Header & Source Mode Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <span className="text-xs font-bold text-foreground">
                        Item {index + 1}
                      </span>

                      <div
                        className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border/60"
                        role="group"
                        aria-label={`Item ${index + 1} product source`}
                      >
                        <button
                          type="button"
                          onClick={() => updateLine(line.key, { isCustom: false })}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            !line.isCustom
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          From Inventory
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateLine(line.key, { isCustom: true, itemId: "" })
                          }
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            line.isCustom
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Custom Product
                        </button>
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                      <div className="md:col-span-6">
                        {!line.isCustom ? (
                          <>
                            <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                              Select Inventory Item
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
                                        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                                          (Stock: {item.Quantity ?? 0})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                              Product or Service Name
                            </Label>
                            <Input
                              type="text"
                              placeholder="Type product name not in inventory..."
                              value={line.customName}
                              onChange={(e) =>
                                updateLine(line.key, { customName: e.target.value })
                              }
                              autoComplete="off"
                              className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm"
                            />
                          </>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                          className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm font-mono font-bold tabular-nums"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Unit Price (₦)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={line.salePrice}
                          onChange={(e) => updateLine(line.key, { salePrice: e.target.value })}
                          className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm font-mono font-bold tabular-nums"
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
                          aria-label={`Remove item ${index + 1}`}
                          className="h-10 w-full md:w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
                      <span>
                        {line.isCustom
                          ? `Custom product · Does not deduct ${selectedLocation} inventory stock`
                          : `Showroom inventory (${selectedLocation}) · Deducts stock on save`}
                      </span>
                      {lineTotal > 0 && (
                        <span className="font-mono font-bold text-foreground tabular-nums">
                          Subtotal: {formatCurrency(lineTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Grand Total
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-primary tabular-nums">
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
