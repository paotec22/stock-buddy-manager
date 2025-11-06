
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { InventoryItem } from "@/utils/inventoryUtils";

export function useInventoryData(selectedLocation: string) {
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
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  return {
    inventoryItems,
    isLoading,
    error,
    refetch
  };
}
