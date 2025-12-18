import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { InventoryItem } from "@/utils/inventoryUtils";
import { useOnlineStatus } from "./useOnlineStatus";
import { useIndexedDB } from "./useIndexedDB";
import { useEffect } from "react";

export function useInventoryData(selectedLocation: string) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { isReady, getInventory, saveInventory } = useIndexedDB();
  const queryClient = useQueryClient();

  const { data: inventoryItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', selectedLocation, isOnline],
    queryFn: async () => {
      console.log('Fetching inventory for location:', selectedLocation, '| Online:', isOnline);
      
      // If offline, try to get from IndexedDB cache
      if (!isOnline) {
        if (!isReady) {
          console.log('IndexedDB not ready, returning empty array');
          return [];
        }
        
        try {
          const cachedData = await getInventory(selectedLocation);
          console.log('Loaded from IndexedDB cache:', cachedData.length, 'items');
          
          if (cachedData.length > 0) {
            toast.info("Showing cached data (offline mode)");
            return cachedData as InventoryItem[];
          }
          
          toast.warning("No cached data available for this location");
          return [];
        } catch (cacheError) {
          console.error('Error reading from cache:', cacheError);
          return [];
        }
      }

      // Online: fetch from Supabase
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

        console.log('Fetched inventory data:', data?.length, 'items');
        return data || [];
      } catch (error) {
        console.error('Error in queryFn:', error);
        
        // Fallback to cache on network error
        if (isReady) {
          try {
            const cachedData = await getInventory(selectedLocation);
            if (cachedData.length > 0) {
              console.log('Network failed, using cache:', cachedData.length, 'items');
              toast.warning("Network error - showing cached data");
              return cachedData as InventoryItem[];
            }
          } catch (cacheError) {
            console.error('Cache fallback failed:', cacheError);
          }
        }
        
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: isOnline ? 3 : 0, // Don't retry when offline
  });

  // Cache data to IndexedDB when we successfully fetch online
  useEffect(() => {
    if (isOnline && isReady && inventoryItems.length > 0) {
      saveInventory(inventoryItems)
        .then(() => console.log('Cached', inventoryItems.length, 'items to IndexedDB'))
        .catch((err) => console.error('Failed to cache inventory:', err));
    }
  }, [isOnline, isReady, inventoryItems, saveInventory]);

  // Refetch when coming back online (after sync completes)
  useEffect(() => {
    if (isOnline && wasOffline) {
      // Small delay to ensure pull sync has completed
      const timer = setTimeout(() => {
        console.log('Back online - refreshing inventory data');
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }, 5000); // Wait for sync to complete
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, queryClient]);

  return {
    inventoryItems,
    isLoading,
    error,
    refetch,
    isOffline: !isOnline,
  };
}
