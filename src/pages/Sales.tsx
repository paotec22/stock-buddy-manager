import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesExportModal } from "@/components/sales/SalesExportModal";
import { SalesViewToggle } from "@/components/sales/SalesViewToggle";
import { SalesGraphicalView } from "@/components/sales/SalesGraphicalView";
import { SalesTableView } from "@/components/sales/SalesTableView";
import { SalesLoadingState } from "@/components/sales/SalesLoadingState";
import { ChartFilters } from "@/components/sales/SalesChartFilters";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { SearchInput } from "@/components/ui/search-input";
import { Sale } from "@/components/sales/types";

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
          notes,
          payment_status,
          amount_paid,
          "inventory list" (
            "Item Description",
            location
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      return (salesData || []).map((sale: any) => ({
        id: sale.id,
        quantity: sale.quantity,
        sale_price: sale.sale_price,
        total_amount: sale.total_amount,
        sale_date: sale.sale_date,
        item_name: sale["inventory list"]?.["Item Description"] || "Unknown Item",
        location: sale["inventory list"]?.location || "Unknown Location",
        notes: sale.notes,
        payment_status: sale.payment_status || 'paid',
        amount_paid: sale.amount_paid || 0,
      })) as Sale[];
    },
    enabled: !!session
  });

  const filteredSales = searchTerm.trim()
    ? sales.filter(sale => sale.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : sales;

  if (loading) return <div>Loading...</div>;

  if (!session) {
    navigate("/");
    return null;
  }

  if (isLoading) return <SalesLoadingState />;

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'user']}>
      <div>
        <SalesHeader 
          onAddSale={() => setShowAddSale(true)}
          onBulkUpload={() => setShowBulkUpload(true)}
          onExport={() => setShowExport(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentView={currentView}
          onViewChange={setCurrentView}
        />

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
      </div>
    </RoleProtectedRoute>
  );
};

export default Sales;
