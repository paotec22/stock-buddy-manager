
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
      
      // Calculate the new total based on the new price and current quantity
      const newTotal = newPrice * item.Quantity;
      
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Price: newPrice,
          Total: newTotal 
        })
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Price updated successfully");
      refetch();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Failed to update price");
    }
  };

  const handleQuantityEdit = async (item: InventoryItem, newQuantity: number) => {
    try {
      console.log('Updating quantity for item:', item.id);
      
      // Ensure newQuantity is not negative
      const validQuantity = Math.max(0, newQuantity);
      
      // Calculate the new total based on the current price and new quantity
      const newTotal = item.Price * validQuantity;
      
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Quantity: validQuantity,
          Total: newTotal 
        })
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      toast.success("Quantity updated successfully");
      refetch();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error("Failed to update quantity");
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
      refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  const getSortedItems = () => {
    if (!inventoryItems) return [];
    
    // Ensure all items have correct Total values
    const validatedItems = inventoryItems.map(item => ({
      ...item,
      // Ensure Quantity is a number
      Quantity: typeof item.Quantity === 'number' ? item.Quantity : 0,
      // Ensure Price is a number
      Price: typeof item.Price === 'number' ? item.Price : 0,
      // Recalculate Total to ensure consistency
      Total: (typeof item.Price === 'number' && typeof item.Quantity === 'number') 
        ? item.Price * item.Quantity 
        : 0
    }));
    
    const items = [...validatedItems];
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
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-16 bg-muted rounded-lg" />
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Error loading inventory</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedItems = getSortedItems();

  return (
    <div className="space-y-6 fade-in">
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

      <div className="grid gap-6">
        <InventoryGrandTotal 
          items={sortedItems}
          selectedLocation={selectedLocation}
        />

        {sortedItems.length > 0 ? (
          <Card className="overflow-hidden border rounded-lg shadow-sm">
            <CardContent className="p-0">
              <InventoryTable
                items={sortedItems}
                onPriceEdit={handlePriceEdit}
                onQuantityEdit={handleQuantityEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No inventory items yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
