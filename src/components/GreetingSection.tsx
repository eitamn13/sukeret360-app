import { useMemo } from 'react';
import { Siren } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAppContext, genderedText } from '../context/AppContext';

function isWithinLastDays(isoDate: string, days: number) {
  const targetTime = new Date(isoDate).getTime();
  const minTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return targetTime >= minTime;
}

interface GreetingSectionProps {
  onSOSClick?: () => void;
}

export function GreetingSection({ onSOSClick }: GreetingSectionProps) {
  const { timeString, greeting, dateString } = useCurrentTime();
  const {
    userProfile,
    theme,
    sugarLogs,
    todayMeals,
    medicationSchedule,
    medicationLogs,
  } = useAppContext();

  const displayName = userProfile.name || genderedText(userProfile.gender, 'אורחת', 'אורח');
  const gender = userProfile.gender;
  const targetLow = Number(userProfile.targetLow || 80);
  const targetHigh = Number(userProfile.targetHigh || 140);

  const latestSugar = sugarLogs[0];
  const weeklySugarLogs = useMemo(
    () => sugarLogs.filter((log) => isWithinLastDays(log.loggedAt, 7)),
    [sugarLogs]
  );
  const weeklyAverage = weeklySugarLogs.length
    ? Math.round(
        weeklySugarLogs.reduce((sum, log) => sum + log.level, 0) / weeklySugarLogs.length
      )
    : null;
  const inRangePercent = weeklySugarLogs.length
    ? Math.round(
        (weeklySugarLogs.filter(
          (log) => log.level >= targetLow && log.level <= targetHigh
        ).length /
          weeklySugarLogs.length) *
          100
      )
    : null;

  const todayKey = new Date().toISOString().split('T')[0];
  const medicationDoneCount = medicationLogs.filter((log) => log.dateKey === todayKey).length;
  const medicationProgress =
    medicationSchedule.length > 0
      ? Math.round((medicationDoneCount / medicationSchedule.length) * 100)
      : null;

  const feelingText = genderedText(
    gender,
    'הנה תמונת המצב של היום שלך במקום אחד.',
    'הנה תמונת המצב של היום שלך במקום אחד.'
  );

  const connectedText = genderedText(gender, 'מחוברת', 'מחובר');
  const personalGreeting = `${greeting}, ${displayName}!`;

  const quickStats = [
    {
      label: 'סוכר אחרון',
      value: latestSugar ? String(latestSugar.level) : '--',
      suffix: latestSugar ? 'mg/dL' : 'התחל/י רישום',
    },
    {
      label: 'ממוצע 7 ימים',
      value: weeklyAverage ? String(weeklyAverage) : '--',
      suffix: weeklyAverage ? 'mg/dL' : 'אין מספיק נתונים',
    },
    {
      label: 'בטווח היעד',
      value: inRangePercent !== null ? `${inRangePercent}%` : '--',
      suffix: `${targetLow}-${targetHigh} mg/dL`,
    },
    {
      label: 'היום עד עכשיו',
      value:
        medicationProgress !== null
          ? `${medicationProgress}%`
          : `${todayMeals.length}`,
      suffix:
        medicationProgress !== null
          ? 'עמידה בתרופות'
          : `${todayMeals.length} ארוחות`,
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-6"
      style={{
        background: theme.gradientCard,
        boxShadow: `0 12px 40px ${theme.primaryShadow}`,
        transition: 'background 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.8) 24px, rgba(255,255,255,0.8) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.8) 24px, rgba(255,255,255,0.8) 25px)',
        }}
      />

      <div
        className="absolute top-[-30px] left-[-30px] w-48 h-48 rounded-full opacity-[0.08]"
        style={{ background: 'rgba(255,255,255,0.5)' }}
      />

      <div
        className="absolute bottom-[-40px] right-[-20px] w-60 h-60 rounded-full opacity-[0.06]"
        style={{ background: 'rgba(255,255,255,0.6)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl text-white leading-none" style={{ fontWeight: 900 }}>
              {timeString}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}
            >
              {dateString}
            </p>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 600,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
            {connectedText}
          </div>
        </div>

        <div className="mt-5">
          <h2
            className="text-3xl text-white leading-tight"
            style={{ fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {personalGreeting}
          </h2>

          <p
            className="text-sm mt-1"
            style={{ color: 'rgba(255,255,255,0.68)', fontWeight: 400 }}
          >
            {feelingText}
          </p>
        </div>

        <div
          className="mt-5 rounded-2xl p-3"
          style={{
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}
                >
                  {stat.label}
                </p>
                <p className="text-2xl text-white" style={{ fontWeight: 900 }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {stat.suffix}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div
            className="rounded-2xl px-4 py-3 flex-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 700 }}>
              מדידה אחרונה
            </p>
            <p style={{ color: 'white', fontWeight: 800, marginTop: 4 }}>
              {latestSugar
                ? `${latestSugar.contextLabel} • ${new Date(latestSugar.loggedAt).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'עדיין לא נרשמה מדידת סוכר היום'}
            </p>
          </div>

          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 700 }}>
              ארוחות היום
            </p>
            <p style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>{todayMeals.length}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="rounded-2xl px-4 py-3 flex-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 700 }}>
              לחצן חירום
            </p>
            <p style={{ color: 'white', fontWeight: 700, marginTop: 4, lineHeight: 1.6 }}>
              נגיש תמיד, אבל כבר לא מפריע לצ׳אט, לטפסים או ללחצנים אחרים.
            </p>
          </div>

          <button
            onClick={onSOSClick}
            className="h-[60px] px-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
              color: '#FFFFFF',
              fontWeight: 900,
              boxShadow: '0 12px 24px rgba(185, 28, 28, 0.24)',
            }}
            aria-label="SOS"
          >
            <Siren size={18} strokeWidth={1.9} />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
