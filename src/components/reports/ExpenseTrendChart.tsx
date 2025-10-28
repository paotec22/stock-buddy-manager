import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";

interface ExpenseTrendChartProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function ExpenseTrendChart({ dateFrom, dateTo }: ExpenseTrendChartProps) {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expense-trends', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('expense_date, amount, category');

      if (dateFrom) {
        query = query.gte('expense_date', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('expense_date', dateTo.toISOString());
      }

      const { data, error } = await query.order('expense_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Group expenses by date
  const chartData = expenses?.reduce((acc: any[], expense) => {
    const date = format(parseISO(expense.expense_date), 'MMM dd');
    const existingDate = acc.find(item => item.date === date);
    
    if (existingDate) {
      existingDate.amount += expense.amount;
    } else {
      acc.push({ date, amount: expense.amount });
    }
    
    return acc;
  }, []) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAmount)"
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
