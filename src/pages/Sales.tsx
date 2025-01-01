import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesChart } from "@/components/sales/SalesChart";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload } from "lucide-react";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
}

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data: sales = [], isLoading, refetch } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          id,
          quantity,
          sale_price,
          total_amount,
          sale_date,
          item_id,
          "inventory list" ("Item Description")
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      return (salesData || []).map((sale: any) => ({
        ...sale,
        item_name: sale["inventory list"]["Item Description"]
      })) as Sale[];
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Sales Management</h1>
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkUpload(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button onClick={() => setShowAddSale(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            </div>
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

          <BulkSaleUploadModal
            open={showBulkUpload}
            onOpenChange={setShowBulkUpload}
            onDataUpload={refetch}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Sales;