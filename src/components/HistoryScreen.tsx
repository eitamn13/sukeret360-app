import { useMemo } from 'react';
import { Droplets, Pill, Share2, UtensilsCrossed } from 'lucide-react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';

interface HistoryScreenProps {
  onClose: () => void;
}

function isWithinLastDays(isoDate: string, days: number) {
  const targetTime = new Date(isoDate).getTime();
  const minTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return targetTime >= minTime;
}

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getLevelStatus(level: number, low: number, high: number) {
  if (level < low) return { label: 'נמוך', color: '#DC2626', bg: '#FEF2F2' };
  if (level > high) return { label: 'גבוה', color: '#D97706', bg: '#FFF7ED' };
  return { label: 'בטווח', color: '#16A34A', bg: '#F0FDF4' };
}

export function HistoryScreen({ onClose }: HistoryScreenProps) {
  const { theme, sugarLogs, mealLogs, medicationLogs, medicationSchedule, userProfile } = useAppContext();

  const targetLow = Number(userProfile.targetLow || 80);
  const targetHigh = Number(userProfile.targetHigh || 140);
  const todayKey = getDateKey(new Date());

  const weeklySugarLogs = useMemo(
    () => sugarLogs.filter((log) => isWithinLastDays(log.loggedAt, 7)),
    [sugarLogs]
  );

  const weeklyMealLogs = useMemo(
    () => mealLogs.filter((meal) => isWithinLastDays(meal.loggedAt, 7)),
    [mealLogs]
  );

  const avgLevel = weeklySugarLogs.length
    ? Math.round(weeklySugarLogs.reduce((sum, log) => sum + log.level, 0) / weeklySugarLogs.length)
    : null;

  const inRangePercent = weeklySugarLogs.length
    ? Math.round(
        (weeklySugarLogs.filter((log) => log.level >= targetLow && log.level <= targetHigh).length /
          weeklySugarLogs.length) *
          100
      )
    : null;

  const mealAverageCarbs = weeklyMealLogs.length
    ? Math.round(weeklyMealLogs.reduce((sum, meal) => sum + meal.carbs, 0) / weeklyMealLogs.length)
    : null;

  const medicationDoneToday = medicationLogs.filter((log) => log.dateKey === todayKey).length;
  const medicationProgress = medicationSchedule.length
    ? Math.round((medicationDoneToday / medicationSchedule.length) * 100)
    : 0;

  const recentSugarLogs = sugarLogs.slice(0, 5);
  const recentMeals = mealLogs.slice(0, 5);

  const todayMedicationStatus = medicationSchedule.map((item) => {
    const taken = medicationLogs.some(
      (log) => log.dateKey === todayKey && log.medicationId === item.id
    );

    return {
      ...item,
      taken,
    };
  });

  const handleShare = async () => {
    const text = `ממוצע שבועי: ${avgLevel ?? '--'} mg/dL | בטווח: ${inRangePercent ?? '--'}% | ארוחות השבוע: ${weeklyMealLogs.length}`;

    if (navigator.share) {
      await navigator.share({
        title: 'הסוכרת שלי',
        text,
      });
      return;
    }

    await navigator.clipboard?.writeText(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="היסטוריה"
        subtitle="סוכר, ארוחות ותרופות"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
          <button
            onClick={() => void handleShare()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{
              backgroundColor: '#FFFFFF',
              color: theme.primary,
              border: `1px solid ${theme.primaryBorder}`,
            }}
            aria-label="שיתוף"
          >
            <Share2 size={18} strokeWidth={1.8} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TopCard
            title="ממוצע שבועי"
            value={avgLevel !== null ? `${avgLevel}` : '--'}
            hint="mg/dL"
            color={theme.primary}
            background={theme.primaryBg}
          />
          <TopCard
            title="בטווח היעד"
            value={inRangePercent !== null ? `${inRangePercent}%` : '--'}
            hint={`${targetLow}-${targetHigh}`}
            color="#16A34A"
            background="#F0FDF4"
          />
          <TopCard
            title="ארוחות השבוע"
            value={String(weeklyMealLogs.length)}
            hint={mealAverageCarbs !== null ? `${mealAverageCarbs} גרם בממוצע` : 'אין מספיק נתונים'}
            color="#7C3AED"
            background="#F5F3FF"
          />
          <TopCard
            title="תרופות היום"
            value={`${medicationProgress}%`}
            hint={`${medicationDoneToday}/${medicationSchedule.length || 0}`}
            color="#D97706"
            background="#FFF7ED"
          />
        </div>

        <InsightCard
          title="סיכום קצר"
          text={
            avgLevel === null
              ? 'עדיין אין מספיק נתונים. ברגע שתתחיל לרשום סוכר וארוחות, נראה כאן תמונה אמיתית.'
              : inRangePercent !== null && inRangePercent >= 70
                ? `נראה שיש יציבות יפה השבוע. ממוצע הסוכר הוא ${avgLevel} mg/dL ו-${inRangePercent}% מהמדידות היו בטווח.`
                : `יש מקום ליותר יציבות. ממוצע הסוכר השבועי הוא ${avgLevel} mg/dL, ולכן כדאי להמשיך לעקוב אחרי ארוחות, תרופות ומדידות.`
          }
          themeColor={theme.primary}
          background={`linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`}
          border={theme.primaryBorder}
        />

        <SectionTitle title="מדידות אחרונות" />
        <div className="space-y-3">
          {recentSugarLogs.length === 0 && <EmptyCard text="עדיין אין מדידות סוכר." />}

          {recentSugarLogs.map((log) => {
            const status = getLevelStatus(log.level, targetLow, targetHigh);

            return (
              <div
                key={log.id}
                className="bg-white rounded-3xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  border: `1px solid ${theme.primaryBorder}`,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
                >
                  <Droplets size={18} strokeWidth={1.8} />
                </div>

                <div className="flex-1 text-right min-w-0">
                  <p style={{ color: '#0F172A', fontWeight: 900 }}>{log.contextLabel}</p>
                  <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                    {new Date(log.loggedAt).toLocaleDateString('he-IL')} ·{' '}
                    {new Date(log.loggedAt).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-left flex-shrink-0">
                  <p style={{ color: status.color, fontWeight: 900, fontSize: 20 }}>{log.level}</p>
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: status.bg, color: status.color, fontWeight: 800 }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <SectionTitle title="ארוחות אחרונות" />
        <div className="space-y-3">
          {recentMeals.length === 0 && <EmptyCard text="עדיין אין ארוחות ביומן." />}

          {recentMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-3xl px-4 py-3.5 flex items-center gap-3"
              style={{
                border: `1px solid ${theme.primaryBorder}`,
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                {meal.icon}
              </div>

              <div className="flex-1 text-right min-w-0">
                <p style={{ color: '#0F172A', fontWeight: 900 }}>{meal.name}</p>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {meal.servingLabel || 'פריט שנשמר ביומן הארוחות'}
                </p>
              </div>

              <div className="text-left flex-shrink-0">
                <div
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 800 }}
                >
                  {meal.carbs} גרם
                </div>
                <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 6 }}>
                  {new Date(meal.loggedAt).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle title="לוח תרופות להיום" />
        <div className="space-y-3">
          {todayMedicationStatus.length === 0 && <EmptyCard text="עדיין לא הוגדרו תרופות." />}

          {todayMedicationStatus.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl px-4 py-3.5 flex items-center gap-3"
              style={{
                border: `1px solid ${theme.primaryBorder}`,
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: item.taken ? '#F0FDF4' : theme.primaryBg,
                  color: item.taken ? '#16A34A' : theme.primary,
                }}
              >
                <Pill size={18} strokeWidth={1.8} />
              </div>

              <div className="flex-1 text-right min-w-0">
                <p style={{ color: '#0F172A', fontWeight: 900 }}>{item.name}</p>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {item.time} · {item.dosage}
                </p>
              </div>

              <span
                className="px-3 py-1 rounded-full text-xs flex-shrink-0"
                style={{
                  backgroundColor: item.taken ? '#F0FDF4' : '#FFF7ED',
                  color: item.taken ? '#15803D' : '#C2410C',
                  fontWeight: 800,
                }}
              >
                {item.taken ? 'סומן' : 'ממתין'}
              </span>
            </div>
          ))}
        </div>

        <div className="pb-4" />
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p
      className="text-xs uppercase tracking-widest"
      style={{ color: '#94A3B8', fontWeight: 800, letterSpacing: '0.12em' }}
    >
      {title}
    </p>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-3xl p-4 text-sm text-right"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#64748B',
        border: '1px solid #E2E8F0',
      }}
    >
      {text}
    </div>
  );
}

function TopCard({
  title,
  value,
  hint,
  color,
  background,
}: {
  title: string;
  value: string;
  hint: string;
  color: string;
  background: string;
}) {
  return (
    <div
      className="rounded-3xl p-4 text-right"
      style={{
        backgroundColor: background,
        border: `1px solid ${background}`,
      }}
    >
      <p style={{ color, fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{value}</p>
      <p style={{ color, opacity: 0.78, fontSize: 12, fontWeight: 700, marginTop: 6 }}>{hint}</p>
      <p style={{ color: '#334155', fontWeight: 800, marginTop: 10 }}>{title}</p>
    </div>
  );
}

function InsightCard({
  title,
  text,
  themeColor,
  background,
  border,
}: {
  title: string;
  text: string;
  themeColor: string;
  background: string;
  border: string;
}) {
  return (
    <div
      className="rounded-3xl p-4"
      style={{
        background,
        border: `1px solid ${border}`,
      }}
    >
      <div className="flex items-center justify-end gap-2 mb-2">
        <p style={{ color: '#0F172A', fontWeight: 900 }}>{title}</p>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: themeColor, color: '#FFFFFF' }}
        >
          <UtensilsCrossed size={18} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{ color: '#475569', lineHeight: 1.8, fontSize: 14 }}>{text}</p>
    </div>
  );
}
