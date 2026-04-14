import { X, TrendingUp, TrendingDown, Minus, Share2, Droplets, UtensilsCrossed, Pill } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

interface HistoryScreenProps {
  onClose: () => void;
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function isWithinLastDays(isoDate: string, days: number) {
  const targetTime = new Date(isoDate).getTime();
  const minTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return targetTime >= minTime;
}

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getLevelStatus(level: number, low: number, high: number): { label: string; color: string; bg: string } {
  if (level < low) return { label: 'נמוך', color: '#DC2626', bg: '#FEF2F2' };
  if (level > high) return { label: 'גבוה', color: '#D97706', bg: '#FEF3C7' };
  return { label: 'בטווח', color: '#16A34A', bg: '#F0FDF4' };
}

function getTrend(current: number, previous: number | null): 'up' | 'down' | 'stable' {
  if (previous === null) return 'stable';
  if (current - previous >= 10) return 'up';
  if (previous - current >= 10) return 'down';
  return 'stable';
}

export function HistoryScreen({ onClose }: HistoryScreenProps) {
  const {
    theme,
    sugarLogs,
    mealLogs,
    medicationLogs,
    medicationSchedule,
    userProfile,
  } = useAppContext();

  const targetLow = Number(userProfile.targetLow || 80);
  const targetHigh = Number(userProfile.targetHigh || 140);

  const weeklySugarLogs = useMemo(
    () => sugarLogs.filter((log) => isWithinLastDays(log.loggedAt, 7)),
    [sugarLogs]
  );

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dateKey = getDateKey(date);
      const dayLogs = weeklySugarLogs.filter((log) => log.dateKey === dateKey);
      const value = dayLogs.length
        ? Math.round(dayLogs.reduce((sum, log) => sum + log.level, 0) / dayLogs.length)
        : 0;

      return {
        label: DAY_LABELS[date.getDay()],
        value,
        dateKey,
        hasData: dayLogs.length > 0,
      };
    });
  }, [weeklySugarLogs]);

  const activeChartValues = chartData.filter((day) => day.hasData).map((day) => day.value);
  const avgLevel = activeChartValues.length
    ? Math.round(activeChartValues.reduce((sum, value) => sum + value, 0) / activeChartValues.length)
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

  const recentSugarLogs = sugarLogs.slice(0, 8).map((log, index, array) => ({
    ...log,
    trend: getTrend(log.level, array[index + 1]?.level ?? null),
  }));

  const weeklyMealLogs = mealLogs.filter((meal) => isWithinLastDays(meal.loggedAt, 7));
  const averageMealCarbs = weeklyMealLogs.length
    ? Math.round(
        weeklyMealLogs.reduce((sum, meal) => sum + meal.carbs, 0) / weeklyMealLogs.length
      )
    : null;

  const todayKey = getDateKey(new Date());
  const medicationDoneToday = medicationLogs.filter((log) => log.dateKey === todayKey).length;
  const medicationProgress = medicationSchedule.length
    ? Math.round((medicationDoneToday / medicationSchedule.length) * 100)
    : 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'דו״ח סוכרת שבועי',
        text: `ממוצע שבועי: ${avgLevel ?? '--'} mg/dL | בטווח: ${inRangePercent ?? '--'}% | ארוחות רשומות: ${weeklyMealLogs.length}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right" style={{ background: theme.gradientFull }}>
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 pt-12 pb-4"
        style={{ backgroundColor: theme.headerBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${theme.primaryBorder}` }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ border: `1.5px solid ${theme.primaryBorder}`, backgroundColor: 'white' }}
          aria-label="סגור"
        >
          <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
        </button>

        <div className="text-center">
          <h1 className="text-lg" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.03em' }}>
            היסטוריה ודוחות
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontWeight: 500 }}>
            7 הימים האחרונים
          </p>
        </div>

        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
        >
          <Share2 size={16} strokeWidth={2} style={{ color: theme.primary }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'ממוצע שבועי', value: avgLevel ? `${avgLevel}` : '--', suffix: 'mg/dL', color: theme.primary, bg: theme.primaryBg },
            { label: 'בטווח היעד', value: inRangePercent !== null ? `${inRangePercent}%` : '--', suffix: `${targetLow}-${targetHigh}`, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'ארוחות השבוע', value: String(weeklyMealLogs.length), suffix: averageMealCarbs ? `${averageMealCarbs} גרם בממוצע` : 'אין נתונים', color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'תרופות היום', value: `${medicationProgress}%`, suffix: `${medicationDoneToday}/${medicationSchedule.length || 0} סומנו`, color: '#D97706', bg: '#FFF7ED' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 text-center"
              style={{ backgroundColor: stat.bg, border: `1.5px solid ${stat.bg}` }}
            >
              <p className="text-2xl leading-none mb-1" style={{ color: stat.color, fontWeight: 900 }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: stat.color, fontWeight: 600, opacity: 0.78 }}>
                {stat.suffix}
              </p>
              <p className="text-xs mt-2" style={{ color: stat.color, fontWeight: 700 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div
          className="bg-white rounded-2xl p-4"
          style={{
            border: '1.5px solid #F3F4F6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 6px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: '#FCA5A5' }} />
                <span className="text-xs" style={{ color: '#9CA3AF', fontWeight: 500 }}>גבוה ({targetHigh})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: '#86EFAC' }} />
                <span className="text-xs" style={{ color: '#9CA3AF', fontWeight: 500 }}>יעד ({targetLow}-{targetHigh})</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#1F2937', fontWeight: 700 }}>
              ממוצעי סוכר לפי יום
            </p>
          </div>

          <div className="relative" style={{ height: '140px' }}>
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${(targetHigh / 220) * 100}%`,
                borderTop: '1.5px dashed #FCA5A5',
                zIndex: 1,
              }}
            />
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${(targetLow / 220) * 100}%`,
                borderTop: '1.5px dashed #86EFAC',
                zIndex: 1,
              }}
            />

            <div className="absolute inset-0 flex items-end justify-between gap-1.5 px-1">
              {chartData.map((day) => {
                const status = getLevelStatus(day.value || targetLow, targetLow, targetHigh);
                const barHeight = day.hasData ? `${Math.max((day.value / 220) * 100, 8)}%` : '6%';

                return (
                  <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-1">
                    <span
                      className="text-xs"
                      style={{ color: day.hasData ? status.color : '#CBD5E1', fontWeight: 700 }}
                    >
                      {day.hasData ? day.value : '--'}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 relative"
                      style={{
                        height: barHeight,
                        background: day.hasData
                          ? day.value > targetHigh
                            ? 'linear-gradient(180deg, #FBBF24 0%, #FDE68A 100%)'
                            : day.value < targetLow
                            ? 'linear-gradient(180deg, #FB7185 0%, #FECDD3 100%)'
                            : theme.gradientCard
                          : '#E2E8F0',
                        boxShadow: day.hasData ? `0 2px 8px ${theme.primaryShadow}` : 'none',
                      }}
                    />
                    <span
                      style={{
                        color: '#64748B',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <SectionTitle title="יומן מדידות" />
        <div className="space-y-2.5">
          {recentSugarLogs.length === 0 && (
            <EmptyCard text="עדיין אין מדידות סוכר. ברגע שתתחיל/י לרשום, יוצגו כאן מגמות אמיתיות." />
          )}

          {recentSugarLogs.map((log) => {
            const status = getLevelStatus(log.level, targetLow, targetHigh);
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ border: '1.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F8FAFC' }}
                >
                  <Droplets size={18} strokeWidth={1.6} style={{ color: theme.primary }} />
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <span className="text-sm" style={{ color: '#334155', fontWeight: 700 }}>
                    {log.contextLabel}
                  </span>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                    {new Date(log.loggedAt).toLocaleDateString('he-IL')} •{' '}
                    {new Date(log.loggedAt).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    {log.trend === 'up' && <TrendingUp size={14} strokeWidth={2} style={{ color: '#D97706' }} />}
                    {log.trend === 'down' && <TrendingDown size={14} strokeWidth={2} style={{ color: '#16A34A' }} />}
                    {log.trend === 'stable' && <Minus size={14} strokeWidth={2} style={{ color: '#6B7280' }} />}
                    <span className="text-base" style={{ color: status.color, fontWeight: 900 }}>
                      {log.level}
                    </span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: status.bg, color: status.color, fontWeight: 700 }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <SectionTitle title="ארוחות אחרונות" />
        <div className="space-y-2.5">
          {mealLogs.slice(0, 6).length === 0 && (
            <EmptyCard text="עדיין אין ארוחות ביומן. אחרי צילום או הוספה ידנית, הן יופיעו כאן." />
          )}

          {mealLogs.slice(0, 6).map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ border: '1.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                {meal.icon}
              </div>

              <div className="flex-1 text-right">
                <p style={{ color: '#1F2937', fontWeight: 800 }}>{meal.name}</p>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {meal.servingLabel || 'פריט ביומן הארוחות'}
                </p>
              </div>

              <div className="text-left flex-shrink-0">
                <div
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 800 }}
                >
                  {meal.carbs} גרם
                </div>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                  {new Date(meal.loggedAt).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCard
            icon={<UtensilsCrossed size={18} strokeWidth={1.75} style={{ color: '#7C3AED' }} />}
            title="פחמימות ממוצעות"
            text={
              averageMealCarbs !== null
                ? `ב-7 הימים האחרונים ממוצע הפחמימות שלך לארוחה הוא ${averageMealCarbs} גרם.`
                : 'כדי לקבל ממוצע ארוחות, צריך להתחיל לצלם או להוסיף מזון ליומן.'
            }
            background="#F5F3FF"
            border="#DDD6FE"
          />
          <SummaryCard
            icon={<Pill size={18} strokeWidth={1.75} style={{ color: '#D97706' }} />}
            title="עמידה בתרופות"
            text={
              medicationSchedule.length > 0
                ? `היום סומנו ${medicationDoneToday} מתוך ${medicationSchedule.length} תזכורות תרופה.`
                : 'עדיין לא הוגדרו תרופות. אפשר להוסיף אותן במסך התרופות או בהרשמה.'
            }
            background="#FFF7ED"
            border="#FED7AA"
          />
        </div>

        {avgLevel !== null && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <Droplets size={20} strokeWidth={1.5} style={{ color: theme.primary }} />
            <p className="text-sm text-right flex-1" style={{ color: '#1E3A5F', fontWeight: 600 }}>
              ממוצע הסוכר השבועי שלך הוא <strong>{avgLevel} mg/dL</strong>.{' '}
              {inRangePercent !== null && inRangePercent >= 70
                ? 'נראה שיש יציבות יחסית טובה בטווח היעד.'
                : 'יש מקום לשפר יציבות דרך מעקב עקבי אחר ארוחות, תרופות ומדידות.'}
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p
      className="text-xs uppercase tracking-widest"
      style={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.12em' }}
    >
      {title}
    </p>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-4 text-sm text-right"
      style={{ backgroundColor: '#FFFFFF', color: '#64748B', border: '1.5px solid #E2E8F0' }}
    >
      {text}
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  text,
  background,
  border,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  background: string;
  border: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: background, border: `1.5px solid ${border}` }}
    >
      <div className="flex items-center justify-end gap-2 mb-2">
        <p style={{ color: '#1F2937', fontWeight: 800 }}>{title}</p>
        {icon}
      </div>
      <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}
