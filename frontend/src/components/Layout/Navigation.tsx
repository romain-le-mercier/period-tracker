import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export function Navigation() {
  const { t } = useTranslation();
  
  const navItems = [
    { path: '/dashboard', label: t('nav.today'), icon: '🏠' },
    { path: '/calendar', label: t('nav.calendar'), icon: '📅' },
    { path: '/history', label: t('nav.history'), icon: '📊' },
    { path: '/settings', label: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom md:hidden z-50 shadow-lg">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 py-3 px-2 text-xs transition-all duration-200',
                  isActive
                    ? 'text-sage-600'
                    : 'text-text-secondary active:scale-95'
                )
              }
            >
              <span className="text-2xl transition-transform duration-200">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6">
        <h1 className="text-heading-2 text-sage-600 mb-8">{t('app.title', 'Period Tracker')}</h1>
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sage-50 text-sage-600'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-sage-500'
                )
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}