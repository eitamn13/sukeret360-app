import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Search, CheckCircle2, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface FoodItem {
  id: string;
  name: string;
  carbs: number;
  icon: string;
  category: string;
}

const FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'תפוח עץ בינוני', carbs: 15, icon: '🍎', category: 'פירות' },
  { id: '2', name: 'בננה בינונית', carbs: 27, icon: '🍌', category: 'פירות' },
  { id: '3', name: 'תפוז גדול', carbs: 18, icon: '🍊', category: 'פירות' },
  { id: '4', name: 'ענבים כוס', carbs: 28, icon: '🍇', category: 'פירות' },
  { id: '5', name: 'אבטיח פרוסה', carbs: 11, icon: '🍉', category: 'פירות' },
  { id: '6', name: 'פרוסת לחם חיטה מלאה', carbs: 12, icon: '🍞', category: 'פחמימות' },
  { id: '7', name: 'כוס אורז בסמטי מבושל', carbs: 45, icon: '🍚', category: 'פחמימות' },
  { id: '8', name: 'כוס פסטה מבושלת', carbs: 40, icon: '🍝', category: 'פחמימות' },
  { id: '9', name: 'פיתה גדולה', carbs: 35, icon: '🫓', category: 'פחמימות' },
  { id: '10', name: 'תפוח אדמה בינוני', carbs: 30, icon: '🥔', category: 'פחמימות' },
  { id: '11', name: 'ביצה קשה', carbs: 0, icon: '🥚', category: 'חלבונים' },
  { id: '12', name: 'חזה עוף צלוי 100 גרם', carbs: 0, icon: '🍗', category: 'חלבונים' },
  { id: '13', name: 'פילה סלמון 100 גרם', carbs: 0, icon: '🐟', category: 'חלבונים' },
  { id: '14', name: 'גבינה לבנה 5% מנה', carbs: 3, icon: '🧀', category: 'חלבונים' },
  { id: '15', name: 'יוגורט טבעי 3% מנה', carbs: 12, icon: '🥛', category: 'חלבונים' },
  { id: '16', name: 'סלט ירקות קטן', carbs: 5, icon: '🥗', category: 'ירקות' },
  { id: '17', name: 'עגבנייה בינונית', carbs: 4, icon: '🍅', category: 'ירקות' },
  { id: '18', name: 'מלפפון בינוני', carbs: 3, icon: '🥒', category: 'ירקות' },
  { id: '19', name: 'גזר בינוני', carbs: 7, icon: '🥕', category: 'ירקות' },
  { id: '20', name: 'פלפל ירוק', carbs: 6, icon: '🫑', category: 'ירקות' },
  { id: '21', name: 'אבוקדו חצי', carbs: 6, icon: '🥑', category: 'שומנים בריאים' },
  { id: '22', name: 'שקדים חופן קטן', carbs: 6, icon: '🌰', category: 'שומנים בריאים' },
  { id: '23', name: 'כוס חלב 3%', carbs: 12, icon: '🥛', category: 'משקאות' },
  { id: '24', name: 'מיץ תפוזים טבעי כוס', carbs: 26, icon: '🧃', category: 'משקאות' },
  { id: '25', name: 'חומוס ביתי 3 כפות', carbs: 10, icon: '🫘', category: 'קטניות' },
  { id: '26', name: 'עדשים מבושלות חצי כוס', carbs: 20, icon: '🫘', category: 'קטניות' },
];

const QUICK_SUGGESTIONS = [
  FOOD_DATABASE[0],
  FOOD_DATABASE[6],
  FOOD_DATABASE[10],
  FOOD_DATABASE[15],
  FOOD_DATABASE[11],
];

interface SmartMealLoggerProps {
  onClose: () => void;
}

