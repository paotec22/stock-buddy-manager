import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InventoryItem {
  id?: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
  user_id?: string;
}

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to view inventory");
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching inventory:', error);
        toast.error("Failed to load inventory items");
        return;
      }

      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to load inventory items");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (items: InventoryItem[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to upload inventory");
        return;
      }

      const itemsWithUserId = items.map(item => ({
        ...item,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('inventory')
        .insert(itemsWithUserId);

      if (error) {
        console.error('Error uploading inventory:', error);
        toast.error("Failed to upload inventory items");
        return;
      }

      toast.success("Inventory items uploaded successfully");
      fetchInventoryItems();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to upload inventory items");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <div className="flex gap-3">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                <Upload className="mr-2" />
                Bulk Upload
              </Button>
            </div>
          </div>

          <AddInventoryForm open={showAddForm} onOpenChange={setShowAddForm} />
          <BulkUploadModal 
            open={showBulkUpload} 
            onOpenChange={setShowBulkUpload} 
            onDataUpload={handleBulkUpload}
          />

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="p-6 text-center">Loading inventory...</div>
            ) : inventoryItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minQuantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <p className="text-muted-foreground">No inventory items yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Inventory;