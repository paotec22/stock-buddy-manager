
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryGrandTotal } from "./InventoryGrandTotal";
import { useInventoryOperations } from "@/hooks/useInventoryOperations";
import { getStockStatus, StockStatus } from "@/components/ui/status-badge";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | null>(null);
  
  const { handlePriceEdit, handleQuantityEdit, handleDelete } = useInventoryOperations(refetch);

  const handleStatusFilter = (status: StockStatus) => {
    // Toggle filter: if same status is clicked, clear the filter
    setStatusFilter(statusFilter === status ? null : status);
  };

  // Filter items based on search term and status
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = searchTerm.trim() 
      ? item["Item Description"]?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter 
      ? getStockStatus(item.Quantity || 0) === statusFilter
      : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in">
      <InventoryHeader
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onAddItem={() => setShowAddForm(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isOffline={isOffline}
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
          <Card className="overflow-hidden border rounded-lg shadow-sm">
            <CardContent className="p-0">
              <InventoryTable
                items={filteredItems}
                onPriceEdit={handlePriceEdit}
                onQuantityEdit={handleQuantityEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No items match your search." : "No inventory items yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
