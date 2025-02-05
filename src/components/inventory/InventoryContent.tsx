
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from "@/utils/inventoryUtils";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryGrandTotal } from "./InventoryGrandTotal";
import { InventoryMobileNav } from "./InventoryMobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

export function InventoryContent() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const [sortBy, setSortBy] = useState("none");
  const isMobile = useIsMobile();

  const { data: inventoryItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', selectedLocation],
    queryFn: async () => {
      console.log('Fetching inventory for location:', selectedLocation);
      try {
        const { data, error } = await supabase
          .from('inventory list')
          .select('*')
          .eq('location', selectedLocation);

        if (error) {
          console.error('Supabase error:', error);
          toast.error("Failed to fetch inventory data");
          throw error;
        }

        console.log('Fetched inventory data:', data);
        return data || [];
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const handlePriceEdit = async (item: InventoryItem, newPrice: number) => {
    try {
      console.log('Updating price for item:', item.id);
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Price: newPrice,
          Total: newPrice * item.Quantity 
        })
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Price updated successfully");
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Failed to update price");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      console.log('Deleting item:', item.id);
      const { error } = await supabase
        .from('inventory list')
        .delete()
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  const getSortedItems = () => {
    if (!inventoryItems) return [];
    
    const items = [...inventoryItems];
    switch (sortBy) {
      case "name_asc":
        return items.sort((a, b) => a["Item Description"].localeCompare(b["Item Description"]));
      case "name_desc":
        return items.sort((a, b) => b["Item Description"].localeCompare(a["Item Description"]));
      case "price_asc":
        return items.sort((a, b) => a.Price - b.Price);
      case "price_desc":
        return items.sort((a, b) => b.Price - a.Price);
      case "quantity_asc":
        return items.sort((a, b) => a.Quantity - b.Quantity);
      case "quantity_desc":
        return items.sort((a, b) => b.Quantity - a.Quantity);
      default:
        return items;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted rounded-lg animate-pulse" />
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">Error loading inventory</h2>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  const sortedItems = getSortedItems();

  return (
    <>
      <InventoryHeader
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onAddItem={() => setShowAddForm(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        onSortChange={setSortBy}
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

      <InventoryGrandTotal 
        items={sortedItems}
        selectedLocation={selectedLocation}
      />

      {sortedItems.length > 0 ? (
        <InventoryTable
          items={sortedItems}
          onPriceEdit={handlePriceEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="p-6">
          <p className="text-muted-foreground">No inventory items yet.</p>
        </div>
      )}
    </>
  );
}
