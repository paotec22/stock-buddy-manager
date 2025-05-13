
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

interface MonthlyExpense {
  month: string;
  category: string;
  total_amount: number;
}

interface MonthlyExpensesTableProps {
  searchTerm?: string;
}

export function MonthlyExpensesTable({ searchTerm = "" }: MonthlyExpensesTableProps) {
  const { data: monthlyExpenses, isLoading } = useQuery({
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
        } else {
          acc.push({
            month,
            category: expense.category,
            total_amount: Number(expense.amount)
          });
        }

        return acc;
      }, []);

      return expensesByMonth;
    }
  });

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
        expense.month.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : monthlyExpenses;

  return (
    <Card className="glass-effect fade-in">
      <CardHeader>
        <CardTitle>Monthly Expenses by Category</CardTitle>
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
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses?.map((expense, index) => (
                <TableRow key={`${expense.month}-${expense.category}-${index}`}>
                  <TableCell>{expense.month}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{formatCurrency(expense.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No matching expense records found</p>
        )}
      </CardContent>
    </Card>
  );
}
