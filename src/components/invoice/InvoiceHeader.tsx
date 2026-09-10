import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { InvoiceActions } from "./InvoiceActions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Hash, FileCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface InvoiceHeaderProps {
  onPrint: () => void;
  onDownload: () => void;
  isSubmitting: boolean;
  onSave: () => void;
  onShowSavedInvoices: () => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
  invoiceDate: Date;
  onInvoiceDateChange: (date: Date) => void;
  onReset?: () => void;
  isPaidInFull?: boolean;
}

export const InvoiceHeader = ({
  onPrint,
  onDownload,
  isSubmitting,
  onSave,
  onShowSavedInvoices,
  invoiceNumber,
  onInvoiceNumberChange,
  invoiceDate,
  onInvoiceDateChange,
  onReset,
  isPaidInFull = false
}: InvoiceHeaderProps) => {
  const handleGenerateNewNumber = () => {
    const now = new Date();
    const prefix = isPaidInFull ? "REC" : "INV";
    onInvoiceNumberChange(`${prefix}-${format(now, "yyyyMMddHHmmss")}`);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs space-y-3 print:p-0 print:border-none print:shadow-none print:rounded-none print:space-y-0 print:bg-transparent">
      {/* ── PRINT HEADER (Only visible when printing) ────────────────────── */}
      <div className="hidden print:block pb-3 mb-3 border-b-2 border-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 items-start">
            <img 
              src="/Puido_Smart_Solutions.svg" 
              alt="Puido Smart Solutions" 
              className="h-10 sm:h-12 w-auto object-contain company-logo"
            />
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
              {isPaidInFull ? "Official Payment Receipt" : "Commercial Invoice"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <h2 className="text-lg font-black text-slate-900 font-mono tracking-tight">
              {isPaidInFull ? "RECEIPT" : "INVOICE"} #{invoiceNumber}
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Date: <strong className="font-bold text-slate-900">{format(invoiceDate, "dd/MM/yyyy")}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── SCREEN CONTROLS (Hidden when printing) ───────────────────────── */}
      <div className="print:hidden space-y-3">
        {/* Top Banner & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border/60">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
            <Link to="/inventory" className="shrink-0 group" title="Puido Smart Solutions - Inventory">
              <div className="h-10 w-auto px-2 py-1 rounded-lg border border-border/60 bg-white dark:bg-slate-950 flex items-center justify-center transition-all group-hover:border-primary/50 shadow-xs">
                <img 
                  src="/Puido_Smart_Solutions.svg" 
                  alt="Puido Smart Solutions" 
                  className="h-7 w-auto object-contain" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight transition-colors">
                  {isPaidInFull ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      Receipt
                    </span>
                  ) : (
                    <span className="text-foreground">Invoice</span>
                  )}
                </h1>
                {isPaidInFull ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Paid in Full
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <FileCheck className="h-3 w-3" />
                    Active Draft
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="w-full sm:w-auto">
            <InvoiceActions
              onPrint={onPrint}
              onDownload={onDownload}
              onSave={onSave}
              onShowSavedInvoices={onShowSavedInvoices}
              isSubmitting={isSubmitting}
              onReset={onReset}
              isPaidInFull={isPaidInFull}
            />
          </div>
        </div>

        {/* Invoice Meta Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/50">
          {/* Invoice Number */}
          <div>
            <Label htmlFor="inv-no" className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Hash className="h-3 w-3 text-primary" />
              {isPaidInFull ? "Receipt Number" : "Invoice Number"}
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="inv-no"
                value={invoiceNumber}
                onChange={(e) => onInvoiceNumberChange(e.target.value)}
                className="!min-h-0 h-9 sm:h-8 font-mono text-xs sm:text-sm font-semibold bg-background"
                placeholder={isPaidInFull ? "e.g. REC-20260906" : "e.g. INV-20260906"}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="!min-h-0 h-9 sm:h-8 w-9 sm:w-8 shrink-0 bg-background"
                onClick={handleGenerateNewNumber}
                title={isPaidInFull ? "Generate fresh receipt number" : "Generate fresh invoice number"}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Invoice Date */}
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 text-primary" />
              Invoice Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full !min-h-0 h-9 sm:h-8 justify-start text-left font-normal text-xs sm:text-sm bg-background"
                >
                  {invoiceDate ? format(invoiceDate, "dd/MM/yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(d) => d && onInvoiceDateChange(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};
