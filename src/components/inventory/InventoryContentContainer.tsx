
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventorySubNav } from "@/components/inventory/InventorySubNav";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryGrandTotal } from "./InventoryGrandTotal";
import { useOfflineInventoryOperations } from "@/hooks/useOfflineInventoryOperations";
import { getStockStatus, StockStatus } from "@/components/ui/status-badge";
import { exportInventoryReport } from "@/utils/inventoryExport";
import { InventoryExportModal } from "@/components/inventory/InventoryExportModal";
import { toast } from "sonner";

interface InventoryContentContainerProps {
  inventoryItems: InventoryItem[];
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  refetch: () => void;
  isOffline?: boolean;
}

export function InventoryContentContainer({
  inventoryItems,
  selectedLocation,
  setSelectedLocation,
  refetch,
  isOffline = false,
}: InventoryContentContainerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | null>(null);
  
  const { handlePriceEdit, handleQuantityEdit, handleDescriptionEdit, handleDelete, pendingCount } = useOfflineInventoryOperations(refetch);

  const handleStatusFilter = (status: StockStatus) => {
    // Toggle filter: if same status is clicked, clear the filter
    setStatusFilter(statusFilter === status ? null : status);
  };

  // Filter items based on search term (multi-token description, features, or exact ID/SKU) and status
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const queryTokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = queryTokens.length > 0
      ? (() => {
          const idMatch =
            String(item.id) === normalizedQuery ||
            `#${item.id}` === normalizedQuery;
          if (idMatch) return true;

          const haystack = [
            item["Item Description"] || "",
            ...(Array.isArray(item.features) ? item.features : []),
          ]
            .join(" ")
            .toLowerCase();

          return queryTokens.every(token => haystack.includes(token));
        })()
      : true;
    
    const matchesStatus = statusFilter 
      ? getStockStatus(item.Quantity || 0) === statusFilter
      : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in">
      <InventorySubNav activeTab="inventory" />
      <InventoryHeader
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onAddItem={() => setShowAddForm(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        onExport={() => setShowExportModal(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalItemsCount={inventoryItems.length}
        filteredItemsCount={filteredItems.length}
        isOffline={isOffline}
        pendingCount={pendingCount}
      />

      <InventoryExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onExport={async (range) => {
          try {
            const count = await exportInventoryReport(filteredItems, selectedLocation, range);
            toast.success(`Exported ${count} item${count === 1 ? "" : "s"}`);
          } catch (e) {
            console.error(e);
            toast.error("Failed to export inventory");
          }
        }}
      />

      <AddInventoryForm 
        open={showAddForm} 
        onOpenChange={setShowAddForm} 
      />
      
      <BulkUploadModal 
        open={showBulkUpload} 
        onOpenChange={setShowBulkUpload}
        onDataUpload={() => {
          refetch();
          setShowBulkUpload(false);
        }}
      />

      <div className="grid gap-6">
        <InventoryGrandTotal 
          items={inventoryItems}
          selectedLocation={selectedLocation}
          onStatusClick={handleStatusFilter}
          selectedStatus={statusFilter}
        />

        {filteredItems.length > 0 ? (
          <Card className="overflow-hidden border rounded-lg shadow-sm max-sm:border-0 max-sm:shadow-none max-sm:bg-transparent">
            <CardContent className="p-0">
              <InventoryTable
                items={filteredItems}
                onPriceEdit={handlePriceEdit}
                onQuantityEdit={handleQuantityEdit}
                onDescriptionEdit={handleDescriptionEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/80 rounded-xl">
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                {normalizedQuery
                  ? `No inventory items match "${searchTerm.trim()}" in ${selectedLocation}.`
                  : statusFilter
                  ? `No ${statusFilter.replace("-", " ")} items found in ${selectedLocation}.`
                  : `No inventory items in ${selectedLocation} yet.`}
              </p>
              {(normalizedQuery || statusFilter) && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter(null);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer touch-manipulation"
                  >
                    Clear Search &amp; Filters
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
