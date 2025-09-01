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

const ORDER_FIELDS = [
  { value: "sale_date", label: "Sale Date" },
  { value: "total_amount", label: "Total Amount" },
  { value: "item_name", label: "Item Name" },
];

const ORDER_DIRECTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

// Simple Select component for dropdowns
const Select = ({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`border rounded px-2 py-1 ${className ?? ""}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const SalesHeader = ({
  onAddSale,
  onBulkUpload,
  onExport,
  searchTerm,
  onSearchChange,
  orderField,
  orderDirection,
  onOrderFieldChange,
  onOrderDirectionChange,
}: {
  onAddSale: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  orderField: string;
  orderDirection: string;
  onOrderFieldChange: (value: string) => void;
  onOrderDirectionChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:gap-4">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        <div className="w-full md:w-[250px]">
          <SearchInput 
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search sales..."
          />
        </div>
        <Select
          value={orderField}
          onChange={onOrderFieldChange}
          options={ORDER_FIELDS}
          className="md:w-[150px]"
        />
        <Select
          value={orderDirection}
          onChange={onOrderDirectionChange}
          options={ORDER_DIRECTIONS}
          className="md:w-[150px]"
        />
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
  const [orderField, setOrderField] = useState("sale_date");
  const [orderDirection, setOrderDirection] = useState("desc");
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: sales = [], isLoading, refetch } = useQuery({
    queryKey: ['sales', orderField, orderDirection],
    queryFn: async () => {
      let query = supabase
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
        `);

      // Supabase can't order by joined fields, so we sort by item_name in JS
      if (orderField !== "item_name") {
        query = query.order(orderField, { ascending: orderDirection === "asc" });
      } else {
        query = query.order("item_id", { ascending: true }); // fallback order
      }

      const { data: salesData, error } = await query;

      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }

      let mappedSales = (salesData || []).map((sale: any) => ({
        id: sale.id,
        quantity: sale.quantity,
        sale_price: sale.sale_price,
        total_amount: sale.total_amount,
        sale_date: sale.sale_date,
        item_name: sale["inventory list"]?.["Item Description"] || "Unknown Item",
        location: sale["inventory list"]?.location || "Unknown Location"
      })) as Sale[];

      if (orderField === "item_name") {
        mappedSales = mappedSales.sort((a, b) => {
          if (a.item_name < b.item_name) return orderDirection === "asc" ? -1 : 1;
          if (a.item_name > b.item_name) return orderDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      return mappedSales;
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
      <div className="min-h-screen bg-background pb-16">
        <main className="p-4">
          <SalesHeader 
            onAddSale={() => setShowAddSale(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
            onExport={() => setShowExport(true)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            orderField={orderField}
            orderDirection={orderDirection}
            onOrderFieldChange={setOrderField}
            onOrderDirectionChange={setOrderDirection}
          />

          <div className="grid gap-4 mb-6">
            <TotalSalesSummary />
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Sales Summary</h2>
              <SalesSummaryTable sales={filteredSales} />
            </div>
          </div>

          <div className="space-y-3">
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
    );
  }

  // Desktop layout
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
            orderField={orderField}
            orderDirection={orderDirection}
            onOrderFieldChange={setOrderField}
            onOrderDirectionChange={setOrderDirection}
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