import { useTranslation } from 'react-i18next';
import { format as dateFnsFormat, Locale } from 'date-fns';
import { enUS, fr, de, es } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  en: enUS,
  fr,
  de,
  es,
};

export function useLocalizedDate() {
  const { i18n } = useTranslation();

  const format = (date: Date | string, formatStr: string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = localeMap[i18n.language] || enUS;
    
    return dateFnsFormat(dateObj, formatStr, { locale });
  };

  const formatShort = (date: Date | string) => {
    return format(date, 'MMM d');
  };

  const formatLong = (date: Date | string) => {
    return format(date, 'MMMM d, yyyy');
  };

  const formatMonthYear = (date: Date | string) => {
    return format(date, 'MMMM yyyy');
  };

  return {
    format,
    formatShort,
    formatLong,
    formatMonthYear,
  };
}