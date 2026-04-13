import { Bell, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { theme } = useAppContext();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: theme.headerBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${theme.headerBorder}`,
        boxShadow: theme.headerShadow,
        transition: 'background 0.4s ease, border-color 0.4s ease',
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <div>
            <h1
              className="text-lg leading-none"
              style={{ color: theme.primary, fontWeight: 900, letterSpacing: '-0.03em', transition: 'color 0.4s ease' }}
            >
              הסוכרת שלי
            </h1>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500, transition: 'color 0.4s ease' }}>
              התמודדות חכמה עם סוכרת
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-2.5 rounded-xl relative transition-colors"
            style={{ color: theme.primary, backgroundColor: `${theme.primary}12` }}
          >
            <Bell size={22} strokeWidth={1.75} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2.5 rounded-xl transition-all active:scale-95"
            style={{ color: theme.primary, backgroundColor: `${theme.primary}12` }}
          >
            <Settings size={22} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
