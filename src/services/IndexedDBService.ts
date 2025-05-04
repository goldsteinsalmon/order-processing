
import { v4 as uuidv4 } from "uuid";

// Define database structure
const DB_NAME = 'foodOrderSystem';
const DB_VERSION = 1;
const STORES = {
  customers: 'customers',
  products: 'products',
  orders: 'orders',
  completedOrders: 'completedOrders',
  standingOrders: 'standingOrders',
  returns: 'returns',
  complaints: 'complaints',
  missingItems: 'missingItems',
  users: 'users',
  pickers: 'pickers',
  batchUsages: 'batchUsages',
  syncInfo: 'syncInfo'
};

// Define a common interface for database operations
export interface DBService {
  getAll<T>(storeName: string): Promise<T[]>;
  getById<T>(storeName: string, id: string): Promise<T | undefined>;
  save<T extends { id: string }>(storeName: string, data: T): Promise<T>;
  saveAll<T extends { id: string }>(storeName: string, data: T[]): Promise<T[]>;
  delete(storeName: string, id: string): Promise<void>;
  clear(storeName: string): Promise<void>;
}

// Sync metadata type
export interface SyncInfo {
  id: string;
  lastSynced: string;
  clientId: string;
  version: number;
}

class IndexedDBService implements DBService {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;
  private clientId: string;

  constructor() {
    this.clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', this.clientId);
    this.dbReady = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("Database initialized successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores with indices
        if (!db.objectStoreNames.contains(STORES.customers)) {
          const customerStore = db.createObjectStore(STORES.customers, { keyPath: "id" });
          customerStore.createIndex("name", "name", { unique: false });
          customerStore.createIndex("email", "email", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.products)) {
          const productStore = db.createObjectStore(STORES.products, { keyPath: "id" });
          productStore.createIndex("name", "name", { unique: false });
          productStore.createIndex("sku", "sku", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.orders)) {
          const orderStore = db.createObjectStore(STORES.orders, { keyPath: "id" });
          orderStore.createIndex("customerId", "customerId", { unique: false });
          orderStore.createIndex("status", "status", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.completedOrders)) {
          const completedOrderStore = db.createObjectStore(STORES.completedOrders, { keyPath: "id" });
          completedOrderStore.createIndex("customerId", "customerId", { unique: false });
          completedOrderStore.createIndex("orderDate", "orderDate", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.standingOrders)) {
          db.createObjectStore(STORES.standingOrders, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.returns)) {
          db.createObjectStore(STORES.returns, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.complaints)) {
          db.createObjectStore(STORES.complaints, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.missingItems)) {
          db.createObjectStore(STORES.missingItems, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.users)) {
          db.createObjectStore(STORES.users, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.pickers)) {
          db.createObjectStore(STORES.pickers, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.batchUsages)) {
          db.createObjectStore(STORES.batchUsages, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.syncInfo)) {
          db.createObjectStore(STORES.syncInfo, { keyPath: "id" });
        }
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = (event) => {
        console.error(`Error getting all from ${storeName}:`, event);
        reject(`Error getting all from ${storeName}`);
      };
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as T);
      };

      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event);
        reject(`Error getting item from ${storeName}`);
      };
    });
  }

  async save<T extends { id: string }>(storeName: string, data: T): Promise<T> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve(data);
      };

      request.onerror = (event) => {
        console.error(`Error saving to ${storeName}:`, event);
        reject(`Error saving to ${storeName}`);
      };
    });
  }

  async saveAll<T extends { id: string }>(storeName: string, data: T[]): Promise<T[]> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      
      let completed = 0;
      let hasError = false;

      transaction.oncomplete = () => {
        if (!hasError) {
          resolve(data);
        }
      };

      transaction.onerror = (event) => {
        console.error(`Error in batch save to ${storeName}:`, event);
        hasError = true;
        reject(`Error in batch save to ${storeName}`);
      };

      data.forEach((item) => {
        store.put(item);
      });
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error deleting from ${storeName}:`, event);
        reject(`Error deleting from ${storeName}`);
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error clearing ${storeName}:`, event);
        reject(`Error clearing ${storeName}`);
      };
    });
  }

  // Get current client ID
  getClientId(): string {
    return this.clientId;
  }

  // Update sync information
  async updateSyncInfo(syncInfo: Partial<SyncInfo>): Promise<SyncInfo> {
    const db = await this.dbReady;
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(STORES.syncInfo, "readwrite");
      const store = transaction.objectStore(STORES.syncInfo);
      const request = store.get('sync-metadata');

      request.onsuccess = async () => {
        let currentInfo: SyncInfo;
        
        if (request.result) {
          currentInfo = {
            ...request.result,
            ...syncInfo,
            lastSynced: new Date().toISOString()
          };
        } else {
          currentInfo = {
            id: 'sync-metadata',
            lastSynced: new Date().toISOString(),
            clientId: this.clientId,
            version: 1,
            ...syncInfo
          };
        }

        try {
          await this.save(STORES.syncInfo, currentInfo);
          resolve(currentInfo);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = (event) => {
        console.error(`Error getting sync info:`, event);
        reject(`Error getting sync info`);
      };
    });
  }

  async getSyncInfo(): Promise<SyncInfo | undefined> {
    return this.getById<SyncInfo>(STORES.syncInfo, 'sync-metadata');
  }
}

// Export a singleton instance
export const dbService = new IndexedDBService();
