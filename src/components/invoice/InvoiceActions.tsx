
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
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" onClick={onPrint} disabled={isSubmitting}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button variant="outline" onClick={onDownload} disabled={isSubmitting}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
      <Button onClick={onSave} disabled={isSubmitting}>
        <Save className="w-4 h-4 mr-2" />
        Save Invoice
      </Button>
      <Button variant="outline" onClick={onShowSavedInvoices}>
        <FileText className="w-4 h-4 mr-2" />
        Print Saved Invoices
      </Button>
    </div>
  );
};
