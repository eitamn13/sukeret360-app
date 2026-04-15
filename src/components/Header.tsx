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

  const notificationBadge = notificationPermission !== 'granted' && medicationSchedule.length > 0
    ? '!'
    : dueNotificationCount > 0
      ? String(dueNotificationCount)
      : null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: theme.headerBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${theme.headerBorder}`,
        boxShadow: theme.headerShadow,
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #123B5D 0%, #0F766E 100%)',
              boxShadow: `0 12px 24px ${theme.primaryShadow}`,
            }}
          >
            <Logo size={28} />
          </div>

          <div className="min-w-0">
            <h1
              className="text-lg leading-none truncate"
              style={{
                color: theme.primary,
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}
            >
              Sukeret360
            </h1>
            <p
              className="text-xs mt-1 truncate"
              style={{ color: theme.primaryMuted, fontWeight: 600 }}
            >
              ליווי חכם, רגוע וברור לניהול היום עם סוכרת
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <HeaderButton
            onClick={onNotificationsClick}
            label="התראות"
            theme={theme}
          >
            <Bell size={21} strokeWidth={1.8} />
            {notificationBadge && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] flex items-center justify-center"
                style={{
                  backgroundColor: notificationBadge === '!' ? '#F59E0B' : '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                }}
              >
                {notificationBadge}
              </span>
            )}
          </HeaderButton>

          <HeaderButton
            onClick={onSettingsClick}
            label="הגדרות"
            theme={theme}
          >
            <Settings size={21} strokeWidth={1.8} />
          </HeaderButton>
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
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
      style={{
        color: theme.primary,
        backgroundColor: '#FFFFFF',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: `0 10px 20px ${theme.primary}12`,
      }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
