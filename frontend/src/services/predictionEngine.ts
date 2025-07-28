import { Period, Prediction, Settings, PredictionType } from '../types';
import { cycleCalculator } from './cycleCalculator';

class PredictionEngine {
  async generatePredictions(periods: Period[], settings: Settings): Promise<Prediction[]> {
    if (periods.length < 2) {
      // Not enough data for predictions
      return [];
    }

    const cycles = cycleCalculator.calculateCycles(periods);
    const completeCycles = cycles.filter(c => c.isComplete);
    
    if (completeCycles.length === 0) {
      return [];
    }

    const predictions: Prediction[] = [];
    const avgCycleLength = cycleCalculator.getAverageCycleLength(completeCycles);
    const avgPeriodLength = cycleCalculator.getAveragePeriodLength(completeCycles);
    const regularity = cycleCalculator.getCycleRegularity(completeCycles);
    
    // Get the most recent period
    const sortedPeriods = [...periods].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const lastPeriod = sortedPeriods[0];
    const lastPeriodStart = new Date(lastPeriod.startDate);
    
    // Generate predictions for the next 3 cycles
    for (let i = 1; i <= 3; i++) {
      const cycleStartDate = new Date(lastPeriodStart);
      cycleStartDate.setDate(cycleStartDate.getDate() + (avgCycleLength * i));
      
      const cycleEndDate = new Date(cycleStartDate);
      cycleEndDate.setDate(cycleEndDate.getDate() + avgPeriodLength - 1);
      
      // Period prediction
      const periodPrediction: Prediction = {
        id: `pred-period-${i}-${Date.now()}`,
        type: PredictionType.PERIOD,
        startDate: cycleStartDate.toISOString(),
        endDate: cycleEndDate.toISOString(),
        confidence: this.calculateConfidence(regularity, completeCycles.length, i),
        algorithm: 'average_cycle_length',
        basedOnCycles: completeCycles.length,
        metadata: {
          avgCycleLength,
          avgPeriodLength,
          regularity,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      predictions.push(periodPrediction);
      
      // Ovulation prediction (typically 14 days before next period)
      const ovulationDate = new Date(cycleStartDate);
      ovulationDate.setDate(ovulationDate.getDate() - settings.lutealPhaseLength);
      
      const ovulationPrediction: Prediction = {
        id: `pred-ovulation-${i}-${Date.now()}`,
        type: PredictionType.OVULATION,
        startDate: ovulationDate.toISOString(),
        confidence: this.calculateConfidence(regularity, completeCycles.length, i) * 0.9, // Slightly less confident
        algorithm: 'luteal_phase_calculation',
        basedOnCycles: completeCycles.length,
        metadata: {
          lutealPhaseLength: settings.lutealPhaseLength,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      predictions.push(ovulationPrediction);
      
      // Fertile window prediction (5 days before ovulation + ovulation day)
      const fertileWindowStart = new Date(ovulationDate);
      fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
      
      const fertileWindowEnd = new Date(ovulationDate);
      fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);
      
      const fertileWindowPrediction: Prediction = {
        id: `pred-fertile-${i}-${Date.now()}`,
        type: PredictionType.FERTILE_WINDOW,
        startDate: fertileWindowStart.toISOString(),
        endDate: fertileWindowEnd.toISOString(),
        confidence: this.calculateConfidence(regularity, completeCycles.length, i) * 0.85,
        algorithm: 'standard_fertile_window',
        basedOnCycles: completeCycles.length,
        metadata: {
          ovulationDate: ovulationDate.toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      predictions.push(fertileWindowPrediction);
    }
    
    return predictions;
  }
  
  private calculateConfidence(regularity: number, cycleCount: number, futureMonths: number): number {
    // Base confidence from regularity (0-100)
    let confidence = regularity;
    
    // Adjust based on number of cycles tracked
    if (cycleCount < 3) {
      confidence *= 0.6;
    } else if (cycleCount < 6) {
      confidence *= 0.8;
    } else if (cycleCount < 12) {
      confidence *= 0.9;
    }
    
    // Decrease confidence for predictions further in the future
    confidence *= Math.pow(0.95, futureMonths - 1);
    
    // Ensure confidence is between 0 and 100
    return Math.min(100, Math.max(0, Math.round(confidence)));
  }
  
  updatePredictionAccuracy(prediction: Prediction, actualDate: string): Prediction {
    const predictedDate = new Date(prediction.startDate);
    const actual = new Date(actualDate);
    
    const daysDifference = Math.abs(
      Math.round((actual.getTime() - predictedDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    return {
      ...prediction,
      actualDate,
      accuracyDays: daysDifference,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const predictionEngine = new PredictionEngine();