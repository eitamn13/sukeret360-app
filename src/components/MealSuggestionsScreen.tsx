import { type ReactNode, useState } from 'react';
import { X, CheckSquare, Square, UtensilsCrossed, Moon, Sun, Coffee, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RecipeModal, RecipeDetail } from './RecipeModal';

interface MealSuggestionsScreenProps {
  onClose: () => void;
}

interface HabitItem {
  id: string;
  label: string;
  icon: string;
}

const meals: RecipeDetail[] = [
  {
    id: 'breakfast',
    type: 'ארוחת בוקר',
    name: 'חביתת ירק עם לחם כוסמין',
    imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '18 גרם',
    protein: '14 גרם',
    tags: ['חלבון גבוה', 'דל פחמימות'],
    ingredients: [
      '2 ביצים גדולות',
      'חצי כוס פטרוזיליה טרייה קצוצה',
      'רבע בצל קטן קצוץ דק',
      'כף שמן זית כתית מעולה',
      'קורט מלח ים ופלפל שחור',
      'פרוסת לחם כוסמין מלא',
    ],
    instructions: [
      'חממו מחבת על אש בינונית עם כף שמן זית.',
      'טגנו את הבצל הקצוץ כ-2 דקות עד שיוזהב קלות.',
      'טרפו את הביצים עם הפטרוזיליה, המלח והפלפל בקערה.',
      'שפכו את תערובת הביצים למחבת מעל הבצל.',
      'בשלו 2–3 דקות על אש בינונית-נמוכה עד שהביצים מתייצבות.',
      'הגישו חם לצד פרוסת הלחם לארוחה מהירה ומזינה.',
    ],
  },
  {
    id: 'lunch',
    type: 'ארוחת צהריים',
    name: 'חזה עוף צלוי עם קינואה וברוקולי',
    imageUrl: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '28 גרם',
    protein: '38 גרם',
    tags: ['חלבון גבוה', 'מאוזן'],
    ingredients: [
      '150 גרם חזה עוף נקי ללא עור',
      'חצי כוס קינואה לבנה (לפני בישול)',
      'כוס מים לבישול הקינואה',
      'כוס פרחי ברוקולי טרי',
      'כפית שמן זית',
      'כפית פפריקה מתוקה',
      'מלח, פלפל שחור וכמון לפי טעם',
    ],
    instructions: [
      'שטפו את הקינואה במסננת תחת מים קרים כדי להסיר מרירות.',
      'בשלו קינואה עם כוס מים רותחים ומלח על אש נמוכה, מכוסה, כ-15 דקות.',
      'אדו ברוקולי מעל סיר עם מים רותחים או במיקרוגל 5–7 דקות.',
      'תבלו חזה עוף בפפריקה, כמון, מלח ופלפל.',
      'צלו עוף במחבת פסים חמה עם שמן זית, כ-6–7 דקות מכל צד.',
      'פרסו את העוף באלכסון וסדרו בצלחת יחד עם הקינואה והברוקולי.',
    ],
  },
  {
    id: 'dinner',
    type: 'ארוחת ערב',
    name: 'סלט סלמון ואבוקדו עשיר',
    imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '12 גרם',
    protein: '32 גרם',
    tags: ['אומגה 3', 'דל פחמימות'],
    ingredients: [
      'פילה סלמון 200 גרם',
      'חצי אבוקדו בשל חתוך לקוביות',
      'חופן גדול עלי תרד צעירים',
      '10–12 עגבניות שרי חצויות',
      'מיץ מחצי לימון טרי',
      'כפית שמן זית כתית מעולה',
      'מלח ים, פלפל שחור ואיזוט לפי טעם',
    ],
    instructions: [
      'חממו תנור ל-180°C. תבלו פילה סלמון במלח, פלפל ואיזוט.',
      'אפו סלמון בתבנית מרופדת נייר אפייה כ-18–20 דקות עד שהדג מוכן.',
      'בזמן הצליה, פרסו אבוקדו, חצו עגבניות שרי וסדרו בקערה עם עלי תרד.',
      'הוציאו הסלמון מהתנור, המתינו 2 דקות, ופרקו לחתיכות גסות מעל הסלט.',
      'זלפו שמן זית ומיץ לימון, ערבבו בעדינות.',
      'הגישו מיד — הסלמון הטרי עם שומני האומגה 3 מושלמים לארוחת ערב קלה.',
    ],
  },
];

const habits: HabitItem[] = [
  { id: 'water', label: 'שתיתי 8 כוסות מים', icon: '💧' },
  { id: 'walk', label: 'הלכתי לפחות 20 דקות', icon: '🚶' },
  { id: 'feet', label: 'בדקתי כפות רגליים', icon: '🦶' },
  { id: 'meds', label: 'לקחתי תרופות בזמן', icon: '💊' },
  { id: 'sugar', label: 'בדקתי רמת סוכר', icon: '🩸' },
];

