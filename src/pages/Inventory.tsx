import { InventoryContentContainer } from "@/components/inventory/InventoryContentContainer";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useState } from "react";
import { InventoryErrorState } from "@/components/inventory/InventoryErrorState";
import { InventoryLoadingState } from "@/components/inventory/InventoryLoadingState";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime";

const Inventory = () => {
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const { inventoryItems, isLoading, error, refetch, isOffline } = useInventoryData(selectedLocation);
  
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
    </RoleProtectedRoute>
  );
};

export default Inventory;
