import { useCallback, useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { getSyncQueue, removeSyncOperation, SyncOperation, STORES } from '@/lib/indexedDB';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePullSync } from './usePullSync';

export type SyncStatus = 'idle' | 'syncing' | 'pulling' | 'success' | 'error';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
}

export function useBackgroundSync() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const { pullAllData } = usePullSync();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ total: 0, completed: 0, failed: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Process a single sync operation (push to server)
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

  // Push pending local changes to server
  const pushPendingOperations = useCallback(async (): Promise<{ completed: number; failed: number }> => {
    const queue = await getSyncQueue();
    
    if (queue.length === 0) {
      console.log('No pending operations to push');
      return { completed: 0, failed: 0 };
    }

    console.log(`Pushing ${queue.length} pending operations to server`);
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

    return { completed, failed };
  }, []);

  // Full sync: push local changes, then pull server data
  const syncAll = useCallback(async () => {
    console.log('Starting full sync (push + pull)...');
    setShowBanner(true);
    setSyncStatus('syncing');

    try {
      // Step 1: Push any pending local changes first
      const { completed: pushCompleted, failed: pushFailed } = await pushPendingOperations();
      
      if (pushCompleted > 0) {
        console.log(`Pushed ${pushCompleted} local changes`);
      }
      if (pushFailed > 0) {
        console.warn(`Failed to push ${pushFailed} local changes`);
      }

      // Step 2: Pull latest data from server
      setSyncStatus('pulling');
      const pullResult = await pullAllData(false); // Don't show individual toast

      setLastSyncTime(new Date());

      // Show combined result
      if (pullResult.success && pushFailed === 0) {
        setSyncStatus('success');
        const totalPulled = pullResult.inventoryCount + pullResult.salesCount + pullResult.expensesCount;
        
        if (pushCompleted > 0 || totalPulled > 0) {
          toast.success(
            pushCompleted > 0 
              ? `Synced: ${pushCompleted} changes pushed, ${totalPulled} records updated`
              : `Synced ${totalPulled} records from server`
          );
        } else {
          toast.success('Data is up to date');
        }
      } else if (pushFailed > 0) {
        setSyncStatus('error');
        toast.warning(`Sync completed with ${pushFailed} failed operations`);
      } else {
        setSyncStatus('error');
        toast.error('Failed to sync data from server');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast.error('Sync failed');
    }

    // Hide banner after delay
    setTimeout(() => {
      setShowBanner(false);
      setSyncStatus('idle');
      resetWasOffline();
    }, 4000);
  }, [pushPendingOperations, pullAllData, resetWasOffline]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('Back online - triggering full sync');
      syncAll();
    }
  }, [isOnline, wasOffline, syncAll]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    await syncAll();
  }, [isOnline, syncAll]);

  // Pull only (no push)
  const triggerPullOnly = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    setShowBanner(true);
    setSyncStatus('pulling');
    
    const result = await pullAllData();
    
    setLastSyncTime(new Date());
    setSyncStatus(result.success ? 'success' : 'error');
    
    setTimeout(() => {
      setShowBanner(false);
      setSyncStatus('idle');
    }, 3000);
  }, [isOnline, pullAllData]);

  return {
    syncStatus,
    syncProgress,
    lastSyncTime,
    isOnline,
    wasOffline,
    showBanner,
    triggerSync,
    triggerPullOnly
  };
}
