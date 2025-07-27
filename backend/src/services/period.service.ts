import { PrismaClient, FlowIntensity } from '@prisma/client';
import { addDays, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export class PeriodService {
  async createPeriod(
    userId: string,
    data: {
      startDate: Date;
      endDate?: Date;
      flowIntensity?: FlowIntensity;
      symptoms?: string[];
      notes?: string;
    }
  ) {
    // Check for overlapping periods
    const overlappingPeriod = await prisma.period.findFirst({
      where: {
        userId,
        OR: [
          {
            startDate: {
              lte: data.startDate,
            },
            endDate: {
              gte: data.startDate,
            },
          },
          {
            startDate: {
              lte: data.endDate || data.startDate,
            },
            endDate: {
              gte: data.endDate || data.startDate,
            },
          },
        ],
      },
    });
    
    if (overlappingPeriod) {
      throw new Error('Period dates overlap with existing period');
    }
    
    // Create period
    const period = await prisma.period.create({
      data: {
        ...data,
        userId,
      },
    });
    
    // Update cycle data if period is complete
    if (data.endDate) {
      await this.updateCycleData(userId, period.id);
    }
    
    return period;
  }
  
  async updatePeriod(
    userId: string,
    periodId: string,
    data: Partial<{
      startDate: Date;
      endDate: Date;
      flowIntensity: FlowIntensity;
      symptoms: string[];
      notes: string;
    }>
  ) {
    // Verify period belongs to user
    const period = await prisma.period.findFirst({
      where: {
        id: periodId,
        userId,
      },
    });
    
    if (!period) {
      throw new Error('Period not found');
    }
    
    // Update period
    const updatedPeriod = await prisma.period.update({
      where: { id: periodId },
      data,
    });
    
    // Update cycle data if period is complete
    if (updatedPeriod.endDate) {
      await this.updateCycleData(userId, periodId);
    }
    
    return updatedPeriod;
  }
  
  async deletePeriod(userId: string, periodId: string) {
    // Verify period belongs to user
    const period = await prisma.period.findFirst({
      where: {
        id: periodId,
        userId,
      },
    });
    
    if (!period) {
      throw new Error('Period not found');
    }
    
    await prisma.period.delete({
      where: { id: periodId },
    });
    
    return { success: true };
  }
  
  async getPeriods(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(options.startDate && {
        startDate: {
          gte: options.startDate,
        },
      }),
      ...(options.endDate && {
        startDate: {
          lte: options.endDate,
        },
      }),
    };
    
    const [periods, total] = await Promise.all([
      prisma.period.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          startDate: 'desc',
        },
      }),
      prisma.period.count({ where }),
    ]);
    
    return {
      periods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  async getCurrentPeriod(userId: string) {
    return prisma.period.findFirst({
      where: {
        userId,
        endDate: null,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }
  
  private async updateCycleData(userId: string, periodId: string) {
    // Get the current period and previous period
    const periods = await prisma.period.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      take: 2,
    });
    
    if (periods.length < 2) {
      return; // Need at least 2 periods to calculate cycle
    }
    
    const currentPeriod = periods[0];
    const previousPeriod = periods[1];
    
    if (!currentPeriod.endDate) {
      return; // Current period not complete
    }
    
    // Calculate cycle length
    const cycleLength = differenceInDays(
      currentPeriod.startDate,
      previousPeriod.startDate
    );
    
    // Calculate period length
    const periodLength = differenceInDays(
      currentPeriod.endDate,
      currentPeriod.startDate
    ) + 1;
    
    // Calculate ovulation date (typically 14 days before next period)
    const ovulationDate = addDays(currentPeriod.startDate, cycleLength - 14);
    
    // Create or update cycle
    await prisma.cycle.upsert({
      where: {
        id: currentPeriod.cycleId || 'new',
      },
      create: {
        userId,
        startDate: previousPeriod.startDate,
        endDate: currentPeriod.startDate,
        cycleLength,
        periodLength,
        ovulationDate,
        lutealPhaseLength: 14,
        isComplete: true,
        periods: {
          connect: [
            { id: previousPeriod.id },
            { id: currentPeriod.id },
          ],
        },
      },
      update: {
        cycleLength,
        periodLength,
        ovulationDate,
        endDate: currentPeriod.startDate,
        isComplete: true,
      },
    });
  }
}