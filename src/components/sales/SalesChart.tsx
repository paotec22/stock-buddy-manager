import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface Sale {
  sale_date: string;
  total_amount: number;
}

interface SalesChartProps {
  sales: Sale[];
}

export function SalesChart({ sales }: SalesChartProps) {
  // Group sales by date and calculate daily totals
  const dailySales = sales.reduce((acc: { [key: string]: number }, sale) => {
    const date = new Date(sale.sale_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + sale.total_amount;
    return acc;
  }, {});

  const chartData = Object.entries(dailySales).map(([date, total]) => ({
    date,
    total,
  }));

  const chartConfig = {
    sales: {
      label: "Daily Sales",
      theme: {
        light: "#3b82f6",
        dark: "#60a5fa"
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip />
              <Bar dataKey="total" fill="var(--color-sales)" name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}