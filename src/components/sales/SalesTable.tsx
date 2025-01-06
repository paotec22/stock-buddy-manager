import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
}

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      return profile?.role === 'admin';
    }
  });

  const handleDateUpdate = async (saleId: string, newDate: Date) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ sale_date: newDate.toISOString() })
        .eq('id', saleId);

      if (error) throw error;
      toast.success("Sale date updated successfully");
    } catch (error) {
      console.error('Error updating sale date:', error);
      toast.error("Failed to update sale date");
    }
  };

  const filteredSales = sales.filter((sale) => {
    return sale.item_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {isAdmin ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal",
                            !sale.sale_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(new Date(sale.sale_date), "dd/MM/yy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(sale.sale_date)}
                          onSelect={(date) => date && handleDateUpdate(sale.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    format(new Date(sale.sale_date), "dd/MM/yy")
                  )}
                </TableCell>
                <TableCell>{sale.item_name}</TableCell>
                <TableCell>{sale.location}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{formatCurrency(sale.sale_price)}</TableCell>
                <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}