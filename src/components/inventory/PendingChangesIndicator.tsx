import { CloudOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { STORES } from "@/lib/indexedDB";

export function PendingChangesIndicator() {
  const { getPendingCount, hasPendingOperations, isOnline } = useSyncQueue();
  const inventoryPending = getPendingCount(STORES.INVENTORY);

  if (!hasPendingOperations) return null;

  return (
    <Badge 
      variant="outline" 
      className="bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1.5"
    >
      {isOnline ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <CloudOff className="h-3 w-3" />
      )}
      <span>{inventoryPending} pending</span>
    </Badge>
  );
}
