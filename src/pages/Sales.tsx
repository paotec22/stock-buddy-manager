import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesSummaryTable } from "@/components/sales/SalesSummaryTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
}

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // Check authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    console.log("No session found, redirecting to home");
    navigate("/");
    return null;
  }

  const { data: sales = [], isLoading, refetch } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      console.log('Fetching sales data...');
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          id,
          quantity,
          sale_price,
          total_amount,
          sale_date,
          item_id,
          "inventory list" (
            "Item Description",
            location
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }

      console.log('Sales data received:', salesData);

      return (salesData || []).map((sale: any) => ({
        id: sale.id,
        quantity: sale.quantity,
        sale_price: sale.sale_price,
        total_amount: sale.total_amount,
        sale_date: sale.sale_date,
        item_name: sale["inventory list"]?.["Item Description"] || "Unknown Item",
        location: sale["inventory list"]?.location || "Unknown Location"
      })) as Sale[];
    },
    enabled: !!session // Only run query if session exists
  });

  if (isLoading) {
    return <div>Loading sales data...</div>;
  }

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
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Sales Summary</h2>
              <SalesSummaryTable sales={sales} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Sales Details</h2>
            <SalesTable sales={sales} />
          </div>

          <AddSaleForm
            open={showAddSale}
            onOpenChange={setShowAddSale}
            onSuccess={() => {
              refetch();
              setShowAddSale(false);
            }}
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