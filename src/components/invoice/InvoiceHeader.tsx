
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { InvoiceActions } from "./InvoiceActions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InvoiceHeaderProps {
  onPrint: () => void;
  onDownload: () => void;
  isSubmitting: boolean;
  onSave: () => void;
  onShowSavedInvoices: () => void;
  invoiceDate: string;
  onDateChange: (date: string) => void;
}

export const InvoiceHeader = ({
  onPrint,
  onDownload,
  isSubmitting,
  onSave,
  onShowSavedInvoices,
  invoiceDate,
  onDateChange,
}: InvoiceHeaderProps) => {
  const generateInvoiceNumber = () => {
    const now = new Date();
    return format(now, "ddMMHHmmss");
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invoice-date" className="text-sm font-medium">Date:</Label>
          <Input
            id="invoice-date"
            type="date"
            value={invoiceDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-40"
          />
        </div>
        <p className="text-sm font-medium">Invoice #: {generateInvoiceNumber()}</p>
      </div>
      <div className="flex justify-between items-center">
        <Link to="/inventory">
          <img src="/Puido_Smart_Solutions.svg" alt="Puido Smart Solutions" className="h-16" />
        </Link>
        <InvoiceActions
          onPrint={onPrint}
          onDownload={onDownload}
          onSave={onSave}
          onShowSavedInvoices={onShowSavedInvoices}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
