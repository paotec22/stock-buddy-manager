import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  fetchAccessories,
  addAccessory,
  updateAccessory,
  deleteAccessory,
  adjustAccessoryQuantity,
  getLocalAccessories,
} from "@/lib/accessoriesStorage";
import { AccessoryItem, NewAccessoryItem } from "@/types/accessories";
import { toast } from "sonner";

export function useAccessoriesData(selectedLocation: string = "Ikeja") {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["accessories", selectedLocation],
    queryFn: async () => {
      return await fetchAccessories(selectedLocation);
    },
    staleTime: 1000 * 60 * 3, // 3 minutes fresh
  });

  // Query for all accessories (to calculate grand aggregate stats across branches)
  const { data: allAccessories = [] } = useQuery({
    queryKey: ["accessories", "all"],
    queryFn: async () => {
      return await fetchAccessories("All Locations");
    },
    staleTime: 1000 * 60 * 3,
  });

  // Listen to custom cross-tab or local storage update events
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
    };
    window.addEventListener("accessories-updated", handleUpdate);
    return () => window.removeEventListener("accessories-updated", handleUpdate);
  }, [queryClient]);

  const handleAdd = async (item: NewAccessoryItem) => {
    try {
      const added = await addAccessory(item);
      toast.success(`Added "${added.name}" to accessories`);
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      return added;
    } catch (err: any) {
      toast.error(err.message || "Failed to add accessory");
      throw err;
    }
  };

  const handleUpdate = async (id: string | number, updates: Partial<AccessoryItem>) => {
    try {
      const updated = await updateAccessory(id, updates);
      toast.success(`Updated "${updated.name}"`);
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      return updated;
    } catch (err: any) {
      toast.error(err.message || "Failed to update accessory");
      throw err;
    }
  };

  const handleDelete = async (id: string | number, name?: string) => {
    try {
      await deleteAccessory(id);
      toast.success(name ? `Deleted "${name}"` : "Deleted accessory item");
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete accessory");
      throw err;
    }
  };

  const handleAdjustQuantity = async (id: string | number, delta: number) => {
    try {
      const updated = await adjustAccessoryQuantity(id, delta);
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      return updated;
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock");
      throw err;
    }
  };

  return {
    items,
    allAccessories: allAccessories.length > 0 ? allAccessories : getLocalAccessories(),
    isLoading,
    error,
    refetch,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleAdjustQuantity,
  };
}
