
import { InventoryLayout } from "@/components/inventory/InventoryLayout";
import { InventoryContentContainer } from "@/components/inventory/InventoryContentContainer";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useState } from "react";
import { InventoryErrorState } from "@/components/inventory/InventoryErrorState";
import { InventoryLoadingState } from "@/components/inventory/InventoryLoadingState";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

// Fixed import issue - using InventoryContentContainer instead of deleted InventoryContent
const Inventory = () => {
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const { inventoryItems, isLoading, error, refetch } = useInventoryData(selectedLocation);

  if (isLoading) return <InventoryLayout><InventoryLoadingState /></InventoryLayout>;
  if (error) return <InventoryLayout><InventoryErrorState /></InventoryLayout>;

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'inventory_manager', 'user']}>
      <InventoryLayout>
        <InventoryContentContainer 
          inventoryItems={inventoryItems}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          refetch={refetch}
        />
      </InventoryLayout>
    </RoleProtectedRoute>
  );
};

// Make sure we're using a default export
export default Inventory;
