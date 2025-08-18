import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesSummaryTable } from "@/components/sales/SalesSummaryTable";
import { TotalSalesSummary } from "@/components/sales/TotalSalesSummary";
import { SalesExportModal } from "@/components/sales/SalesExportModal";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchInput } from "@/components/ui/search-input";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
}

const SalesHeader = ({ onAddSale, onBulkUpload, onExport, searchTerm, onSearchChange }: { 
  onAddSale: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:gap-4">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        
        {/* Search input - visible on all devices */}
        <div className="w-full md:w-[250px]">
          <SearchInput 
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search sales..."
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onExport} variant="outline">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export</span>
          </div>
        </Button>
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
};

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter sales based on search term
  const filteredSales = searchTerm.trim()
    ? sales.filter(sale => sale.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : sales;

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
            onExport={() => setShowExport(true)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <div className="grid gap-6 mb-6">
            <TotalSalesSummary />
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Sales Summary</h2>
              <SalesSummaryTable sales={filteredSales} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Sales Details</h2>
            <SalesTable sales={filteredSales} />
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

          <SalesExportModal
            open={showExport}
            onOpenChange={setShowExport}
            sales={sales}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Sales;
