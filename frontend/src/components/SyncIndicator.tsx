import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineService } from '@/services/offline';
import { apiClient } from '@/services/api';
import { toast } from '@/components/ui/Toaster';
import { useTranslation } from 'react-i18next';

export function SyncIndicator() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateQueueCount = () => {
      setQueueCount(OfflineService.getQueue().length);
    };

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && queueCount > 0 && !syncing) {
      syncOfflineData();
    }
  }, [isOnline, queueCount]);

  const syncOfflineData = async () => {
    setSyncing(true);
    try {
      const result = await OfflineService.processQueue(apiClient, (processed, total) => {
        setQueueCount(total - processed);
      });
      
      if (result && result.processed > 0) {
        toast.success(t('messages.syncedChanges', { count: result.processed }));
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      toast.error(t('messages.failedToSync'));
    } finally {
      setSyncing(false);
      setQueueCount(OfflineService.getQueue().length);
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-md">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="text-sm font-medium">{t('messages.offline')}</span>
        {queueCount > 0 && (
          <span className="text-xs">({queueCount} {t('messages.pending')})</span>
        )}
      </div>
    );
  }

  if (syncing || queueCount > 0) {
    return (
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg shadow-md">
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-medium">
          {syncing ? t('messages.syncing') : t('messages.changesPending', { count: queueCount })}
        </span>
      </div>
    );
  }

  return null;
}