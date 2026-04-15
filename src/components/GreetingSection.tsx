import { Activity, ShieldCheck, Siren, Sparkles, TimerReset, Target } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAppContext, genderedText } from '../context/AppContext';

function isWithinLastDays(isoDate: string, days: number) {
  const targetTime = new Date(isoDate).getTime();
  const minTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return targetTime >= minTime;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatClock(time: string) {
  return time || '--:--';
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

  const displayName = userProfile.name || genderedText(userProfile.gender, 'יקרה', 'יקר');
  const targetLow = Number(userProfile.targetLow || 80);
  const targetHigh = Number(userProfile.targetHigh || 140);
  const latestSugar = sugarLogs[0];

  const weeklySugarLogs = useMemo(
    () => sugarLogs.filter((log) => isWithinLastDays(log.loggedAt, 7)),
    [sugarLogs]
  );

  const weeklyAverage = weeklySugarLogs.length
    ? Math.round(weeklySugarLogs.reduce((sum, log) => sum + log.level, 0) / weeklySugarLogs.length)
    : null;

  const inRangePercent = weeklySugarLogs.length
    ? Math.round(
        (weeklySugarLogs.filter((log) => log.level >= targetLow && log.level <= targetHigh).length /
          weeklySugarLogs.length) *
          100
      )
    : null;

  const todayKey = new Date().toISOString().split('T')[0];
  const medicationDoneCount = medicationLogs.filter((log) => log.dateKey === todayKey).length;
  const medicationProgress = medicationSchedule.length > 0
    ? Math.round((medicationDoneCount / medicationSchedule.length) * 100)
    : 0;
  const mealProgress = todayMeals.length === 0 ? 18 : clamp(todayMeals.length * 34, 18, 100);

  const stabilityScore = Math.round(
    ((inRangePercent ?? 58) * 0.55) + (medicationProgress * 0.28) + (mealProgress * 0.17)
  );

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

  const nextFocus = useMemo(() => {
    if (!latestSugar) {
      return 'מדידת סוכר אחת עכשיו תיתן לאפליקציה בסיס טוב יותר להמשך היום.';
    }

    if (latestSugar.level < targetLow) {
      return 'הערך האחרון נמוך. כדאי לטפל בירידה ורק אחר כך לעבור לפעולה הבאה.';
    }

    if (latestSugar.level > targetHigh) {
      return 'הערך האחרון גבוה. עדיף לבחור כרגע ארוחה רגועה יותר ולעקוב שוב אחריה.';
    }

    if (todayMeals.length === 0) {
      return 'היום עוד לא נרשמה ארוחה. צילום קצר של מה שאכלת ישמור את התמונה המלאה.';
    }

    if (medicationProgress < 100 && medicationSchedule.length > 0) {
      return 'יש עוד תרופות פתוחות להיום. סימון בזמן ישמור את היומן שלך מדויק ושקט.';
    }

    return 'היום נראה מאוזן יחסית. שווה לשמור על הקצב ולהמשיך לעקוב ברוגע.';
  }, [latestSugar, medicationProgress, medicationSchedule.length, targetHigh, targetLow, todayMeals.length]);

  const radarText = useMemo(() => {
    if (nextMedication) {
      return `${nextMedication.name} מתוכנ${userProfile.gender === 'male' ? 'ן' : 'נת'} ל־${formatClock(nextMedication.time)}.`;
    }

    if (todayMeals.length === 0) {
      return 'עדיין אין ארוחות היום. צילום ארוחה אחת ייתן תחזית טובה יותר להמשך.';
    }

    return 'שלוש השעות הקרובות נראות שקטות. זה זמן טוב לשתייה, הליכה קלה או בדיקה קצרה.';
  }, [nextMedication, todayMeals.length, userProfile.gender]);

  const quickStats = [
    {
      label: 'סוכר אחרון',
      value: latestSugar ? String(latestSugar.level) : '--',
      suffix: latestSugar ? 'mg/dL' : 'מחכה למדידה',
    },
    {
      label: 'ממוצע שבועי',
      value: weeklyAverage ? String(weeklyAverage) : '--',
      suffix: weeklyAverage ? 'mg/dL' : 'עדיין נבנה',
    },
    {
      label: 'בטווח היעד',
      value: inRangePercent !== null ? `${inRangePercent}%` : '--',
      suffix: `${targetLow}-${targetHigh}`,
    },
    {
      label: 'תרופות היום',
      value: medicationSchedule.length > 0 ? `${medicationProgress}%` : '--',
      suffix: medicationSchedule.length > 0 ? 'עמידה בלוח' : 'עוד לא הוגדר',
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[32px] mx-4 mt-4 p-6"
      style={{
        background: theme.gradientCard,
        boxShadow: `0 24px 54px ${theme.primaryShadow}`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.8) 0, transparent 18%), radial-gradient(circle at 86% 12%, rgba(255,255,255,0.42) 0, transparent 20%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 28px 28px, 28px 28px',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onSOSClick}
            className="h-11 px-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.12)',
              fontWeight: 900,
            }}
            aria-label="פתיחת מרכז החירום"
          >
            <Siren size={18} strokeWidth={1.9} />
            <span>חירום</span>
          </button>

          <div className="text-right">
            <p className="text-4xl text-white leading-none" style={{ fontWeight: 900 }}>
              {timeString}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
              {dateString}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 800,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
            מסונכרן
          </div>

          <div className="text-right">
            <h2 className="text-3xl text-white leading-tight" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
              {greeting}, {displayName}
            </h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              כל מה שחשוב להיום מרוכז כאן בצורה נקייה, רגועה וברורה.
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-[26px] p-3.5"
          style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(10px)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-3.5 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.11)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.66)', fontWeight: 700 }}>
                  {stat.label}
                </p>
                <p className="text-2xl text-white" style={{ fontWeight: 900 }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.56)' }}>
                  {stat.suffix}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div
            className="rounded-[24px] p-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}
              >
                <Activity size={20} strokeWidth={1.9} />
              </div>

              <div className="text-right flex-1">
                <p style={{ color: 'rgba(255,255,255,0.74)', fontSize: 12, fontWeight: 800 }}>
                  מדד יציבות יומי
                </p>
                <div className="flex items-end justify-end gap-2 mt-1">
                  <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 30 }}>{stabilityScore}</span>
                  <span style={{ color: 'rgba(255,255,255,0.68)', fontWeight: 700, fontSize: 13 }}>
                    מתוך 100
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${clamp(stabilityScore, 12, 100)}%`,
                  background: 'linear-gradient(90deg, #A7F3D0 0%, #FFFFFF 100%)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
              <div className="flex items-center justify-end gap-2">
                <p style={{ color: '#FFFFFF', fontWeight: 800 }}>הצעד הבא</p>
                <Target size={16} strokeWidth={1.8} color="#FFFFFF" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.8, marginTop: 10 }}>
                {nextFocus}
              </p>
            </div>

            <div className="rounded-[24px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
              <div className="flex items-center justify-end gap-2">
                <p style={{ color: '#FFFFFF', fontWeight: 800 }}>מכ"ם 3 השעות הקרובות</p>
                <TimerReset size={16} strokeWidth={1.8} color="#FFFFFF" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.8, marginTop: 10 }}>
                {radarText}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-end gap-2">
                <p style={{ color: '#FFFFFF', fontWeight: 800 }}>מצב אחרון</p>
                <ShieldCheck size={16} strokeWidth={1.8} color="#FFFFFF" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.8, marginTop: 10 }}>
                {latestSugar
                  ? `${latestSugar.contextLabel} · ${new Date(latestSugar.loggedAt).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'עדיין לא נרשמה מדידה היום'}
              </p>
            </div>

            <div className="rounded-[22px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-end gap-2">
                <p style={{ color: '#FFFFFF', fontWeight: 800 }}>פיצ'ר ייחודי</p>
                <Sparkles size={16} strokeWidth={1.8} color="#FFFFFF" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.8, marginTop: 10 }}>
                המדד היומי והמכ"ם האישי מחברים בין סוכר, תרופות וארוחות לתמונה אחת.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
