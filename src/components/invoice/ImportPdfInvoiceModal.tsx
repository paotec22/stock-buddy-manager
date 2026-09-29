import { useState, useRef, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FileUp,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Plus,
  ArrowRight,
  UserCheck,
  Package,
  Calendar,
  DollarSign,
  Hash,
  RefreshCw,
  Eye,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractTextFromPdf,
  parseInvoiceFromText,
  type ExtractedPdfInvoice,
  type ExtractedPdfItem,
} from "@/utils/pdfInvoiceParser";
import { currencies, type Currency } from "./CurrencyChanger";
import { formatCurrency } from "@/utils/formatters";
import type { NewInvoiceItem } from "@/hooks/useInvoiceOperations";

interface ImportPdfInvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyInvoice: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    notes: string;
    items: NewInvoiceItem[];
    includeVat: boolean;
    discountPercent: number;
    selectedCustomerId: string | null;
    amountPaid: number;
    currency: Currency;
  }) => void;
}

export const ImportPdfInvoiceModal = ({
  isOpen,
  onOpenChange,
  onApplyInvoice,
}: ImportPdfInvoiceModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPdfInvoice | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "review">("upload");
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(null);
  const [matchedCustomerName, setMatchedCustomerName] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  // Fetch customers for auto-matching
  const { data: existingCustomers = [] } = useQuery({
    queryKey: ["customers", "for-pdf-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address")
        .limit(200);
      if (error) return [];
      return data ?? [];
    },
    enabled: isOpen,
  });

  // Fetch inventory for item matching
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory", "for-pdf-matching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, item_description, item_number, unit_price, quantity")
        .limit(300);
      if (error) return [];
      return data ?? [];
    },
    enabled: isOpen,
  });

  // Match customer when extractedData changes
  useEffect(() => {
    if (!extractedData || existingCustomers.length === 0) return;

    const extractedName = extractedData.customerName.trim().toLowerCase();
    const extractedEmail = extractedData.customerEmail.trim().toLowerCase();
    const extractedPhone = extractedData.customerPhone.replace(/\D/g, "");

    const matched = existingCustomers.find((c: any) => {
      if (extractedEmail && c.email && c.email.trim().toLowerCase() === extractedEmail) return true;
      if (extractedPhone && c.phone && c.phone.replace(/\D/g, "").includes(extractedPhone.slice(-8))) return true;
      if (extractedName && c.name && (
        c.name.toLowerCase() === extractedName ||
        c.name.toLowerCase().includes(extractedName) ||
        extractedName.includes(c.name.toLowerCase())
      )) {
        return true;
      }
      return false;
    });

    if (matched) {
      setMatchedCustomerId(matched.id);
      setMatchedCustomerName(matched.name);
    } else {
      setMatchedCustomerId(null);
      setMatchedCustomerName(null);
    }
  }, [extractedData, existingCustomers]);

  // Match items when extractedData changes
  useEffect(() => {
    if (!extractedData || inventoryItems.length === 0) return;

    const updatedItems = extractedData.items.map((item) => {
      if (item.matchedInventoryId) return item;
      const desc = item.description.trim().toLowerCase();

      const matched = inventoryItems.find((inv: any) => {
        const invDesc = (inv.item_description || "").toLowerCase();
        const invNo = (inv.item_number || "").toLowerCase();
        if (invNo && desc.includes(invNo)) return true;
        if (invDesc && (desc === invDesc || desc.includes(invDesc) || invDesc.includes(desc))) return true;
        return false;
      });

      if (matched) {
        return {
          ...item,
          matchedInventoryId: matched.id,
          matchedInventoryName: matched.item_description,
          confidence: "high" as const,
        };
      }
      return item;
    });

    // Only update if changed
    if (JSON.stringify(updatedItems) !== JSON.stringify(extractedData.items)) {
      setExtractedData((prev) => (prev ? { ...prev, items: updatedItems } : null));
    }
  }, [extractedData, inventoryItems]);

  const handleFileProcess = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document (.pdf)");
      return;
    }

    setIsParsing(true);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      const { text, pagesText } = await extractTextFromPdf(file);
      if (!text || text.trim().length === 0) {
        toast.error("Could not extract readable text from this PDF. It may be an image scan.");
        setIsParsing(false);
        return;
      }

      const parsed = parseInvoiceFromText(text);
      parsed.pageCount = pagesText.length;

      // Ensure at least one default row if no line items were detected
      if (parsed.items.length === 0) {
        parsed.items.push({
          id: "item-1",
          description: "General Service / Goods",
          quantity: 1,
          unit_price: parsed.totalAmount || 0,
          amount: parsed.totalAmount || 0,
        });
      }

      setExtractedData(parsed);
      setActiveTab("review");
      toast.success(`PDF parsed successfully! Extracted ${parsed.items.length} line items.`);
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to parse PDF document");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    const newItem: ExtractedPdfItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: "New Item",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    };
    setExtractedData({
      ...extractedData,
      items: [...extractedData.items, newItem],
    });
  };

  const handleUpdateItem = (id: string, field: keyof ExtractedPdfItem, val: any) => {
    if (!extractedData) return;
    const updated = extractedData.items.map((it) => {
      if (it.id === id) {
        const itemCopy = { ...it, [field]: val };
        if (field === "quantity" || field === "unit_price") {
          const qty = field === "quantity" ? Number(val) : it.quantity;
          const price = field === "unit_price" ? Number(val) : it.unit_price;
          itemCopy.amount = (qty || 0) * (price || 0);
        }
        return itemCopy;
      }
      return it;
    });

    // Recompute subtotal
    const newSubtotal = updated.reduce((s, it) => s + it.amount, 0);
    const disc = (newSubtotal * extractedData.discountPercent) / 100;
    const tax = extractedData.includeVat ? (newSubtotal - disc) * 0.075 : 0;
    const total = newSubtotal - disc + tax;

    setExtractedData({
      ...extractedData,
      items: updated,
      subtotal: newSubtotal,
      taxAmount: tax,
      totalAmount: total,
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!extractedData) return;
    const filtered = extractedData.items.filter((it) => it.id !== id);
    const newSubtotal = filtered.reduce((s, it) => s + it.amount, 0);
    const disc = (newSubtotal * extractedData.discountPercent) / 100;
    const tax = extractedData.includeVat ? (newSubtotal - disc) * 0.075 : 0;
    const total = newSubtotal - disc + tax;

    setExtractedData({
      ...extractedData,
      items: filtered,
      subtotal: newSubtotal,
      taxAmount: tax,
      totalAmount: total,
    });
  };

  const handleApply = () => {
    if (!extractedData) return;

    const validNewItems: NewInvoiceItem[] = extractedData.items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      amount: Number(it.amount) || Number(it.quantity) * Number(it.unit_price) || 0,
    }));

    onApplyInvoice({
      customerName: extractedData.customerName || "Valued Customer",
      customerPhone: extractedData.customerPhone || "",
      customerAddress: extractedData.customerAddress || "",
      customerEmail: extractedData.customerEmail || "",
      invoiceNumber: extractedData.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
      invoiceDate: extractedData.invoiceDate,
      dueDate: extractedData.dueDate,
      notes: extractedData.notes || "",
      items: validNewItems,
      includeVat: extractedData.includeVat,
      discountPercent: extractedData.discountPercent,
      selectedCustomerId: matchedCustomerId,
      amountPaid: extractedData.amountPaid,
      currency: extractedData.currency,
    });

    toast.success(`Invoice populated with ${validNewItems.length} items from ${fileName || "PDF"}`);
    onOpenChange(false);
  };

  const resetModal = () => {
    setExtractedData(null);
    setFileName(null);
    setFileSize(null);
    setActiveTab("upload");
    setMatchedCustomerId(null);
    setMatchedCustomerName(null);
    setShowRawText(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetModal();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Import PDF to Populate Invoice
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Upload an invoice or quote PDF to automatically extract customer details, line items, and pricing.
                </DialogDescription>
              </div>
            </div>

            {extractedData && (
              <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {fileName} ({fileSize})
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === "upload" || !extractedData ? (
            /* Upload State */
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
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
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    {isParsing ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <FileUp className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {isParsing ? "Extracting invoice data..." : "Click or drag & drop PDF here"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports supplier invoices, customer purchase orders, quotes, receipts, and digital PDF bills.
                    </p>
                  </div>

                  {!isParsing && (
                    <div className="pt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-normal text-[11px]">
                        .PDF files up to 20MB
                      </Badge>
                      <Badge variant="secondary" className="font-normal text-[11px]">
                        Auto item & customer matching
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Tips & Supported formats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-card/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    Smart Customer Sync
                  </div>
                  <p className="text-muted-foreground">
                    Matches customer name, phone, or email with your database records.
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-card/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                    Inventory Matching
                  </div>
                  <p className="text-muted-foreground">
                    Automatically connects extracted line items to existing catalog stock.
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-card/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    Tax & Currency Check
                  </div>
                  <p className="text-muted-foreground">
                    Detects NGN (₦), USD ($), EUR (€), discounts, and Nigerian VAT rates.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Edit State */
            <div className="space-y-5">
              {/* Top Meta & Switch Back */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">
                    Parsed from: <span className="font-mono">{fileName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawText(!showRawText)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {showRawText ? "Hide Raw Text" : "View Raw Text"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExtractedData(null);
                      setActiveTab("upload");
                    }}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Upload Different PDF
                  </Button>
                </div>
              </div>

              {showRawText && (
                <div className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                  {extractedData.rawText}
                </div>
              )}

              {/* Customer Information Card */}
              <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Customer Details</h3>
                  </div>
                  {matchedCustomerName ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                      Matched to: {matchedCustomerName}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      New Customer
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Customer Name</Label>
                    <Input
                      value={extractedData.customerName}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, customerName: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
                    <Input
                      value={extractedData.customerPhone}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, customerPhone: e.target.value })
                      }
                      className="h-9 text-xs font-mono"
                      placeholder="e.g. 08012345678"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Email Address</Label>
                    <Input
                      value={extractedData.customerEmail}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, customerEmail: e.target.value })
                      }
                      className="h-9 text-xs font-mono"
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Billing Address</Label>
                    <Input
                      value={extractedData.customerAddress}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, customerAddress: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Meta Card */}
              <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Invoice Reference & Dates</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Currency:</span>
                    <select
                      value={extractedData.currency.code}
                      onChange={(e) => {
                        const cur = currencies.find((c) => c.code === e.target.value) || currencies[0];
                        setExtractedData({ ...extractedData, currency: cur });
                      }}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Invoice Number</Label>
                    <Input
                      value={extractedData.invoiceNumber}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                      }
                      className="h-9 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Invoice Date</Label>
                    <Input
                      type="date"
                      value={
                        extractedData.invoiceDate instanceof Date && !isNaN(extractedData.invoiceDate.getTime())
                          ? extractedData.invoiceDate.toISOString().split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                          setExtractedData({ ...extractedData, invoiceDate: d });
                        }
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Due Date</Label>
                    <Input
                      type="date"
                      value={
                        extractedData.dueDate instanceof Date && !isNaN(extractedData.dueDate.getTime())
                          ? extractedData.dueDate.toISOString().split("T")[0]
                          : new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
                      }
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                          setExtractedData({ ...extractedData, dueDate: d });
                        }
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
                <div className="p-3 sm:p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Extracted Line Items ({extractedData.items.length})</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Row
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                      <tr>
                        <th className="py-2.5 px-3 w-[45%]">Item Description</th>
                        <th className="py-2.5 px-3 w-[15%] text-center">Qty</th>
                        <th className="py-2.5 px-3 w-[20%] text-right">Unit Price ({extractedData.currency.symbol})</th>
                        <th className="py-2.5 px-3 w-[20%] text-right">Amount ({extractedData.currency.symbol})</th>
                        <th className="py-2.5 px-2 w-[5%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {extractedData.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3">
                            <div className="space-y-1">
                              <Input
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                                className="h-8 text-xs"
                                placeholder="Description"
                              />
                              {item.matchedInventoryName && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Linked: {item.matchedInventoryName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                              className="h-8 text-xs text-center font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItem(item.id, "unit_price", e.target.value)}
                              className="h-8 text-xs text-right font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            {formatCurrency(item.amount, extractedData.currency)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Options */}
                <div className="p-3 sm:p-4 bg-muted/30 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pdf-vat" className="cursor-pointer font-medium">
                        Include VAT (7.5%)
                      </Label>
                      <Switch
                        id="pdf-vat"
                        checked={extractedData.includeVat}
                        onCheckedChange={(checked) => {
                          const tax = checked ? extractedData.subtotal * 0.075 : 0;
                          setExtractedData({
                            ...extractedData,
                            includeVat: checked,
                            taxAmount: tax,
                            totalAmount: extractedData.subtotal + tax,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-medium">Discount (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={extractedData.discountPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const disc = (extractedData.subtotal * val) / 100;
                          const tax = extractedData.includeVat ? (extractedData.subtotal - disc) * 0.075 : 0;
                          setExtractedData({
                            ...extractedData,
                            discountPercent: val,
                            discountAmount: disc,
                            taxAmount: tax,
                            totalAmount: extractedData.subtotal - disc + tax,
                          });
                        }}
                        className="h-8 w-24 text-xs text-right font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-medium">Amount Paid / Deposit</Label>
                      <Input
                        type="number"
                        min="0"
                        value={extractedData.amountPaid}
                        onChange={(e) =>
                          setExtractedData({
                            ...extractedData,
                            amountPaid: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 w-32 text-xs text-right font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm text-right flex flex-col justify-center sm:border-l sm:border-border/60 sm:pl-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(extractedData.subtotal, extractedData.currency)}</span>
                    </div>
                    {extractedData.discountPercent > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Discount ({extractedData.discountPercent}%):</span>
                        <span className="font-mono">- {formatCurrency(extractedData.discountAmount, extractedData.currency)}</span>
                      </div>
                    )}
                    {extractedData.includeVat && (
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>VAT (7.5%):</span>
                        <span className="font-mono">+ {formatCurrency(extractedData.taxAmount, extractedData.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t border-border/80">
                      <span>Grand Total:</span>
                      <span className="font-mono">{formatCurrency(extractedData.totalAmount, extractedData.currency)}</span>
                    </div>
                    {extractedData.amountPaid > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <span>Paid:</span>
                        <span className="font-mono">{formatCurrency(extractedData.amountPaid, extractedData.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </Button>

          {extractedData && (
            <Button
              type="button"
              onClick={handleApply}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all"
            >
              <FileCheck className="w-4 h-4 mr-1.5" />
              Populate Invoice ({extractedData.items.length} items)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
