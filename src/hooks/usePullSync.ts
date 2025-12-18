import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { putMany, getAll, getMeta, setMeta, STORES, clearStore } from '@/lib/indexedDB';
import { toast } from 'sonner';

export interface PullSyncResult {
  success: boolean;
  inventoryCount: number;
  salesCount: number;
  expensesCount: number;
  error?: string;
}

const LAST_SYNC_KEY = 'lastPullSync';

export function usePullSync() {
  // Pull inventory data from server
  const pullInventory = useCallback(async (location?: string): Promise<number> => {
    try {
      let query = supabase.from('inventory list').select('*');
      
      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to pull inventory:', error);
        throw error;
      }

      if (data && data.length > 0) {
        // If pulling for specific location, don't clear all - just update
        if (!location) {
          await clearStore(STORES.INVENTORY);
        }
        await putMany(STORES.INVENTORY, data);
        console.log(`Pulled ${data.length} inventory items from server`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Pull inventory error:', error);
      throw error;
    }
  }, []);

  // Pull sales data from server
  const pullSales = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, inventory_item:item_id("Item Description", location)')
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Failed to pull sales:', error);
        throw error;
      }

      if (data && data.length > 0) {
        await clearStore(STORES.SALES);
        await putMany(STORES.SALES, data);
        console.log(`Pulled ${data.length} sales from server`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Pull sales error:', error);
      throw error;
    }
  }, []);

  // Pull expenses data from server
  const pullExpenses = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Failed to pull expenses:', error);
        throw error;
      }

      if (data && data.length > 0) {
        await clearStore(STORES.EXPENSES);
        await putMany(STORES.EXPENSES, data);
        console.log(`Pulled ${data.length} expenses from server`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Pull expenses error:', error);
      throw error;
    }
  }, []);

  // Pull all data from server
  const pullAllData = useCallback(async (showToast = true): Promise<PullSyncResult> => {
    console.log('Starting pull sync from server...');
    
    try {
      // Pull all data types in parallel
      const [inventoryCount, salesCount, expensesCount] = await Promise.all([
        pullInventory(),
        pullSales(),
        pullExpenses()
      ]);

      // Update last sync timestamp
      await setMeta(LAST_SYNC_KEY, Date.now());

      const totalCount = inventoryCount + salesCount + expensesCount;
      
      if (showToast && totalCount > 0) {
        toast.success(`Synced ${totalCount} records from server`);
      }

      console.log('Pull sync completed:', { inventoryCount, salesCount, expensesCount });

      return {
        success: true,
        inventoryCount,
        salesCount,
        expensesCount
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Pull sync failed:', errorMessage);
      
      if (showToast) {
        toast.error('Failed to sync data from server');
      }

      return {
        success: false,
        inventoryCount: 0,
        salesCount: 0,
        expensesCount: 0,
        error: errorMessage
      };
    }
  }, [pullInventory, pullSales, pullExpenses]);

  // Get last sync time
  const getLastSyncTime = useCallback(async (): Promise<number | null> => {
    try {
      const lastSync = await getMeta<number>(LAST_SYNC_KEY);
      return lastSync || null;
    } catch {
      return null;
    }
  }, []);

  // Check if local cache has data
  const hasLocalCache = useCallback(async (): Promise<boolean> => {
    try {
      const inventory = await getAll(STORES.INVENTORY);
      return inventory.length > 0;
    } catch {
      return false;
    }
  }, []);

  return {
    pullInventory,
    pullSales,
    pullExpenses,
    pullAllData,
    getLastSyncTime,
    hasLocalCache
  };
}
