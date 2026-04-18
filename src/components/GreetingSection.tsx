import { Droplets, MessageCircle, Pill, Siren, UtensilsCrossed } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAppContext } from '../context/AppContext';

interface GreetingSectionProps {
  onSOSClick?: () => void;
  onSugarClick?: () => void;
  onMealClick?: () => void;
  onMedicationsClick?: () => void;
  onDoctorClick?: () => void;
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

  const cards = [
    {
      label: '\u05d1\u05d3\u05d9\u05e7\u05ea \u05e1\u05d5\u05db\u05e8',
      note: latestSugar ? `${latestSugar.level} mg/dL` : '\u05de\u05d3\u05d9\u05d3\u05d4 \u05d7\u05d3\u05e9\u05d4',
      icon: <Droplets size={18} strokeWidth={1.9} />,
      onClick: onSugarClick,
    },
    {
      label: '\u05e8\u05d9\u05e9\u05d5\u05dd \u05d0\u05e8\u05d5\u05d7\u05d4',
      note: '\u05e6\u05d9\u05dc\u05d5\u05dd \u05d0\u05d5 \u05d7\u05d9\u05e4\u05d5\u05e9',
      icon: <UtensilsCrossed size={18} strokeWidth={1.9} />,
      onClick: onMealClick,
    },
    {
      label: '\u05ea\u05e8\u05d5\u05e4\u05d5\u05ea',
      note: nextMedication ? formatClock(nextMedication.time) : '\u05dc\u05d5\u05d7 \u05d9\u05d5\u05de\u05d9',
      icon: <Pill size={18} strokeWidth={1.9} />,
      onClick: onMedicationsClick,
    },
    {
      label: '\u05d4\u05e2\u05d5\u05d6\u05e8 \u05d4\u05e8\u05e4\u05d5\u05d0\u05d9 \u05e9\u05dc\u05d9',
      note: '\u05e9\u05d9\u05d7\u05d4 \u05e7\u05d5\u05dc\u05d9\u05ea \u05e7\u05e6\u05e8\u05d4',
      icon: <MessageCircle size={18} strokeWidth={1.9} />,
      onClick: onDoctorClick,
    },
  ];

  return (
    <section
      className="relative mx-4 mt-3 overflow-hidden rounded-[34px] p-4"
      dir="rtl"
      style={{
        background: theme.gradientCard,
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: `0 26px 54px ${theme.primaryShadow}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={onSOSClick}
          className="flex h-12 min-w-[112px] items-center justify-center gap-2 rounded-[20px] px-5 transition-all active:scale-95"
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

        <div className="text-right">
          <p className="text-[28px] leading-none" style={{ color: theme.primaryDark, fontWeight: 900 }}>
            {timeString}
          </p>
          <p className="mt-1 text-sm" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
            {dateString}
          </p>
        </div>
      </div>

      <div className="mt-5 text-right">
        <h2
          className="text-[28px] leading-tight"
          style={{ color: '#594841', fontWeight: 900, letterSpacing: '-0.03em' }}
        >
          {'\u05de\u05d1\u05d8 \u05de\u05d4\u05d9\u05e8 \u05dc\u05d4\u05d9\u05d5\u05dd'}
        </h2>
        <p className="mt-2 text-sm" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
          {userProfile.name?.trim()
            ? `${'\u05e9\u05dc\u05d5\u05dd'}, ${userProfile.name.trim()}`
            : '\u05db\u05dc \u05de\u05d4 \u05e9\u05d7\u05e9\u05d5\u05d1 \u05dc\u05d4\u05d9\u05d5\u05dd \u05d1\u05de\u05e7\u05d5\u05dd \u05d0\u05d7\u05d3'}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 104,
              background: 'rgba(255,255,255,0.84)',
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex h-full flex-col items-end text-right">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: theme.primaryBg,
                  color: theme.primaryDark,
                }}
              >
                {card.icon}
              </div>

              <div className="mt-auto w-full text-right">
                <p style={{ color: '#5A4740', fontWeight: 900 }}>{card.label}</p>
                <p style={{ color: '#947D74', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                  {card.note}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
