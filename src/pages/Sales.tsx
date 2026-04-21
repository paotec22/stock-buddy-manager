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
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 md:p-6 shadow-sm">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Sales Management</h1>
            </div>
            <div className="w-full md:w-[260px]">
              <SearchInput 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search sales..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onExport} variant="outline" size="sm" className="btn-with-icon bg-card/70 backdrop-blur-sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button onClick={onBulkUpload} variant="outline" size="sm" className="btn-with-icon bg-card/70 backdrop-blur-sm">
              <Upload className="h-4 w-4" />
              <span>Bulk Upload</span>
            </Button>
            <Button onClick={onAddSale} size="sm" className="btn-with-icon btn-primary">
              <Plus className="h-4 w-4" />
              <span>Record Sale</span>
            </Button>
          </div>
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
      <div className="animate-fade-in">
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
