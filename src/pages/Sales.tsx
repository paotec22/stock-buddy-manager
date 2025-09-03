import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesSummaryTable } from "@/components/sales/SalesSummaryTable";
import { TotalSalesSummary } from "@/components/sales/TotalSalesSummary";
import { SalesExportModal } from "@/components/sales/SalesExportModal";
import { SalesViewToggle } from "@/components/sales/SalesViewToggle";
import { SalesGraphicalView } from "@/components/sales/SalesGraphicalView";
import { SalesTableView } from "@/components/sales/SalesTableView";
import { ChartFilters } from "@/components/sales/SalesChartFilters";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
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

const SalesHeader = ({ 
  onAddSale, 
  onBulkUpload, 
  onExport, 
  searchTerm, 
  onSearchChange,
  currentView,
  onViewChange
}: { 
  onAddSale: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentView: 'table' | 'chart';
  onViewChange: (view: 'table' | 'chart') => void;
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:gap-4">
          <h1 className="section-title">Sales Management</h1>
          
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
          <Button onClick={onExport} variant="outline" className="btn-with-icon">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button onClick={onBulkUpload} variant="outline" className="btn-with-icon">
            <Upload className="h-4 w-4" />
            <span>Bulk Upload</span>
          </Button>
          <Button onClick={onAddSale} className="btn-with-icon">
            <Plus className="h-4 w-4" />
            <span>Record Sale</span>
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center md:justify-start">
        <SalesViewToggle currentView={currentView} onViewChange={onViewChange} />
      </div>
    </div>
  );
};

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'table' | 'chart'>('table');
  const [chartFilters, setChartFilters] = useState<ChartFilters>({
    chartType: 'bar',
    timePeriod: 'year',
    location: 'all'
  });
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

  // Mobile layout
  if (isMobile) {
    return (
      <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'user']}>
        <div className="min-h-screen bg-background pb-16 page-transition">
          <main className="p-4">
            <SalesHeader 
              onAddSale={() => setShowAddSale(true)}
              onBulkUpload={() => setShowBulkUpload(true)}
              onExport={() => setShowExport(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              currentView={currentView}
              onViewChange={setCurrentView}
            />

            {/* Content based on view */}
            {currentView === 'chart' ? (
              <SalesGraphicalView
                sales={filteredSales}
                filters={chartFilters}
                onFiltersChange={setChartFilters}
              />
            ) : (
              <SalesTableView sales={filteredSales} />
            )}

            {/* Floating Action Button for mobile */}
            <button 
              onClick={() => setShowAddSale(true)}
              className="fab"
              aria-label="Add new sale"
            >
              <Plus className="h-6 w-6" />
            </button>

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
      </RoleProtectedRoute>
    );
  }

  // Desktop layout
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'user']}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full page-transition">
          <AppSidebar />
          <main className="flex-1 p-6">
            <SalesHeader 
              onAddSale={() => setShowAddSale(true)}
              onBulkUpload={() => setShowBulkUpload(true)}
              onExport={() => setShowExport(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              currentView={currentView}
              onViewChange={setCurrentView}
            />

            {/* Content based on view */}
            {currentView === 'chart' ? (
              <SalesGraphicalView
                sales={filteredSales}
                filters={chartFilters}
                onFiltersChange={setChartFilters}
              />
            ) : (
              <SalesTableView sales={filteredSales} />
            )}

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
    </RoleProtectedRoute>
  );
};

export default Sales;
