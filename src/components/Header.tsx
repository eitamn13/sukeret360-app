import type { ReactNode } from 'react';
import { Bell, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useAppContext } from '../context/AppContext';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

interface HeaderProps {
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
}

export function Header({ onSettingsClick, onNotificationsClick }: HeaderProps) {
  const { theme, medicationSchedule, medicationLogs, notificationPermission } = useAppContext();
  const todayKey = getTodayKey();

  const takenMedicationIds = new Set(
    medicationLogs
      .filter((log) => log.dateKey === todayKey)
      .map((log) => log.medicationId)
  );

  const dueNotificationCount = medicationSchedule.filter((medication) => {
    if (takenMedicationIds.has(medication.id)) return false;
    const [hours, minutes] = medication.time.split(':').map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
    return scheduledAt.getTime() <= Date.now();
  }).length;

  const notificationBadge =
    notificationPermission !== 'granted' && medicationSchedule.length > 0
      ? '!'
      : dueNotificationCount > 0
        ? String(dueNotificationCount)
        : null;

  return (
    <header
      className="sticky top-0 z-50"
      dir="rtl"
      style={{
        background: theme.headerBg,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${theme.headerBorder}`,
        boxShadow: theme.headerShadow,
      }}
    >
      <div className="max-w-md mx-auto px-4 py-2.5 grid grid-cols-[92px_1fr_52px] items-center gap-3">
        <div className="flex items-center gap-2 justify-self-start">
          <HeaderButton onClick={onSettingsClick} label="הגדרות" theme={theme}>
            <Settings size={20} strokeWidth={1.9} />
          </HeaderButton>

          <HeaderButton onClick={onNotificationsClick} label="התראות" theme={theme}>
            <Bell size={20} strokeWidth={1.9} />
            {notificationBadge && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] flex items-center justify-center"
                style={{
                  backgroundColor: notificationBadge === '!' ? '#D6924C' : theme.primaryDark,
                  color: '#FFFFFF',
                  fontWeight: 800,
                }}
              >
                {notificationBadge}
              </span>
            )}
          </HeaderButton>
        </div>

        <div className="min-w-0 text-right">
          <h1
            className="text-[21px] leading-none truncate"
            style={{
              color: theme.primaryDark,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            הסוכרת שלי
          </h1>
        </div>

        <div className="justify-self-end">
          <Logo size={42} />
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  children,
  label,
  onClick,
  theme,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-11 h-11 rounded-[18px] flex items-center justify-center transition-all active:scale-95"
      style={{
        color: theme.primaryDark,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,249,244,0.95) 100%)',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 22px rgba(160, 134, 122, 0.08)',
      }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
