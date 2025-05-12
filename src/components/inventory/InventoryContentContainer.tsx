
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryGrandTotal } from "./InventoryGrandTotal";
import { InventoryMobileNav } from "./InventoryMobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInventoryOperations } from "@/hooks/useInventoryOperations";
import { getSortedInventoryItems } from "@/utils/inventorySortUtils";

interface InventoryContentContainerProps {
  inventoryItems: InventoryItem[];
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  refetch: () => void;
}

export function InventoryContentContainer({
  inventoryItems,
  selectedLocation,
  setSelectedLocation,
  sortBy,
  setSortBy,
  refetch
}: InventoryContentContainerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  
  const { handlePriceEdit, handleQuantityEdit, handleDelete } = useInventoryOperations(refetch);
  
  const sortedItems = getSortedInventoryItems(inventoryItems, sortBy);

  // Filter items based on search term
  const filteredItems = searchTerm.trim() 
    ? sortedItems.filter(item => 
        item["Item Description"]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedItems;

  return (
    <div className="space-y-6 fade-in">
      <InventoryHeader
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onAddItem={() => setShowAddForm(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        onSortChange={setSortBy}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {isMobile && <InventoryMobileNav />}

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
          items={filteredItems}
          selectedLocation={selectedLocation}
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
