import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp } from "lucide-react";

interface ExpenseTrendChartProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function ExpenseTrendChart({ dateFrom, dateTo }: ExpenseTrendChartProps) {
  const isMobile = useIsMobile();
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
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('expense_date', endOfDay.toISOString());
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
      existingDate.amount += Number(expense.amount);
    } else {
      acc.push({ date, amount: Number(expense.amount) });
    }
    
    return acc;
  }, []) || [];

  const totalExpenseSum = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  if (isLoading) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold">Expense Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading trend data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold">Expense Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="h-[210px] sm:h-[260px] flex flex-col items-center justify-center text-muted-foreground text-xs sm:text-sm gap-1">
            <TrendingUp className="h-6 w-6 opacity-30" />
            <span>No expense data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            Expense Trajectory
          </CardTitle>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Spending volume over time
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-[10px] sm:text-xs text-muted-foreground block">Period Total</span>
          <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalExpenseSum)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-5 pt-0">
        <div className="h-[210px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: isMobile ? -25 : -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={isMobile ? "preserveStartEnd" : 0}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Expenses']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAmount)"
                activeDot={{ r: 5, fill: "hsl(var(--destructive))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
