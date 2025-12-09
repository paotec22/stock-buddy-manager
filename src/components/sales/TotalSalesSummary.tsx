import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function TotalSalesSummary() {
  const currentYear = new Date().getFullYear();
  const [showValue, setShowValue] = useState(true);

  const { data: totalSales, isLoading, error } = useQuery({
    queryKey: ['totalSales', currentYear],
    queryFn: async () => {
      console.log(`Fetching total sales data for year ${currentYear}...`);
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);
      
      if (error) {
        console.error('Error fetching total sales:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No sales data found for current year');
        return { totalAmount: 0, year: currentYear };
      }

      // Calculate total for the current year
      const totalAmount = data.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      console.log(`Total sales for ${currentYear}: ${totalAmount}`);

      return { totalAmount, year: currentYear };
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Year Sales Summary</h2>
        <div>Loading sales data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Year Sales Summary</h2>
        <div className="text-red-500">Error loading sales data. Please try again later.</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Current Year Sales Summary</h2>
        <button
          onClick={() => setShowValue(!showValue)}
          className="p-1 rounded-md hover:bg-accent transition-colors"
          aria-label={showValue ? "Hide value" : "Show value"}
        >
          {showValue ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      <div className="space-y-4">
        <div className="text-2xl font-bold">
          Total Sales for {totalSales?.year}: {showValue ? formatCurrency(totalSales?.totalAmount || 0) : "••••••••"}
        </div>
      </div>
    </Card>
  );
}