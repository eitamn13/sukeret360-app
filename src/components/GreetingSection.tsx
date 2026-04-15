import { Droplets, MessageCircle, Pill, Siren, UtensilsCrossed } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { genderedText, useAppContext } from '../context/AppContext';

function formatClock(time: string) {
  return time || '--:--';
}

interface GreetingSectionProps {
  onSOSClick?: () => void;
  onSugarClick?: () => void;
  onMealClick?: () => void;
  onMedicationsClick?: () => void;
  onDoctorClick?: () => void;
}

export function GreetingSection({
  onSOSClick,
  onSugarClick,
  onMealClick,
  onMedicationsClick,
  onDoctorClick,
}: GreetingSectionProps) {
  const { timeString, greeting, dateString } = useCurrentTime();
  const { userProfile, theme, sugarLogs, todayMeals, medicationSchedule } = useAppContext();

  const displayName = userProfile.name || genderedText(userProfile.gender, 'יקרה', 'יקר');
  const latestSugar = sugarLogs[0];

  const nextMedication = useMemo(() => {
    if (medicationSchedule.length === 0) return null;

    const now = new Date();
    const sorted = [...medicationSchedule].sort((a, b) => a.time.localeCompare(b.time));

    return (
      sorted.find((medication) => {
        const [hours, minutes] = medication.time.split(':').map(Number);
        const scheduledAt = new Date();
        scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
        return scheduledAt.getTime() >= now.getTime();
      }) || sorted[0]
    );
  }, [medicationSchedule]);

  const quickActions = [
    {
      label: 'בדיקת סוכר',
      note: latestSugar ? `אחרון ${latestSugar.level}` : 'מדידה חדשה',
      icon: <Droplets size={18} strokeWidth={1.9} />,
      onClick: onSugarClick,
    },
    {
      label: 'רישום ארוחה',
      note: todayMeals.length > 0 ? `${todayMeals.length} היום` : 'צילום או חיפוש',
      icon: <UtensilsCrossed size={18} strokeWidth={1.9} />,
      onClick: onMealClick,
    },
    {
      label: 'תרופות',
      note: nextMedication ? formatClock(nextMedication.time) : 'לוח יומי',
      icon: <Pill size={18} strokeWidth={1.9} />,
      onClick: onMedicationsClick,
    },
    {
      label: 'העוזר הרפואי שלי',
      note: 'שאלה קצרה וברורה',
      icon: <MessageCircle size={18} strokeWidth={1.9} />,
      onClick: onDoctorClick,
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[32px] mx-4 mt-4 p-5"
      dir="rtl"
      style={{
        background: theme.gradientCard,
        boxShadow: `0 24px 54px ${theme.primaryShadow}`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.8) 0, transparent 18%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: 'auto, 26px 26px, 26px 26px',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <p className="text-3xl text-white leading-none" style={{ fontWeight: 900 }}>
              {timeString}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>
              {dateString}
            </p>
          </div>

          <button
            onClick={onSOSClick}
            className="h-12 min-w-[98px] px-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(255,255,255,0.16)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.24)',
              fontWeight: 900,
            }}
            aria-label="SOS"
          >
            <Siren size={18} strokeWidth={1.9} />
            <span>SOS</span>
          </button>
        </div>

        <div className="mt-5 text-right">
          <p className="text-lg text-white" style={{ fontWeight: 800 }}>
            {greeting}, {displayName}
          </p>
          <h2
            className="text-[32px] leading-tight mt-2 text-white"
            style={{ fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            {genderedText(userProfile.gender, 'איך את מרגישה היום?', 'איך אתה מרגיש היום?')}
          </h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.76)', fontWeight: 600 }}>
            בוחרים פעולה אחת וממשיכים.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div className="flex flex-row-reverse items-center justify-between gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}
                >
                  {action.icon}
                </div>
                <div className="text-right flex-1">
                  <p style={{ color: '#FFFFFF', fontWeight: 900 }}>{action.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 4 }}>
                    {action.note}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <CompactStatus
            label="סוכר אחרון"
            value={latestSugar ? `${latestSugar.level} mg/dL` : 'עוד לא נמדד'}
          />
          <CompactStatus
            label="התרופה הבאה"
            value={nextMedication ? `${nextMedication.name} · ${formatClock(nextMedication.time)}` : 'לא הוגדרה'}
          />
        </div>
      </div>
    </section>
  );
}

function CompactStatus({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[22px] p-4 text-right"
      style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
    >
      <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: 800 }}>{label}</p>
      <p style={{ color: '#FFFFFF', fontWeight: 900, marginTop: 8, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}
