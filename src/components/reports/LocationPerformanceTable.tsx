
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
      console.log('Fetching location sales...');
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

      return Object.entries(salesByLocation).map(([location, total_sales]) => ({
        location,
        total_sales
      })) as LocationSales[];
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter location sales based on search term
  const filteredLocationSales = searchTerm.trim()
    ? locationSales?.filter(item => 
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : locationSales;

  return (
    <Card className="glass-effect fade-in">
      <CardHeader>
        <CardTitle>Location Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading sales data...</p>
        ) : filteredLocationSales?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Total Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocationSales?.map((item) => (
                <TableRow key={item.location}>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{formatCurrency(item.total_sales)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No matching location data found</p>
        )}
      </CardContent>
    </Card>
  );
}
