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
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      await fetchInventoryItems();
      toast.success("Price updated successfully");
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
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      toast.success("Item deleted successfully");
      await fetchInventoryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  const calculateGrandTotal = () => {
    return inventoryItems.reduce((sum, item) => sum + (item.Total || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <InventoryHeader
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onAddItem={() => setShowAddForm(true)}
            onBulkUpload={() => setShowBulkUpload(true)}
          />

          {isMobile && (
            <div className="flex justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Dashboard</span>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/sales')}
              >
                <div className="flex items-center gap-2">
                  <span>Sales</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </div>
          )}

          <AddInventoryForm 
            open={showAddForm} 
            onOpenChange={setShowAddForm} 
          />
          
          <BulkUploadModal 
            open={showBulkUpload} 
            onOpenChange={setShowBulkUpload} 
            onDataUpload={fetchInventoryItems}
          />

          {!loading && inventoryItems.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Grand Total for {selectedLocation}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateGrandTotal())}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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