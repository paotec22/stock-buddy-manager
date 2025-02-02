import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesSummaryTable } from "@/components/sales/SalesSummaryTable";
import { TotalSalesSummary } from "@/components/sales/TotalSalesSummary";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
}

const SalesHeader = ({ onAddSale, onBulkUpload }: { 
  onAddSale: () => void;
  onBulkUpload: () => void;
}) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold">Sales Management</h1>
    <div className="flex gap-2">
      <Button onClick={onBulkUpload} variant="outline">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Bulk Upload</span>
        </div>
      </Button>
      <Button onClick={onAddSale}>
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Record Sale</span>
        </div>
      </Button>
    </div>
  </div>
);

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
    enabled: !!session
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    console.log("No session found, redirecting to home");
    navigate("/");
    return null;
  }

  if (isLoading) {
    return <div>Loading sales data...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <SalesHeader 
            onAddSale={() => setShowAddSale(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
          />

          <div className="grid gap-6 mb-6">
            <TotalSalesSummary />
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Sales Summary</h2>
              <SalesSummaryTable sales={sales} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Sales Details</h2>
            <SalesTable sales={sales} />
          </div>

          {showAddSale && (
            <AddSaleForm
              onOpenChange={setShowAddSale}
              onSuccess={() => {
                refetch();
              }}
            />
          )}

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