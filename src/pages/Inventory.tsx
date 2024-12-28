import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Edit2, Trash } from "lucide-react";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InventoryItem {
  "Item Description": string;
  Price: number;
  Quantity: number;
  Total: number;
  location: string;
}

const LOCATIONS = ["Ikeja", "Cement"];

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchInventoryItems();
  }, [selectedLocation]);

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
      toast.success("Price updated successfully");
      fetchInventoryItems();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Failed to update price");
    }
    setEditingPrice({ ...editingPrice, [item["Item Description"]]: false });
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
      fetchInventoryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
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

          <div className="mb-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AddInventoryForm open={showAddForm} onOpenChange={setShowAddForm} />
          <BulkUploadModal 
            open={showBulkUpload} 
            onOpenChange={setShowBulkUpload} 
            onDataUpload={fetchInventoryItems}
          />

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="p-6 text-center">Loading inventory...</div>
            ) : inventoryItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item, index) => (
                    <TableRow 
                      key={index}
                      className={item.Quantity < 1 ? "bg-red-50" : ""}
                    >
                      <TableCell>{item["Item Description"]}</TableCell>
                      <TableCell>
                        {editingPrice[item["Item Description"]] ? (
                          <Input
                            type="number"
                            defaultValue={item.Price}
                            className="w-24"
                            onBlur={(e) => handlePriceEdit(item, parseFloat(e.target.value))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceEdit(item, parseFloat((e.target as HTMLInputElement).value));
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center">
                            ${item.Price?.toFixed(2)}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPrice({ ...editingPrice, [item["Item Description"]]: true })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.Quantity}</TableCell>
                      <TableCell>${item.Total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
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
