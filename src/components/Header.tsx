import { Bell, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useAppContext } from '../context/AppContext';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function Header({ onSettingsClick }: { onSettingsClick: () => void }) {
  const { theme, medicationSchedule, medicationLogs } = useAppContext();
  const todayKey = getTodayKey();
  const takenMedicationIds = new Set(
    medicationLogs
      .filter((log) => log.dateKey === todayKey)
      .map((log) => log.medicationId)
  );

  const notificationCount = medicationSchedule.filter((medication) => {
    if (takenMedicationIds.has(medication.id)) return false;
    const [hours, minutes] = medication.time.split(':').map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
    return scheduledAt.getTime() <= Date.now();
  }).length;

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
              חוויית ניהול חכמה, בטוחה ונגישה יותר
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-2.5 rounded-xl relative transition-colors"
            style={{ color: theme.primary, backgroundColor: `${theme.primary}12` }}
            aria-label="התראות"
          >
            <Bell size={22} strokeWidth={1.75} />
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] flex items-center justify-center"
                style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 800 }}
              >
                {notificationCount}
              </span>
            )}
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
