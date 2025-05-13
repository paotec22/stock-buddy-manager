
import { InventoryLayout } from "@/components/inventory/InventoryLayout";
import { InventoryContent } from "@/components/inventory/InventoryContent";

const Inventory = () => {
  return (
    <InventoryLayout>
      <InventoryContent />
    </InventoryLayout>
  );
};

// Make sure we're using a default export
export default Inventory;
