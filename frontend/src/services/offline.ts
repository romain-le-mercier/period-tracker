import { Period } from '@/types';

const OFFLINE_QUEUE_KEY = 'period-tracker-offline-queue';
const PERIODS_CACHE_KEY = 'period-tracker-periods-cache';

export interface OfflineAction {
  id: string;
  type: 'CREATE_PERIOD' | 'UPDATE_PERIOD' | 'DELETE_PERIOD';
  data: any;
  timestamp: string;
}

export class OfflineService {
  // Queue management
  static getQueue(): OfflineAction[] {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    const newAction: OfflineAction = {
      ...action,
      id: `offline-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };
    queue.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return newAction;
  }

  static removeFromQueue(id: string) {
    const queue = this.getQueue().filter(action => action.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  static clearQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // Period cache management
  static getCachedPeriods(): Period[] {
    const stored = localStorage.getItem(PERIODS_CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static cachePeriods(periods: Period[]) {
    localStorage.setItem(PERIODS_CACHE_KEY, JSON.stringify(periods));
  }

  static addPeriodToCache(period: Period) {
    const periods = this.getCachedPeriods();
    const index = periods.findIndex(p => p.id === period.id);
    
    if (index >= 0) {
      periods[index] = period;
    } else {
      periods.push(period);
    }
    
    this.cachePeriods(periods);
  }

  static updatePeriodInCache(id: string, updates: Partial<Period>) {
    const periods = this.getCachedPeriods();
    const index = periods.findIndex(p => p.id === id);
    
    if (index >= 0) {
      periods[index] = { ...periods[index], ...updates };
      this.cachePeriods(periods);
    }
  }

  static deletePeriodFromCache(id: string) {
    const periods = this.getCachedPeriods().filter(p => p.id !== id);
    this.cachePeriods(periods);
  }

  // Create offline period with temporary ID
  static createOfflinePeriod(data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: string;
    symptoms?: string[];
    notes?: string;
  }): Period {
    const tempPeriod: Period = {
      id: `temp-${Date.now()}`,
      startDate: data.startDate,
      endDate: data.endDate,
      flowIntensity: data.flowIntensity as any || 'MEDIUM',
      symptoms: data.symptoms || [],
      notes: data.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to cache
    this.addPeriodToCache(tempPeriod);

    // Add to offline queue
    this.addToQueue({
      type: 'CREATE_PERIOD',
      data: { ...data, tempId: tempPeriod.id },
    });

    return tempPeriod;
  }

  // Process offline queue when back online
  static async processQueue(
    apiClient: any,
    onProgress?: (processed: number, total: number) => void
  ) {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    let processed = 0;
    const tempIdMap = new Map<string, string>();

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'CREATE_PERIOD': {
            const { tempId, ...data } = action.data;
            const period = await apiClient.createPeriod(data);
            tempIdMap.set(tempId, period.id);
            
            // Update cache with real ID
            const cached = this.getCachedPeriods();
            const index = cached.findIndex(p => p.id === tempId);
            if (index >= 0) {
              cached[index] = period;
              this.cachePeriods(cached);
            }
            break;
          }
          
          case 'UPDATE_PERIOD': {
            const { id, ...data } = action.data;
            const realId = tempIdMap.get(id) || id;
            await apiClient.updatePeriod(realId, data);
            break;
          }
          
          case 'DELETE_PERIOD': {
            const realId = tempIdMap.get(action.data.id) || action.data.id;
            await apiClient.deletePeriod(realId);
            break;
          }
        }
        
        this.removeFromQueue(action.id);
        processed++;
        onProgress?.(processed, queue.length);
      } catch (error) {
        console.error('Failed to process offline action:', action, error);
        // Keep in queue for retry
      }
    }

    return { processed, total: queue.length };
  }
}