import { Button } from "@/components/ui/button";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { BulkSaleUploadModal } from "@/components/sales/BulkSaleUploadModal";
import { SalesExportModal } from "@/components/sales/SalesExportModal";
import { SalesViewToggle } from "@/components/sales/SalesViewToggle";
import { SalesGraphicalView } from "@/components/sales/SalesGraphicalView";
import { SalesTableView } from "@/components/sales/SalesTableView";
import { SalesLoadingState } from "@/components/sales/SalesLoadingState";
import { SalesExecutiveCards } from "@/components/sales/SalesExecutiveCards";
import { SalesFilterToolbar } from "@/components/sales/SalesFilterToolbar";
import { ChartFilters } from "@/components/sales/SalesChartFilters";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Upload, FileSpreadsheet, Filter } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Sale } from "@/components/sales/types";
import { MobileFAB } from "@/components/MobileFAB";
import { DateRange } from "react-day-picker";
import { parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";

const SalesHeader = ({ 
  onAddSale, 
  onBulkUpload, 
  onExport, 
  currentView,
  onViewChange,
  totalSalesCount,
  isFilterVisible,
  onToggleFilter,
  hasActiveFilters,
}: { 
  onAddSale: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
  currentView: 'table' | 'chart';
  onViewChange: (view: 'table' | 'chart') => void;
  totalSalesCount: number;
  isFilterVisible?: boolean;
  onToggleFilter?: () => void;
  hasActiveFilters?: boolean;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Sales Operations</h1>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary font-mono tabular-nums">
            {totalSalesCount} {totalSalesCount === 1 ? 'record' : 'records'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Track customer transactions, receivables, and branch performance
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SalesViewToggle currentView={currentView} onViewChange={onViewChange} />

        <div className="h-4 w-px bg-border hidden sm:block mx-1" />

        {onToggleFilter && (
          <Button
            type="button"
            variant={isFilterVisible ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleFilter}
            className={`h-9 text-xs sm:text-sm px-2.5 sm:px-3 rounded-lg gap-1.5 transition-all cursor-pointer ${
              isFilterVisible
                ? "bg-secondary text-secondary-foreground border-border"
                : "bg-background border-border hover:bg-muted"
            }`}
            title={isFilterVisible ? "Hide filter bar" : "Show filter bar"}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{isFilterVisible ? "Hide Filters" : "Show Filters"}</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Button>
        )}

        <Button 
          onClick={onAddSale} 
          size="sm" 
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-medium h-9 text-xs sm:text-sm px-3 sm:px-3.5"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          <span>Record Sale</span>
        </Button>

        <Button 
          onClick={onBulkUpload} 
          variant="outline" 
          size="sm" 
          className="h-9 text-xs sm:text-sm px-2.5 sm:px-3 bg-background border-border hover:bg-muted"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden xs:inline sm:inline">Bulk </span>
          <span>Upload</span>
        </Button>

        <Button 
          onClick={onExport} 
          variant="outline" 
          size="sm" 
          className="h-9 text-xs sm:text-sm px-2.5 sm:px-3 bg-background border-border hover:bg-muted"
          title="Export Sales Data"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
};

const Sales = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'chart'>('table');
  
  // Unified Filters
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem("sales_filter_visible");
    return saved !== null ? saved === "true" : false; // Hidden by default
  });

  const handleToggleFilter = () => {
    setIsFilterVisible((prev) => {
      const next = !prev;
      localStorage.setItem("sales_filter_visible", String(next));
      return next;
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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

  // Extract unique locations from all sales
  const locations = useMemo(() => {
    return Array.from(new Set(sales.map(s => s.location).filter(Boolean))).sort();
  }, [sales]);

  // Apply unified filter criteria
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search term matching item name or notes
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = sale.item_name.toLowerCase().includes(term);
        const matchNotes = sale.notes ? sale.notes.toLowerCase().includes(term) : false;
        if (!matchName && !matchNotes) return false;
      }

      // Location filter
      if (selectedLocation !== "all" && sale.location !== selectedLocation) {
        return false;
      }

      // Payment status filter
      if (paymentStatus !== "all" && sale.payment_status !== paymentStatus) {
        return false;
      }

      // Date range filter
      if (dateRange?.from) {
        const saleDate = parseISO(sale.sale_date);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(saleDate, { start: from, end: to })) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchTerm, selectedLocation, paymentStatus, dateRange]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedLocation !== "all" ||
    paymentStatus !== "all" ||
    dateRange?.from
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedLocation("all");
    setPaymentStatus("all");
    setDateRange(undefined);
  };

  if (loading) return <div>Loading...</div>;

  if (!session) {
    navigate("/");
    return null;
  }

  if (isLoading) return <SalesLoadingState />;

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'user']}>
      <div className="space-y-4 sm:space-y-5 animate-fade-in pb-20 sm:pb-10">
        <SalesHeader 
          onAddSale={() => setShowAddSale(true)}
          onBulkUpload={() => setShowBulkUpload(true)}
          onExport={() => setShowExport(true)}
          currentView={currentView}
          onViewChange={setCurrentView}
          totalSalesCount={sales.length}
          isFilterVisible={isFilterVisible}
          onToggleFilter={handleToggleFilter}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Executive KPI Summary Cards */}
        <SalesExecutiveCards
          sales={filteredSales}
          totalSalesCount={sales.length}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Unified Filter Toolbar */}
        <SalesFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          locations={locations}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          isVisible={isFilterVisible}
          onToggleVisibility={handleToggleFilter}
        />

        {/* View Switcher: Table vs Chart */}
        {currentView === 'chart' ? (
          <SalesGraphicalView
            sales={filteredSales}
            filters={chartFilters}
            onFiltersChange={setChartFilters}
          />
        ) : (
          <SalesTableView 
            sales={filteredSales} 
            hasFilters={hasActiveFilters}
            onClearFilters={handleResetFilters}
          />
        )}

        {/* Modals */}
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
          sales={filteredSales}
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
