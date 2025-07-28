export interface Period {
  id: string;
  startDate: string;
  endDate?: string;
  flowIntensity: FlowIntensity;
  symptoms: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  periodLength?: number;
  ovulationDate?: string;
  lutealPhaseLength?: number;
  isComplete: boolean;
  isRegular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  type: PredictionType;
  startDate: string;
  endDate?: string;
  confidence: number;
  metadata?: any;
  algorithm: string;
  basedOnCycles: number;
  createdAt: string;
  updatedAt: string;
  actualDate?: string;
  accuracyDays?: number;
}

export interface Settings {
  id: string;
  cycleLength: number;
  periodLength: number;
  lutealPhaseLength: number;
  reminderDays: number[];
  enableReminders: boolean;
  enablePredictions: boolean;
  theme: Theme;
  language: string;
  timezone: string;
  privacyMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum FlowIntensity {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  SPOTTING = 'SPOTTING',
  NO_PERIOD = 'NO_PERIOD',
}

export enum PredictionType {
  PERIOD = 'PERIOD',
  OVULATION = 'OVULATION',
  FERTILE_WINDOW = 'FERTILE_WINDOW',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}