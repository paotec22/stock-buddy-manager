import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { InvoiceActions } from "./InvoiceActions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Hash, FileCheck, RefreshCw } from "lucide-react";
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
  dueDate: Date;
  onDueDateChange: (date: Date) => void;
  onReset?: () => void;
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
  dueDate,
  onDueDateChange,
  onReset
}: InvoiceHeaderProps) => {
  const handleGenerateNewNumber = () => {
    const now = new Date();
    onInvoiceNumberChange(`INV-${format(now, "yyyyMMddHHmmss")}`);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-6">
      {/* Top Banner & Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="shrink-0 group">
            <div className="h-14 w-auto p-1.5 rounded-lg border border-border/60 bg-white dark:bg-slate-950 flex items-center justify-center transition-all group-hover:border-primary/50">
              <img 
                src="/Puido_Smart_Solutions.svg" 
                alt="Puido Smart Solutions" 
                className="h-10 w-auto object-contain" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-primary text-base tracking-tight px-2 hidden group-has-[:hidden]:inline">
                PUIDO SMART
              </span>
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                Invoice Generator
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <FileCheck className="h-3 w-3" />
                Active Draft
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Create, preview, save, and print customer bills & receipts
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          <InvoiceActions
            onPrint={onPrint}
            onDownload={onDownload}
            onSave={onSave}
            onShowSavedInvoices={onShowSavedInvoices}
            isSubmitting={isSubmitting}
            onReset={onReset}
          />
        </div>
      </div>

      {/* Invoice Meta Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 p-3.5 rounded-lg border border-border/50">
        {/* Invoice Number */}
        <div>
          <Label htmlFor="inv-no" className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-primary" />
            Invoice Number
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="inv-no"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              className="h-9 font-mono text-xs sm:text-sm font-semibold bg-background"
              placeholder="e.g. INV-20260906"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 bg-background"
              onClick={handleGenerateNewNumber}
              title="Generate fresh number"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Invoice Date */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            Invoice Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 justify-start text-left font-normal text-xs sm:text-sm bg-background"
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

        {/* Payment Due Date */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5 text-amber-500" />
            Payment Due Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 justify-start text-left font-normal text-xs sm:text-sm bg-background"
              >
                {dueDate ? format(dueDate, "dd/MM/yyyy") : "Select due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(d) => d && onDueDateChange(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
