import { useCallback, useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { getSyncQueue, removeSyncOperation, SyncOperation, STORES } from '@/lib/indexedDB';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
}

export function useBackgroundSync() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ total: 0, completed: 0, failed: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Process a single sync operation
  const processOperation = async (operation: SyncOperation): Promise<boolean> => {
    try {
      const { store, operation: opType, data } = operation;

      if (store === STORES.INVENTORY) {
        const tableName = 'inventory list';
        
        if (opType === 'update') {
          const { error } = await supabase
            .from(tableName)
            .update({
              'Item Description': data['Item Description'],
              Price: data.Price,
              Quantity: data.Quantity,
              Total: data.Total,
              location: data.location
            })
            .eq('id', data.id as number);

          if (error) throw error;
        } else if (opType === 'delete') {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', data.id as number);

          if (error) throw error;
        } else if (opType === 'create') {
          const { error } = await supabase
            .from(tableName)
            .insert({
              'Item Description': data['Item Description'],
              Price: data.Price,
              Quantity: data.Quantity,
              Total: data.Total,
              location: data.location
            });

          if (error) throw error;
        }
      }
      // Add handlers for other stores (sales, expenses) as needed

      return true;
    } catch (error) {
      console.error('Sync operation failed:', error);
      return false;
    }
  };

  // Process all pending operations
  const syncPendingOperations = useCallback(async () => {
    const queue = await getSyncQueue();
    
    if (queue.length === 0) {
      console.log('No pending operations to sync');
      setShowBanner(true);
      setSyncStatus('success');
      setSyncProgress({ total: 0, completed: 0, failed: 0 });
      
      // Hide banner after delay
      setTimeout(() => {
        setShowBanner(false);
        setSyncStatus('idle');
        resetWasOffline();
      }, 3000);
      return;
    }

    console.log(`Starting sync of ${queue.length} pending operations`);
    setShowBanner(true);
    setSyncStatus('syncing');
    setSyncProgress({ total: queue.length, completed: 0, failed: 0 });

    let completed = 0;
    let failed = 0;

    for (const operation of queue) {
      const success = await processOperation(operation);
      
      if (success && operation.id) {
        await removeSyncOperation(operation.id);
        completed++;
      } else {
        failed++;
      }

      setSyncProgress({ total: queue.length, completed, failed });
    }

    setLastSyncTime(new Date());

    if (failed === 0) {
      setSyncStatus('success');
      toast.success(`Synced ${completed} change${completed > 1 ? 's' : ''} successfully`);
    } else if (completed > 0) {
      setSyncStatus('error');
      toast.warning(`Synced ${completed} changes, ${failed} failed`);
    } else {
      setSyncStatus('error');
      toast.error(`Failed to sync ${failed} changes`);
    }

    // Hide banner after delay
    setTimeout(() => {
      setShowBanner(false);
      setSyncStatus('idle');
      resetWasOffline();
    }, 4000);
  }, [resetWasOffline]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('Back online - triggering background sync');
      syncPendingOperations();
    }
  }, [isOnline, wasOffline, syncPendingOperations]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    await syncPendingOperations();
  }, [isOnline, syncPendingOperations]);

  return {
    syncStatus,
    syncProgress,
    lastSyncTime,
    isOnline,
    wasOffline,
    showBanner,
    triggerSync
  };
}
