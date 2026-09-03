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
import { MobileFAB } from "@/components/MobileFAB";

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
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Sales Management</h1>
            <div className="w-full sm:w-[240px]">
              <SearchInput 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search sales..."
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button 
              onClick={onAddSale} 
              size="sm" 
              className="flex-1 md:flex-initial min-h-[40px] md:min-h-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Record Sale</span>
            </Button>
            <Button 
              onClick={onBulkUpload} 
              variant="outline" 
              size="sm" 
              className="flex-1 md:flex-initial min-h-[40px] md:min-h-0 bg-background border-input hover:bg-muted font-medium"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              <span>Upload</span>
            </Button>
            <Button 
              onClick={onExport} 
              variant="outline" 
              size="sm" 
              className="min-h-[40px] md:min-h-0 bg-background border-input hover:bg-muted font-medium px-2.5 sm:px-3"
              title="Export Sales"
            >
              <FileSpreadsheet className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
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

        <MobileFAB
          primaryAction={{
            label: "Record Sale",
            icon: Plus,
            onClick: () => setShowAddSale(true),
            shortcut: "⌘⇧N",
          }}
          secondaryActions={[
            { label: "Bulk Upload", icon: Upload, onClick: () => setShowBulkUpload(true) },
            { label: "Export", icon: FileSpreadsheet, onClick: () => setShowExport(true) },
          ]}
          tourId="fab"
        />
      </div>
    </RoleProtectedRoute>
  );
};

export default Sales;
