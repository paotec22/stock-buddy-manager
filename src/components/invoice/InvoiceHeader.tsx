import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface InvoiceHeaderProps {
  onPrint: () => void;
  onDownload: () => void;
  isSubmitting: boolean;
  onSave: () => void;
  onShowSavedInvoices: () => void; // New prop for showing saved invoices
}

export const InvoiceHeader = ({
  onPrint,
  onDownload,
  isSubmitting,
  onSave,
  onShowSavedInvoices,
}: InvoiceHeaderProps) => {
  const generateInvoiceNumber = () => {
    const now = new Date();
    return format(now, "ddMMHHmmss");
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-end">
        <p className="text-sm font-medium">Invoice #: {generateInvoiceNumber()}</p>
      </div>
      <div className="flex justify-between items-center">
        <Link to="/inventory">
          <img src="/Puido_Smart_Solutions.svg" alt="Puido Smart Solutions" className="h-16" />
        </Link>
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
            Save Invoice
          </Button>
          <Button variant="outline" onClick={onShowSavedInvoices}>
            Print Saved Invoices
          </Button>
        </div>
      </div>
    </div>
  );
};