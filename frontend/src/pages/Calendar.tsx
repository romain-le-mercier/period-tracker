import { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/Calendar/Calendar';
import { apiClient } from '@/services/api';
import { Period, Prediction } from '@/types';
import { format } from 'date-fns';
import { OfflineService } from '@/services/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

export function Calendar() {
  const { t } = useTranslation();
  const { formatLong, formatShort, formatMonthYear } = useLocalizedDate();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const SYMPTOM_ICONS: { [key: string]: string } = {
    'cramps': '⚡',
    'headache': '🤯',
    'fatigue': '😴',
    'moodSwings': '🦖',
    'bloating': '🎈',
    'backPain': '🪑',
    'breastTenderness': '🌸',
    'nausea': '🌊',
  };

  const getSymptomIcon = (symptomKey: string) => {
    return SYMPTOM_ICONS[symptomKey] || '💫';
  };

  useEffect(() => {
    fetchData();
  }, [isOnline]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        // Fetch periods
        const periodResponse = await apiClient.getPeriods({ limit: 50 });
        setPeriods(periodResponse.periods);
        
        // Cache periods for offline use
        OfflineService.cachePeriods(periodResponse.periods);
        
        // Fetch predictions
        try {
          const predictionsData = await apiClient.getPredictions();
          console.log('Predictions fetched:', predictionsData);
          setPredictions(predictionsData);
        } catch (error) {
          console.error('Failed to fetch predictions:', error);
          setPredictions([]);
        }
      } else {
        // Use cached data when offline
        const cachedPeriods = OfflineService.getCachedPeriods();
        setPeriods(cachedPeriods);
        setPredictions([]); // Predictions not cached yet
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Fallback to cached data
      const cachedPeriods = OfflineService.getCachedPeriods();
      setPeriods(cachedPeriods);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDateInfo = () => {
    if (!selectedDate) return null;

    const period = periods.find((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : new Date();
      return selectedDate >= start && selectedDate <= end;
    });

    if (period) {
      return {
        type: 'period',
        title: t('calendar.periodDay'),
        description: `${t('calendar.flow')}: ${period.flowIntensity ? t(`flowIntensity.${period.flowIntensity.toLowerCase()}`) : t('calendar.notSpecified')}`,
        symptoms: period.symptoms,
        notes: period.notes,
      };
    }

    const prediction = predictions.find((pred) => {
      const start = new Date(pred.startDate);
      const end = pred.endDate ? new Date(pred.endDate) : start;
      return selectedDate >= start && selectedDate <= end;
    });

    if (prediction) {
      let title = '';
      switch (prediction.type) {
        case 'PERIOD':
          title = t('calendar.predictedPeriod');
          break;
        case 'OVULATION':
          title = t('calendar.ovulationDay');
          break;
        case 'FERTILE_WINDOW':
          title = t('calendar.fertileWindow');
          break;
      }
      
      return {
        type: 'prediction',
        title,
        confidence: prediction.confidence,
        description: `${t('calendar.confidence')}: ${prediction.confidence}%`,
      };
    }

    return null;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-1 text-sage-600">{t('calendar.calendar')}</h1>
        <div className="card animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedInfo = getSelectedDateInfo();

  return (
    <div className="space-y-6">
      <h1 className="text-heading-1 text-sage-600">Calendar</h1>
      
      <CalendarComponent
        periods={periods}
        predictions={predictions}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />

      {selectedDate && (
        <div className="card">
          <h3 className="text-heading-3 mb-4">
            {formatLong(selectedDate)}
          </h3>
          
          {selectedInfo ? (
            <div>
              <p className="text-sm font-medium text-sage-600 mb-2">
                {selectedInfo.title}
              </p>
              <p className="text-sm text-text-secondary">
                {selectedInfo.description}
              </p>
              
              {selectedInfo.symptoms && selectedInfo.symptoms.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-text-primary mb-2">{t('periodEntry.symptoms')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfo.symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="px-3 py-1 bg-sage-100 text-sage-600 rounded-full text-sm flex items-center gap-1 inline-flex"
                      >
                        <span className="text-base">{getSymptomIcon(symptom)}</span>
                        <span>{t(`symptoms.${symptom}`)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedInfo.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-text-primary mb-1">{t('periodEntry.notes')}:</p>
                  <p className="text-sm text-text-secondary">{selectedInfo.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{t('calendar.noEvents')}</p>
          )}
        </div>
      )}

      {predictions.length > 0 && (
        <div className="card">
          <h3 className="text-heading-3 mb-4">{t('calendar.upcomingPredictions')}</h3>
          <div className="space-y-3">
            {predictions.slice(0, 5).map((prediction) => (
              <div
                key={prediction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {prediction.type === 'PERIOD' && t('calendar.nextPeriod')}
                    {prediction.type === 'OVULATION' && t('calendar.ovulation')}
                    {prediction.type === 'FERTILE_WINDOW' && t('calendar.fertileWindow')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatShort(prediction.startDate)}
                    {prediction.endDate && prediction.endDate !== prediction.startDate && 
                      ` - ${formatShort(prediction.endDate)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-sage-600">
                    {prediction.confidence}%
                  </p>
                  <p className="text-xs text-text-secondary">{t('calendar.confidence')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}