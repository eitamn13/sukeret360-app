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
      <div className="mx-auto grid max-w-md grid-cols-[96px_1fr_52px] items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 justify-self-start">
          <HeaderButton
            onClick={onSettingsClick}
            label={'\u05d4\u05d2\u05d3\u05e8\u05d5\u05ea'}
            theme={theme}
          >
            <Settings size={20} strokeWidth={1.9} />
          </HeaderButton>

          <HeaderButton
            onClick={onNotificationsClick}
            label={'\u05d4\u05ea\u05e8\u05d0\u05d5\u05ea'}
            theme={theme}
          >
            <Bell size={20} strokeWidth={1.9} />
            {notificationBadge ? (
              <span
                className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px]"
                style={{
                  backgroundColor: notificationBadge === '!' ? '#D6924C' : theme.primaryDark,
                  color: '#FFFFFF',
                  fontWeight: 800,
                }}
              >
                {notificationBadge}
              </span>
            ) : null}
          </HeaderButton>
        </div>

        <div className="min-w-0 text-right">
          <h1
            className="truncate text-[21px] leading-none"
            style={{
              color: theme.primaryDark,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            {'\u05d4\u05e1\u05d5\u05db\u05e8\u05ea \u05e9\u05dc\u05d9'}
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
      className="relative flex h-11 w-11 items-center justify-center rounded-[18px] transition-all active:scale-95"
      style={{
        color: theme.primaryDark,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,249,244,0.96) 100%)',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 22px rgba(160, 134, 122, 0.08)',
      }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
