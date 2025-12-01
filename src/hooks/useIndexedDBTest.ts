import { useCallback } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { toast } from 'sonner';

// Test hook to verify IndexedDB operations
export function useIndexedDBTest() {
  const db = useIndexedDB();

  const runTests = useCallback(async () => {
    if (!db.isReady) {
      toast.error('IndexedDB not ready');
      return { success: false, message: 'IndexedDB not ready' };
    }

    const results: string[] = [];

    try {
      // Test 1: Write inventory item
      const testInventory = {
        id: 99999,
        'Item Description': 'Test Item (Delete Me)',
        Price: 100,
        Quantity: 10,
        Total: 1000,
        location: 'Test Location'
      };
      await db.saveInventoryItem(testInventory);
      results.push('✓ Write inventory item');

      // Test 2: Read inventory
      const inventory = await db.getInventory();
      const found = inventory.find((i: any) => i.id === 99999);
      if (found) {
        results.push('✓ Read inventory item');
      } else {
        throw new Error('Could not read inventory item');
      }

      // Test 3: Read by location
      const locationItems = await db.getInventory('Test Location');
      if (locationItems.length > 0) {
        results.push('✓ Read by location index');
      } else {
        throw new Error('Could not read by location');
      }

      // Test 4: Write sale
      const testSale = {
        id: 99999,
        item_id: 1,
        quantity: 2,
        sale_price: 150,
        total_amount: 300,
        sale_date: new Date().toISOString(),
        user_id: 'test-user'
      };
      await db.saveSale(testSale);
      results.push('✓ Write sale');

      // Test 5: Read sales
      const sales = await db.getSales();
      if (sales.find((s: any) => s.id === 99999)) {
        results.push('✓ Read sale');
      } else {
        throw new Error('Could not read sale');
      }

      // Test 6: Write expense
      const testExpense = {
        id: 99999,
        description: 'Test Expense (Delete Me)',
        amount: 50,
        category: 'Test',
        location: 'Test Location',
        expense_date: new Date().toISOString(),
        user_id: 'test-user'
      };
      await db.saveExpense(testExpense);
      results.push('✓ Write expense');

      // Test 7: Read expenses
      const expenses = await db.getExpenses();
      if (expenses.find((e: any) => e.id === 99999)) {
        results.push('✓ Read expense');
      } else {
        throw new Error('Could not read expense');
      }

      // Cleanup: Delete test data
      await db.deleteInventoryItem(99999);
      results.push('✓ Delete test data');

      const message = results.join('\n');
      console.log('IndexedDB Test Results:\n' + message);
      toast.success('All IndexedDB tests passed!');
      
      return { success: true, results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`✗ Failed: ${errorMessage}`);
      console.error('IndexedDB Test Failed:', results);
      toast.error(`IndexedDB test failed: ${errorMessage}`);
      
      return { success: false, results, error: errorMessage };
    }
  }, [db]);

  return { runTests, isReady: db.isReady };
}
