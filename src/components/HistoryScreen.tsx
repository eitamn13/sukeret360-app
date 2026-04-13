import { X, TrendingUp, TrendingDown, Minus, Share2, Droplets } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface HistoryScreenProps {
  onClose: () => void;
}

interface LogEntry {
  id: string;
  date: string;
  time: string;
  level: number;
  context: string;
  contextIcon: string;
  trend: 'up' | 'down' | 'stable';
}

interface ChartDay {
  day: string;
  value: number;
  label: string;
}

const chartData: ChartDay[] = [
  { day: 'ראש', value: 142, label: 'א' },
  { day: 'שני', value: 118, label: 'ב' },
  { day: 'שלישי', value: 165, label: 'ג' },
  { day: 'רביעי', value: 134, label: 'ד' },
  { day: 'חמישי', value: 108, label: 'ה' },
  { day: 'שישי', value: 127, label: 'ו' },
  { day: 'שבת', value: 152, label: 'ש' },
];

const logs: LogEntry[] = [
  { id: 'l1', date: 'היום', time: '08:15', level: 127, context: 'לפני ארוחת בוקר', contextIcon: '☀️', trend: 'stable' },
  { id: 'l2', date: 'היום', time: '12:40', level: 152, context: 'אחרי ארוחת צהריים', contextIcon: '🍽️', trend: 'up' },
  { id: 'l3', date: 'אתמול', time: '07:55', level: 108, context: 'לפני ארוחת בוקר', contextIcon: '☀️', trend: 'down' },
  { id: 'l4', date: 'אתמול', time: '20:30', level: 134, context: 'לפני שינה', contextIcon: '🌙', trend: 'stable' },
  { id: 'l5', date: '10 באפריל', time: '09:10', level: 165, context: 'אחרי ארוחה', contextIcon: '🍽️', trend: 'up' },
  { id: 'l6', date: '10 באפריל', time: '18:00', level: 118, context: 'לפני ארוחת ערב', contextIcon: '🌆', trend: 'down' },
  { id: 'l7', date: '9 באפריל', time: '08:00', level: 142, context: 'בוקר', contextIcon: '☀️', trend: 'stable' },
];

const TARGET_LOW = 80;
const TARGET_HIGH = 140;
const CHART_MAX = 200;

function getLevelStatus(level: number): { label: string; color: string; bg: string } {
  if (level < TARGET_LOW) return { label: 'נמוך', color: '#DC2626', bg: '#FEF2F2' };
  if (level > TARGET_HIGH) return { label: 'גבוה', color: '#D97706', bg: '#FEF3C7' };
  return { label: 'תקין', color: '#16A34A', bg: '#F0FDF4' };
}

const avgLevel = Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length);
const maxLevel = Math.max(...chartData.map((d) => d.value));
const minLevel = Math.min(...chartData.map((d) => d.value));

