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

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  location: string;
}

interface ExpensesExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
}

export function ExpensesExportModal({ open, onOpenChange, expenses }: ExpensesExportModalProps) {
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

    // Filter expenses by date range
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    if (filteredExpenses.length === 0) {
      toast.error("No expenses found in the selected date range");
      return;
    }

    // Prepare data for export
    const exportData = filteredExpenses.map(expense => ({
      'Expense ID': expense.id,
      'Description': expense.description,
      'Category': expense.category,
      'Location': expense.location,
      'Amount': expense.amount,
      'Expense Date': format(new Date(expense.expense_date), 'PPP')
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Expense ID
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Location
      { wch: 15 }, // Amount
      { wch: 15 }  // Expense Date
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Data');

    // Generate filename with date range
    const filename = `expenses_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    toast.success(`Exported ${filteredExpenses.length} expense records successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Expenses Data</DialogTitle>
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