import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Real-time subscription hook to keep customer directory and customer details
 * synchronized across all active users and devices of the application.
 */
export const useCustomersRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("customers-realtime-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        (payload) => {
          // Immediately invalidate customer queries so any new, edited, or removed
          // customer record is instantly fetched and displayed across all connected clients
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
