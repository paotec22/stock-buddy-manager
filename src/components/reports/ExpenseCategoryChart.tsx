import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart as PieChartIcon } from "lucide-react";

interface ExpenseCategoryChartProps {
  dateFrom?: Date;
  dateTo?: Date;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(217 91% 60%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(340 75% 55%)',
  'hsl(180 70% 45%)',
  'hsl(24 94% 53%)',
];

export function ExpenseCategoryChart({ dateFrom, dateTo }: ExpenseCategoryChartProps) {
  const isMobile = useIsMobile();
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expense-categories', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('category, amount');

      if (dateFrom) {
        query = query.gte('expense_date', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('expense_date', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Group expenses by category
  const chartData = expenses?.reduce((acc: any[], expense) => {
    const categoryName = expense.category || 'Uncategorized';
    const existing = acc.find(item => item.name === categoryName);
    
    if (existing) {
      existing.value += Number(expense.amount);
    } else {
      acc.push({ name: categoryName, value: Number(expense.amount) });
    }
    
    return acc;
  }, []) || [];

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading categories...</span>
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
          <CardTitle className="text-sm sm:text-base font-semibold">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="h-[210px] sm:h-[260px] flex flex-col items-center justify-center text-muted-foreground text-xs sm:text-sm gap-1">
            <PieChartIcon className="h-6 w-6 opacity-30" />
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
            <PieChartIcon className="h-4 w-4 text-primary" />
            Expense Allocation
          </CardTitle>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Breakdown across {chartData.length} categories
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-[10px] sm:text-xs text-muted-foreground block">Allocation Total</span>
          <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-5 pt-0">
        <div className="h-[210px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 42 : 54}
                outerRadius={isMobile ? 70 : 86}
                paddingAngle={2}
                labelLine={false}
                label={isMobile ? false : ({ percent }) => `${(percent * 100).toFixed(0)}%`}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Spent']}
              />
              <Legend 
                wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: '4px' }}
                iconSize={isMobile ? 8 : 10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