const MEAL_ICONS: Record<string, ReactNode> = {
  breakfast: <Coffee size={17} strokeWidth={1.75} />,
  lunch: <Sun size={17} strokeWidth={1.75} />,
  dinner: <Moon size={17} strokeWidth={1.75} />,
};

export function MealSuggestionsScreen({ onClose }: MealSuggestionsScreenProps) {
  const { theme } = useAppContext();
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  const toggleHabit = (id: string) => {
    setCompletedHabits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const completedCount = completedHabits.size;
  const totalHabits = habits.length;
  const allDone = completedCount === totalHabits;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
        style={{ background: theme.gradientFull }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 pt-12 pb-4"
          style={{
            backgroundColor: theme.headerBg,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${theme.primaryBorder}`,
          }}
        >
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ border: `1.5px solid ${theme.primaryBorder}`, backgroundColor: 'white', boxShadow: `0 2px 8px ${theme.primary}10` }}
            aria-label="סגור"
          >
            <UtensilsCrossed size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h1 className="text-lg" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.03em' }}>
              הצעות ארוחה
            </h1>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              לחצי על ארוחה לפרטים ומתכון מלא
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ border: `1.5px solid ${theme.primaryBorder}`, backgroundColor: 'white', boxShadow: `0 2px 8px ${theme.primary}10` }}
            aria-label="סגור"
          >
            <X size={20} strokeWidth={2.5} style={{ color: theme.primary }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <p
            className="text-xs uppercase tracking-widest pr-1"
            style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
          >
            תפריט יומי מוצע
          </p>

          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedRecipe(meal)}
              className="w-full bg-white rounded-2xl overflow-hidden text-right transition-all duration-200 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${theme.primaryBorder}`,
                boxShadow: `0 2px 12px ${theme.primary}0D`,
              }}
            >
              <div className="relative">
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="w-full object-cover"
                  style={{ height: 130 }}
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }}
                />
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700 }}
                >
                  {MEAL_ICONS[meal.id]}
                  <span>{meal.type}</span>
                </div>
                <div
                  className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: theme.primaryDark, fontWeight: 700 }}
                >
                  <ChevronLeft size={13} strokeWidth={2.5} />
                  <span>לפרטים ומתכון</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base text-right mb-1.5" style={{ color: '#1F2937', fontWeight: 800 }}>
                  {meal.name}
                </h3>

                <div className="flex items-center justify-end gap-2 mb-3">
                  {meal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 600 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="flex items-center justify-around rounded-xl p-3"
                  style={{ backgroundColor: theme.primaryBg, border: `1px solid ${theme.primaryBorder}` }}
                >
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>פחמימות</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.carbs}</p>
                  </div>
                  <div className="w-px h-9" style={{ backgroundColor: theme.primaryBorder }} />
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>חלבון</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.protein}</p>
                  </div>
                  <div className="w-px h-9" style={{ backgroundColor: theme.primaryBorder }} />
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>מצרכים</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.ingredients.length}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-sm px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700, border: `1px solid ${theme.primaryBorder}` }}
              >
                {completedCount} / {totalHabits}
              </span>
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
              >
                הרגלים יומיים
              </p>
            </div>

            <div
              className="w-full h-2.5 rounded-full mb-4 overflow-hidden"
              style={{ backgroundColor: theme.primaryBorder }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / totalHabits) * 100}%`,
                  background: allDone
                    ? 'linear-gradient(90deg,#16A34A,#22C55E)'
                    : theme.gradientCard,
                }}
              />
            </div>

            <div className="space-y-2.5">
              {habits.map((habit) => {
                const done = completedHabits.has(habit.id);
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-200 active:scale-[0.98]"
                    style={{
                      backgroundColor: done ? (allDone ? '#F0FDF4' : theme.primaryBg) : '#FFFFFF',
                      border: `1.5px solid ${done ? (allDone ? '#BBF7D0' : theme.primaryBorder) : '#F3F4F6'}`,
                      boxShadow: done ? `0 2px 8px ${theme.primary}15` : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ color: done ? (allDone ? '#16A34A' : theme.primary) : '#D1D5DB', flexShrink: 0 }}>
                      {done
                        ? <CheckSquare size={22} strokeWidth={2} />
                        : <Square size={22} strokeWidth={1.5} />
                      }
                    </div>
                    <span className="text-xl leading-none flex-shrink-0">{habit.icon}</span>
                    <p
                      className="text-sm text-right flex-1"
                      style={{
                        color: done ? (allDone ? '#15803D' : theme.primaryDark) : '#374151',
                        fontWeight: done ? 700 : 500,
                      }}
                    >
                      {habit.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {allDone && (
              <div
                className="mt-5 rounded-2xl p-5 text-center"
                style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #BBF7D0' }}
              >
                <p className="text-xl mb-1" style={{ color: '#15803D', fontWeight: 900 }}>
                  כל הכבוד! יום מושלם!
                </p>
                <p className="text-sm" style={{ color: '#16A34A', fontWeight: 500 }}>
                  השלמת את כל ההרגלים הבריאותיים היום
                </p>
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
