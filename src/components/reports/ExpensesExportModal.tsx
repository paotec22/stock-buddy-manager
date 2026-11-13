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

  const handleExport = async () => {
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

    try {
      const headers = [
        'Expense ID',
        'Description',
        'Category',
        'Location',
        'Amount',
        'Expense Date',
      ].map((value) => ({ value, fontWeight: 'bold' as const }));

      const rows = filteredExpenses.map(expense => ([
        { type: String, value: String(expense.id ?? '') },
        { type: String, value: String(expense.description ?? '') },
        { type: String, value: String(expense.category ?? '') },
        { type: String, value: String(expense.location ?? '') },
        { type: Number, value: Number(expense.amount ?? 0) },
        { type: String, value: format(new Date(expense.expense_date), 'PPP') },
      ]));

      const columns = [
        { width: 15 },
        { width: 30 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
      ];

      const filename = `expenses_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;

      await writeXlsxFile([headers, ...rows], {
        columns,
        sheet: 'Expenses Data',
      }).toFile(filename);

      toast.success(`Exported ${filteredExpenses.length} expense records successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to export expenses XLSX:", error);
      toast.error("Failed to generate Excel export");
    }
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