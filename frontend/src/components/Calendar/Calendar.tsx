import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from 'date-fns';
import { clsx } from 'clsx';
import { Period, Prediction } from '@/types';
import { useTranslation } from 'react-i18next';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

interface CalendarProps {
  periods: Period[];
  predictions?: Prediction[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
}

export function Calendar({ periods, predictions = [], onDateClick, selectedDate }: CalendarProps) {
  const { t } = useTranslation();
  const { formatMonthYear } = useLocalizedDate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(() => {
    const daysArray: Date[] = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    
    return daysArray;
  }, [calendarStart, calendarEnd]);

  const getDayStatus = (date: Date) => {
    // Normalize date to start of day for comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if it's a period day (including NO_PERIOD)
    const periodOnDate = periods.find((period) => {
      const start = new Date(parseISO(period.startDate));
      start.setHours(0, 0, 0, 0);
      
      // If no end date, it's a single day entry or ongoing period
      if (!period.endDate) {
        return normalizedDate.getTime() === start.getTime();
      }
      
      const end = new Date(parseISO(period.endDate));
      end.setHours(0, 0, 0, 0);
      
      return normalizedDate >= start && normalizedDate <= end;
    });
    
    if (periodOnDate) {
      if (periodOnDate.flowIntensity === 'NO_PERIOD') {
        return 'no-period';
      }
      return 'period';
    }
    
    // Check predictions
    for (const prediction of predictions) {
      const start = new Date(parseISO(prediction.startDate));
      start.setHours(0, 0, 0, 0);
      
      if (prediction.type === 'OVULATION') {
        // Ovulation is typically a single day
        if (normalizedDate.getTime() === start.getTime()) {
          return 'ovulation';
        }
      } else if (prediction.type === 'FERTILE_WINDOW' && prediction.endDate) {
        // Fertile window spans multiple days
        const end = new Date(parseISO(prediction.endDate));
        end.setHours(0, 0, 0, 0);
        if (normalizedDate >= start && normalizedDate <= end) {
          return 'fertile';
        }
      } else if (prediction.type === 'PERIOD') {
        // Period prediction
        const end = prediction.endDate ? new Date(parseISO(prediction.endDate)) : start;
        end.setHours(0, 0, 0, 0);
        if (normalizedDate >= start && normalizedDate <= end) {
          return 'predicted-period';
        }
      }
    }
    
    return null;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // For now, use simple weekday arrays - can be enhanced later with proper localization
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDaysFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-soft p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button 
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg md:text-heading-3 font-semibold text-text-primary">
          {formatMonthYear(currentMonth)}
        </h2>
        <button 
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={day} className="text-center text-xs md:text-sm font-medium text-text-secondary py-1 md:py-2">
            <span className="md:hidden">{day}</span>
            <span className="hidden md:block">{weekDaysFull[index]}</span>
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {days.map((day) => {
          const dayStatus = getDayStatus(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={clsx(
                'calendar-cell',
                {
                  'opacity-30': !isCurrentMonth,
                  'calendar-cell-today': today,
                  'calendar-cell-period': dayStatus === 'period',
                  'calendar-cell-predicted': dayStatus === 'predicted-period',
                  'calendar-cell-ovulation': dayStatus === 'ovulation',
                  'calendar-cell-fertile': dayStatus === 'fertile',
                  'calendar-cell-no-period': dayStatus === 'no-period',
                  'ring-2 ring-sage-600': isSelected,
                }
              )}
            >
              <span className="text-sm">{format(day, 'd')}</span>
              {dayStatus === 'ovulation' && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs">🥚</span>
              )}
              {dayStatus === 'fertile' && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-fertile-window rounded-full opacity-80" />
              )}
              {dayStatus === 'predicted-period' && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full opacity-60" />
              )}
              {dayStatus === 'no-period' && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend - Mobile optimized */}
      <div className="mt-4 md:mt-6 grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-period-active rounded" />
          <span className="text-text-secondary">{t('calendar.period')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-period-light border-2 border-period-predicted rounded" />
          <span className="text-text-secondary">{t('calendar.predicted')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-fertile-ovulation rounded" />
          <span className="text-text-secondary">{t('calendar.ovulation')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-fertile-window rounded" />
          <span className="text-text-secondary">{t('calendar.fertile')}</span>
        </div>
        <div className="flex items-center gap-2 col-span-2 md:col-span-1">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-300 rounded flex items-center justify-center">
            <span className="text-xs">✗</span>
          </div>
          <span className="text-text-secondary">{t('calendar.noPeriod')}</span>
        </div>
      </div>
    </div>
  );
}