export function HistoryScreen({ onClose }: HistoryScreenProps) {
  const { theme } = useAppContext();
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'דוח סוכר שבועי',
        text: `ממוצע שבועי: ${avgLevel} mg/dL | מקסימום: ${maxLevel} | מינימום: ${minLevel}`,
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
          <h1
            className="text-lg font-800"
            style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            היסטוריית מדדים
          </h1>
          <p className="text-xs font-500 mt-0.5" style={{ color: '#9CA3AF', fontWeight: 500 }}>
            7 ימים אחרונים
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
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'ממוצע', value: avgLevel, suffix: 'mg/dL', color: theme.primary, bg: theme.primaryBg },
            { label: 'מקסימום', value: maxLevel, suffix: 'mg/dL', color: '#D97706', bg: '#FEF3C7' },
            { label: 'מינימום', value: minLevel, suffix: 'mg/dL', color: '#16A34A', bg: '#F0FDF4' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-3 text-center"
              style={{ backgroundColor: stat.bg, border: `1.5px solid ${stat.bg}` }}
            >
              <p className="text-xl font-800 leading-none mb-1" style={{ color: stat.color, fontWeight: 800 }}>
                {stat.value}
              </p>
              <p className="text-xs font-500" style={{ color: stat.color, fontWeight: 500, opacity: 0.75 }}>
                {stat.suffix}
              </p>
              <p className="text-xs font-600 mt-1" style={{ color: stat.color, fontWeight: 600 }}>
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
                <span className="text-xs font-500" style={{ color: '#9CA3AF', fontWeight: 500 }}>גבוה (140)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: '#86EFAC' }} />
                <span className="text-xs font-500" style={{ color: '#9CA3AF', fontWeight: 500 }}>תקין</span>
              </div>
            </div>
            <p className="text-sm font-700" style={{ color: '#1F2937', fontWeight: 700 }}>
              רמות סוכר — שבוע אחרון
            </p>
          </div>

          <div className="relative" style={{ height: '120px' }}>
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${((TARGET_HIGH - 60) / (CHART_MAX - 60)) * 100}%`,
                borderTop: '1.5px dashed #FCA5A5',
                zIndex: 1,
              }}
            />
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${((TARGET_LOW - 60) / (CHART_MAX - 60)) * 100}%`,
                borderTop: '1.5px dashed #86EFAC',
                zIndex: 1,
              }}
            />

            <div className="absolute inset-0 flex items-end justify-between gap-1.5 px-1">
              {chartData.map((day, i) => {
                const heightPct = ((day.value - 60) / (CHART_MAX - 60)) * 100;
                const status = getLevelStatus(day.value);
                const isToday = i === chartData.length - 1;
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                    <span
                      className="text-xs font-700"
                      style={{
                        color: isToday ? theme.primary : status.color,
                        fontWeight: isToday ? 800 : 600,
                        fontSize: '10px',
                      }}
                    >
                      {day.value}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 relative"
                      style={{
                        height: `${(heightPct / 100) * 85}px`,
                        background: isToday
                          ? theme.gradientCard
                          : day.value > TARGET_HIGH
                          ? 'linear-gradient(180deg, #FBBF24 0%, #FDE68A 100%)'
                          : 'linear-gradient(180deg, #34D399 0%, #A7F3D0 100%)',
                        boxShadow: isToday ? `0 2px 8px ${theme.primaryShadow}` : 'none',
                      }}
                    />
                    <span
                      className="text-center"
                      style={{
                        color: isToday ? theme.primaryDark : '#9CA3AF',
                        fontWeight: isToday ? 700 : 500,
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

        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 h-8 px-3 rounded-xl transition-all active:scale-95"
              style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
            >
              <Share2 size={13} strokeWidth={2} style={{ color: theme.primary }} />
              <span className="text-xs font-700" style={{ color: theme.primary, fontWeight: 700 }}>
                שתף דוח עם הרופא
              </span>
            </button>
            <p
              className="text-xs font-700 uppercase tracking-widest"
              style={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              יומן מדידות
            </p>
          </div>

          <div className="space-y-2.5">
            {logs.map((log) => {
              const status = getLevelStatus(log.level);
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{
                    border: '1.5px solid #F3F4F6',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    {log.contextIcon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-600 truncate" style={{ color: '#374151', fontWeight: 600 }}>
                        {log.context}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <span className="text-xs font-500" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                        {log.date} · {log.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {log.trend === 'up' && <TrendingUp size={14} strokeWidth={2} style={{ color: '#D97706' }} />}
                      {log.trend === 'down' && <TrendingDown size={14} strokeWidth={2} style={{ color: '#16A34A' }} />}
                      {log.trend === 'stable' && <Minus size={14} strokeWidth={2} style={{ color: '#6B7280' }} />}
                      <span
                        className="text-base font-800"
                        style={{ color: status.color, fontWeight: 800 }}
                      >
                        {log.level}
                      </span>
                    </div>
                    <span
                      className="text-xs font-600 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: status.bg,
                        color: status.color,
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
        >
          <Droplets size={20} strokeWidth={1.5} style={{ color: theme.primary }} />
          <p className="text-sm font-600 text-right flex-1" style={{ color: '#1E3A5F', fontWeight: 600 }}>
            ממוצע הסוכר השבועי שלך הוא <strong>{avgLevel} mg/dL</strong> — {avgLevel <= 140 ? 'בטווח הנורמה. המשך כך!' : 'מעט גבוה מהיעד. מומלץ להתייעץ עם הרופא.'}
          </p>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
