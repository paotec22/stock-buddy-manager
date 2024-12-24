import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InventoryItem {
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
}

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const handleBulkUpload = (data: InventoryItem[]) => {
    setInventoryItems((prevItems) => [...prevItems, ...data]);
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
            {inventoryItems.length > 0 ? (
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
                    <TableRow key={index}>
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