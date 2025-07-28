import { Period, Cycle, Prediction, Settings, PredictionType, Theme } from '../types';

const DB_NAME = 'periodTrackerDB';
const DB_VERSION = 1;

interface Database {
  periods: Period;
  cycles: Cycle;
  predictions: Prediction;
  settings: Settings;
}

class LocalStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('periods')) {
          const periodStore = db.createObjectStore('periods', { keyPath: 'id' });
          periodStore.createIndex('startDate', 'startDate');
          periodStore.createIndex('isActive', 'isActive');
        }

        if (!db.objectStoreNames.contains('cycles')) {
          const cycleStore = db.createObjectStore('cycles', { keyPath: 'id' });
          cycleStore.createIndex('startDate', 'startDate');
          cycleStore.createIndex('isComplete', 'isComplete');
        }

        if (!db.objectStoreNames.contains('predictions')) {
          const predictionStore = db.createObjectStore('predictions', { keyPath: 'id' });
          predictionStore.createIndex('type', 'type');
          predictionStore.createIndex('startDate', 'startDate');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Initialize default settings
        this.initializeDefaultSettings();
      };
    });
  }

  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings: Settings = {
      id: 'default',
      cycleLength: 28,
      periodLength: 5,
      lutealPhaseLength: 14,
      reminderDays: [3, 1],
      enableReminders: true,
      enablePredictions: true,
      theme: Theme.LIGHT,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      privacyMode: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveSettings(defaultSettings);
  }

  private getStore(storeName: keyof Database, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Period methods
  async savePeriod(period: Period): Promise<Period> {
    const store = this.getStore('periods', 'readwrite');
    const now = new Date().toISOString();
    
    const periodToSave = {
      ...period,
      id: period.id || this.generateId(),
      createdAt: period.createdAt || now,
      updatedAt: now,
    };

    await store.put(periodToSave);
    return periodToSave;
  }

  async getPeriod(id: string): Promise<Period | null> {
    const store = this.getStore('periods');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPeriods(): Promise<Period[]> {
    const store = this.getStore('periods');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getActivePeriod(): Promise<Period | null> {
    const store = this.getStore('periods');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const periods = request.result || [];
        const activePeriod = periods.find((p: Period) => p.isActive);
        resolve(activePeriod || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePeriod(id: string): Promise<void> {
    const store = this.getStore('periods', 'readwrite');
    await store.delete(id);
  }

  // Cycle methods
  async saveCycle(cycle: Cycle): Promise<Cycle> {
    const store = this.getStore('cycles', 'readwrite');
    const now = new Date().toISOString();
    
    const cycleToSave = {
      ...cycle,
      id: cycle.id || this.generateId(),
      createdAt: cycle.createdAt || now,
      updatedAt: now,
    };

    await store.put(cycleToSave);
    return cycleToSave;
  }

  async getCycle(id: string): Promise<Cycle | null> {
    const store = this.getStore('cycles');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCycles(): Promise<Cycle[]> {
    const store = this.getStore('cycles');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getCompleteCycles(): Promise<Cycle[]> {
    const store = this.getStore('cycles');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cycles = request.result || [];
        const completeCycles = cycles.filter((c: Cycle) => c.isComplete);
        resolve(completeCycles);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Prediction methods
  async savePrediction(prediction: Prediction): Promise<Prediction> {
    const store = this.getStore('predictions', 'readwrite');
    const now = new Date().toISOString();
    
    const predictionToSave = {
      ...prediction,
      id: prediction.id || this.generateId(),
      createdAt: prediction.createdAt || now,
      updatedAt: now,
    };

    await store.put(predictionToSave);
    return predictionToSave;
  }

  async getPrediction(id: string): Promise<Prediction | null> {
    const store = this.getStore('predictions');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPredictions(): Promise<Prediction[]> {
    const store = this.getStore('predictions');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPredictionsByType(type: PredictionType): Promise<Prediction[]> {
    const store = this.getStore('predictions');
    const index = store.index('type');
    const request = index.getAll(type);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePrediction(id: string): Promise<void> {
    const store = this.getStore('predictions', 'readwrite');
    await store.delete(id);
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    const store = this.getStore('settings');
    const request = store.get('default');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Return default settings if none exist
          this.initializeDefaultSettings().then(() => {
            this.getSettings().then(resolve).catch(reject);
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    const store = this.getStore('settings', 'readwrite');
    const settingsToSave = {
      ...settings,
      id: 'default',
      updatedAt: new Date().toISOString(),
    };
    await store.put(settingsToSave);
    return settingsToSave;
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearAllPredictions(): Promise<void> {
    const store = this.getStore('predictions', 'readwrite');
    await store.clear();
  }

  async clearAllData(): Promise<void> {
    const stores: Array<keyof Database> = ['periods', 'cycles', 'predictions', 'settings'];
    
    for (const storeName of stores) {
      const store = this.getStore(storeName, 'readwrite');
      await store.clear();
    }
    
    // Reinitialize default settings
    await this.initializeDefaultSettings();
  }

  async exportData(): Promise<any> {
    const periods = await this.getAllPeriods();
    const cycles = await this.getAllCycles();
    const predictions = await this.getAllPredictions();
    const settings = await this.getSettings();

    return {
      periods,
      cycles,
      predictions,
      settings,
      exportDate: new Date().toISOString(),
      version: DB_VERSION,
    };
  }

  async importData(data: any): Promise<void> {
    // Clear existing data first
    await this.clearAllData();

    // Import periods
    if (data.periods) {
      for (const period of data.periods) {
        await this.savePeriod(period);
      }
    }

    // Import cycles
    if (data.cycles) {
      for (const cycle of data.cycles) {
        await this.saveCycle(cycle);
      }
    }

    // Import predictions
    if (data.predictions) {
      for (const prediction of data.predictions) {
        await this.savePrediction(prediction);
      }
    }

    // Import settings
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
  }
}

// Create singleton instance
const storageService = new LocalStorageService();

// Initialize on first import
storageService.init().catch(console.error);

export default storageService;