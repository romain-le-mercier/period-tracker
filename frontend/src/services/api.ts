import { Period, Settings, Prediction, FlowIntensity } from '@/types';
import storageService from './storage';
import { cycleCalculator } from './cycleCalculator';
import { predictionEngine } from './predictionEngine';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface PeriodResponse {
  periods: Period[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  constructor() {
    // Initialize storage service
    storageService.init().catch(console.error);
  }

  // Period endpoints
  async createPeriod(data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: string;
    symptoms?: string[];
    notes?: string;
  }): Promise<Period> {
    const period: Period = {
      id: '',
      startDate: data.startDate,
      endDate: data.endDate,
      flowIntensity: (data.flowIntensity as FlowIntensity) || FlowIntensity.MEDIUM,
      symptoms: data.symptoms || [],
      notes: data.notes,
      isActive: !data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedPeriod = await storageService.savePeriod(period);
    
    // Recalculate cycles and predictions after creating a period
    await this.recalculateCyclesAndPredictions();
    
    return savedPeriod;
  }

  async updatePeriod(
    id: string,
    data: Partial<{
      startDate: string;
      endDate: string;
      flowIntensity: string;
      symptoms: string[];
      notes: string;
    }>
  ): Promise<Period> {
    const existingPeriod = await storageService.getPeriod(id);
    if (!existingPeriod) {
      throw new ApiError(404, 'Period not found');
    }

    const updatedPeriod: Period = {
      ...existingPeriod,
      ...data,
      flowIntensity: (data.flowIntensity as FlowIntensity) || existingPeriod.flowIntensity,
      isActive: !data.endDate && !existingPeriod.endDate,
      updatedAt: new Date().toISOString(),
    };

    const savedPeriod = await storageService.savePeriod(updatedPeriod);
    
    // Recalculate cycles and predictions after updating a period
    await this.recalculateCyclesAndPredictions();
    
    return savedPeriod;
  }

  async deletePeriod(id: string): Promise<void> {
    await storageService.deletePeriod(id);
    
    // Recalculate cycles and predictions after deleting a period
    await this.recalculateCyclesAndPredictions();
  }

  async getPeriods(options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PeriodResponse> {
    const allPeriods = await storageService.getAllPeriods();
    
    // Filter by date range if provided
    let filteredPeriods = allPeriods;
    if (options?.startDate || options?.endDate) {
      filteredPeriods = allPeriods.filter(period => {
        const periodStart = new Date(period.startDate);
        if (options.startDate && periodStart < new Date(options.startDate)) return false;
        if (options.endDate && periodStart > new Date(options.endDate)) return false;
        return true;
      });
    }
    
    // Sort by start date descending
    filteredPeriods.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedPeriods = filteredPeriods.slice(start, start + limit);
    
    return {
      periods: paginatedPeriods,
      pagination: {
        page,
        limit,
        total: filteredPeriods.length,
        totalPages: Math.ceil(filteredPeriods.length / limit),
      },
    };
  }

  async getCurrentPeriod(): Promise<Period | null> {
    return storageService.getActivePeriod();
  }

  // Prediction endpoints
  async getPredictions(): Promise<Prediction[]> {
    return storageService.getAllPredictions();
  }

  async generatePredictions(): Promise<Prediction[]> {
    const periods = await storageService.getAllPeriods();
    const settings = await storageService.getSettings();
    
    if (!settings.enablePredictions || periods.length === 0) {
      return [];
    }
    
    // Clear all existing predictions first to avoid overlapping
    await storageService.clearAllPredictions();
    
    // Calculate new predictions using prediction engine
    const predictions = await predictionEngine.generatePredictions(periods, settings);
    
    // Save new predictions
    for (const prediction of predictions) {
      await storageService.savePrediction(prediction);
    }
    
    return predictions;
  }

  // Settings endpoints
  async getSettings(): Promise<Settings> {
    return storageService.getSettings();
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await storageService.getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };
    return storageService.saveSettings(updatedSettings);
  }

  // Utility methods
  private async recalculateCyclesAndPredictions(): Promise<void> {
    const periods = await storageService.getAllPeriods();
    const settings = await storageService.getSettings();
    
    // Recalculate cycles
    const cycles = cycleCalculator.calculateCycles(periods);
    for (const cycle of cycles) {
      await storageService.saveCycle(cycle);
    }
    
    // Generate new predictions
    if (settings.enablePredictions) {
      await this.generatePredictions();
    }
  }

  // Data management
  async exportData(): Promise<any> {
    return storageService.exportData();
  }

  async importData(data: any): Promise<void> {
    await storageService.importData(data);
    await this.recalculateCyclesAndPredictions();
  }

  async clearAllData(): Promise<void> {
    await storageService.clearAllData();
  }
}

export const apiClient = new ApiClient();
export { ApiError };