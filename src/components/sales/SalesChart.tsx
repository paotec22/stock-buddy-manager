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
      color: "#3b82f6"
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Daily Sales Overview</h3>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
}