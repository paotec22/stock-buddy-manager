import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface SaleSummary {
  month: string;
  location: string;
  total_amount: number;
}

interface SalesSummaryTableProps {
  sales: Array<{
    sale_date: string;
    location: string;
    total_amount: number;
  }>;
}

export function SalesSummaryTable({ sales }: SalesSummaryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Group sales by location and month
  const summaryData: SaleSummary[] = sales.reduce((acc: SaleSummary[], sale) => {
    const month = format(new Date(sale.sale_date), 'MMMM yyyy');
    const existingEntry = acc.find(
      entry => entry.month === month && entry.location === sale.location
    );

    if (existingEntry) {
      existingEntry.total_amount += sale.total_amount;
    } else {
      acc.push({
        month,
        location: sale.location,
        total_amount: sale.total_amount
      });
    }

    return acc;
  }, []);

  // Sort by month (newest first) and then by location
  const sortedSummary = summaryData.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    return a.location.localeCompare(b.location);
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Total Sales</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSummary.map((summary, index) => (
            <TableRow key={`${summary.month}-${summary.location}-${index}`}>
              <TableCell>{summary.month}</TableCell>
              <TableCell>{summary.location}</TableCell>
              <TableCell>{formatCurrency(summary.total_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}