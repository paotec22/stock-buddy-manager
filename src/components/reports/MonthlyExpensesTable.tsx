
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
import { FileSpreadsheet } from "lucide-react";
import { ExpensesExportModal } from "./ExpensesExportModal";
import { useState } from "react";

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
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-expenses'],
    queryFn: async () => {
      console.log('Fetching monthly expenses...');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

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
        <div className="flex justify-between items-center">
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