export function SmartMealLogger({ onClose }: SmartMealLoggerProps) {
  const { theme, logMeal, todayMeals } = useAppContext();
  const [query, setQuery] = useState('');
  const [toastItem, setToastItem] = useState<FoodItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return FOOD_DATABASE.filter((f) => f.name.includes(q));
  }, [query]);

  const handleLog = (item: FoodItem) => {
    logMeal({ name: item.name, icon: item.icon, carbs: item.carbs });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastItem(item);
    setQuery('');
    toastTimer.current = setTimeout(() => setToastItem(null), 3000);
  };

  const totalCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
  const showHome = query.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: theme.gradientFull }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 pt-12 pb-4"
        style={{ borderBottom: `1px solid ${theme.primaryBorder}`, background: theme.headerBg, backdropFilter: 'blur(14px)' }}
      >
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}`, boxShadow: `0 2px 8px ${theme.primary}10` }}
          aria-label="סגור"
        >
          <X size={20} strokeWidth={2.5} style={{ color: theme.primary }} />
        </button>
        <div className="text-center">
          <h1 className="text-lg" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.03em' }}>
            רישום ארוחה חכם
          </h1>
          <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
            חיפוש ורישום פחמימות
          </p>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="mt-5 relative">
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: query ? theme.primary : theme.primaryMuted }}
          >
            <Search size={21} strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפשי מאכל..."
            dir="rtl"
            className="w-full h-14 rounded-2xl text-base outline-none pr-12 pl-4 transition-all"
            style={{
              background: '#FFFFFF',
              border: `2px solid ${query ? theme.primary : theme.primaryBorder}`,
              color: '#1F2937',
              fontWeight: 500,
              boxShadow: query
                ? `0 0 0 4px ${theme.primaryShadow}25, 0 4px 16px ${theme.primary}12`
                : `0 2px 8px ${theme.primary}0F`,
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: theme.primaryBg }}
            >
              <X size={14} strokeWidth={2.5} style={{ color: theme.primary }} />
            </button>
          )}
        </div>

        {showHome && (
          <>
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={15} strokeWidth={2.5} style={{ color: theme.primary }} />
                <p className="text-xs uppercase tracking-widest" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
                  הצעות חכמות
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLog(item)}
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 transition-all active:scale-95"
                    style={{
                      background: '#FFFFFF',
                      border: `1.5px solid ${theme.primaryBorder}`,
                      boxShadow: `0 2px 8px ${theme.primary}0F`,
                    }}
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-sm" style={{ color: '#374151', fontWeight: 600 }}>{item.name}</span>
                    <span
                      className="text-xs rounded-full px-2.5 py-0.5"
                      style={{ background: theme.primaryBg, color: theme.primary, fontWeight: 800 }}
                    >
                      {item.carbs}ג
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {todayMeals.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: theme.gradientCard }}
                  >
                    <span className="text-sm text-white" style={{ fontWeight: 800 }}>
                      סה"כ: {totalCarbs} גרם פחמימות
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
                    יומן היום
                  </p>
                </div>
                <div className="space-y-2">
                  {todayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                      style={{
                        background: '#FFFFFF',
                        border: `1.5px solid ${theme.primaryBorder}`,
                        boxShadow: `0 2px 8px ${theme.primary}08`,
                      }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-1 rounded-full flex-shrink-0"
                        style={{ background: theme.primaryBg }}
                      >
                        <span className="text-sm" style={{ color: theme.primary, fontWeight: 800 }}>
                          {meal.carbs}
                        </span>
                        <span className="text-xs" style={{ color: theme.primaryMuted, fontWeight: 600 }}>
                          גרם פחמימות
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm text-right" style={{ color: '#1F2937', fontWeight: 600 }}>
                          {meal.name}
                        </span>
                        <span className="text-2xl leading-none">{meal.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todayMeals.length === 0 && (
              <div className="mt-10 text-center py-8">
                <p className="text-4xl mb-3">🥗</p>
                <p className="text-base" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                  עוד לא רשמת ארוחות היום
                </p>
                <p className="text-sm mt-1" style={{ color: '#D1D5DB', fontWeight: 400 }}>
                  חפשי מאכל למעלה או בחרי מהצעות החכמות
                </p>
              </div>
            )}
          </>
        )}

        {!showHome && (
          <div className="mt-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-base" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                  לא נמצאו תוצאות עבור "{query}"
                </p>
                <p className="text-sm mt-1" style={{ color: '#D1D5DB', fontWeight: 400 }}>
                  נסי מילה אחרת
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs mb-3 text-right" style={{ color: theme.primaryMuted, fontWeight: 600 }}>
                  {filtered.length} תוצאות
                </p>
                <div className="space-y-2">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLog(item)}
                      className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all active:scale-[0.98] text-right"
                      style={{
                        background: '#FFFFFF',
                        border: `1.5px solid ${theme.primaryBorder}`,
                        boxShadow: `0 2px 8px ${theme.primary}0A`,
                      }}
                    >
                      <div
                        className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[68px]"
                        style={{ background: theme.primaryBg }}
                      >
                        <span className="text-lg" style={{ color: theme.primary, fontWeight: 900, lineHeight: 1.1 }}>
                          {item.carbs}
                        </span>
                        <span className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 600 }}>
                          גרם פח׳
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: '#1F2937', fontWeight: 700 }}>
                          {item.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontWeight: 400 }}>
                          {item.category}
                        </p>
                      </div>
                      <span className="text-2xl leading-none flex-shrink-0">{item.icon}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {toastItem && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-fade-in"
          style={{ minWidth: 260, maxWidth: 340 }}
        >
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: '#FFFFFF',
              border: `1.5px solid ${theme.primaryBorder}`,
              boxShadow: `0 12px 40px ${theme.primaryShadow}`,
            }}
          >
            <CheckCircle2 size={24} strokeWidth={2.5} style={{ color: '#16A34A', flexShrink: 0 }} />
            <div className="flex-1 text-right min-w-0">
              <p className="text-sm" style={{ color: '#1F2937', fontWeight: 800 }}>
                הארוחה נרשמה בהצלחה!
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280', fontWeight: 500 }}>
                {toastItem.name} · {toastItem.carbs} גרם פחמימות
              </p>
            </div>
            <span className="text-2xl leading-none flex-shrink-0">{toastItem.icon}</span>
          </div>
        </div>
      )}
    </div>
  );
}
