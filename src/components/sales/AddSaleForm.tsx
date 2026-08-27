
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
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { PaymentStatus } from "./types";

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function AddSaleForm({ open, onOpenChange, onSuccess }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
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
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to record sales");
      return;
    }

    const filled = lines.filter((l) => l.itemId);
    if (filled.length === 0) {
      toast.error("Add at least one item");
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
          customer?.id ?? null
        );
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Customer (optional)</Label>
              <CustomerSelector value={customer?.id ?? null} onChange={setCustomer} />
            </div>
            <div>
              <Label className="mb-1.5 block">Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={(v) => {
                  setSelectedLocation(v);
                  setLines([newLine()]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add item
              </Button>
            </div>

            {lines.map((line, index) => {
              const lineTotal =
                (parseFloat(line.quantity) || 0) * (parseFloat(line.salePrice) || 0);
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border border-border p-3"
                >
                  <div className="md:col-span-6">
                    <Label className="text-xs text-muted-foreground">Item {index + 1}</Label>
                    <Select
                      value={line.itemId}
                      onValueChange={(v) => handleItemSelect(line.key, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[220px] overflow-y-auto bg-background border z-50">
                        {[...inventoryItems]
                          .sort((a, b) =>
                            a["Item Description"].localeCompare(b["Item Description"])
                          )
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item["Item Description"]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs text-muted-foreground">Price</Label>
                    <Input
                      type="number"
                      value={line.salePrice}
                      onChange={(e) => updateLine(line.key, { salePrice: e.target.value })}
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {lineTotal > 0 && (
                    <div className="md:col-span-12 text-xs text-muted-foreground">
                      Line total: {formatCurrency(lineTotal)}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end text-sm font-semibold">
              Total: {formatCurrency(grandTotal)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="part_paid">Part Paid</SelectItem>
                  <SelectItem value="unpaid">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentStatus === 'part_paid' && (
              <div>
                <Label className="mb-1.5 block">Amount Paid (total)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount paid so far"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Notes (Optional)</Label>
            <Textarea
              placeholder="Add any comments about this sale..."
              className="resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
