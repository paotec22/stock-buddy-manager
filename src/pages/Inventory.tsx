
import { InventoryLayout } from "@/components/inventory/InventoryLayout";
import { InventoryContentContainer } from "@/components/inventory/InventoryContentContainer";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useState } from "react";
import { InventoryErrorState } from "@/components/inventory/InventoryErrorState";
import { InventoryLoadingState } from "@/components/inventory/InventoryLoadingState";

// Fixed import issue - using InventoryContentContainer instead of deleted InventoryContent
const Inventory = () => {
  const [selectedLocation, setSelectedLocation] = useState("Main Store");
  const { inventoryItems, isLoading, error, refetch } = useInventoryData(selectedLocation);

  if (isLoading) return <InventoryLayout><InventoryLoadingState /></InventoryLayout>;
  if (error) return <InventoryLayout><InventoryErrorState /></InventoryLayout>;

  return (
    <InventoryLayout>
      <InventoryContentContainer 
        inventoryItems={inventoryItems}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        refetch={refetch}
      />
    </InventoryLayout>
  );
};

// Make sure we're using a default export
export default Inventory;
