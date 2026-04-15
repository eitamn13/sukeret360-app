import { Droplets, Heart, MessageCircle, Pill, Siren, UtensilsCrossed } from 'lucide-react';
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
  const isMale = userProfile.gender === 'male';

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
      note: 'שאלה רפואית קצרה',
      icon: <MessageCircle size={18} strokeWidth={1.9} />,
      onClick: onDoctorClick,
    },
  ];

  const heroGlow = isMale
    ? 'radial-gradient(circle at top right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at bottom left, rgba(189, 214, 246, 0.46) 0%, rgba(189, 214, 246, 0) 38%)'
    : 'radial-gradient(circle at top right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at bottom left, rgba(248, 209, 220, 0.45) 0%, rgba(248, 209, 220, 0) 38%)';

  const orbGlow = isMale
    ? 'radial-gradient(circle, rgba(203, 222, 247, 0.36) 0%, rgba(203, 222, 247, 0) 70%)'
    : 'radial-gradient(circle, rgba(242, 196, 210, 0.34) 0%, rgba(242, 196, 210, 0) 70%)';

  const sosButton = isMale
    ? {
        background: 'linear-gradient(135deg, #D7E5FA 0%, #B9CEF0 100%)',
        color: '#476183',
        border: '1px solid rgba(129, 159, 206, 0.36)',
        boxShadow: '0 14px 28px rgba(118, 150, 201, 0.18)',
      }
    : {
        background: 'linear-gradient(135deg, #F8CAD8 0%, #E9A9BE 100%)',
        color: '#7D3F56',
        border: '1px solid rgba(206, 147, 169, 0.35)',
        boxShadow: '0 14px 28px rgba(204, 132, 158, 0.18)',
      };

  const accentCard = isMale
    ? {
        background: 'linear-gradient(145deg, rgba(247,250,255,0.98) 0%, rgba(232,241,253,0.98) 100%)',
        border: '#D5E2F4',
        shadow: '0 18px 34px rgba(138, 169, 214, 0.14)',
        iconBg: 'linear-gradient(135deg, #D5E5FB 0%, #C3D8F4 100%)',
        iconColor: '#4F6786',
      }
    : {
        background: 'linear-gradient(145deg, rgba(255,247,244,0.98) 0%, rgba(251,231,236,0.98) 100%)',
        border: '#ECD8D9',
        shadow: '0 18px 34px rgba(210, 174, 169, 0.15)',
        iconBg: 'linear-gradient(135deg, #F7CAD8 0%, #E6B8C7 100%)',
        iconColor: '#83485F',
      };

  return (
    <section
      className="relative overflow-hidden rounded-[34px] mx-4 mt-3 p-4"
      dir="rtl"
      style={{
        background: theme.gradientCard,
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: `0 26px 54px ${theme.primaryShadow}`,
      }}
    >
      <div className="absolute inset-0 opacity-90" style={{ background: heroGlow }} />
      <div className="absolute -left-8 bottom-[-18px] w-40 h-40 rounded-full" style={{ background: orbGlow }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={onSOSClick}
            className="h-12 min-w-[108px] px-5 rounded-[20px] flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ ...sosButton, fontWeight: 900 }}
            aria-label="SOS"
          >
            <Siren size={18} strokeWidth={1.9} />
            <span>SOS</span>
          </button>

          <div className="text-right">
            <p className="text-[28px] leading-none" style={{ color: theme.primaryDark, fontWeight: 900 }}>
              {timeString}
            </p>
            <p className="text-sm mt-1" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
              {dateString}
            </p>
          </div>
        </div>

        <div className="mt-5 text-right">
          <div className="flex items-center justify-start gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isMale ? 'rgba(210, 225, 248, 0.72)' : 'rgba(246, 211, 221, 0.66)', color: theme.primaryDark }}
            >
              <Heart size={16} strokeWidth={2} />
            </div>
            <p className="text-base" style={{ color: theme.primaryDark, fontWeight: 800 }}>
              {greeting}, {displayName}
            </p>
          </div>

          <h2
            className="text-[28px] leading-tight mt-2.5 text-right"
            style={{ color: '#594841', fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            {genderedText(userProfile.gender, 'איך את מרגישה היום?', 'איך אתה מרגיש היום?')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {quickActions.map((action, index) => {
            const accent = index === 1 || index === 3;

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
                style={{
                  minHeight: 104,
                  background: accent ? accentCard.background : 'rgba(255,255,255,0.82)',
                  border: `1px solid ${accent ? accentCard.border : theme.primaryBorder}`,
                  boxShadow: accent ? accentCard.shadow : '0 12px 28px rgba(160, 134, 122, 0.08)',
                }}
              >
                <div className="flex flex-col items-start h-full text-right">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: accent ? accentCard.iconBg : theme.primaryBg,
                      color: accent ? accentCard.iconColor : theme.primaryDark,
                    }}
                  >
                    {action.icon}
                  </div>

                  <div className="text-right mt-auto w-full">
                    <p style={{ color: '#5A4740', fontWeight: 900 }}>{action.label}</p>
                    <p style={{ color: '#947D74', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                      {action.note}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <CompactStatus
            label="סוכר אחרון"
            value={latestSugar ? `${latestSugar.level} mg/dL` : 'עוד לא נמדד'}
            theme={theme}
          />
          <CompactStatus
            label="התרופה הבאה"
            value={nextMedication ? `${nextMedication.name} · ${formatClock(nextMedication.time)}` : 'לא הוגדרה'}
            theme={theme}
          />
        </div>
      </div>
    </section>
  );
}

function CompactStatus({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <div
      className="rounded-[22px] p-4 text-right"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 24px rgba(160, 134, 122, 0.06)',
      }}
    >
      <p style={{ color: '#9A8379', fontSize: 12, fontWeight: 800 }}>{label}</p>
      <p style={{ color: '#5B4740', fontWeight: 900, marginTop: 8, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}
