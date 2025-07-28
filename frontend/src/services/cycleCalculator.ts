import { Period, Cycle } from '../types';

class CycleCalculator {
  calculateCycles(periods: Period[]): Cycle[] {
    if (periods.length === 0) return [];

    // Sort periods by start date
    const sortedPeriods = [...periods].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const cycles: Cycle[] = [];
    
    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      const currentPeriod = sortedPeriods[i];
      const nextPeriod = sortedPeriods[i + 1];
      
      const cycleStart = new Date(currentPeriod.startDate);
      const cycleEnd = new Date(nextPeriod.startDate);
      const cycleLength = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate period length
      let periodLength = 5; // Default
      if (currentPeriod.endDate) {
        const periodEnd = new Date(currentPeriod.endDate);
        const periodStart = new Date(currentPeriod.startDate);
        periodLength = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      // Calculate ovulation date (typically 14 days before next period)
      const ovulationDate = new Date(cycleEnd);
      ovulationDate.setDate(ovulationDate.getDate() - 14);
      
      const cycle: Cycle = {
        id: `cycle-${currentPeriod.id}-${nextPeriod.id}`,
        startDate: currentPeriod.startDate,
        endDate: new Date(new Date(nextPeriod.startDate).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        cycleLength,
        periodLength,
        ovulationDate: ovulationDate.toISOString(),
        lutealPhaseLength: 14, // Standard luteal phase
        isComplete: true,
        isRegular: cycleLength >= 21 && cycleLength <= 35, // Normal cycle range
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      cycles.push(cycle);
    }
    
    // Handle the current incomplete cycle if exists
    if (sortedPeriods.length > 0) {
      const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
      const today = new Date();
      const daysSinceLastPeriod = Math.round((today.getTime() - new Date(lastPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Only create incomplete cycle if it's been less than 45 days (reasonable max cycle length)
      if (daysSinceLastPeriod < 45) {
        let periodLength = 5; // Default
        if (lastPeriod.endDate) {
          const periodEnd = new Date(lastPeriod.endDate);
          const periodStart = new Date(lastPeriod.startDate);
          periodLength = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        
        const incompleteCycle: Cycle = {
          id: `cycle-${lastPeriod.id}-current`,
          startDate: lastPeriod.startDate,
          endDate: undefined,
          cycleLength: undefined,
          periodLength,
          ovulationDate: undefined,
          lutealPhaseLength: undefined,
          isComplete: false,
          isRegular: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        cycles.push(incompleteCycle);
      }
    }
    
    return cycles;
  }
  
  getAverageCycleLength(cycles: Cycle[]): number {
    const completeCycles = cycles.filter(c => c.isComplete && c.cycleLength);
    if (completeCycles.length === 0) return 28; // Default cycle length
    
    const sum = completeCycles.reduce((acc, cycle) => acc + (cycle.cycleLength || 0), 0);
    return Math.round(sum / completeCycles.length);
  }
  
  getAveragePeriodLength(cycles: Cycle[]): number {
    const cyclesWithPeriodLength = cycles.filter(c => c.periodLength);
    if (cyclesWithPeriodLength.length === 0) return 5; // Default period length
    
    const sum = cyclesWithPeriodLength.reduce((acc, cycle) => acc + (cycle.periodLength || 0), 0);
    return Math.round(sum / cyclesWithPeriodLength.length);
  }
  
  getCycleRegularity(cycles: Cycle[]): number {
    const completeCycles = cycles.filter(c => c.isComplete && c.cycleLength);
    if (completeCycles.length < 2) return 0;
    
    const lengths = completeCycles.map(c => c.cycleLength || 0);
    const avgLength = this.getAverageCycleLength(completeCycles);
    
    // Calculate standard deviation
    const squaredDiffs = lengths.map(length => Math.pow(length - avgLength, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    // Convert to regularity score (0-100)
    // Cycles within 2 days of average are considered regular
    const regularityScore = Math.max(0, 100 - (stdDev * 20));
    
    return Math.round(regularityScore);
  }
}

export const cycleCalculator = new CycleCalculator();