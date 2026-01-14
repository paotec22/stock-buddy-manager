import { Table, TableBody } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SalesTableHeader, SortField, SortDirection } from "./table/SalesTableHeader";
import { SalesTableRow } from "./table/SalesTableRow";
import { SalesEmptyState } from "./SalesEmptyState";
import { MobileSaleCard } from "./MobileSaleCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
  notes?: string | null;
}

interface SalesTableProps {
  sales: Sale[];
  hasFilters?: boolean;
}

export function SalesTable({ sales, hasFilters = false }: SalesTableProps) {
  const [sortField, setSortField] = useState<SortField>('sale_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'sale_date':
          comparison = new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime();
          break;
        case 'item_name':
          comparison = a.item_name.localeCompare(b.item_name);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'sale_price':
          comparison = a.sale_price - b.sale_price;
          break;
        case 'total_amount':
          comparison = a.total_amount - b.total_amount;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sales, sortField, sortDirection]);

  const handleDateUpdate = async (saleId: string, newDate: Date) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ sale_date: newDate.toISOString() })
        .eq('id', saleId);

      if (error) throw error;
      toast.success("Sale date updated successfully");
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Error updating sale date:', error);
      toast.error("Failed to update sale date");
    }
  };

  const handlePriceUpdate = async (saleId: string, newPrice: number) => {
    try {
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
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Error updating sale price:', error);
      toast.error("Failed to update sale price");
    }
  };

  const handleDelete = async (saleId: string) => {
    if (!isAdmin) {
      toast.error("Only admins can delete sales");
      return;
    }

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;
      
      toast.success("Sale deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error("Failed to delete sale");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Empty state
  if (sales.length === 0) {
    return <SalesEmptyState hasFilters={hasFilters} />;
  }

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-3 animate-fade-in">
        {sortedSales.map((sale) => (
          <MobileSaleCard
            key={sale.id}
            sale={sale}
            isAdmin={isAdmin}
            canEditDates={canEditDates}
            formatCurrency={formatCurrency}
            onDelete={handleDelete}
            onDateUpdate={handleDateUpdate}
            onPriceUpdate={handlePriceUpdate}
          />
        ))}
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="max-h-[calc(100vh-400px)] overflow-auto rounded-md border">
        <Table>
          <SalesTableHeader 
            showActions={isAdmin} 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {sortedSales.map((sale) => (
              <SalesTableRow
                key={sale.id}
                sale={sale}
                canEditDates={canEditDates}
                isAdmin={isAdmin}
                formatCurrency={formatCurrency}
                onDateUpdate={handleDateUpdate}
                onPriceUpdate={handlePriceUpdate}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {sortedSales.length} sale{sortedSales.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
