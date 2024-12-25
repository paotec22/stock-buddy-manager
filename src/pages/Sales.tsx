import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesChart } from "@/components/sales/SalesChart";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          quantity,
          sale_price,
          total_amount,
          sale_date,
          inventory!inner (
            name
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      return data.map(sale => ({
        ...sale,
        item_name: sale.inventory.name
      }));
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Sales Management</h1>
            <Button onClick={() => setShowAddSale(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </div>

          <div className="grid gap-6 mb-6">
            <SalesChart sales={sales} />
          </div>

          {isLoading ? (
            <div>Loading sales data...</div>
          ) : (
            <SalesTable sales={sales} />
          )}

          <AddSaleForm
            open={showAddSale}
            onOpenChange={setShowAddSale}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Sales;