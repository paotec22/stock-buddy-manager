
import { useState } from "react";
import { useInventoryData } from "@/hooks/useInventoryData";
import { InventoryLoadingState } from "./InventoryLoadingState";
import { InventoryErrorState } from "./InventoryErrorState";
import { InventoryContentContainer } from "./InventoryContentContainer";
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime";

export function InventoryContent() {
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  
  const { inventoryItems, isLoading, error, refetch } = useInventoryData(selectedLocation);
  
  // Set up realtime updates
  useInventoryRealtime(() => {
    refetch();
  });

  if (isLoading) {
    return <InventoryLoadingState />;
  }

  if (error) {
    return <InventoryErrorState />;
  }

  return (
    <InventoryContentContainer
      inventoryItems={inventoryItems}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
      refetch={refetch}
    />
  );
}
