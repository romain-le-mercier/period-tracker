import { PrismaClient, Period, Prediction, PredictionType } from '@prisma/client';
import { addDays, differenceInDays } from 'date-fns';

interface CycleAnalysis {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleVariability: number;
  dataPoints: number;
  cycleLengths: number[];
  periodLengths: number[];
}

interface PredictionWithConfidence extends Prediction {
  confidence: number;
}

export class PredictionService {
  constructor(private prisma: PrismaClient) {}

  async generatePredictions(userId: string): Promise<PredictionWithConfidence[]> {
    const periods = await this.prisma.period.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });

    if (periods.length < 2) {
      return this.generateDefaultPredictions(userId, periods[0]);
    }

    const analysis = this.analyzeCycles(periods);
    const predictions: PredictionWithConfidence[] = [];

    const lastPeriod = periods[periods.length - 1];
    const nextPeriodDate = addDays(
      new Date(lastPeriod.startDate),
      Math.round(analysis.averageCycleLength)
    );

    predictions.push({
      id: '',
      userId,
      type: PredictionType.PERIOD,
      startDate: nextPeriodDate,
      endDate: addDays(nextPeriodDate, Math.round(analysis.averagePeriodLength) - 1),
      confidence: this.calculateConfidence(analysis),
      metadata: {
        basedOnCycles: analysis.dataPoints,
        averageCycleLength: analysis.averageCycleLength,
        cycleVariability: analysis.cycleVariability,
      },
      algorithm: 'weighted_average',
      basedOnCycles: analysis.dataPoints,
      actualDate: null,
      accuracyDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ovulationDate = addDays(nextPeriodDate, -14);
    predictions.push({
      id: '',
      userId,
      type: PredictionType.OVULATION,
      startDate: ovulationDate,
      endDate: ovulationDate,
      confidence: this.calculateOvulationConfidence(analysis),
      metadata: {
        method: 'calendar',
        dayFromNextPeriod: -14,
      },
      algorithm: 'calendar',
      basedOnCycles: analysis.dataPoints,
      actualDate: null,
      accuracyDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, 1);
    predictions.push({
      id: '',
      userId,
      type: PredictionType.FERTILE_WINDOW,
      startDate: fertileStart,
      endDate: fertileEnd,
      confidence: this.calculateFertileWindowConfidence(analysis),
      metadata: {
        method: 'calendar',
        duration: 7,
      },
      algorithm: 'calendar',
      basedOnCycles: analysis.dataPoints,
      actualDate: null,
      accuracyDays: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (let i = 1; i < 3; i++) {
      const futurePeriod = addDays(
        nextPeriodDate,
        Math.round(analysis.averageCycleLength) * i
      );
      
      predictions.push({
        id: '',
        userId,
        type: PredictionType.PERIOD,
        startDate: futurePeriod,
        endDate: addDays(futurePeriod, Math.round(analysis.averagePeriodLength) - 1),
        confidence: Math.max(30, this.calculateConfidence(analysis) - (i * 20)),
        metadata: {
          basedOnCycles: analysis.dataPoints,
          monthsAhead: i + 1,
        },
        algorithm: 'weighted_average',
        basedOnCycles: analysis.dataPoints,
        actualDate: null,
        accuracyDays: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return predictions;
  }

  private analyzeCycles(periods: Period[]): CycleAnalysis {
    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];

    // Include NO_PERIOD entries in cycle calculations
    for (let i = 1; i < periods.length; i++) {
      const cycleLength = differenceInDays(
        new Date(periods[i].startDate),
        new Date(periods[i - 1].startDate)
      );
      
      if (cycleLength > 20 && cycleLength < 45) {
        cycleLengths.push(cycleLength);
      }
    }

    // Exclude NO_PERIOD entries from period length calculations
    for (const period of periods) {
      if (period.endDate && period.flowIntensity !== 'NO_PERIOD') {
        const periodLength = differenceInDays(
          new Date(period.endDate),
          new Date(period.startDate)
        ) + 1;
        
        if (periodLength > 0 && periodLength < 15) {
          periodLengths.push(periodLength);
        }
      }
    }

    const averageCycleLength = cycleLengths.length > 0
      ? cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length
      : 28;

    const averagePeriodLength = periodLengths.length > 0
      ? periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
      : 5;

    const cycleVariability = this.calculateVariability(cycleLengths);

    return {
      averageCycleLength,
      averagePeriodLength,
      cycleVariability,
      dataPoints: cycleLengths.length,
      cycleLengths,
      periodLengths,
    };
  }

  private calculateVariability(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev / mean) * 100;
  }

  private calculateConfidence(analysis: CycleAnalysis): number {
    let confidence = 50;

    if (analysis.dataPoints >= 6) confidence += 30;
    else if (analysis.dataPoints >= 3) confidence += 20;
    else if (analysis.dataPoints >= 2) confidence += 10;

    if (analysis.cycleVariability < 10) confidence += 15;
    else if (analysis.cycleVariability < 20) confidence += 10;
    else if (analysis.cycleVariability < 30) confidence += 5;
    else confidence -= 10;

    return Math.min(95, Math.max(30, confidence));
  }

  private calculateOvulationConfidence(analysis: CycleAnalysis): number {
    let confidence = this.calculateConfidence(analysis);
    
    if (analysis.cycleVariability > 20) {
      confidence *= 0.7;
    }

    return Math.max(25, confidence);
  }

  private calculateFertileWindowConfidence(analysis: CycleAnalysis): number {
    return Math.max(40, this.calculateOvulationConfidence(analysis) * 1.2);
  }

  private generateDefaultPredictions(
    userId: string,
    lastPeriod?: Period
  ): PredictionWithConfidence[] {
    const baseDate = lastPeriod ? new Date(lastPeriod.startDate) : new Date();
    const nextPeriod = addDays(baseDate, 28);

    return [
      {
        id: '',
        userId,
        type: PredictionType.PERIOD,
        startDate: nextPeriod,
        endDate: addDays(nextPeriod, 4),
        confidence: 30,
        metadata: {
          basedOnCycles: 0,
          defaultPrediction: true,
        },
        algorithm: 'default',
        basedOnCycles: 0,
        actualDate: null,
        accuracyDays: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '',
        userId,
        type: PredictionType.OVULATION,
        startDate: addDays(nextPeriod, -14),
        endDate: addDays(nextPeriod, -14),
        confidence: 25,
        metadata: {
          method: 'calendar',
          defaultPrediction: true,
        },
        algorithm: 'calendar',
        basedOnCycles: 0,
        actualDate: null,
        accuracyDays: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '',
        userId,
        type: PredictionType.FERTILE_WINDOW,
        startDate: addDays(nextPeriod, -19),
        endDate: addDays(nextPeriod, -13),
        confidence: 40,
        metadata: {
          method: 'calendar',
          defaultPrediction: true,
        },
        algorithm: 'calendar',
        basedOnCycles: 0,
        actualDate: null,
        accuracyDays: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async savePredictions(predictions: PredictionWithConfidence[]): Promise<void> {
    for (const prediction of predictions) {
      const { id, confidence, ...predictionData } = prediction;
      
      await this.prisma.prediction.upsert({
        where: {
          userId_type_startDate: {
            userId: predictionData.userId,
            type: predictionData.type,
            startDate: predictionData.startDate,
          },
        },
        update: {
          endDate: predictionData.endDate,
          confidence,
          metadata: predictionData.metadata as any,
          algorithm: predictionData.algorithm,
          basedOnCycles: predictionData.basedOnCycles,
          updatedAt: new Date(),
        },
        create: {
          userId: predictionData.userId,
          type: predictionData.type,
          startDate: predictionData.startDate,
          endDate: predictionData.endDate,
          confidence,
          metadata: predictionData.metadata as any,
          algorithm: predictionData.algorithm,
          basedOnCycles: predictionData.basedOnCycles,
        },
      });
    }
  }

  async getPredictions(userId: string): Promise<Prediction[]> {
    return this.prisma.prediction.findMany({
      where: {
        userId,
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async updatePredictionsForUser(userId: string): Promise<void> {
    await this.prisma.prediction.deleteMany({
      where: {
        userId,
        startDate: {
          gte: new Date(),
        },
      },
    });

    const predictions = await this.generatePredictions(userId);
    await this.savePredictions(predictions);
  }
}