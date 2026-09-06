
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/utils/formatters";
import { MapPin, TrendingUp, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LocationSales {
  location: string;
  total_sales: number;
}

interface LocationPerformanceTableProps {
  searchTerm?: string;
}

export function LocationPerformanceTable({ searchTerm = "" }: LocationPerformanceTableProps) {
  const { data: locationSales, isLoading } = useQuery({
    queryKey: ['location-sales'],
    queryFn: async () => {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          total_amount,
          item_id
        `);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw salesError;
      }

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory list')
        .select('id, location');

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw inventoryError;
      }

      const locationMap = new Map(
        inventoryData.map((item) => [item.id, item.location])
      );

      const salesByLocation = salesData.reduce((acc: { [key: string]: number }, sale) => {
        const location = locationMap.get(sale.item_id) || 'Unknown';
        acc[location] = (acc[location] || 0) + (sale.total_amount || 0);
        return acc;
      }, {});

      const list = Object.entries(salesByLocation).map(([location, total_sales]) => ({
        location,
        total_sales
      })) as LocationSales[];

      // Sort descending by total sales
      return list.sort((a, b) => b.total_sales - a.total_sales);
    }
  });

  const totalCompanySales = locationSales?.reduce((sum, item) => sum + item.total_sales, 0) || 0;
  const maxLocationSales = locationSales && locationSales.length > 0 ? locationSales[0].total_sales : 0;

  // Filter location sales based on search term
  const filteredLocationSales = searchTerm.trim()
    ? locationSales?.filter(item => 
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : locationSales;

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Branch Revenue Performance
              </CardTitle>
              {filteredLocationSales && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary font-mono tabular-nums">
                  {filteredLocationSales.length} {filteredLocationSales.length === 1 ? 'branch' : 'branches'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales contribution and revenue distribution across operating locations
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-background/80 border border-border/60 rounded-lg px-3 py-1.5 shadow-2xs">
            <span className="text-xs text-muted-foreground">Total Revenue:</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-primary tabular-nums">
              {formatCurrency(totalCompanySales)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs sm:text-sm">Loading location performance...</span>
          </div>
        ) : filteredLocationSales?.length ? (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-14 text-center">Rank</TableHead>
                    <TableHead className="w-[200px]">Branch / Location</TableHead>
                    <TableHead className="w-[180px] text-right">Total Revenue</TableHead>
                    <TableHead className="w-[110px] text-right">Share (%)</TableHead>
                    <TableHead>Relative Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocationSales.map((item, index) => {
                    const percent = totalCompanySales > 0 ? (item.total_sales / totalCompanySales) * 100 : 0;
                    const relativePercent = maxLocationSales > 0 ? (item.total_sales / maxLocationSales) * 100 : 0;
                    const isTop = index === 0 && item.total_sales > 0;

                    return (
                      <TableRow key={item.location} className="hover:bg-muted/30">
                        <TableCell className="text-center font-medium">
                          {isTop ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs">
                              <Trophy className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {item.location}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatCurrency(item.total_sales)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground font-medium">
                          {percent.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={relativePercent} 
                              className="h-2 flex-1 bg-muted"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredLocationSales.map((item, index) => {
                const percent = totalCompanySales > 0 ? (item.total_sales / totalCompanySales) * 100 : 0;
                const relativePercent = maxLocationSales > 0 ? (item.total_sales / maxLocationSales) * 100 : 0;
                const isTop = index === 0 && item.total_sales > 0;

                return (
                  <div 
                    key={item.location} 
                    className="p-3.5 rounded-lg border border-border/70 bg-card hover:border-border transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                          isTop 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                            : 'bg-muted text-muted-foreground font-mono'
                        }`}>
                          {isTop ? <Trophy className="h-3.5 w-3.5" /> : `#${index + 1}`}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {item.location}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold font-mono text-foreground tabular-nums">
                          {formatCurrency(item.total_sales)}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {percent.toFixed(1)}% share
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Contribution vs Top</span>
                        <span className="font-mono">{relativePercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={relativePercent} className="h-1.5 bg-muted" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground space-y-2">
            <MapPin className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm">No matching location performance data found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
