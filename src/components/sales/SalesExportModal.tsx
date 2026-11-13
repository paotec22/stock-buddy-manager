import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import writeXlsxFile from 'write-excel-file/browser';
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

  const handleExport = async () => {
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

    try {
      const headers = [
        'Sale ID',
        'Item Name',
        'Location',
        'Quantity',
        'Sale Price',
        'Total Amount',
        'Sale Date',
      ].map((value) => ({ value, fontWeight: 'bold' as const }));

      const rows = filteredSales.map(sale => ([
        { type: String, value: String(sale.id ?? '') },
        { type: String, value: String(sale.item_name ?? '') },
        { type: String, value: String(sale.location ?? '') },
        { type: Number, value: Number(sale.quantity ?? 0) },
        { type: Number, value: Number(sale.sale_price ?? 0) },
        { type: Number, value: Number(sale.total_amount ?? 0) },
        { type: String, value: format(new Date(sale.sale_date), 'PPP') },
      ]));

      const columns = [
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 10 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
      ];

      const filename = `sales_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;

      await writeXlsxFile([headers, ...rows], {
        columns,
        sheet: 'Sales Data',
      }).toFile(filename);

      toast.success(`Exported ${filteredSales.length} sales records successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to export sales XLSX:", error);
      toast.error("Failed to generate Excel export");
    }
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