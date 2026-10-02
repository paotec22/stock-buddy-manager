import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle, CreditCard, Sparkles } from "lucide-react";
import { Sale, PaymentStatus } from "./types";
import { formatCurrency } from "@/utils/formatters";

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function UpdatePaymentModal({
  open,
  onOpenChange,
  sale,
}: UpdatePaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [salePrice, setSalePrice] = useState<string>("0");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Reset fields when a new sale is selected or modal opens
  useEffect(() => {
    if (open && sale) {
      setStatus(sale.payment_status || "paid");
      setAmountPaid(
        sale.payment_status === "paid"
          ? sale.total_amount.toString()
          : (sale.amount_paid || 0).toString()
      );
      setSalePrice(sale.sale_price.toString());
      setPaymentNotes(sale.notes || "");
    }
  }, [open, sale]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
    onOpenChange(isOpen);
  };

  if (!sale) return null;

  const currentPrice = parseFloat(salePrice) || 0;
  const currentTotalAmount = currentPrice * (sale.quantity || 1);
  const currentPaid = parseFloat(amountPaid) || 0;
  const remainingBalance = Math.max(0, currentTotalAmount - currentPaid);

  const handleMarkFullyPaidQuick = () => {
    setStatus("paid");
    setAmountPaid(currentTotalAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    setIsSubmitting(true);
    try {
      const newPrice = parseFloat(salePrice);
      if (isNaN(newPrice) || newPrice < 0) {
        toast.error("Please enter a valid sale price.");
        setIsSubmitting(false);
        return;
      }

      const newTotalAmount = newPrice * sale.quantity;

      let newAmountPaid = 0;
      if (status === "paid") {
        newAmountPaid = newTotalAmount;
      } else if (status === "unpaid") {
        newAmountPaid = 0;
      } else {
        const parsedPaid = parseFloat(amountPaid);
        newAmountPaid = isNaN(parsedPaid) || parsedPaid < 0 ? 0 : Math.min(parsedPaid, newTotalAmount);
      }

      // Auto-adjust status if amount paid equals total amount
      let finalStatus = status;
      if (newAmountPaid >= newTotalAmount && newTotalAmount > 0) {
        finalStatus = "paid";
        newAmountPaid = newTotalAmount;
      } else if (newAmountPaid > 0 && finalStatus === "unpaid") {
        finalStatus = "part_paid";
      }

      const { error } = await supabase
        .from("sales")
        .update({
          payment_status: finalStatus,
          amount_paid: newAmountPaid,
          sale_price: newPrice,
          total_amount: newTotalAmount,
          notes: paymentNotes.trim() || null,
        })
        .eq("id", sale.id);

      if (error) throw error;

      // Invalidate queries to update UI across sales, customers, and reports
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });

      if (finalStatus === "paid") {
        toast.success(`🎉 Sale for "${sale.item_name}" recorded as Fully Paid!`);
      } else if (finalStatus === "part_paid") {
        toast.success(
          `Payment updated: ${formatCurrency(newAmountPaid)} paid, ${formatCurrency(
            newTotalAmount - newAmountPaid
          )} balance remaining.`
        );
      } else {
        toast.info(
          `Payment status set to Delayed / Unpaid. Status will remain delayed until recorded as paid.`
        );
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast.error(error.message || "Failed to update payment status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-3xl p-5 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Change Payment Status
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update payment state for <strong className="text-foreground">{sale.item_name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Sale Overview Banner */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Item &amp; Quantity
              </span>
              <span className="font-semibold text-foreground truncate block">
                {sale.item_name} (×{sale.quantity})
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Showroom Location
              </span>
              <span className="font-semibold text-foreground block">{sale.location}</span>
            </div>
          </div>

          {/* Price & Total Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">
                Unit Price (₦)
              </Label>
              <Input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0"
                step="any"
                className="h-10 rounded-xl font-mono text-xs font-bold"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">
                Total Amount (₦)
              </Label>
              <div className="h-10 rounded-xl bg-muted/50 border border-border/70 px-3 flex items-center font-mono font-black text-sm text-foreground">
                {formatCurrency(currentTotalAmount)}
              </div>
            </div>
          </div>

          {/* Payment Status Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">Payment Status</Label>
              {status !== "paid" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkFullyPaidQuick}
                  className="h-6 px-2 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 rounded-md active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  <span>Mark as Fully Paid</span>
                </Button>
              )}
            </div>

            <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
              <SelectTrigger className="h-11 rounded-xl bg-card border-border/80 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 rounded-xl">
                <SelectItem value="paid" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-0.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Fully Paid
                    </span>
                  </div>
                </SelectItem>

                <SelectItem value="part_paid" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-0.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      Part Paid (Installment / Deposit)
                    </span>
                  </div>
                </SelectItem>

                <SelectItem value="unpaid" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-0.5">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      Delayed / Unpaid (Credit)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Part Paid Deposit Input */}
          {status === "part_paid" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Amount Received So Far (₦)
                </Label>
                <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                  Balance: {formatCurrency(remainingBalance)}
                </span>
              </div>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                min="0"
                max={currentTotalAmount}
                step="any"
                placeholder="Enter deposit amount"
                className="h-10 rounded-xl bg-background border-amber-500/40 font-mono text-sm font-bold"
              />
            </div>
          )}

          {/* Unpaid Delay Banner */}
          {status === "unpaid" && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Payment Delayed</span>
              </div>
              <p className="text-[11px] opacity-90 leading-tight">
                This transaction status will remain delayed as unpaid debt until it is updated or recorded as paid.
              </p>
            </div>
          )}

          {/* Notes & Delay Instructions */}
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1 block">
              Payment Notes &amp; Delay Reference (Optional)
            </Label>
            <Textarea
              placeholder="e.g. Customer promised transfer by Oct 15 / Paid deposit via POS"
              className="resize-none rounded-xl text-xs bg-card border-border/80"
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-4 rounded-xl font-semibold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`h-11 px-5 rounded-xl font-bold shadow-xs text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                status === "paid"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : "Save Payment Status"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
