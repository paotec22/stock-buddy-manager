import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  DollarSign,
  Wallet,
  Building2,
  Sparkles,
  ArrowRight,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";
import type { Customer, CustomerStats } from "@/pages/Customers";

interface RemoveDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  stats?: CustomerStats | null;
  onSuccess?: () => void;
}

interface CustomerUnpaidSale {
  id: number;
  sale_date: string;
  item_id: number | null;
  quantity: number;
  sale_price: number;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  notes: string | null;
  item_description?: string;
}

export function RemoveDebtDialog({
  open,
  onOpenChange,
  customer,
  stats,
  onSuccess,
}: RemoveDebtDialogProps) {
  const queryClient = useQueryClient();

  const [settlementMode, setSettlementMode] = useState<"full" | "partial" | "write_off">("full");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [settlementNotes, setSettlementNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all unpaid / partial sales for this customer
  const { data: unpaidSales = [], isLoading: salesLoading, refetch: refetchUnpaidSales } = useQuery({
    queryKey: ["customers", "unpaid-sales", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];

      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          item_id,
          quantity,
          sale_price,
          total_amount,
          amount_paid,
          payment_status,
          notes,
          "inventory list" ( "Item Description" )
        `)
        .eq("customer_id", customer.id)
        .order("sale_date", { ascending: true }); // Oldest first to settle sequentially

      if (error) {
        console.error("Error fetching customer unpaid sales:", error);
        throw error;
      }

      // Filter to sales with outstanding balance
      const withDebt = (data || []).filter((s: any) => {
        const total = Number(s.total_amount) || 0;
        const paid = Number(s.amount_paid) || 0;
        return total > paid || s.payment_status !== "paid";
      });

      return withDebt.map((s: any) => ({
        id: s.id,
        sale_date: s.sale_date,
        item_id: s.item_id,
        quantity: s.quantity,
        sale_price: s.sale_price,
        total_amount: Number(s.total_amount) || 0,
        amount_paid: Number(s.amount_paid) || 0,
        payment_status: s.payment_status,
        notes: s.notes,
        item_description: s["inventory list"]?.["Item Description"] || "Showroom Stock Item",
      })) as CustomerUnpaidSale[];
    },
    enabled: open && !!customer?.id,
  });

  // Calculate actual outstanding debt from fetched sales or fallback to stats
  const totalOutstanding = useMemo(() => {
    if (unpaidSales.length > 0) {
      return unpaidSales.reduce((acc, s) => acc + Math.max(0, s.total_amount - s.amount_paid), 0);
    }
    return stats?.outstanding || 0;
  }, [unpaidSales, stats]);

  // Reset custom amount and mode when dialog opens
  useEffect(() => {
    if (open) {
      setSettlementMode("full");
      setCustomAmount(totalOutstanding > 0 ? totalOutstanding.toString() : "");
      setPaymentMethod("Bank Transfer");
      setSettlementNotes("");
    }
  }, [open, totalOutstanding]);

  // Compute how much is being cleared based on mode and inputs
  const paymentAmountNumber = useMemo(() => {
    if (settlementMode === "full" || settlementMode === "write_off") {
      return totalOutstanding;
    }
    const val = parseFloat(customAmount);
    return isNaN(val) || val < 0 ? 0 : Math.min(val, totalOutstanding);
  }, [settlementMode, customAmount, totalOutstanding]);

  const newRemainingDebt = Math.max(0, totalOutstanding - paymentAmountNumber);

  const handleApplyQuickPercentage = (pct: number) => {
    const val = Math.round((totalOutstanding * pct) / 100);
    setCustomAmount(val.toString());
    setSettlementMode("partial");
  };

  const handleClearDebt = async () => {
    if (!customer?.id) return;
    if (totalOutstanding <= 0) {
      toast.info("This customer currently has no outstanding debt.");
      onOpenChange(false);
      return;
    }

    if (settlementMode === "partial" && paymentAmountNumber <= 0) {
      toast.error("Please enter a valid payment amount greater than ₦0.");
      return;
    }

    setIsSubmitting(true);
    try {
      let remainingPayment = paymentAmountNumber;
      const now = new Date().toISOString();
      const updatedSaleIds: number[] = [];

      // If we have distinct unpaid sales in the database
      if (unpaidSales.length > 0) {
        for (const sale of unpaidSales) {
          if (remainingPayment <= 0 && settlementMode === "partial") break;

          const saleDebt = Math.max(0, sale.total_amount - sale.amount_paid);
          if (saleDebt <= 0) continue;

          let newPaid = sale.amount_paid;
          let newStatus = sale.payment_status;

          if (settlementMode === "full" || settlementMode === "write_off") {
            // Settle this sale 100%
            newPaid = sale.total_amount;
            newStatus = "paid";
          } else {
            // Partial distribution
            const paymentForThisSale = Math.min(remainingPayment, saleDebt);
            newPaid = sale.amount_paid + paymentForThisSale;
            remainingPayment -= paymentForThisSale;
            newStatus = newPaid >= sale.total_amount ? "paid" : "partial";
          }

          // Build note description
          const modeLabel =
            settlementMode === "write_off"
              ? "Debt Waived / Written Off"
              : `Debt Settle (${paymentMethod})`;
          const noteAddendum = `[${modeLabel} on ${new Date().toLocaleDateString()}: ${formatCurrency(
            newPaid - sale.amount_paid
          )}${settlementNotes ? ` • ${settlementNotes}` : ""}]`;

          const updatedNotes = sale.notes ? `${sale.notes}\n${noteAddendum}` : noteAddendum;

          const { error: updateError } = await supabase
            .from("sales")
            .update({
              amount_paid: newPaid,
              payment_status: newStatus,
              notes: updatedNotes,
            })
            .eq("id", sale.id);

          if (updateError) {
            console.error(`Error updating sale #${sale.id}:`, updateError);
            throw updateError;
          }

          updatedSaleIds.push(sale.id);
        }
      } else {
        // Fallback: If no distinct sales found with customer_id, check if there are sales by customer_id
        const { data: allCustSales } = await supabase
          .from("sales")
          .select("id, total_amount, amount_paid")
          .eq("customer_id", customer.id);

        if (allCustSales && allCustSales.length > 0) {
          for (const s of allCustSales) {
            await supabase
              .from("sales")
              .update({
                amount_paid: s.total_amount,
                payment_status: "paid",
              })
              .eq("id", s.id);
          }
        }
      }

      // Add a record in customer notes for audit trail
      const auditMsg = `[Debt Settled: ${formatCurrency(
        paymentAmountNumber
      )} via ${paymentMethod} (${settlementMode}) on ${new Date().toLocaleDateString()}${
        settlementNotes ? ` - "${settlementNotes}"` : ""
      }]`;

      const existingNotes = customer.notes ? `${customer.notes}\n` : "";
      await supabase
        .from("customers")
        .update({
          notes: `${existingNotes}${auditMsg}`.slice(0, 1000),
          updated_at: now,
        })
        .eq("id", customer.id);

      // Invalidate relevant queries to update stats everywhere immediately
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "sales-aggregates"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "history"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "unpaid-sales", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });

      if (settlementMode === "full" || newRemainingDebt === 0) {
        toast.success(`🎉 Full debt of ${formatCurrency(totalOutstanding)} cleared for ${customer.name}! Customer is now fully settled.`);
      } else if (settlementMode === "write_off") {
        toast.success(`Debt waiver of ${formatCurrency(paymentAmountNumber)} recorded for ${customer.name}.`);
      } else {
        toast.success(
          `Payment of ${formatCurrency(paymentAmountNumber)} recorded. Remaining balance: ${formatCurrency(newRemainingDebt)}.`
        );
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Debt settlement error:", err);
      toast.error(err.message || "Failed to update debt settlement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
                Remove / Settle Customer Debt
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Clear outstanding balance or record partial debt repayments for{" "}
                <strong className="text-foreground">{customer.name}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Outstanding Balance Banner */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-amber-500/10 via-amber-500/5 to-card border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Current Outstanding Debt
              </span>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                ₦{totalOutstanding.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {unpaidSales.length} unsettled sale transaction{unpaidSales.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                New Balance After
              </span>
              <div
                className={`text-lg font-black font-mono mt-0.5 tabular-nums ${
                  newRemainingDebt === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                ₦{newRemainingDebt.toLocaleString()}
              </div>
              {newRemainingDebt === 0 && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-bold mt-1">
                  100% Settled
                </Badge>
              )}
            </div>
          </div>

          {/* Settlement Option Radio */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              Select Settlement Action
            </Label>
            <RadioGroup
              value={settlementMode}
              onValueChange={(v) => setSettlementMode(v as any)}
              className="grid grid-cols-1 gap-2"
            >
              {/* Option 1: Full Payment */}
              <label
                htmlFor="r-full"
                className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  settlementMode === "full"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border/70 hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <RadioGroupItem value="full" id="r-full" className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold block">
                      Clear Full Debt (Mark as 100% Paid)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Customer paid the entire ₦{totalOutstanding.toLocaleString()} balance.
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold shrink-0">
                  ₦{totalOutstanding.toLocaleString()}
                </Badge>
              </label>

              {/* Option 2: Partial Payment */}
              <label
                htmlFor="r-partial"
                className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  settlementMode === "partial"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border/70 hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <RadioGroupItem value="partial" id="r-partial" className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold block">
                      Record Partial Debt Payment
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Customer made a partial installment towards their debt.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Custom</span>
              </label>

              {/* Option 3: Debt Write-off / Waiver */}
              <label
                htmlFor="r-writeoff"
                className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  settlementMode === "write_off"
                    ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400"
                    : "bg-card border-border/70 hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <RadioGroupItem value="write_off" id="r-writeoff" className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold block">
                      Forgive / Waive Debt (Write-off)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Zero out the balance without collecting further cash.
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                  Waiver
                </Badge>
              </label>
            </RadioGroup>
          </div>

          {/* Partial Payment Amount Input & Quick Chips */}
          {settlementMode === "partial" && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/70 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <Label htmlFor="debt-amount-input" className="text-xs font-bold text-foreground">
                  Payment Amount Received (₦) <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyQuickPercentage(25)}
                    className="h-6 px-2 text-[10px] font-semibold"
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyQuickPercentage(50)}
                    className="h-6 px-2 text-[10px] font-semibold"
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyQuickPercentage(75)}
                    className="h-6 px-2 text-[10px] font-semibold"
                  >
                    75%
                  </Button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                  ₦
                </span>
                <Input
                  id="debt-amount-input"
                  type="number"
                  min="1"
                  max={totalOutstanding}
                  placeholder={`e.g. 50000 (Max: ${totalOutstanding})`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-8 h-11 rounded-xl text-base font-mono font-bold"
                />
              </div>

              {parseFloat(customAmount) > totalOutstanding && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Amount exceeds outstanding debt. Will be capped to ₦{totalOutstanding.toLocaleString()}.
                </p>
              )}
            </div>
          )}

          {/* Payment Method & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Payment Channel / Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 rounded-xl mt-1 text-xs">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer (Instant)</SelectItem>
                  <SelectItem value="Cash">Cash in Showroom</SelectItem>
                  <SelectItem value="POS / Card">POS Terminal / Debit Card</SelectItem>
                  <SelectItem value="Cheque">Bank Cheque / Draft</SelectItem>
                  <SelectItem value="Store Credit / Waiver">Store Credit / Waiver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="debt-notes-input" className="text-xs font-semibold text-foreground">
                Reference / Note (Optional)
              </Label>
              <Input
                id="debt-notes-input"
                placeholder="e.g. Zenith Bank ref #9832 / Paid in cash"
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                maxLength={200}
                className="h-10 rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          {/* Breakdown of Affected Sales */}
          {unpaidSales.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Affected Transactions ({unpaidSales.length})
              </span>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40 text-xs">
                {unpaidSales.map((s) => {
                  const saleDebt = Math.max(0, s.total_amount - s.amount_paid);
                  return (
                    <div key={s.id} className="p-2.5 flex items-center justify-between gap-2 bg-card hover:bg-muted/30">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {s.item_description}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(s.sale_date).toLocaleDateString()} • Qty: {s.quantity} • Total: ₦
                          {s.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-destructive block">
                          ₦{saleDebt.toLocaleString()} owed
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Paid: ₦{s.amount_paid.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 px-4 rounded-xl font-semibold text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleClearDebt}
            disabled={isSubmitting || totalOutstanding <= 0 || (settlementMode === "partial" && paymentAmountNumber <= 0)}
            className="h-11 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Processing Settlement..."
                : settlementMode === "full"
                ? `Confirm Full Clearance (₦${totalOutstanding.toLocaleString()})`
                : settlementMode === "write_off"
                ? "Confirm Debt Waiver"
                : `Apply Payment of ₦${paymentAmountNumber.toLocaleString()}`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
