import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Installation {
  id: number;
  description: string;
  amount: number;
  installation_date: string;
  user_id: string;
  created_at: string;
}

interface InstallationsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installations: Installation[];
}

export function InstallationsExportModal({ 
  open, 
  onOpenChange, 
  installations 
}: InstallationsExportModalProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleExport = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    // Filter installations by date range
    const filteredInstallations = installations.filter(installation => {
      const installationDate = new Date(installation.installation_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      return installationDate >= start && installationDate <= end;
    });

    if (filteredInstallations.length === 0) {
      toast.error("No installations found in the selected date range");
      return;
    }

    // Prepare data for Excel
    const excelData = filteredInstallations.map(installation => ({
      'Date': format(new Date(installation.installation_date), 'yyyy-MM-dd'),
      'Description': installation.description,
      'Amount (₦)': installation.amount,
    }));

    // Calculate total
    const total = filteredInstallations.reduce((sum, installation) => sum + installation.amount, 0);
    
    // Add total row
    excelData.push({
      'Date': '',
      'Description': 'TOTAL',
      'Amount (₦)': total,
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 40 }, // Description
      { wch: 15 }, // Amount
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Installations");

    // Generate filename with date range
    const filename = `installations_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;
    
    // Download the file
    XLSX.writeFile(wb, filename);
    
    toast.success(`Exported ${filteredInstallations.length} installation records`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Installation Records</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
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
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
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
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}