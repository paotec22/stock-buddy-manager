import { InventoryContentContainer } from "@/components/inventory/InventoryContentContainer";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useState } from "react";
import { InventoryErrorState } from "@/components/inventory/InventoryErrorState";
import { InventoryLoadingState } from "@/components/inventory/InventoryLoadingState";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime";
import { MobileFAB } from "@/components/MobileFAB";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryExportModal } from "@/components/inventory/InventoryExportModal";
import { Upload, Download, Plus } from "lucide-react";

const Inventory = () => {
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const { inventoryItems, isLoading, error, refetch, isOffline } = useInventoryData(selectedLocation);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  useInventoryRealtime(refetch);

  if (isLoading) return <InventoryLoadingState />;
  if (error) return <InventoryErrorState />;

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'inventory_manager', 'user']}>
      <InventoryContentContainer 
        inventoryItems={inventoryItems}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        refetch={refetch}
        isOffline={isOffline}
      />
      <MobileFAB
        primaryAction={{
          label: "Add Item",
          icon: Plus,
          onClick: () => setShowAddForm(true),
          shortcut: "⌘⇧N",
        }}
        secondaryActions={[
          { label: "Bulk Upload", icon: Upload, onClick: () => setShowBulkUpload(true) },
          { label: "Export", icon: Download, onClick: () => setShowExportModal(true) },
        ]}
      />
      <AddInventoryForm 
        open={showAddForm} 
        onOpenChange={setShowAddForm} 
      />
      <BulkUploadModal 
        open={showBulkUpload} 
        onOpenChange={setShowBulkUpload}
        onDataUpload={() => refetch()}
      />
      <InventoryExportModal 
        open={showExportModal} 
        onOpenChange={setShowExportModal}
        onExport={async (range) => {
          // Export handled by container
        }}
      />
    </RoleProtectedRoute>
  );
};

export default Inventory;
