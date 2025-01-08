import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityLog {
  id: number;
  action_type: string;
  table_name: string;
  item_description: string | null;
  location: string | null;
  quantity: number | null;
  amount: number | null;
  created_at: string;
}

interface LocationSales {
  location: string;
  total_sales: number;
}

interface MonthlyExpense {
  month: string;
  category: string;
  total_amount: number;
}

const Reports = () => {
  const { data: activityLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      console.log('Fetching activity logs...');
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      return data as ActivityLog[];
    }
  });

  const { data: locationSales, isLoading: isLoadingSales } = useQuery({
    queryKey: ['location-sales'],
    queryFn: async () => {
      console.log('Fetching location sales...');
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          total_amount,
          item_id
        `);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw salesError;
      }

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory list')
        .select('id, location');

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw inventoryError;
      }

      const locationMap = new Map(
        inventoryData.map((item) => [item.id, item.location])
      );

      const salesByLocation = salesData.reduce((acc: { [key: string]: number }, sale) => {
        const location = locationMap.get(sale.item_id) || 'Unknown';
        acc[location] = (acc[location] || 0) + (sale.total_amount || 0);
        return acc;
      }, {});

      return Object.entries(salesByLocation).map(([location, total_sales]) => ({
        location,
        total_sales
      })) as LocationSales[];
    }
  });

  const { data: monthlyExpenses, isLoading: isLoadingExpenses } = useQuery({
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <h1 className="text-2xl font-bold">Reports</h1>

          {/* Monthly Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <p>Loading expenses data...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyExpenses?.map((expense, index) => (
                      <TableRow key={`${expense.month}-${expense.category}-${index}`}>
                        <TableCell>{expense.month}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{formatCurrency(expense.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Location Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Location Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <p>Loading sales data...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationSales?.map((item) => (
                      <TableRow key={item.location}>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{formatCurrency(item.total_sales)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <p>Loading activity logs...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell className="capitalize">{log.action_type.toLowerCase()}</TableCell>
                        <TableCell>{log.item_description || '-'}</TableCell>
                        <TableCell>{log.location || '-'}</TableCell>
                        <TableCell>{log.quantity || '-'}</TableCell>
                        <TableCell>{log.amount ? formatCurrency(log.amount) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;