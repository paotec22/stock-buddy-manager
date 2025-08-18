import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
}

interface SalesExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: Sale[];
}

export function SalesExportModal({ open, onOpenChange, sales }: SalesExportModalProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleExport = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    // Filter sales by date range
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    if (filteredSales.length === 0) {
      toast.error("No sales found in the selected date range");
      return;
    }

    // Prepare data for export
    const exportData = filteredSales.map(sale => ({
      'Sale ID': sale.id,
      'Item Name': sale.item_name,
      'Location': sale.location,
      'Quantity': sale.quantity,
      'Sale Price': sale.sale_price,
      'Total Amount': sale.total_amount,
      'Sale Date': format(new Date(sale.sale_date), 'PPP')
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Sale ID
      { wch: 25 }, // Item Name
      { wch: 15 }, // Location
      { wch: 10 }, // Quantity
      { wch: 15 }, // Sale Price
      { wch: 15 }, // Total Amount
      { wch: 15 }  // Sale Date
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // Generate filename with date range
    const filename = `sales_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast.success(`Exported ${filteredSales.length} sales records successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Sales Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}