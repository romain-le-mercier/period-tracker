import { useState, useEffect } from 'react';
import { PeriodEntry } from '@/components/PeriodEntry/PeriodEntry';
import { apiClient } from '@/services/api';
import { Period, Prediction } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { OfflineService } from '@/services/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t } = useTranslation();
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [lastPeriod, setLastPeriod] = useState<Period | null>(null);
  const [nextPrediction, setNextPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const fetchPeriodData = async () => {
    try {
      if (isOnline) {
        const current = await apiClient.getCurrentPeriod();
        setCurrentPeriod(current);
        
        if (!current) {
          // Get last period
          const { periods } = await apiClient.getPeriods({ limit: 1 });
          setLastPeriod(periods[0] || null);
          
          // Cache periods for offline use
          if (periods.length > 0) {
            OfflineService.cachePeriods(periods);
          }
        }
        
        // Fetch predictions
        try {
          const predictions = await apiClient.getPredictions();
          const nextPeriodPrediction = predictions
            .filter(p => p.type === 'PERIOD')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
          setNextPrediction(nextPeriodPrediction || null);
        } catch (error) {
          console.error('Failed to fetch predictions:', error);
        }
      } else {
        // Use cached data when offline
        const cachedPeriods = OfflineService.getCachedPeriods();
        const sortedPeriods = cachedPeriods.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        const current = sortedPeriods.find(p => !p.endDate);
        setCurrentPeriod(current || null);
        
        if (!current && sortedPeriods.length > 0) {
          setLastPeriod(sortedPeriods[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch period data:', error);
      // Try to use cached data on error
      const cachedPeriods = OfflineService.getCachedPeriods();
      if (cachedPeriods.length > 0) {
        const current = cachedPeriods.find(p => !p.endDate);
        setCurrentPeriod(current || null);
        setLastPeriod(cachedPeriods[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodData();
  }, []);

  const getDaysSince = (dateStr: string) => {
    return differenceInDays(new Date(), parseISO(dateStr));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile-friendly header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 py-3 md:relative md:bg-transparent md:backdrop-blur-none">
        <h1 className="text-2xl md:text-heading-1 font-bold text-sage-600">{t('dashboard.welcome')}</h1>
      </div>
      
      {/* Period Entry */}
      <PeriodEntry
        currentPeriod={currentPeriod}
        onPeriodLogged={fetchPeriodData}
      />

      {/* Cycle Information - Mobile-optimized cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-text-secondary mb-1 md:mb-2">{t('dashboard.currentStatus')}</h3>
          {currentPeriod ? (
            <>
              <p className="text-xl md:text-heading-3 font-semibold text-period-active">{t('dashboard.onPeriod')}</p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">
                {t('common.day')} {getDaysSince(currentPeriod.startDate) + 1}
              </p>
            </>
          ) : lastPeriod ? (
            <>
              <p className="text-xl md:text-heading-3 font-semibold text-sage-600">{t('dashboard.daysSincePeriod', { days: getDaysSince(lastPeriod.startDate) })}</p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">
                {t('dashboard.sinceLast')}
              </p>
            </>
          ) : (
            <p className="text-lg md:text-heading-3 text-text-secondary">{t('dashboard.noData')}</p>
          )}
        </div>

        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-text-secondary mb-1 md:mb-2">{t('dashboard.lastPeriod')}</h3>
          {lastPeriod ? (
            <>
              <p className="text-xl md:text-heading-3 font-semibold text-text-primary">
                {format(parseISO(lastPeriod.startDate), 'MMM d')}
              </p>
              {lastPeriod.endDate && (
                <p className="text-xs md:text-sm text-text-secondary mt-1">
                  {differenceInDays(parseISO(lastPeriod.endDate), parseISO(lastPeriod.startDate)) + 1} {t('common.days')}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg md:text-heading-3 text-text-secondary">{t('dashboard.noData')}</p>
          )}
        </div>
      </div>

      {/* Next Prediction */}
      {nextPrediction && (
        <div className="card bg-sage-50 p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-text-secondary mb-2">{t('dashboard.nextPredicted')}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl md:text-heading-3 font-semibold text-sage-600">
                {format(parseISO(nextPrediction.startDate), 'MMM d')}
              </p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">
                {t('dashboard.inDays', { days: differenceInDays(parseISO(nextPrediction.startDate), new Date()) })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base md:text-sm font-medium text-sage-600">
                {nextPrediction.confidence}%
              </p>
              <p className="text-xs text-text-secondary">{t('dashboard.confidence')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="card p-4 md:p-6">
        <h3 className="text-lg md:text-heading-3 font-semibold mb-3 md:mb-4">{t('dashboard.yourCycle')}</h3>
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
          <div>
            <p className="text-xs md:text-sm text-text-secondary">{t('dashboard.averageCycle')}</p>
            <p className="text-lg md:text-heading-3 font-semibold text-sage-600">28</p>
            <p className="text-xs text-text-secondary">{t('common.days')}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-secondary">{t('dashboard.averagePeriod')}</p>
            <p className="text-lg md:text-heading-3 font-semibold text-sage-600">5</p>
            <p className="text-xs text-text-secondary">{t('common.days')}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-secondary">{t('dashboard.trackedCycles')}</p>
            <p className="text-lg md:text-heading-3 font-semibold text-sage-600">0</p>
            <p className="text-xs text-text-secondary">{t('common.total')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}