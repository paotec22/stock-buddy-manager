import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
}

interface SalesChartProps {
  sales: Sale[];
}

export function SalesChart({ sales }: SalesChartProps) {
  // Process sales data for the chart
  const dailySales = sales.reduce((acc: { [key: string]: number }, sale) => {
    const date = format(parseISO(sale.sale_date), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + sale.total_amount;
    return acc;
  }, {});

  const chartData = Object.entries(dailySales).map(([date, amount]) => ({
    date: format(parseISO(date), 'MMM dd'),
    amount: amount
  }));

  const chartConfig = {
    sales: {
      label: "Daily Sales",
      color: "hsl(var(--primary))"
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Daily Sales Overview</h3>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.7}/>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Bar 
              dataKey="amount" 
              fill="url(#colorBar)" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
}