
import { Button } from "@/components/ui/button";
import { Printer, Download, Save, FileText } from "lucide-react";

interface InvoiceActionsProps {
  onPrint: () => void;
  onDownload: () => void;
  onSave: () => void;
  onShowSavedInvoices: () => void;
  isSubmitting: boolean;
}

export const InvoiceActions = ({
  onPrint,
  onDownload,
  onSave,
  onShowSavedInvoices,
  isSubmitting
}: InvoiceActionsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto">
      <Button 
        onClick={onSave} 
        disabled={isSubmitting}
        size="sm"
        className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 bg-primary text-primary-foreground font-medium shadow-sm"
      >
        <Save className="w-4 h-4 mr-1.5" />
        <span>Save</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onPrint} 
        disabled={isSubmitting}
        className="min-h-[40px] sm:min-h-0 bg-background border-input hover:bg-muted font-medium px-2.5 sm:px-3"
        title="Print Invoice"
      >
        <Printer className="w-4 h-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Print</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onDownload} 
        disabled={isSubmitting}
        className="min-h-[40px] sm:min-h-0 bg-background border-input hover:bg-muted font-medium px-2.5 sm:px-3"
        title="Download Invoice"
      >
        <Download className="w-4 h-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onShowSavedInvoices}
        className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 bg-background border-input hover:bg-muted font-medium"
      >
        <FileText className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Saved Invoices</span>
        <span className="sm:hidden">History</span>
      </Button>
    </div>
  );
};
