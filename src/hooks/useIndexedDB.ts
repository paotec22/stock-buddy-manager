import { useCallback, useEffect, useState } from 'react';
import {
  initializeDB,
  getAll,
  getByIndex,
  put,
  putMany,
  deleteByKey,
  clearStore,
  STORES,
  type StoreName
} from '@/lib/indexedDB';

export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeDB()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error('Failed to initialize IndexedDB:', err);
        setError(err);
      });
  }, []);

  // Inventory operations
  const getInventory = useCallback(async (location?: string) => {
    if (location) {
      return getByIndex(STORES.INVENTORY, 'location', location);
    }
    return getAll(STORES.INVENTORY);
  }, []);

  const saveInventory = useCallback(async (items: unknown[]) => {
    await putMany(STORES.INVENTORY, items);
  }, []);

  const saveInventoryItem = useCallback(async (item: unknown) => {
    await put(STORES.INVENTORY, item);
  }, []);

  const deleteInventoryItem = useCallback(async (id: number) => {
    await deleteByKey(STORES.INVENTORY, id);
  }, []);

  // Sales operations
  const getSales = useCallback(async () => {
    return getAll(STORES.SALES);
  }, []);

  const saveSales = useCallback(async (items: unknown[]) => {
    await putMany(STORES.SALES, items);
  }, []);

  const saveSale = useCallback(async (sale: unknown) => {
    await put(STORES.SALES, sale);
  }, []);

  // Expenses operations
  const getExpenses = useCallback(async () => {
    return getAll(STORES.EXPENSES);
  }, []);

  const saveExpenses = useCallback(async (items: unknown[]) => {
    await putMany(STORES.EXPENSES, items);
  }, []);

  const saveExpense = useCallback(async (expense: unknown) => {
    await put(STORES.EXPENSES, expense);
  }, []);

  // Clear all cached data
  const clearAllData = useCallback(async () => {
    await Promise.all([
      clearStore(STORES.INVENTORY),
      clearStore(STORES.SALES),
      clearStore(STORES.EXPENSES),
    ]);
  }, []);

  return {
    isReady,
    error,
    // Inventory
    getInventory,
    saveInventory,
    saveInventoryItem,
    deleteInventoryItem,
    // Sales
    getSales,
    saveSales,
    saveSale,
    // Expenses
    getExpenses,
    saveExpenses,
    saveExpense,
    // Utility
    clearAllData,
  };
}
