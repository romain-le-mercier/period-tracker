import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '@/i18n/config';

export function Settings() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 py-3 md:relative md:bg-transparent md:backdrop-blur-none">
        <h1 className="text-2xl md:text-heading-1 font-bold text-sage-600">{t('settings.settings')}</h1>
      </div>

      {/* Language Settings */}
      <div className="card p-4 md:p-6">
        <h3 className="text-lg md:text-heading-3 font-semibold mb-4">{t('settings.language')}</h3>
        <div className="space-y-2">
          {supportedLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                i18n.language === language.code
                  ? 'bg-sage-100 text-sage-700 font-medium'
                  : 'hover:bg-gray-50 text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{language.nativeName}</span>
                {i18n.language === language.code && (
                  <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="card p-4 md:p-6">
        <h3 className="text-lg md:text-heading-3 font-semibold mb-4">{t('settings.account')}</h3>
        <p className="text-sm text-text-secondary">
          Account settings will be available in a future update.
        </p>
      </div>

      {/* About */}
      <div className="card p-4 md:p-6">
        <h3 className="text-lg md:text-heading-3 font-semibold mb-4">{t('settings.about')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">{t('settings.version')}</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div>
            <a href="#" className="text-sage-600 hover:underline">
              {t('settings.privacyPolicy')}
            </a>
          </div>
          <div>
            <a href="#" className="text-sage-600 hover:underline">
              {t('settings.termsOfService')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}