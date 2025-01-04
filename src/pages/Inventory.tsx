import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useInventoryRealtime } from "@/hooks/useInventoryRealtime";
import type { InventoryItem } from "@/utils/inventoryUtils";

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .eq('location', selectedLocation);

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error("Failed to load inventory items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, [selectedLocation]);

  useInventoryRealtime(fetchInventoryItems);

  const handlePriceEdit = async (item: InventoryItem, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('inventory list')
        .update({ 
          Price: newPrice,
          Total: newPrice * item.Quantity 
        })
        .eq('Item Description', item["Item Description"])
        .eq('location', item.location);

      if (error) throw error;
      await fetchInventoryItems();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Failed to update price");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory list')
        .delete()
        .eq('Item Description', item["Item Description"])
        .eq('location', item.location);

      if (error) throw error;
      toast.success("Item deleted successfully");
      await fetchInventoryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col md:flex-row w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <InventoryHeader
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onAddItem={() => setShowAddForm(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
          />

          <AddInventoryForm 
            open={showAddForm} 
            onOpenChange={setShowAddForm} 
          />
          
          <BulkUploadModal 
            open={showBulkUpload} 
            onOpenChange={setShowBulkUpload} 
            onDataUpload={fetchInventoryItems}
          />

          {loading ? (
            <div className="p-6 text-center">Loading inventory...</div>
          ) : inventoryItems.length > 0 ? (
            <InventoryTable
              items={inventoryItems}
              onPriceEdit={handlePriceEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="p-6">
              <p className="text-muted-foreground">No inventory items yet.</p>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Inventory;