import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface InvoiceHeaderProps {
  onPrint: () => void;
  onDownload: () => void;
  isSubmitting: boolean;
  onSave: () => void;
}

export const InvoiceHeader = ({ onPrint, onDownload, isSubmitting, onSave }: InvoiceHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <img src="/Puido_Smart_Solutions.svg" alt="Puido Smart Solutions" className="h-16" />
      <div className="flex gap-2">
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
      </div>
    </div>
  );
};