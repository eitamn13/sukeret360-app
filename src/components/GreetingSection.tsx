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

  const mainCards = [
    {
      key: 'sugar',
      title: 'בדיקת סוכר',
      subtitle: latestSugar ? `${latestSugar.level} mg/dL` : 'מדידה חדשה',
      icon: <Droplets size={18} strokeWidth={1.9} />,
      onClick: onSugarClick,
    },
    {
      key: 'meal',
      title: 'רישום ארוחה',
      subtitle: 'צילום או חיפוש',
      icon: <UtensilsCrossed size={18} strokeWidth={1.9} />,
      onClick: onMealClick,
    },
    {
      key: 'medications',
      title: 'תרופות',
      subtitle: nextMedication ? formatClock(nextMedication.time) : 'לוח יומי',
      icon: <Pill size={18} strokeWidth={1.9} />,
      onClick: onMedicationsClick,
    },
    {
      key: 'doctor',
      title: 'העוזר הרפואי שלי',
      subtitle: 'שיחה חיה בקול',
      icon: <MessageCircleMore size={18} strokeWidth={1.9} />,
      onClick: onDoctorClick,
    },
  ];

  return (
    <section className="px-4 pt-4" dir="rtl">
      <div
        className="overflow-hidden rounded-[34px] p-4"
        style={{
          background: theme.gradientCard,
          border: `1px solid ${theme.primaryBorder}`,
          boxShadow: `0 26px 54px ${theme.primaryShadow}`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <p className="text-[30px] leading-none" style={{ color: theme.primaryDark, fontWeight: 900 }}>
              {timeString}
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
              {dateString}
            </p>
          </div>

          <button
            onClick={onSOSClick}
            className="flex h-12 min-w-[118px] items-center justify-center gap-2 rounded-[20px] px-5 transition-all active:scale-95"
            style={{
              background: theme.primaryBg,
              color: theme.primaryDark,
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 14px 28px rgba(118, 150, 201, 0.12)',
              fontWeight: 900,
            }}
            aria-label="SOS"
          >
            <Siren size={18} strokeWidth={1.9} />
            <span>SOS</span>
          </button>
        </div>

        <div className="mt-5 text-right">
          <h2
            className="text-[28px] leading-tight"
            style={{ color: '#594841', fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            פעולות מרכזיות
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
            {userProfile.name?.trim() ? `שלום ${userProfile.name.trim()}` : 'כל מה שחשוב באמת במקום אחד'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <QuickInfo
            label="סוכר אחרון"
            value={latestSugar ? `${latestSugar.level} mg/dL` : 'עדיין לא נמדד'}
          />
          <QuickInfo
            label="התרופה הבאה"
            value={nextMedication ? `${nextMedication.name} · ${formatClock(nextMedication.time)}` : 'אין תזכורת קרובה'}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {mainCards.map((card) => (
            <HomeActionCard
              key={card.key}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              onClick={card.onClick}
              theme={theme}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SecondaryActionCard
            title="היסטוריה"
            subtitle="מה קרה השבוע"
            icon={<BookOpen size={18} strokeWidth={1.9} />}
            onClick={onHistoryClick}
            theme={theme}
          />
          <SecondaryActionCard
            title="מנוי PRO"
            subtitle="שדרוג לעוזר חכם יותר"
            icon={<Crown size={18} strokeWidth={1.9} />}
            onClick={onSubscriptionClick}
            theme={theme}
          />
        </div>
      </div>
    </section>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[22px] px-4 py-3 text-right"
      style={{
        background: 'rgba(255,255,255,0.84)',
        border: '1px solid rgba(219, 229, 241, 0.9)',
      }}
    >
      <p className="text-xs font-bold text-[#8A97A8]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#4D5B73]">{value}</p>
    </div>
  );
}

function HomeActionCard({
  title,
  subtitle,
  icon,
  onClick,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <button
      onClick={onClick}
      className="relative min-h-[122px] rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 12px 28px rgba(160, 134, 122, 0.08)',
      }}
    >
      <div
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{
          background: theme.primaryBg,
          color: theme.primaryDark,
        }}
      >
        {icon}
      </div>

      <div className="flex h-full flex-col justify-end text-right">
        <p className="text-[17px] font-black text-[#5A4740]">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#8D7A73]">{subtitle}</p>
      </div>
    </button>
  );
}

function SecondaryActionCard({
  title,
  subtitle,
  icon,
  onClick,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[90px] items-center justify-between rounded-[24px] px-4 text-right transition-all active:scale-[0.98]"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 12px 28px rgba(122, 146, 182, 0.08)',
      }}
    >
      <div className="text-right">
        <p className="font-black text-[#4D5B73]">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#7F8CA0]">{subtitle}</p>
      </div>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: theme.primaryBg, color: theme.primaryDark }}
      >
        {icon}
      </div>
    </button>
  );
}
