import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Trash2, Edit3, History, Receipt, Loader2, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onPrintInvoice: (invoice: Invoice) => void;
  onLoadInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
  loadingInvoiceId?: number | null;
}

export const SavedInvoicesModal = ({
  isOpen,
  onOpenChange,
  invoices,
  onPrintInvoice,
  onLoadInvoice,
  onDeleteInvoice,
  loadingInvoiceId
}: SavedInvoicesModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(query)) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(query)) ||
      (inv.customer_phone && inv.customer_phone.toLowerCase().includes(query))
    );
  });

  const totalInvoicesValue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Saved Invoices History
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Browse, search, load into editor, or print saved customer invoices
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total Volume</span>
              <span className="text-sm font-bold font-mono text-primary">
                {formatCurrency(totalInvoicesValue)}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-background"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="h-9 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredInvoices.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Receipt className="h-8 w-8 opacity-40" />
              <p className="text-xs sm:text-sm">
                {searchTerm ? "No saved invoices match your search query." : "No saved invoices found."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">Invoice #</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Customer</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Date</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase">Total</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const isLoading = loadingInvoiceId === inv.id;
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground">
                              {inv.customer_name || "Valued Customer"}
                            </span>
                            {inv.customer_phone && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {inv.customer_phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(inv.created_at).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs sm:text-sm text-foreground">
                          {formatCurrency(Number(inv.total_amount || 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Load into editor */}
                            {onLoadInvoice && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onLoadInvoice(inv)}
                                disabled={isLoading}
                                className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                                title="Load into Invoice Editor"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                )}
                                <span className="hidden sm:inline">Load</span>
                              </Button>
                            )}

                            {/* Print */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onPrintInvoice(inv)}
                              className="h-7 px-2 text-xs"
                              title="Print Invoice"
                            >
                              <Printer className="h-3.5 w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>

                            {/* Delete */}
                            {onDeleteInvoice && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteInvoice(inv.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
