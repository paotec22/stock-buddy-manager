import { Button } from "@/components/ui/button";
import { Printer, Download, Save, History, RotateCcw } from "lucide-react";

interface InvoiceActionsProps {
  onPrint: () => void;
  onDownload: () => void;
  onSave: () => void;
  onShowSavedInvoices: () => void;
  isSubmitting: boolean;
  onReset?: () => void;
}

export const InvoiceActions = ({
  onPrint,
  onDownload,
  onSave,
  onShowSavedInvoices,
  isSubmitting,
  onReset
}: InvoiceActionsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto">
      {onReset && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isSubmitting}
          className="h-9 px-2.5 sm:px-3 bg-background border-input hover:bg-muted font-medium text-xs sm:text-sm"
          title="Reset Form"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      )}

      <Button 
        type="button"
        onClick={onSave} 
        disabled={isSubmitting}
        size="sm"
        className="h-9 px-3 sm:px-4 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 text-xs sm:text-sm flex-1 sm:flex-initial"
      >
        <Save className="w-3.5 h-3.5 mr-1.5" />
        <span>{isSubmitting ? "Saving..." : "Save Invoice"}</span>
      </Button>

      <Button 
        type="button"
        variant="outline" 
        size="sm"
        onClick={onPrint} 
        disabled={isSubmitting}
        className="h-9 px-2.5 sm:px-3 bg-background border-input hover:bg-muted font-medium text-xs sm:text-sm"
        title="Print Invoice"
      >
        <Printer className="w-3.5 h-3.5 sm:mr-1.5 text-foreground" />
        <span className="hidden sm:inline">Print</span>
      </Button>

      <Button 
        type="button"
        variant="outline" 
        size="sm"
        onClick={onDownload} 
        disabled={isSubmitting}
        className="h-9 px-2.5 sm:px-3 bg-background border-input hover:bg-muted font-medium text-xs sm:text-sm"
        title="PDF Download Preview"
      >
        <Download className="w-3.5 h-3.5 sm:mr-1.5 text-foreground" />
        <span className="hidden sm:inline">PDF</span>
      </Button>

      <Button 
        type="button"
        variant="outline" 
        size="sm"
        onClick={onShowSavedInvoices}
        className="h-9 px-2.5 sm:px-3 bg-background border-input hover:bg-muted font-medium text-xs sm:text-sm"
      >
        <History className="w-3.5 h-3.5 sm:mr-1.5 text-primary" />
        <span className="hidden sm:inline">History</span>
        <span className="sm:hidden">Saved</span>
      </Button>
    </div>
  );
};
