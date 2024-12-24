import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { AddInventoryForm } from "@/components/inventory/AddInventoryForm";
import { BulkUploadModal } from "@/components/inventory/BulkUploadModal";

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

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

          {/* Forms and Modals */}
          <AddInventoryForm open={showAddForm} onOpenChange={setShowAddForm} />
          <BulkUploadModal open={showBulkUpload} onOpenChange={setShowBulkUpload} />

          {/* Inventory table will be implemented in the next iteration */}
          <div className="rounded-lg border bg-card p-6">
            <p className="text-muted-foreground">No inventory items yet.</p>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Inventory;