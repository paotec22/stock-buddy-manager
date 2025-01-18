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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";

const Inventory = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    console.log("Inventory: Checking authentication", { hasSession: !!session?.user });
    if (!session?.user) {
      console.log("Inventory: No session found, redirecting to login");
      navigate('/');
      return;
    }
  }, [session, navigate]);

  // Optimized data fetching with React Query and better error handling
  const { data: inventoryItems = [], isLoading, error } = useQuery({
    queryKey: ['inventory', selectedLocation],
    queryFn: async () => {
      if (!session?.user) {
        console.log("Query aborted: No authenticated user");
        return [];
      }

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
    enabled: !!session?.user, // Only fetch when authenticated
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  // Optimized real-time updates
  useInventoryRealtime(() => {
    console.log('Invalidating inventory cache');
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  });

  const handlePriceEdit = async (item: InventoryItem, newPrice: number) => {
    if (!session?.user) {
      console.log("Cannot edit price: No authenticated user");
      toast.error("Please login to edit items");
      return;
    }

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
      
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success("Price updated successfully");
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Failed to update price");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!session?.user) {
      console.log("Cannot delete item: No authenticated user");
      toast.error("Please login to delete items");
      return;
    }

    try {
      console.log('Deleting item:', item.id);
      const { error } = await supabase
        .from('inventory list')
        .delete()
        .eq('id', item.id)
        .eq('location', item.location);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Failed to delete item");
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-4">
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
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">Error loading inventory</h2>
              <p className="text-gray-600">Please try refreshing the page</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // If no session, show loading or redirect
  if (!session?.user) {
    return null;
  }

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
            onDataUpload={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}
          />

          {inventoryItems.length > 0 && (
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

          {inventoryItems.length > 0 ? (
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