
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, CalendarIcon } from "lucide-react";
import { ExpensesExportModal } from "./ExpensesExportModal";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthlyExpense {
  month: string;
  category: string;
  total_amount: number;
  descriptions: string[];
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  location: string;
}

interface MonthlyExpensesTableProps {
  searchTerm?: string;
}

export function MonthlyExpensesTable({ searchTerm = "" }: MonthlyExpensesTableProps) {
  const [showExport, setShowExport] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-expenses', dateFrom, dateTo],
    queryFn: async () => {
      console.log('Fetching monthly expenses...');
      let query = supabase
        .from('expenses')
        .select('*');

      // Apply date filters if set
      if (dateFrom) {
        query = query.gte('expense_date', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('expense_date', dateTo.toISOString());
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      const expensesByMonth = data.reduce((acc: MonthlyExpense[], expense) => {
        const month = format(new Date(expense.expense_date), 'MMMM yyyy');
        const existingEntry = acc.find(
          entry => entry.month === month && entry.category === expense.category
        );

        if (existingEntry) {
          existingEntry.total_amount += Number(expense.amount);
          existingEntry.descriptions.push(expense.description);
        } else {
          acc.push({
            month,
            category: expense.category,
            total_amount: Number(expense.amount),
            descriptions: [expense.description]
          });
        }

        return acc;
      }, []);

      return {
        monthlyExpenses: expensesByMonth,
        allExpenses: data as Expense[]
      };
    }
  });

  const monthlyExpenses = data?.monthlyExpenses;
  const allExpenses = data?.allExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter expenses based on search term
  const filteredExpenses = searchTerm.trim() 
    ? monthlyExpenses?.filter(expense => 
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
        expense.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.descriptions.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : monthlyExpenses;

  return (
    <Card className="glass-effect fade-in">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Monthly Expenses by Category</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
        </div>
        
        {/* Date Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Dates
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading expenses data...</p>
        ) : filteredExpenses?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Descriptions</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses?.map((expense, index) => (
                <TableRow key={`${expense.month}-${expense.category}-${index}`}>
                  <TableCell>{expense.month}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm text-muted-foreground">
                        {expense.descriptions.slice(0, 3).join(', ')}
                        {expense.descriptions.length > 3 && ` (+${expense.descriptions.length - 3} more)`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(expense.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No matching expense records found</p>
        )}
      </CardContent>
      
      <ExpensesExportModal
        open={showExport}
        onOpenChange={setShowExport}
        expenses={allExpenses || []}
      />
    </Card>
  );
}
