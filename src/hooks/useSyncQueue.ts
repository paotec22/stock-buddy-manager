import { useCallback, useEffect, useState } from 'react';
import {
  addToSyncQueue,
  getSyncQueue,
  removeSyncOperation,
  SyncOperation,
  STORES,
  StoreName,
  put,
  deleteByKey
} from '@/lib/indexedDB';
import { useOnlineStatus } from './useOnlineStatus';

export interface PendingOperation {
  id?: number;
  store: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export function useSyncQueue() {
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOnline } = useOnlineStatus();

  // Load pending operations on mount
  const loadPendingOperations = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingOperations(queue);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Add operation to queue
  const queueOperation = useCallback(async (
    store: StoreName,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ): Promise<void> => {
    const syncOp: Omit<SyncOperation, 'id'> = {
      store,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    await addToSyncQueue(syncOp);
    
    // Also update local IndexedDB immediately for optimistic UI
    if (operation === 'create' || operation === 'update') {
      await put(store, data);
    } else if (operation === 'delete' && data.id) {
      await deleteByKey(store, data.id as number);
    }

    await loadPendingOperations();
    console.log(`Queued ${operation} operation for ${store}:`, data);
  }, [loadPendingOperations]);

  // Remove operation from queue (after successful sync)
  const removeFromQueue = useCallback(async (id: number): Promise<void> => {
    await removeSyncOperation(id);
    await loadPendingOperations();
  }, [loadPendingOperations]);

  // Get count of pending operations by store
  const getPendingCount = useCallback((store?: StoreName): number => {
    if (store) {
      return pendingOperations.filter(op => op.store === store).length;
    }
    return pendingOperations.length;
  }, [pendingOperations]);

  // Check if there are any pending operations
  const hasPendingOperations = pendingOperations.length > 0;

  return {
    pendingOperations,
    isLoading,
    isOnline,
    queueOperation,
    removeFromQueue,
    loadPendingOperations,
    getPendingCount,
    hasPendingOperations
  };
}
