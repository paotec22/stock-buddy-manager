import { Table, TableBody } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { SalesTableHeader } from "./table/SalesTableHeader";
import { SalesTableRow } from "./table/SalesTableRow";
import { SalesSearchInput } from "./table/SalesSearchInput";

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

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      return profile?.role;
    }
  });

  const canEditDates = userRole === 'admin' || userRole === 'uploader';
  const isAdmin = userRole === 'admin';

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

  const handlePriceUpdate = async (saleId: string, newPrice: number) => {
    try {
      // Calculate new total amount (price * quantity)
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return;
      
      const newTotalAmount = newPrice * sale.quantity;
      
      const { error } = await supabase
        .from('sales')
        .update({ 
          sale_price: newPrice,
          total_amount: newTotalAmount
        })
        .eq('id', saleId);

      if (error) throw error;
      toast.success("Sale price updated successfully");
    } catch (error) {
      console.error('Error updating sale price:', error);
      toast.error("Failed to update sale price");
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
    <div className="space-y-4 animate-fade-in">
      <SalesSearchInput value={searchTerm} onChange={setSearchTerm} />
      <div className="table-card">
        <Table className="table-enhanced">
          <SalesTableHeader />
          <TableBody>
            {filteredSales.map((sale) => (
              <SalesTableRow
                key={sale.id}
                sale={sale}
                canEditDates={canEditDates}
                isAdmin={isAdmin}
                formatCurrency={formatCurrency}
                onDateUpdate={handleDateUpdate}
                onPriceUpdate={handlePriceUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}