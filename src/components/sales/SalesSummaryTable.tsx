import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, getYear } from "date-fns";
import { useMemo } from "react";

interface SaleSummary {
  month: string;
  location: string;
  total_amount: number;
  sortDate: Date;
}

interface YearGroup {
  year: number;
  summaries: SaleSummary[];
  totalAmount: number;
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

  const yearGroups = useMemo(() => {
    // Group sales by location and month
    const summaryData: SaleSummary[] = sales.reduce((acc: SaleSummary[], sale) => {
      const saleDate = new Date(sale.sale_date);
      const month = format(saleDate, 'MMMM yyyy');
      const existingEntry = acc.find(
        entry => entry.month === month && entry.location === sale.location
      );

      if (existingEntry) {
        existingEntry.total_amount += sale.total_amount;
      } else {
        acc.push({
          month,
          location: sale.location,
          total_amount: sale.total_amount,
          sortDate: saleDate
        });
      }

      return acc;
    }, []);

    // Sort by date (newest first) and then by location
    summaryData.sort((a, b) => {
      if (b.sortDate.getTime() !== a.sortDate.getTime()) {
        return b.sortDate.getTime() - a.sortDate.getTime();
      }
      return a.location.localeCompare(b.location);
    });

    // Group by year
    const groupedByYear = summaryData.reduce((acc: Record<number, SaleSummary[]>, summary) => {
      const year = getYear(summary.sortDate);
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(summary);
      return acc;
    }, {});

    // Convert to array and calculate totals
    const yearGroupsArray: YearGroup[] = Object.entries(groupedByYear)
      .map(([year, summaries]) => ({
        year: parseInt(year),
        summaries,
        totalAmount: summaries.reduce((sum, s) => sum + s.total_amount, 0)
      }))
      .sort((a, b) => b.year - a.year); // Sort years descending (newest first)

    return yearGroupsArray;
  }, [sales]);

  const currentYear = new Date().getFullYear();

  if (yearGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sales data available
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-400px)] min-h-[300px] overflow-auto rounded-md border">
      <Accordion 
        type="multiple" 
        defaultValue={[currentYear.toString()]}
        className="w-full"
      >
        {yearGroups.map((group) => (
          <AccordionItem key={group.year} value={group.year.toString()} className="border-b last:border-b-0">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-semibold text-lg">{group.year}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(group.totalAmount)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.summaries.map((summary, index) => (
                    <TableRow key={`${summary.month}-${summary.location}-${index}`}>
                      <TableCell>{format(summary.sortDate, 'MMMM')}</TableCell>
                      <TableCell>{summary.location}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
