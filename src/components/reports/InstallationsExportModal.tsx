import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import writeXlsxFile from "write-excel-file/browser";
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

  const handleExport = async () => {
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

    try {
      const total = filteredInstallations.reduce((sum, installation) => sum + Number(installation.amount || 0), 0);

      const headers = ['Date', 'Description', 'Amount (₦)'].map((value) => ({
        value,
        fontWeight: 'bold' as const,
      }));

      const rows = filteredInstallations.map(installation => ([
        { type: String, value: format(new Date(installation.installation_date), 'yyyy-MM-dd') },
        { type: String, value: String(installation.description ?? '') },
        { type: Number, value: Number(installation.amount ?? 0) },
      ]));

      const totalRow = [
        { type: String, value: '' },
        { type: String, value: 'TOTAL', fontWeight: 'bold' as const },
        { type: Number, value: total, fontWeight: 'bold' as const },
      ];

      const columns = [
        { width: 12 },
        { width: 40 },
        { width: 15 },
      ];

      const filename = `installations_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;

      await writeXlsxFile([headers, ...rows, totalRow], {
        columns,
        sheet: "Installations",
      }).toFile(filename);

      toast.success(`Exported ${filteredInstallations.length} installation records`);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to export installations XLSX:", error);
      toast.error("Failed to generate Excel export");
    }
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