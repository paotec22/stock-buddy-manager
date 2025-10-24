import { SalesTable } from "./SalesTable";
import { SalesSummaryTable } from "./SalesSummaryTable";
import { TotalSalesSummary } from "./TotalSalesSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
}

interface SalesTableViewProps {
  sales: Sale[];
}

export function SalesTableView({ sales }: SalesTableViewProps) {
  return (
    <div className="space-y-6">
      {/* Total Sales Summary */}
      <div className="summary-card">
        <TotalSalesSummary />
      </div>

      {/* Sales Summary Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesSummaryTable sales={sales} />
        </CardContent>
      </Card>

      {/* Detailed Sales Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable sales={sales} />
        </CardContent>
      </Card>
    </div>
  );
}