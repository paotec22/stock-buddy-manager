import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Search,
  Calendar,
  User,
  ArrowRight,
  Package,
  Loader2,
  FileText,
  Clock,
  Sparkles,
  FileUp,
  Database,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { extractTextFromPdf, parseInvoiceFromText } from "@/utils/pdfInvoiceParser";
import { toast } from "sonner";

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  notes: string | null;
  created_at: string;
}

export interface InvoiceItemRecord {
  id: number;
  invoice_id: number;
  item_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ImportInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectInvoice: (
    invoice: InvoiceRecord,
    items: InvoiceItemRecord[]
  ) => void;
}

export function ImportInvoiceDialog({
  open,
  onOpenChange,
  onSelectInvoice,
}: ImportInvoiceDialogProps) {
  const [activeTab, setActiveTab] = useState<"database" | "pdf">("database");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all saved invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", "list-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch invoices:", error);
        throw error;
      }
      return (data ?? []) as InvoiceRecord[];
    },
    enabled: open,
  });

  // Fetch items count / summary for invoices
  const { data: invoiceItemsMap = {} } = useQuery({
    queryKey: ["invoices", "items-map-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("id, invoice_id, item_id, description, quantity, unit_price, amount");

      if (error) {
        console.warn("Failed to fetch invoice items:", error);
        return {};
      }

      const map: Record<number, InvoiceItemRecord[]> = {};
      (data ?? []).forEach((item: any) => {
        if (!map[item.invoice_id]) map[item.invoice_id] = [];
        map[item.invoice_id].push(item);
      });
      return map;
    },
    enabled: open,
  });

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const num = (inv.invoice_number || "").toLowerCase();
      const name = (inv.customer_name || "").toLowerCase();
      const phone = (inv.customer_phone || "").toLowerCase();
      const notes = (inv.notes || "").toLowerCase();
      return num.includes(q) || name.includes(q) || phone.includes(q) || notes.includes(q);
    });
  }, [invoices, searchTerm]);

  const handleSelect = async (invoice: InvoiceRecord) => {
    setLoadingInvoiceId(invoice.id);
    try {
      let items = invoiceItemsMap[invoice.id];
      if (!items || items.length === 0) {
        const { data, error } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoice.id);
        if (!error && data) {
          items = data as InvoiceItemRecord[];
        } else {
          items = [];
        }
      }

      onSelectInvoice(invoice, items || []);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to load invoice items:", err);
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }

    setIsParsingPdf(true);
    try {
      const { text } = await extractTextFromPdf(file);
      if (!text || text.trim().length === 0) {
        toast.error("Could not read text from this PDF");
        setIsParsingPdf(false);
        return;
      }

      const parsed = parseInvoiceFromText(text);
      if (parsed.items.length === 0) {
        toast.error("No items could be extracted from this PDF");
        setIsParsingPdf(false);
        return;
      }

      // Convert parsed PDF data into InvoiceRecord + InvoiceItemRecord format
      const syntheticInvoice: InvoiceRecord = {
        id: Math.floor(Math.random() * 900000) + 100000,
        invoice_number: parsed.invoiceNumber,
        invoice_date: parsed.invoiceDate.toISOString().split("T")[0],
        due_date: parsed.dueDate ? parsed.dueDate.toISOString().split("T")[0] : null,
        customer_id: null,
        customer_name: parsed.customerName || "Customer",
        customer_phone: parsed.customerPhone || null,
        customer_email: parsed.customerEmail || null,
        customer_address: parsed.customerAddress || null,
        total_amount: parsed.totalAmount,
        subtotal: parsed.subtotal,
        tax_amount: parsed.taxAmount,
        notes: parsed.notes || `Imported from PDF: ${file.name}`,
        created_at: new Date().toISOString(),
      };

      const syntheticItems: InvoiceItemRecord[] = parsed.items.map((it, idx) => ({
        id: idx + 1,
        invoice_id: syntheticInvoice.id,
        item_id: null,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: it.amount,
      }));

      toast.success(`Parsed PDF invoice with ${syntheticItems.length} item(s)`);
      onSelectInvoice(syntheticInvoice, syntheticItems);
      onOpenChange(false);
    } catch (err) {
      console.error("PDF Parsing error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to parse PDF");
    } finally {
      setIsParsingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border/80 bg-linear-to-r from-primary/5 via-card to-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>Import Invoice to Record Sale</span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Select a saved invoice from your database or upload a PDF invoice to auto-populate the sales form.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-4 flex items-center gap-2 border-b border-border/60 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "database"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Saved Invoices ({invoices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pdf"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload PDF Invoice</span>
            </button>
          </div>

          {/* Search Box for Database tab */}
          {activeTab === "database" && (
            <div className="mt-3 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by invoice number (#INV-...), client name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-10 bg-background rounded-xl border-border/80 text-sm"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activeTab === "pdf" ? (
            /* Upload PDF Tab */
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handlePdfUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border/80 hover:border-primary/60 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handlePdfUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    {isParsingPdf ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <FileUp className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {isParsingPdf ? "Extracting invoice lines..." : "Click or drag & drop PDF Invoice"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Extracts customer details and items directly into the Record Sale form.
                    </p>
                  </div>

                  {!isParsingPdf && (
                    <Badge variant="secondary" className="font-normal text-[11px]">
                      .PDF documents up to 20MB
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Saved Invoices Database Tab */
            <>
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">Loading saved invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-14 text-center border border-dashed border-border/80 rounded-2xl p-6 space-y-2">
                  <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                  <h4 className="text-sm font-bold text-foreground">
                    {invoices.length === 0 ? "No Saved Invoices Found" : "No Matching Invoices"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {invoices.length === 0
                      ? "Create invoices in the Invoice section or upload a PDF invoice to easily import them into sales records."
                      : `No invoices matched "${searchTerm}". Try searching by invoice number or customer name.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredInvoices.map((inv) => {
                    const items = invoiceItemsMap[inv.id] || [];
                    const isLoadingThis = loadingInvoiceId === inv.id;

                    return (
                      <div
                        key={inv.id}
                        onClick={() => !isLoadingThis && handleSelect(inv)}
                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/70 bg-card hover:bg-card/95 hover:border-primary/50 hover:shadow-xs transition-all duration-200 cursor-pointer gap-3 text-left active:scale-[0.995]"
                      >
                        {/* Left Details */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs sm:text-sm text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                              #{inv.invoice_number}
                            </span>
                            <span className="text-xs font-bold text-foreground truncate">
                              {inv.customer_name || "Unassigned Customer"}
                            </span>
                            {inv.customer_phone && (
                              <span className="text-[11px] text-muted-foreground">
                                • {inv.customer_phone}
                              </span>
                            )}
                          </div>

                          {/* Items Preview */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                              <Package className="h-3 w-3 text-primary" />
                              <span>{items.length > 0 ? `${items.length} item(s)` : "Items loaded on select"}</span>
                            </span>
                            {items.length > 0 && (
                              <span className="truncate max-w-[280px] text-[11px] opacity-75">
                                ({items.map((i) => i.description).slice(0, 2).join(", ")}
                                {items.length > 2 ? ` +${items.length - 2} more` : ""})
                              </span>
                            )}
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Issued: {new Date(inv.invoice_date).toLocaleDateString()}</span>
                            {inv.due_date && (
                              <span className="hidden xs:inline">
                                • Due: {new Date(inv.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Price & Select Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Total Amount
                            </span>
                            <span className="text-sm sm:text-base font-black font-mono text-foreground">
                              {formatCurrency(Number(inv.total_amount || 0))}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            disabled={isLoadingThis}
                            className="h-9 px-3.5 rounded-xl font-bold bg-primary text-primary-foreground text-xs shadow-xs group-hover:bg-primary/90 transition-all flex items-center gap-1.5"
                          >
                            {isLoadingThis ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <span>Import</span>
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
