// IndexedDB Database Configuration and Utilities

const DB_NAME = 'puido-offline-db';
const DB_VERSION = 1;

// Store names
export const STORES = {
  INVENTORY: 'inventory',
  SALES: 'sales',
  EXPENSES: 'expenses',
  SYNC_QUEUE: 'syncQueue',
  META: 'meta'
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

// Sync operation types
export interface SyncOperation {
  id?: number;
  store: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

// Open database connection
let dbInstance: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Inventory store
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const inventoryStore = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
        inventoryStore.createIndex('location', 'location', { unique: false });
        inventoryStore.createIndex('itemDescription', 'Item Description', { unique: false });
      }

      // Sales store
      if (!db.objectStoreNames.contains(STORES.SALES)) {
        const salesStore = db.createObjectStore(STORES.SALES, { keyPath: 'id' });
        salesStore.createIndex('sale_date', 'sale_date', { unique: false });
        salesStore.createIndex('item_id', 'item_id', { unique: false });
      }

      // Expenses store
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expensesStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expensesStore.createIndex('expense_date', 'expense_date', { unique: false });
        expensesStore.createIndex('location', 'location', { unique: false });
      }

      // Sync queue for offline operations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('store', 'store', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Metadata store (last sync time, etc.)
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }

      console.log('IndexedDB schema created/upgraded');
    };
  });
}

// Generic CRUD operations
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getByKey<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<T>(
  storeName: StoreName, 
  indexName: string, 
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put<T>(storeName: StoreName, data: T): Promise<IDBValidKey> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach(item => store.put(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteByKey(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sync queue operations
export async function addToSyncQueue(operation: Omit<SyncOperation, 'id'>): Promise<void> {
  await put(STORES.SYNC_QUEUE, operation);
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  return getAll<SyncOperation>(STORES.SYNC_QUEUE);
}

export async function removeSyncOperation(id: number): Promise<void> {
  await deleteByKey(STORES.SYNC_QUEUE, id);
}

// Meta operations
export async function setMeta(key: string, value: unknown): Promise<void> {
  await put(STORES.META, { key, value, updatedAt: Date.now() });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const result = await getByKey<{ key: string; value: T }>(STORES.META, key);
  return result?.value;
}

// Initialize database on app start
export async function initializeDB(): Promise<void> {
  await openDB();
  console.log('IndexedDB initialized');
}

// Close database connection
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
