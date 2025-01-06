import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function TotalSalesSummary() {
  const { data: totalSales } = useQuery({
    queryKey: ['totalSales'],
    queryFn: async () => {
      console.log('Fetching total sales data...');
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, sale_date');
      
      if (error) {
        console.error('Error fetching total sales:', error);
        throw error;
      }

      // Process the sales data to get monthly totals
      const monthlyTotals = data.reduce((acc: { [key: string]: number }, sale) => {
        const monthYear = new Date(sale.sale_date).toLocaleString('default', { month: 'long', year: 'numeric' });
        acc[monthYear] = (acc[monthYear] || 0) + Number(sale.total_amount);
        return acc;
      }, {});

      // Calculate cumulative totals
      let runningTotal = 0;
      const cumulativeTotals = Object.entries(monthlyTotals)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([month, total]) => {
          runningTotal += total;
          return { month, monthlyTotal: total, cumulativeTotal: runningTotal };
        });

      return cumulativeTotals;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Cumulative Sales Summary</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-3 font-semibold border-b pb-2">
          <div>Month</div>
          <div>Monthly Total</div>
          <div>Cumulative Total</div>
        </div>
        <div className="space-y-2">
          {totalSales?.map((sale, index) => (
            <div key={index} className="grid grid-cols-3">
              <div>{sale.month}</div>
              <div>{formatCurrency(sale.monthlyTotal)}</div>
              <div>{formatCurrency(sale.cumulativeTotal)}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}