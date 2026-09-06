import { Table, TableBody } from "@/components/ui/table";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SalesTableHeader, SortField, SortDirection } from "./table/SalesTableHeader";
import { SalesTableRow } from "./table/SalesTableRow";
import { SalesEmptyState } from "./SalesEmptyState";
import { MobileSaleCard } from "./MobileSaleCard";
import { UpdatePaymentModal } from "./UpdatePaymentModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sale } from "./types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SalesTableProps {
  sales: Sale[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function SalesTable({ sales, hasFilters = false, onClearFilters }: SalesTableProps) {
  const [sortField, setSortField] = useState<SortField>('sale_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Reset to page 1 when sales list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sales.length]);

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
        case 'payment_status':
          comparison = a.payment_status.localeCompare(b.payment_status);
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

  if (sales.length === 0) {
    return <SalesEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  const totalPages = Math.max(1, Math.ceil(sortedSales.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedSales.length);
  const paginatedSales = sortedSales.slice(startIndex, endIndex);

  if (isMobile) {
    return (
      <>
        <div className="space-y-3 animate-fade-in">
          {paginatedSales.map((sale) => (
            <MobileSaleCard
              key={sale.id}
              sale={sale}
              isAdmin={isAdmin}
              canEditDates={canEditDates}
              formatCurrency={formatCurrency}
              onDelete={handleDelete}
              onDateUpdate={handleDateUpdate}
              onPriceUpdate={handlePriceUpdate}
              onUpdatePayment={setPaymentSale}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground border-t border-border mt-3">
            <span>
              {startIndex + 1}–{endIndex} of {sortedSales.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-1">
                {validCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <UpdatePaymentModal
          open={!!paymentSale}
          onOpenChange={(open) => !open && setPaymentSale(null)}
          sale={paymentSale}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3 animate-fade-in">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <SalesTableHeader 
                showActions={isAdmin} 
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableBody>
                {paginatedSales.map((sale) => (
                  <SalesTableRow
                    key={sale.id}
                    sale={sale}
                    canEditDates={canEditDates}
                    isAdmin={isAdmin}
                    formatCurrency={formatCurrency}
                    onDateUpdate={handleDateUpdate}
                    onPriceUpdate={handlePriceUpdate}
                    onDelete={handleDelete}
                    onUpdatePayment={setPaymentSale}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-semibold text-foreground font-mono tabular-nums">
                {sortedSales.length > 0 ? startIndex + 1 : 0}
              </span>
              <span>to</span>
              <span className="font-semibold text-foreground font-mono tabular-nums">
                {endIndex}
              </span>
              <span>of</span>
              <span className="font-semibold text-foreground font-mono tabular-nums">
                {sortedSales.length}
              </span>
              <span>transactions</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[68px] text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="First page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <span className="text-xs px-2 font-mono tabular-nums">
                  Page {validCurrentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UpdatePaymentModal
        open={!!paymentSale}
        onOpenChange={(open) => !open && setPaymentSale(null)}
        sale={paymentSale}
      />
    </>
  );
}
