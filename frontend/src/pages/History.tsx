import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { apiClient } from '@/services/api';
import { Period, FlowIntensity } from '@/types';
import { OfflineService } from '@/services/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import { toast } from '@/components/ui/Toaster';
import { ConfirmModal } from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

export function History() {
  const { t } = useTranslation();
  const { formatLong } = useLocalizedDate();
  
  const FLOW_INTENSITIES: { value: FlowIntensity; label: string; color: string }[] = [
    { value: FlowIntensity.SPOTTING, label: t('flowIntensity.spotting'), color: 'bg-period-light' },
    { value: FlowIntensity.LIGHT, label: t('flowIntensity.light'), color: 'bg-period-predicted' },
    { value: FlowIntensity.MEDIUM, label: t('flowIntensity.medium'), color: 'bg-period-active' },
    { value: FlowIntensity.HEAVY, label: t('flowIntensity.heavy'), color: 'bg-red-600' },
    { value: FlowIntensity.NO_PERIOD, label: t('flowIntensity.noPeriod'), color: 'bg-gray-300' },
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

  const getSymptomIcon = (symptomKey: string) => {
    const symptom = COMMON_SYMPTOMS.find(s => s.key === symptomKey);
    return symptom?.icon || '💫';
  };
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<{
    startDate: string;
    endDate: string;
    flowIntensity: FlowIntensity;
    symptoms: string[];
    notes: string;
  }>({ 
    startDate: '', 
    endDate: '', 
    flowIntensity: FlowIntensity.MEDIUM, 
    symptoms: [], 
    notes: '' 
  });
  const [addForm, setAddForm] = useState<{
    startDate: string;
    endDate: string;
    flowIntensity: FlowIntensity;
    symptoms: string[];
    notes: string;
  }>({ 
    startDate: format(new Date(), 'yyyy-MM-dd'), 
    endDate: '', 
    flowIntensity: FlowIntensity.MEDIUM, 
    symptoms: [], 
    notes: '' 
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    periodId: string | null;
    periodDate: string;
  }>({ isOpen: false, periodId: null, periodDate: '' });
  const isOnline = useOnlineStatus();
  const limit = 10;

  useEffect(() => {
    fetchPeriods();
  }, [page, isOnline]);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const response = await apiClient.getPeriods({ 
          page, 
          limit,
        });
        setPeriods(response.periods);
        setTotalPages(response.pagination.totalPages);
        
        // Cache the first page for offline use
        if (page === 1) {
          OfflineService.cachePeriods(response.periods);
        }
      } else {
        // Use cached data when offline
        const cachedPeriods = OfflineService.getCachedPeriods();
        setPeriods(cachedPeriods.slice((page - 1) * limit, page * limit));
        setTotalPages(Math.ceil(cachedPeriods.length / limit));
      }
    } catch (error) {
      console.error('Failed to fetch periods:', error);
      // Try to use cached data on error
      const cachedPeriods = OfflineService.getCachedPeriods();
      setPeriods(cachedPeriods.slice((page - 1) * limit, page * limit));
      setTotalPages(Math.ceil(cachedPeriods.length / limit));
    } finally {
      setLoading(false);
    }
  };

  const getFlowIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case 'SPOTTING': return 'bg-period-light';
      case 'LIGHT': return 'bg-period-predicted';
      case 'MEDIUM': return 'bg-period-active';
      case 'HEAVY': return 'bg-red-600';
      case 'NO_PERIOD': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const calculatePeriodLength = (period: Period) => {
    if (!period.endDate) return t('history.ongoing');
    const days = differenceInDays(new Date(period.endDate), new Date(period.startDate)) + 1;
    return `${days} ${days === 1 ? t('common.day') : t('common.days')}`;
  };

  const startEdit = (period: Period) => {
    setEditingId(period.id);
    setEditForm({
      startDate: format(new Date(period.startDate), 'yyyy-MM-dd'),
      endDate: period.endDate ? format(new Date(period.endDate), 'yyyy-MM-dd') : '',
      flowIntensity: period.flowIntensity,
      symptoms: period.symptoms || [],
      notes: period.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ 
      startDate: '', 
      endDate: '', 
      flowIntensity: FlowIntensity.MEDIUM, 
      symptoms: [], 
      notes: '' 
    });
  };

  const saveEdit = async (periodId: string) => {
    try {
      const updateData: any = {
        startDate: new Date(editForm.startDate).toISOString(),
        flowIntensity: editForm.flowIntensity,
        symptoms: editForm.symptoms,
        notes: editForm.notes || undefined,
      };
      
      if (editForm.endDate) {
        updateData.endDate = new Date(editForm.endDate).toISOString();
      }

      await apiClient.updatePeriod(periodId, updateData);
      toast.success(t('messages.periodUpdated'));
      cancelEdit();
      fetchPeriods();
    } catch (error) {
      console.error('Failed to update period:', error);
      toast.error(t('messages.failedToUpdate'));
    }
  };

  const toggleSymptom = (symptomKey: string) => {
    setEditForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomKey)
        ? prev.symptoms.filter(s => s !== symptomKey)
        : [...prev.symptoms, symptomKey]
    }));
  };

  const toggleAddSymptom = (symptomKey: string) => {
    setAddForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomKey)
        ? prev.symptoms.filter(s => s !== symptomKey)
        : [...prev.symptoms, symptomKey]
    }));
  };

  const startAdd = () => {
    setIsAdding(true);
    setAddForm({ 
      startDate: format(new Date(), 'yyyy-MM-dd'), 
      endDate: '', 
      flowIntensity: FlowIntensity.MEDIUM, 
      symptoms: [], 
      notes: '' 
    });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setAddForm({ 
      startDate: format(new Date(), 'yyyy-MM-dd'), 
      endDate: '', 
      flowIntensity: FlowIntensity.MEDIUM, 
      symptoms: [], 
      notes: '' 
    });
  };

  const saveAdd = async () => {
    try {
      // Validate dates
      const startDate = new Date(addForm.startDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (startDate > today) {
        toast.error(t('messages.startDateFuture'));
        return;
      }

      const periodData: any = {
        startDate: new Date(addForm.startDate).toISOString(),
        flowIntensity: addForm.flowIntensity,
        symptoms: addForm.symptoms,
        notes: addForm.notes || undefined,
      };
      
      if (addForm.endDate) {
        periodData.endDate = new Date(addForm.endDate).toISOString();
      }

      if (isOnline) {
        await apiClient.createPeriod(periodData);
        toast.success(t('messages.periodAdded'));
      } else {
        OfflineService.createOfflinePeriod(periodData);
        toast.info(t('messages.savedOffline'));
      }
      
      cancelAdd();
      fetchPeriods();
    } catch (error) {
      console.error('Failed to add period:', error);
      toast.error(t('messages.failedToAdd'));
    }
  };

  const openDeleteModal = (period: Period) => {
    setDeleteModal({
      isOpen: true,
      periodId: period.id,
      periodDate: formatLong(period.startDate)
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.periodId) return;
    
    try {
      await apiClient.deletePeriod(deleteModal.periodId);
      toast.success(t('messages.periodDeleted'));
      fetchPeriods();
    } catch (error) {
      console.error('Failed to delete period:', error);
      toast.error(t('messages.failedToDelete'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-1 text-sage-600">{t('history.periodHistory')}</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-1 text-sage-600">{t('history.periodHistory')}</h1>
        <Button
          onClick={startAdd}
          className="flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          {t('history.addPeriod')}
        </Button>
      </div>

      {/* Add Period Form */}
      {isAdding && (
        <div className="card bg-sage-50">
          <h3 className="text-heading-3 mb-4">{t('history.addPreviousPeriod')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('history.startDate')}
                </label>
                <input
                  type="date"
                  value={addForm.startDate}
                  onChange={(e) => setAddForm({...addForm, startDate: e.target.value})}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  {t('history.endDateOptional')}
                </label>
                <input
                  type="date"
                  value={addForm.endDate}
                  onChange={(e) => setAddForm({...addForm, endDate: e.target.value})}
                  min={addForm.startDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('periodEntry.flowIntensity')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FLOW_INTENSITIES.map((intensity) => (
                  <button
                    key={intensity.value}
                    onClick={() => setAddForm({...addForm, flowIntensity: intensity.value})}
                    className={clsx(
                      'p-3 rounded-lg border-2 transition-all',
                      addForm.flowIntensity === intensity.value
                        ? 'border-sage-400 bg-white'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className={`w-4 h-4 ${intensity.color} rounded-full mx-auto mb-1`} />
                    <span className="text-sm">{intensity.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('periodEntry.symptoms')}
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom.key}
                    onClick={() => toggleAddSymptom(symptom.key)}
                    className={clsx(
                      'px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2',
                      addForm.symptoms.includes(symptom.key)
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

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('periodEntry.notes')}
              </label>
              <textarea
                value={addForm.notes}
                onChange={(e) => setAddForm({...addForm, notes: e.target.value})}
                rows={3}
                className="input"
                placeholder={t('periodEntry.additionalNotes')}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={saveAdd}
                className="flex-1"
              >
                {t('history.addPeriod')}
              </Button>
              <Button
                variant="secondary"
                onClick={cancelAdd}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {periods.length === 0 && !isAdding ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary mb-4">{t('history.noPeriodsLogged')}</p>
          <p className="text-sm text-text-secondary mb-6">
            {t('history.startTracking')}
          </p>
          <Button onClick={startAdd}>
            {t('history.addFirstPeriod')}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {periods.map((period) => (
              <div key={period.id} className="card">
                {editingId === period.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          {t('history.startDate')}
                        </label>
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                          max={format(new Date(), 'yyyy-MM-dd')}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          {t('history.endDate')}
                        </label>
                        <input
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                          min={editForm.startDate}
                          max={format(new Date(), 'yyyy-MM-dd')}
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Flow Intensity
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {FLOW_INTENSITIES.map((intensity) => (
                          <button
                            key={intensity.value}
                            onClick={() => setEditForm({...editForm, flowIntensity: intensity.value})}
                            className={clsx(
                              'p-2 rounded-lg border-2 transition-all',
                              editForm.flowIntensity === intensity.value
                                ? 'border-sage-400 bg-sage-50'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div className={`w-3 h-3 ${intensity.color} rounded-full mx-auto mb-1`} />
                            <span className="text-xs">{intensity.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Symptoms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_SYMPTOMS.map((symptom) => (
                          <button
                            key={symptom.key}
                            onClick={() => toggleSymptom(symptom.key)}
                            className={clsx(
                              'px-3 py-1 rounded-full text-sm transition-all flex items-center gap-2',
                              editForm.symptoms.includes(symptom.key)
                                ? 'bg-sage-400 text-white'
                                : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                            )}
                          >
                            <span className="text-base">{symptom.icon}</span>
                            <span>{symptom.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Notes
                      </label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        rows={2}
                        className="input"
                        placeholder={t('periodEntry.additionalNotes')}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(period.id)}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-heading-3 text-text-primary">
                          {formatLong(period.startDate)}
                          {period.endDate && (
                            <span className="text-base font-normal text-text-secondary">
                              {' '}- {formatLong(period.endDate)}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {t('history.duration')}: {calculatePeriodLength(period)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {period.flowIntensity && (
                          <>
                            <div className={`w-4 h-4 ${getFlowIntensityColor(period.flowIntensity)} rounded-full`} />
                            <span className="text-sm text-text-secondary">{t(`flowIntensity.${period.flowIntensity.toLowerCase()}`)}</span>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(period)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteModal(period)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>

                    {period.symptoms && period.symptoms.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-text-secondary mb-2">{t('periodEntry.symptoms')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {period.symptoms.map((symptom) => (
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

                    {period.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-text-secondary">{period.notes}</p>
                      </div>
                    )}

                    {!period.endDate && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center px-3 py-1 bg-period-active text-white rounded-full text-sm">
                          {t('history.currentlyActive')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-sage-600 bg-white border border-sage-300 rounded-lg hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('history.previous')}
              </button>
              <span className="px-4 py-2 text-sm text-text-secondary">
                {t('history.page')} {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-sage-600 bg-white border border-sage-300 rounded-lg hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('history.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, periodId: null, periodDate: '' })}
        onConfirm={handleDelete}
        title={t('history.deletePeriod')}
        message={t('history.deleteConfirm', { date: deleteModal.periodDate })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}