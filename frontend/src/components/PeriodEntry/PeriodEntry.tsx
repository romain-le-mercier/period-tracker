import { useState } from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { FlowIntensity } from '@/types';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api';
import { OfflineService } from '@/services/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/components/ui/Toaster';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

interface PeriodEntryProps {
  onPeriodLogged?: () => void;
  currentPeriod?: {
    id: string;
    startDate: string;
    flowIntensity?: FlowIntensity;
    symptoms?: string[];
    notes?: string;
  } | null;
}

export function PeriodEntry({ onPeriodLogged, currentPeriod }: PeriodEntryProps) {
  const { t } = useTranslation();
  const { formatLong } = useLocalizedDate();
  
  const FLOW_INTENSITIES: { value: FlowIntensity; label: string; color: string }[] = [
    { value: 'SPOTTING', label: t('flowIntensity.spotting'), color: 'bg-period-light' },
    { value: 'LIGHT', label: t('flowIntensity.light'), color: 'bg-period-predicted' },
    { value: 'MEDIUM', label: t('flowIntensity.medium'), color: 'bg-period-active' },
    { value: 'HEAVY', label: t('flowIntensity.heavy'), color: 'bg-red-600' },
    { value: 'NO_PERIOD', label: t('flowIntensity.noPeriod'), color: 'bg-gray-300' },
  ];

  const COMMON_SYMPTOMS = [
    { key: 'cramps', label: t('symptoms.cramps'), icon: '⚡' },
    { key: 'headache', label: t('symptoms.headache'), icon: '🤯' },
    { key: 'fatigue', label: t('symptoms.fatigue'), icon: '😴' },
    { key: 'moodSwings', label: t('symptoms.moodSwings'), icon: '🦖' },
    { key: 'bloating', label: t('symptoms.bloating'), icon: '🎈' },
    { key: 'backPain', label: t('symptoms.backPain'), icon: '🪑' },
    { key: 'breastTenderness', label: t('symptoms.breastTenderness'), icon: '🌸' },
    { key: 'nausea', label: t('symptoms.nausea'), icon: '🌊' },
  ];
  const [isLogging, setIsLogging] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>('MEDIUM');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();

  const handleStartPeriod = async () => {
    // Validate date
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      toast.error(t('messages.startDateFuture'));
      return;
    }
    
    setLoading(true);
    try {
      const periodData: any = {
        startDate: new Date(startDate).toISOString(),
        flowIntensity,
        symptoms: selectedSymptoms,
        notes: notes || undefined,
      };
      
      // For NO_PERIOD, set endDate same as startDate
      if (flowIntensity === 'NO_PERIOD') {
        periodData.endDate = periodData.startDate;
      }

      if (isOnline) {
        await apiClient.createPeriod(periodData);
        toast.success(t('messages.periodLogged'));
      } else {
        OfflineService.createOfflinePeriod(periodData);
        toast.info(t('messages.savedOffline'));
      }
      
      setIsLogging(false);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setFlowIntensity('MEDIUM');
      setSelectedSymptoms([]);
      setNotes('');
      onPeriodLogged?.();
    } catch (error) {
      console.error('Failed to log period:', error);
      toast.error(t('messages.failedToLog'));
    } finally {
      setLoading(false);
    }
  };

  const handleEndPeriod = async () => {
    if (!currentPeriod) return;
    
    setLoading(true);
    try {
      await apiClient.updatePeriod(currentPeriod.id, {
        endDate: new Date(endDate).toISOString(),
        flowIntensity,
        symptoms: selectedSymptoms,
        notes: notes || undefined,
      });
      setIsEnding(false);
      setEndDate(format(new Date(), 'yyyy-MM-dd'));
      setFlowIntensity('MEDIUM');
      setSelectedSymptoms([]);
      setNotes('');
      onPeriodLogged?.();
    } catch (error) {
      console.error('Failed to end period:', error);
      toast.error(t('messages.failedToEnd'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptomKey: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomKey)
        ? prev.filter((s) => s !== symptomKey)
        : [...prev, symptomKey]
    );
  };

  if (!isLogging && !currentPeriod) {
    return (
      <div className="card text-center">
        <h3 className="text-heading-3 mb-4">{t('periodEntry.howFeeling')}</h3>
        <div className="space-y-3">
          <Button size="lg" onClick={() => setIsLogging(true)}>
            {t('periodEntry.logPeriodStart')}
          </Button>
          <p className="text-sm text-text-secondary">
            {t('periodEntry.expectedButNoCome')}
          </p>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => {
              setIsLogging(true);
              setFlowIntensity('NO_PERIOD');
            }}
          >
            {t('periodEntry.logNoPeriod')}
          </Button>
        </div>
      </div>
    );
  }

  if (currentPeriod && !isLogging) {
    if (isEnding) {
      return (
        <div className="card">
          <h3 className="text-heading-3 mb-6">{t('periodEntry.endPeriod')}</h3>
          
          <div className="mb-4">
            <p className="text-sm text-text-secondary">{t('periodEntry.periodStarted')}</p>
            <p className="text-lg font-medium text-period-active">
              {formatLong(currentPeriod.startDate)}
            </p>
          </div>
          
          {/* End Date */}
          <div className="mb-6">
            <label htmlFor="endDate" className="block text-sm font-medium text-text-primary mb-2">
              {t('periodEntry.periodEndDate')}
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={format(new Date(currentPeriod.startDate), 'yyyy-MM-dd')}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="input"
            />
          </div>
          
          {/* Flow Intensity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              {t('periodEntry.overallFlow')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLOW_INTENSITIES.map((intensity) => (
                <button
                  key={intensity.value}
                  onClick={() => setFlowIntensity(intensity.value)}
                  className={clsx(
                    'p-3 rounded-lg border-2 transition-all',
                    flowIntensity === intensity.value
                      ? 'border-sage-400 bg-sage-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={`w-4 h-4 ${intensity.color} rounded-full mx-auto mb-1`} />
                  <span className="text-sm">{intensity.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              {t('periodEntry.symptomsExperienced')}
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom.key}
                  onClick={() => toggleSymptom(symptom.key)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2',
                    selectedSymptoms.includes(symptom.key)
                      ? 'bg-sage-400 text-white'
                      : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                  )}
                >
                  <span className="text-lg">{symptom.icon}</span>
                  <span>{symptom.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="endNotes" className="block text-sm font-medium text-text-primary mb-2">
              {t('periodEntry.notesOptional')}
            </label>
            <textarea
              id="endNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder={t('periodEntry.additionalNotes')}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEnding(false);
                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                setFlowIntensity('MEDIUM');
                setSelectedSymptoms([]);
                setNotes('');
              }}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEndPeriod} disabled={loading} className="flex-1">
              {loading ? t('periodEntry.ending') : t('periodEntry.endPeriodButton')}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card">
        <div className="text-center mb-4">
          <p className="text-text-secondary mb-2">{t('periodEntry.periodStarted')}</p>
          <p className="text-heading-3 text-period-active">
            {formatLong(currentPeriod.startDate)}
          </p>
        </div>
        <Button fullWidth onClick={() => {
          setIsEnding(true);
          // Pre-populate fields with existing data if available
          if (currentPeriod.flowIntensity) {
            setFlowIntensity(currentPeriod.flowIntensity);
          }
          if (currentPeriod.symptoms) {
            setSelectedSymptoms(currentPeriod.symptoms);
          }
          if (currentPeriod.notes) {
            setNotes(currentPeriod.notes);
          }
        }}>
          {t('periodEntry.endPeriodButton')}
        </Button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-heading-3 mb-6">{t('periodEntry.logPeriod')}</h3>

      {/* Start Date */}
      <div className="mb-6">
        <label htmlFor="startDate" className="block text-sm font-medium text-text-primary mb-2">
          {t('periodEntry.periodStartDate')}
        </label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="input"
        />
        <p className="text-xs text-text-secondary mt-1">
          {t('periodEntry.backlogNote')}
        </p>
      </div>

      {/* Flow Intensity */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-3">
          {flowIntensity === 'NO_PERIOD' ? t('periodEntry.loggingNoPeriod') : t('periodEntry.flowIntensity')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FLOW_INTENSITIES.map((intensity) => (
            <button
              key={intensity.value}
              onClick={() => setFlowIntensity(intensity.value)}
              className={clsx(
                'p-3 rounded-lg border-2 transition-all',
                flowIntensity === intensity.value
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={`w-4 h-4 ${intensity.color} rounded-full mx-auto mb-1`} />
              <span className="text-sm">{intensity.label}</span>
            </button>
          ))}
        </div>
        {flowIntensity === 'NO_PERIOD' && (
          <p className="text-sm text-text-secondary mt-2">
            {t('periodEntry.noPeriodHelp')}
          </p>
        )}
      </div>

      {/* Symptoms */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-3">
          {t('periodEntry.symptoms')}
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom.key}
              onClick={() => toggleSymptom(symptom.key)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2',
                selectedSymptoms.includes(symptom.key)
                  ? 'bg-sage-400 text-white'
                  : 'bg-gray-100 text-text-primary hover:bg-gray-200'
              )}
            >
              <span className="text-lg">{symptom.icon}</span>
              <span>{symptom.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-2">
          {t('periodEntry.notesOptional')}
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          placeholder={t('periodEntry.additionalNotes')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setIsLogging(false);
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setFlowIntensity('MEDIUM');
            setSelectedSymptoms([]);
            setNotes('');
          }}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button onClick={handleStartPeriod} disabled={loading} className="flex-1">
          {loading ? t('periodEntry.logging') : flowIntensity === 'NO_PERIOD' ? t('periodEntry.logNoPeriod') : t('periodEntry.startPeriod')}
        </Button>
      </div>
    </div>
  );
}