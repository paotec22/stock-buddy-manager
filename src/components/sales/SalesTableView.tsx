import { useState, useMemo } from "react";
import { SalesTable } from "./SalesTable";
import { SalesSummaryTable } from "./SalesSummaryTable";
import { TotalSalesSummary } from "./TotalSalesSummary";
import { SalesDateRangeFilter } from "./SalesDateRangeFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
  notes?: string | null;
}

interface SalesTableViewProps {
  sales: Sale[];
}

export function SalesTableView({ sales }: SalesTableViewProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const filteredSales = useMemo(() => {
    if (!dateRange?.from) return sales;
    
    return sales.filter(sale => {
      const saleDate = parseISO(sale.sale_date);
      const from = startOfDay(dateRange.from!);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      
      return isWithinInterval(saleDate, { start: from, end: to });
    });
  }, [sales, dateRange]);

  const hasFilters = !!dateRange?.from;

  return (
    <div className="space-y-6">
      {/* Total Sales Summary */}
      <div className="summary-card">
        <TotalSalesSummary />
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SalesDateRangeFilter 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />
        {hasFilters && (
          <span className="text-sm text-muted-foreground">
            Showing {filteredSales.length} of {sales.length} sales
          </span>
        )}
      </div>

      {/* Sales Summary Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sales Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesSummaryTable sales={filteredSales} />
        </CardContent>
      </Card>

      {/* Detailed Sales Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable sales={filteredSales} hasFilters={hasFilters} />
        </CardContent>
      </Card>
    </div>
  );
}
