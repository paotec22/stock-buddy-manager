import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Boxes,
  DollarSign,
  AlertTriangle,
  Receipt,
  Database,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface QuickExportHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol?: string;
}

export function QuickExportHubModal({
  open,
  onOpenChange,
  currencySymbol = "₦",
}: QuickExportHubModalProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((field) => {
              const str = String(field ?? "").replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = (filename: string, data: unknown) => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventory = async () => {
    setDownloadingType("inventory");
    try {
      const { data, error } = await supabase
        .from("inventory list")
        .select("*")
        .order("Item Description", { ascending: true });

      if (error) throw error;
      const items = data || [];
      const headers = ["ID", "Item Description", "Location", "Quantity", "Price", "Total Valuation"];
      const rows = items.map((it) => [
        it.id,
        it["Item Description"] || "",
        it.location || "Default",
        it.Quantity || 0,
        it.Price || 0,
        it.Total || (it.Price || 0) * (it.Quantity || 0),
      ]);

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadCsv(`Inventory_Master_${timestamp}.csv`, headers, rows);
      toast.success(`Exported ${items.length} inventory records`);
    } catch {
      toast.error("Failed to export inventory");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportSales = async () => {
    setDownloadingType("sales");
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          quantity,
          sale_price,
          total_amount,
          payment_status,
          amount_paid,
          notes,
          "inventory list" (
            "Item Description",
            location
          )
        `)
        .order("sale_date", { ascending: false });

      if (error) throw error;
      const sales = data || [];
      const headers = [
        "Sale ID",
        "Date",
        "Item Name",
        "Location",
        "Quantity",
        "Unit Price",
        "Total Amount",
        "Payment Status",
        "Amount Paid",
        "Notes",
      ];
      const rows = sales.map((s: any) => [
        s.id,
        s.sale_date ? format(new Date(s.sale_date), "yyyy-MM-dd HH:mm") : "",
        s["inventory list"]?.["Item Description"] || "Item",
        s["inventory list"]?.location || "Default",
        s.quantity || 1,
        s.sale_price || 0,
        s.total_amount || 0,
        s.payment_status || "paid",
        s.amount_paid || s.total_amount || 0,
        s.notes || "",
      ]);

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadCsv(`Sales_Register_${timestamp}.csv`, headers, rows);
      toast.success(`Exported ${sales.length} sales transactions`);
    } catch {
      toast.error("Failed to export sales");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportExpenses = async () => {
    setDownloadingType("expenses");
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) throw error;
      const expenses = data || [];
      const headers = ["ID", "Date", "Category", "Description", "Amount", "Location"];
      const rows = expenses.map((e) => [
        e.id,
        e.expense_date ? format(new Date(e.expense_date), "yyyy-MM-dd") : "",
        e.category || "General",
        e.description || "",
        e.amount || 0,
        e.location || "Default",
      ]);

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadCsv(`Expenses_Ledger_${timestamp}.csv`, headers, rows);
      toast.success(`Exported ${expenses.length} expense items`);
    } catch {
      toast.error("Failed to export expenses");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportReorderRunway = async () => {
    setDownloadingType("reorder");
    try {
      const { data, error } = await supabase
        .from("inventory list")
        .select("*")
        .lte("Quantity", 5)
        .order("Quantity", { ascending: true });

      if (error) throw error;
      const items = data || [];
      const headers = ["ID", "Item Description", "Location", "Current Quantity", "Unit Price", "Status"];
      const rows = items.map((it) => [
        it.id,
        it["Item Description"] || "",
        it.location || "Default",
        it.Quantity || 0,
        it.Price || 0,
        (it.Quantity || 0) <= 0 ? "OUT OF STOCK" : "CRITICAL LOW STOCK",
      ]);

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadCsv(`Restock_Alerts_${timestamp}.csv`, headers, rows);
      toast.success(`Exported ${items.length} items needing restock`);
    } catch {
      toast.error("Failed to export reorder list");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportFullJsonBackup = async () => {
    setDownloadingType("json_backup");
    try {
      const [invRes, salesRes, expRes, invcRes] = await Promise.all([
        supabase.from("inventory list").select("*"),
        supabase.from("sales").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("invoices").select("*"),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        currency: currencySymbol,
        system: "SI Manager World-Class Store Suite",
        data: {
          inventory: invRes.data || [],
          sales: salesRes.data || [],
          expenses: expRes.data || [],
          invoices: invcRes.data || [],
        },
      };

      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadJson(`SIManager_Backup_${timestamp}.json`, backup);
      toast.success("Complete JSON operational database snapshot downloaded");
    } catch {
      toast.error("Failed to compile full database snapshot");
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-gradient-to-r from-muted/50 to-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Executive Export & Data Hub
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                1-click verified CSV and JSON exports for accounting, auditing, and backups
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-3">
          {/* Inventory Master */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Master Inventory Report</p>
                <p className="text-[11px] text-muted-foreground">All items, quantities, locations, and valuations</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportInventory}
              disabled={downloadingType !== null}
              className="h-8 text-xs gap-1.5"
            >
              {downloadingType === "inventory" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          </div>

          {/* Sales Transactions */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Sales Transactions Register</p>
                <p className="text-[11px] text-muted-foreground">Full revenue records, payments, and timestamps</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportSales}
              disabled={downloadingType !== null}
              className="h-8 text-xs gap-1.5"
            >
              {downloadingType === "sales" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          </div>

          {/* Expenses Ledger */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Operational Expenses Ledger</p>
                <p className="text-[11px] text-muted-foreground">Operating costs, categories, and branch charges</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportExpenses}
              disabled={downloadingType !== null}
              className="h-8 text-xs gap-1.5"
            >
              {downloadingType === "expenses" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          </div>

          {/* Urgent Stock Reorders */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Critical Reorder & Low-Stock Alerts</p>
                <p className="text-[11px] text-muted-foreground">Depleted stock and items requiring supplier reorders</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportReorderRunway}
              disabled={downloadingType !== null}
              className="h-8 text-xs gap-1.5"
            >
              {downloadingType === "reorder" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          </div>

          {/* Full Database JSON Snapshot */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground">Complete Database Snapshot</p>
                  <Badge variant="default" className="text-[9px] px-1 py-0 h-3.5">Full Backup</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Consolidated JSON archive across all operational tables</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleExportFullJsonBackup}
              disabled={downloadingType !== null}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {downloadingType === "json_backup" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              JSON Backup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
