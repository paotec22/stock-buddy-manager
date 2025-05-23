
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onPrintInvoice: (invoice: Invoice) => void;
}

export const SavedInvoicesModal = ({
  isOpen,
  onOpenChange,
  invoices,
  onPrintInvoice
}: SavedInvoicesModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Saved Invoice to Print</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>
                {new Date(invoice.created_at).toLocaleDateString()} - {invoice.invoice_number}
              </span>
              <Button onClick={() => onPrintInvoice(invoice)}>Print</Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
