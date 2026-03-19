import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sale, PaymentStatus } from "./types";

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function UpdatePaymentModal({ open, onOpenChange, sale }: UpdatePaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>(sale?.payment_status || 'paid');
  const [amountPaid, setAmountPaid] = useState(sale?.amount_paid?.toString() || '0');
  const [salePrice, setSalePrice] = useState(sale?.sale_price?.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Reset when sale changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && sale) {
      setStatus(sale.payment_status);
      setAmountPaid(sale.amount_paid.toString());
      setSalePrice(sale.sale_price.toString());
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!sale) return;
    setIsSubmitting(true);

    try {
      const newPrice = parseFloat(salePrice);
      const newTotalAmount = newPrice * sale.quantity;
      const newAmountPaid = status === 'paid' ? newTotalAmount : (status === 'unpaid' ? 0 : parseFloat(amountPaid));

      const { error } = await supabase
        .from('sales')
        .update({
          payment_status: status,
          amount_paid: newAmountPaid,
          sale_price: newPrice,
          total_amount: newTotalAmount,
        })
        .eq('id', sale.id);

      if (error) throw error;

      toast.success("Payment status updated successfully");
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(error.message || "Failed to update payment status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  const totalAmount = parseFloat(salePrice) * sale.quantity;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Payment — {sale.item_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Quantity: <span className="font-medium text-foreground">{sale.quantity}</span>
          </div>

          <div className="space-y-2">
            <Label>Sale Price (per unit)</Label>
            <Input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Total: ₦{isNaN(totalAmount) ? '0.00' : totalAmount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="part_paid">Part Paid</SelectItem>
                <SelectItem value="unpaid">Not Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'part_paid' && (
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Balance: ₦{(totalAmount - parseFloat(amountPaid || '0')).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
