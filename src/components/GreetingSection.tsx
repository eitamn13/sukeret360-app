import {
  BookOpen,
  Crown,
  Droplets,
  MessageCircleMore,
  Pill,
  Siren,
  UtensilsCrossed,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAppContext } from '../context/AppContext';

interface GreetingSectionProps {
  onSOSClick?: () => void;
  onSugarClick?: () => void;
  onMealClick?: () => void;
  onMedicationsClick?: () => void;
  onDoctorClick?: () => void;
  onTipClick?: () => void;
  onHistoryClick?: () => void;
  onSubscriptionClick?: () => void;
}

function formatClock(time: string) {
  return time || '--:--';
}

export function GreetingSection({
  onSOSClick,
  onSugarClick,
  onMealClick,
  onMedicationsClick,
  onDoctorClick,
  onHistoryClick,
  onSubscriptionClick,
}: GreetingSectionProps) {
  const { timeString, dateString } = useCurrentTime();
  const { userProfile, theme, sugarLogs, medicationSchedule } = useAppContext();
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

  const primaryActions = [
    {
      key: 'sugar',
      title: 'בדיקת סוכר',
      subtitle: latestSugar ? `${latestSugar.level} mg/dL` : 'מדידה חדשה',
      icon: <Droplets size={18} strokeWidth={2} />,
      onClick: onSugarClick,
    },
    {
      key: 'meal',
      title: 'רישום ארוחה',
      subtitle: 'צילום או חיפוש',
      icon: <UtensilsCrossed size={18} strokeWidth={2} />,
      onClick: onMealClick,
    },
    {
      key: 'medications',
      title: 'תרופות',
      subtitle: nextMedication ? formatClock(nextMedication.time) : 'לוח יומי',
      icon: <Pill size={18} strokeWidth={2} />,
      onClick: onMedicationsClick,
    },
    {
      key: 'doctor',
      title: 'העוזר הרפואי',
      subtitle: 'שיחה קולית חיה',
      icon: <MessageCircleMore size={18} strokeWidth={2} />,
      onClick: onDoctorClick,
    },
    {
      key: 'history',
      title: 'היסטוריה',
      subtitle: 'דוח שבועי',
      icon: <BookOpen size={18} strokeWidth={2} />,
      onClick: onHistoryClick,
    },
    {
      key: 'subscription',
      title: 'מנוי PRO',
      subtitle: 'שדרוג תכונות',
      icon: <Crown size={18} strokeWidth={2} />,
      onClick: onSubscriptionClick,
    },
  ];

  return (
    <section className="px-4 py-4" dir="rtl">
      <div
        className="rounded-[30px] p-4"
        style={{
          background: '#FFFFFF',
          border: `1px solid ${theme.primaryBorder}`,
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <p className="text-[30px] font-black leading-none text-[#0F172A]">{timeString}</p>
            <p className="mt-1 text-sm font-bold text-[#64748B]">{dateString}</p>
          </div>

          <button
            onClick={onSOSClick}
            className="flex h-12 min-w-[112px] items-center justify-center gap-2 rounded-[18px] px-4 transition-all active:scale-[0.98]"
            style={{
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              fontWeight: 900,
            }}
          >
            <Siren size={18} strokeWidth={2} />
            <span>SOS</span>
          </button>
        </div>

        <div className="mt-5 text-right">
          <h2 className="text-[26px] font-black text-[#0F172A]">מבט מהיר להיום</h2>
          <p className="mt-2 text-sm font-bold text-[#64748B]">
            {userProfile.name?.trim()
              ? `שלום ${userProfile.name.trim()}`
              : 'כל הנתונים החשובים במקום אחד'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SummaryCard
            label="סוכר אחרון"
            value={latestSugar ? `${latestSugar.level} mg/dL` : 'עדיין לא נמדד'}
          />
          <SummaryCard
            label="הטיפול הבא"
            value={
              nextMedication
                ? `${nextMedication.name} · ${formatClock(nextMedication.time)}`
                : 'אין תזכורת קרובה'
            }
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {primaryActions.map((action) => (
          <ActionCard
            key={action.key}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            onClick={action.onClick}
            themeColor={theme.primary}
            themeBorder={theme.primaryBorder}
          />
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[22px] px-4 py-3 text-right"
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
      }}
    >
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#0F172A]">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  onClick,
  themeColor,
  themeBorder,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
  themeColor: string;
  themeBorder: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative min-h-[118px] rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${themeBorder}`,
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-[16px]"
        style={{
          background: '#EFF6FF',
          color: themeColor,
        }}
      >
        {icon}
      </div>

      <div className="flex h-full flex-col justify-end">
        <p className="text-[17px] font-black text-[#0F172A]">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#64748B]">{subtitle}</p>
      </div>
    </button>
  );
}
