import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Search, Trash2 } from 'lucide-react';
import { FOOD_DATABASE, FoodDatabaseItem } from '../data/foodDatabase';
import { MealType, useAppContext } from '../context/AppContext';
import { DetectedFood, detectFoodsFromImage } from '../utils/vision';
import { OverlayHeader } from './OverlayHeader';

const MEAL_TYPE_META: Record<MealType, { label: string; icon: string; accent: string }> = {
  breakfast: { label: 'בוקר', icon: '☀️', accent: '#F59E0B' },
  lunch: { label: 'צהריים', icon: '🍽️', accent: '#10B981' },
  dinner: { label: 'ערב', icon: '🌙', accent: '#6366F1' },
  snack: { label: 'נשנוש', icon: '🍎', accent: '#EC4899' },
};

type SelectedMealFood = DetectedFood & {
  source: 'vision' | 'manual' | 'database';
  servingLabel?: string;
  note?: string;
};

type SuitabilitySummary = {
  label: string;
  title: string;
  body: string;
  tone: string;
  bg: string;
  border: string;
};

function normalizeFoodName(value: string) {
  return value
    .toLowerCase()
    .replace(/['׳״"”“]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mealInsight(totalCarbs: number, totalCalories: number) {
  if (totalCarbs <= 0) {
    return {
      title: 'אפשר להתחיל פשוט',
      body: 'הוסיפו לפחות פריט אחד כדי לראות פחמימות וקלוריות.',
      tone: '#C2410C',
      bg: '#FFF7ED',
      border: '#FED7AA',
    };
  }

  if (totalCarbs <= 20) {
    return {
      title: 'ארוחה קלה יחסית',
      body: totalCalories < 220 ? 'הארוחה קלה גם בפחמימות וגם בקלוריות.' : 'הארוחה קלה יחסית בפחמימות.',
      tone: '#15803D',
      bg: '#F0FDF4',
      border: '#BBF7D0',
    };
  }

  if (totalCarbs <= 45) {
    return {
      title: 'טווח מאוזן',
      body: totalCalories > 520 ? 'הפחמימות סבירות, אבל כדאי לשקול מנה מעט קטנה יותר.' : 'כמות הפחמימות נראית מאוזנת יחסית.',
      tone: '#1D4ED8',
      bg: '#EFF6FF',
      border: '#BFDBFE',
    };
  }

  return {
    title: 'עומס גבוה יחסית',
    body: 'כדאי לשקול הקטנת מנה או שילוב יותר חלבון וירקות.',
    tone: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
  };
}

function getFoodSuitability(food: Pick<SelectedMealFood, 'carbs' | 'calories' | 'name'>, match?: FoodDatabaseItem): SuitabilitySummary {
  const category = match?.category ?? '';
  const normalizedName = normalizeFoodName(food.name);
  const isProcessedSnack =
    category === 'חטיפים' ||
    normalizedName.includes('דוריטוס') ||
    normalizedName.includes('חטיף') ||
    normalizedName.includes('צ יפס') ||
    normalizedName.includes('צ׳יפס') ||
    normalizedName.includes('שוקולד');

  const isVeryFriendly =
    category === 'ירקות' ||
    category === 'חלבון' ||
    category === 'שומנים טובים' ||
    (food.carbs <= 8 && food.calories <= 180);

  if (isProcessedSnack || food.carbs >= 28 || food.calories >= 320) {
    return {
      label: 'פחות מתאים',
      title: 'פחות מתאים לחולי סוכרת',
      body: 'כנראה שיש כאן עומס פחמימות או מזון מעובד, ולכן עדיף לאכול מעט או לבחור חלופה טובה יותר.',
      tone: '#B91C1C',
      bg: '#FEF2F2',
      border: '#FECACA',
    };
  }

  if (isVeryFriendly) {
    return {
      label: 'מתאים יחסית',
      title: 'מתאים יחסית לחולי סוכרת',
      body: 'נראה שמדובר בפריט נוח יותר לאיזון, במיוחד אם הכמות אכן דומה למה שמופיע במסך.',
      tone: '#15803D',
      bg: '#F0FDF4',
      border: '#BBF7D0',
    };
  }

  return {
    label: 'בכמות מדודה',
    title: 'אפשרי, אבל בכמות מדודה',
    body: 'אפשר לשלב את הפריט הזה, אבל כדאי לשים לב לכמות ולשלב חלבון, ירקות או סיבים.',
    tone: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
  };
}

function getMealSuitability(selectedFoods: SelectedMealFood[], totalCarbs: number, totalCalories: number): SuitabilitySummary {
  if (!selectedFoods.length) {
    return {
      label: 'ממתין לניתוח',
      title: 'עדיין אין מספיק מידע',
      body: 'אחרי שנזהה או נוסיף מזון, נראה כאן האם הארוחה מתאימה יותר לחולי סוכרת.',
      tone: '#475569',
      bg: '#F8FAFC',
      border: '#E2E8F0',
    };
  }

  const foodScores = selectedFoods.map((food) => {
    const match = findFoodTemplateByName(food.name);
    return getFoodSuitability(food, match);
  });

  const lessSuitableCount = foodScores.filter((item) => item.label === 'פחות מתאים').length;
  const cautiousCount = foodScores.filter((item) => item.label === 'בכמות מדודה').length;

  if (lessSuitableCount > 0 || totalCarbs >= 50 || totalCalories >= 650) {
    return {
      label: 'דורש זהירות',
      title: 'הארוחה פחות מתאימה כרגע',
      body: 'יש כאן עומס יחסית גבוה. עדיף להקטין כמות, להפחית חטיפים או להוסיף מרכיב משביע כמו חלבון וירקות.',
      tone: '#B91C1C',
      bg: '#FEF2F2',
      border: '#FECACA',
    };
  }

  if (cautiousCount > 0 || totalCarbs > 20) {
    return {
      label: 'כדאי לשים לב',
      title: 'הארוחה סבירה, אבל בכמות מדודה',
      body: 'הארוחה יכולה להתאים, אבל מומלץ לעקוב אחרי הכמות ולשלב רכיבים שממתנים עלייה בסוכר.',
      tone: '#B45309',
      bg: '#FFFBEB',
      border: '#FDE68A',
    };
  }

  return {
    label: 'נראית מאוזנת',
    title: 'הארוחה נראית מתאימה יחסית',
    body: 'לפי הזיהוי והכמות המשוערת, הארוחה נראית מאוזנת יותר לחולי סוכרת.',
    tone: '#15803D',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  };
}

function findFoodTemplateByName(name: string) {
  const normalizedName = normalizeFoodName(name);

  return FOOD_DATABASE.find((item) => {
    const candidates = [item.name, ...(item.aliases ?? [])]
      .map((candidate) => normalizeFoodName(candidate))
      .filter(Boolean);

    return candidates.some((candidate) => normalizedName === candidate || normalizedName.includes(candidate) || candidate.includes(normalizedName));
  });
}

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, mealLogs, theme, userProfile } = useAppContext();
  const isMale = userProfile.gender === 'male';
  const [step, setStep] = useState(0);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedMealFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodServings, setFoodServings] = useState(1);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number | ''>('');
  const [newFoodCalories, setNewFoodCalories] = useState<number | ''>('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const totalCarbs = useMemo(
    () => Math.round(selectedFoods.reduce((sum, food) => sum + food.carbs, 0) * 10) / 10,
    [selectedFoods]
  );
  const totalCalories = useMemo(
    () => Math.round(selectedFoods.reduce((sum, food) => sum + (food.calories || 0), 0)),
    [selectedFoods]
  );
  const insight = useMemo(() => mealInsight(totalCarbs, totalCalories), [totalCarbs, totalCalories]);
  const mealSuitability = useMemo(
    () => getMealSuitability(selectedFoods, totalCarbs, totalCalories),
    [selectedFoods, totalCarbs, totalCalories]
  );

  const databaseResults = useMemo(() => {
    const query = foodSearch.trim().toLowerCase();
    return (query ? FOOD_DATABASE.filter((item) => item.name.toLowerCase().includes(query)) : FOOD_DATABASE).slice(0, 7);
  }, [foodSearch]);

  const frequentFoods = useMemo(() => {
    const seen = new Set<string>();

    return mealLogs
      .filter((meal) => meal.name.trim())
      .map((meal) => {
        const match = findFoodTemplateByName(meal.name);
        return {
          id: meal.id,
          name: meal.name,
          carbs: match?.carbs ?? meal.carbs,
          calories: match?.calories ?? meal.calories ?? 0,
          serving: match?.serving ?? meal.servingLabel ?? 'בחירה מהירה',
          category: match?.category ?? 'היסטוריה',
          fiber: match?.fiber ?? 0,
          note: match?.note ?? 'בחירה מהירה מההיסטוריה שלך',
          icon: match?.icon ?? meal.icon,
        };
      })
      .filter((item) => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [mealLogs]);

  const primaryButtonBackground = isMale
    ? 'linear-gradient(135deg, #7EA8DF 0%, #4F6786 100%)'
    : 'linear-gradient(135deg, #E8A7BD 0%, #B86186 100%)';

  const primaryButtonShadow = isMale
    ? '0 16px 32px rgba(107, 151, 214, 0.24)'
    : '0 16px 32px rgba(216, 142, 168, 0.24)';

  const addFood = (food: SelectedMealFood) => setSelectedFoods((prev) => [food, ...prev]);
  const removeFood = (index: number) => setSelectedFoods((prev) => prev.filter((_, currentIndex) => currentIndex !== index));

  const addDatabaseFood = (item: FoodDatabaseItem) => {
    const servings = foodServings > 0 ? foodServings : 1;
    addFood({
      name: item.name,
      carbs: Math.round(item.carbs * servings * 10) / 10,
      calories: Math.round(item.calories * servings),
      source: 'database',
      servingLabel: servings === 1 ? item.serving : `${servings} מנות · ${item.serving}`,
      note: item.note,
    });
    setFoodSearch('');
    setFoodServings(1);
  };

  const addManualFood = () => {
    if (!newFoodName.trim()) {
      setErrorMessage('אנא הזינו שם מזון לפני ההוספה.');
      return;
    }

    addFood({
      name: newFoodName.trim(),
      carbs: typeof newFoodCarbs === 'number' ? newFoodCarbs : 0,
      calories: typeof newFoodCalories === 'number' ? newFoodCalories : 0,
      source: 'manual',
    });

    setNewFoodName('');
    setNewFoodCarbs('');
    setNewFoodCalories('');
    setErrorMessage('');
  };

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { foods, previewUrl } = await detectFoodsFromImage(file);
      const detectedFoods = foods
        .filter((food) => food.name !== 'לא זוהה')
        .filter((food) => {
          const match = findFoodTemplateByName(food.name);
          return (food.confidence ?? 1) >= 0.45 || Boolean(match);
        })
        .map<SelectedMealFood>((food) => {
          const match = findFoodTemplateByName(food.name);
          return {
            ...food,
            carbs: match?.carbs ?? food.carbs ?? 0,
            calories: match?.calories ?? food.calories ?? 0,
            source: 'vision',
            servingLabel: match?.serving ?? ((food.confidence ?? 1) < 0.72 ? 'זיהוי ראשוני מתמונה' : undefined),
            note:
              (food.confidence ?? 1) < 0.72
                ? `${match?.note ? `${match.note} ` : ''}מומלץ לבדוק שהכמות והפריט נכונים לפני שמירה.`
                : match?.note,
          };
        });

      setImagePreviewUrl(previewUrl);
      setSelectedFoods(detectedFoods);
      setStep(2);

      if (detectedFoods.length === 0) {
        setErrorMessage('לא הצלחנו לזהות מזון בתמונה. אפשר להוסיף ידנית או לבחור מהמאגר.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('יש בעיה זמנית בזיהוי התמונה. אפשר להמשיך ידנית בלי להיתקע.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleImageUpload(file);
  };

  const saveMeals = () => {
    if (!selectedFoods.length) {
      setErrorMessage('יש להוסיף לפחות פריט אחד לפני השמירה.');
      return;
    }

    selectedFoods.forEach((food) =>
      logMeal({
        name: food.name,
        carbs: food.carbs,
        calories: food.calories,
        icon: MEAL_TYPE_META[mealType].icon,
        mealType,
        source: food.source,
        servingLabel: food.servingLabel,
      })
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-white sm:flex sm:items-center sm:justify-center sm:p-4"
      style={{ background: theme.gradientFull }}
      dir="rtl"
    >
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[430px] lg:max-w-xl overflow-hidden flex flex-col rounded-none sm:rounded-[28px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))' }}
      >
        <div
          className="flex-shrink-0 sm:rounded-t-[28px] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)' }}
        >
          <OverlayHeader
            title="רישום ארוחה"
            subtitle={step === 2 ? 'צילום קטן, ניתוח ברור והתאמה לחולי סוכרת' : 'צילום, מאגר מזון וסיכום של פחמימות וקלוריות'}
            theme={theme}
            onBack={() => (step > 0 ? setStep(step - 1) : onClose())}
            onClose={onClose}
            backLabel={step > 0 ? 'חזרה' : 'סגור'}
          />
          <div className="px-5 pb-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-2 rounded-full flex-1 transition-all"
                  style={{ background: index <= step ? theme.gradientCard : 'linear-gradient(90deg, #E2E8F0, #F1F5F9)' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {errorMessage && (
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              {errorMessage}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div
                className="rounded-3xl p-4 text-right"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}`, boxShadow: `0 16px 32px ${theme.primaryShadow}` }}
              >
                <p style={{ fontWeight: 900, fontSize: 22, color: '#0F172A' }}>איזו ארוחה זו?</p>
                <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7, fontWeight: 600 }}>
                  בוחרים סוג ארוחה, ואז אפשר לצלם או להוסיף מהמאגר.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MEAL_TYPE_META).map(([value, meta]) => {
                  const active = mealType === value;

                  return (
                    <button
                      key={value}
                      onClick={() => setMealType(value as MealType)}
                      className="rounded-3xl p-4 text-right transition-all active:scale-[0.98]"
                      style={{
                        minHeight: 108,
                        border: `2px solid ${active ? meta.accent : '#E2E8F0'}`,
                        backgroundColor: active ? `${meta.accent}14` : '#FFFFFF',
                        boxShadow: active ? `0 14px 30px ${meta.accent}25` : 'none',
                      }}
                    >
                      <div className="w-full flex justify-end text-3xl">{meta.icon}</div>
                      <p style={{ fontWeight: 800, marginTop: 8, color: '#0F172A' }}>{meta.label}</p>
                      <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>תיעוד מותאם לארוחת {meta.label}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                  className="w-full h-[52px] sm:h-14 rounded-2xl text-white text-base transition-all active:scale-[0.99]"
                style={{ background: primaryButtonBackground, fontWeight: 800, boxShadow: primaryButtonShadow }}
              >
                המשך לצילום או להעלאה
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div
                className="rounded-3xl p-4 sm:p-5 border-2 border-dashed text-center"
                style={{ borderColor: theme.primaryBorder, backgroundColor: '#FFFFFF' }}
              >
                <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center" style={{ background: primaryButtonBackground, color: 'white' }}>
                  <Camera size={26} />
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, marginTop: 16, color: '#0F172A' }}>צלמו את הצלחת או העלו תמונה</p>
                <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7 }}>
                  ננסה לזהות את המזון, להעריך פחמימות וקלוריות, ואז תוכלו לתקן הכול ידנית.
                </p>
                <label
                  className="inline-flex items-center gap-2 mt-5 px-5 h-12 rounded-2xl cursor-pointer"
                  style={{ background: primaryButtonBackground, color: 'white', fontWeight: 800, boxShadow: primaryButtonShadow }}
                >
                  <Camera size={18} />
                  העלאת תמונה
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
                </label>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-2xl text-sm transition-all active:scale-[0.99]"
                style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700 }}
              >
                דלג לעריכה ידנית
              </button>
            </div>
          )}

          {step === 2 && (
              <div className="space-y-3">
                <div className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
                  <div className="space-y-3">
                  <div className="rounded-3xl p-3.5" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}>
                    <div className="flex flex-row-reverse items-center gap-3">
                      <div
                        className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-2xl flex-shrink-0"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        {imagePreviewUrl ? (
                          <img src={imagePreviewUrl} alt="Meal preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl">📷</div>
                        )}
                      </div>

                      <div className="flex-1 text-right">
                        <div className="flex flex-wrap justify-end gap-2 mb-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${MEAL_TYPE_META[mealType].accent}18`, color: MEAL_TYPE_META[mealType].accent, fontWeight: 800 }}
                          >
                            {MEAL_TYPE_META[mealType].icon} {MEAL_TYPE_META[mealType].label}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 800 }}>
                            {selectedFoods.length} פריטים
                          </span>
                        </div>
                        <p style={{ color: '#0F172A', fontWeight: 800, fontSize: 17 }}>התמונה שנשלחה לניתוח</p>
                        <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.6, fontSize: 13.5 }}>
                          שמרנו תמונה קטנה וברורה, כדי שהמסך יישאר נוח ולא יתנפח.
                        </p>

                        <label
                          className="inline-flex items-center gap-2 mt-3 px-3.5 h-10 rounded-2xl cursor-pointer"
                          style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700 }}
                        >
                          <Camera size={15} />
                          החלף תמונה
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
                        </label>
                      </div>
                    </div>
                  </div>

                    <div className="rounded-3xl p-4" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ color: '#64748B', fontSize: 13 }}>{selectedFoods.length} פריטים</span>
                      <p style={{ fontWeight: 800, color: '#0F172A' }}>פריטי הארוחה</p>
                    </div>
                    <div className="space-y-2">
                      {!selectedFoods.length && (
                        <div className="rounded-2xl p-4 text-sm text-center" style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                          עדיין לא נוספו מזונות. בחרו מהמאגר או הוסיפו ידנית.
                        </div>
                      )}
                      {selectedFoods.map((food, index) => (
                        <FoodRow key={`${food.name}-${index}`} food={food} onRemove={() => removeFood(index)} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl p-4" style={{ backgroundColor: mealSuitability.bg, border: `1px solid ${mealSuitability.border}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ backgroundColor: '#FFFFFF', color: mealSuitability.tone, fontWeight: 900, border: `1px solid ${mealSuitability.border}` }}
                      >
                        {mealSuitability.label}
                      </span>
                      <p style={{ color: mealSuitability.tone, fontWeight: 900, fontSize: 13 }}>התאמה לחולי סוכרת</p>
                    </div>
                    <p style={{ color: mealSuitability.tone, fontWeight: 900, fontSize: 20, marginTop: 10 }}>{mealSuitability.title}</p>
                    <p style={{ color: mealSuitability.tone, opacity: 0.94, marginTop: 8, lineHeight: 1.75 }}>{mealSuitability.body}</p>
                    <div
                      className="mt-3 rounded-2xl px-3.5 py-3"
                      style={{ backgroundColor: '#FFFFFF', border: `1px solid ${mealSuitability.border}` }}
                    >
                      <p style={{ color: insight.tone, fontWeight: 800, fontSize: 15 }}>{insight.title}</p>
                      <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.65, fontSize: 13.5 }}>{insight.body}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <MetricCard label="פחמימות" value={`${totalCarbs}`} color={mealSuitability.tone} border={mealSuitability.border} />
                      <MetricCard label="קלוריות" value={`${totalCalories}`} color={mealSuitability.tone} border={mealSuitability.border} />
                      <MetricCard label="פריטים" value={`${selectedFoods.length}`} color={mealSuitability.tone} border={mealSuitability.border} />
                    </div>
                  </div>

                    <div className="rounded-3xl p-4" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}>
                    <div className="mb-3 flex items-center justify-end gap-2">
                      <Search size={16} style={{ color: theme.primary }} />
                      <p style={{ fontWeight: 800, color: '#0F172A' }}>מאגר מזון לחולי סוכרת</p>
                    </div>

                    {frequentFoods.length > 0 && (
                      <div className="mb-3">
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                          בחירות מהירות מההיסטוריה שלך
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {frequentFoods.map((item) => (
                            <button
                              key={item.id}
                              onClick={() =>
                                addDatabaseFood({
                                  id: item.id,
                                  name: item.name,
                                  carbs: item.carbs,
                                  calories: item.calories,
                                  serving: item.serving,
                                  category: item.category,
                                  fiber: item.fiber,
                                  note: item.note,
                                  icon: item.icon,
                                })
                              }
                              className="px-3 py-2 rounded-2xl text-sm transition-all active:scale-[0.98]"
                              style={{ backgroundColor: theme.primaryBg, color: theme.primary, border: `1px solid ${theme.primaryBorder}`, fontWeight: 700 }}
                            >
                              {item.icon} {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={foodSearch}
                      onChange={(event) => setFoodSearch(event.target.value)}
                      placeholder="חפשו מזון, פרי, לחם, קטניות..."
                      dir="rtl"
                      className="w-full h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                    />

                    <div className="flex items-center gap-2 mt-3 mb-3">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={foodServings}
                        onChange={(event) => setFoodServings(Number(event.target.value) || 1)}
                        className="w-24 h-10 rounded-xl px-3 outline-none text-[15px] font-semibold text-slate-800"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                      />
                      <span style={{ color: '#64748B', fontSize: 13 }}>מנות</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {databaseResults.map((item) => (
                        <FoodDatabaseRow
                          key={item.id}
                          item={item}
                          onAdd={() => addDatabaseFood(item)}
                          themeColor={theme.primary}
                          themeBg={theme.primaryBg}
                        />
                      ))}
                    </div>
                  </div>

                    <div className="rounded-3xl p-4" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}>
                    <p style={{ fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>הוספה ידנית מהירה</p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newFoodName}
                        onChange={(event) => setNewFoodName(event.target.value)}
                        placeholder="שם המזון"
                        dir="rtl"
                        className="w-full h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                      />
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          type="number"
                          value={newFoodCalories}
                          onChange={(event) => setNewFoodCalories(event.target.value ? Number(event.target.value) : '')}
                          placeholder="קלוריות"
                          dir="rtl"
                          className="h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                        />
                        <input
                          type="number"
                          value={newFoodCarbs}
                          onChange={(event) => setNewFoodCarbs(event.target.value ? Number(event.target.value) : '')}
                          placeholder="גרם פחמימות"
                          dir="rtl"
                          className="h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                        />
                        <button
                          onClick={addManualFood}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: primaryButtonBackground, color: 'white', boxShadow: primaryButtonShadow }}
                          aria-label="הוסף ידנית"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="sticky bottom-0 flex flex-col gap-3 sm:flex-row pt-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(248,250,252,0.98) 28%, rgba(248,250,252,0.98) 100%)',
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-2xl"
                  style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700 }}
                >
                  חזרה לצילום
                </button>
                <button
                  onClick={saveMeals}
                  className="flex-1 h-12 rounded-2xl text-white"
                  style={{ background: primaryButtonBackground, fontWeight: 800, boxShadow: primaryButtonShadow }}
                >
                  שמירת הארוחה ליומן
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-5 sm:p-6"
            style={{
              background: 'rgba(241, 245, 249, 0.76)',
              backdropFilter: 'blur(7px)',
            }}
          >
            <div
              className="w-full max-w-[320px] rounded-[28px] px-6 py-7 text-center"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: `1px solid ${theme.primaryBorder}`,
                boxShadow: `0 26px 60px ${theme.primaryShadow}`,
              }}
            >
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${theme.primaryBg} 0%, rgba(255,255,255,0.95) 72%)`,
                  border: `1px solid ${theme.primaryBorder}`,
                }}
              >
                <div
                  className="h-12 w-12 animate-spin rounded-full border-[4px] border-slate-200"
                  style={{ borderTopColor: theme.primary, borderRightColor: theme.primary }}
                />
              </div>

              <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 23, marginTop: 18 }}>מנתחים את התמונה...</p>
              <p style={{ color: '#475569', marginTop: 10, lineHeight: 1.75, fontSize: 15, fontWeight: 600 }}>
                מזהים את המזון, מחשבים פחמימות וקלוריות,
                <br />
                וזה יכול לקחת כמה שניות.
              </p>

              <div
                className="mt-5 rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', fontSize: 13, fontWeight: 700 }}
              >
                אין צורך ללחוץ שוב. אנחנו כבר בודקים בשבילך.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, border }: { label: string; value: string; color: string; border: string }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${border}` }}>
      <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>{label}</p>
      <p style={{ color, fontWeight: 900, fontSize: 24, marginTop: 6 }}>{value}</p>
    </div>
  );
}

function FoodRow({ food, onRemove }: { food: SelectedMealFood; onRemove: () => void }) {
  const match = findFoodTemplateByName(food.name);
  const suitability = getFoodSuitability(food, match);

  return (
    <div className="rounded-2xl p-3 flex items-start gap-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
        aria-label="מחק פריט"
      >
        <Trash2 size={15} />
      </button>

      <div className="flex-1 text-right">
        <div className="flex flex-row-reverse items-start gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            {food.source === 'vision' ? '📷' : food.source === 'database' ? '🗂️' : '🍽️'}
          </div>
          <div className="flex-1">
            <p style={{ fontWeight: 800, color: '#0F172A', fontSize: 17 }}>{food.name}</p>
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <span
                className="px-3 py-1.5 rounded-full text-[13px]"
                style={{ backgroundColor: suitability.bg, color: suitability.tone, fontWeight: 800, border: `1px solid ${suitability.border}` }}
              >
                {suitability.label}
              </span>
              {(food.confidence ?? 1) < 0.72 && (
                <span className="px-3 py-1.5 rounded-full text-[13px]" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800 }}>
                  דורש בדיקה
                </span>
              )}
              <span className="px-3 py-1.5 rounded-full text-[13px]" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 800 }}>
                {food.carbs} גרם פחמימות
              </span>
              <span className="px-3 py-1.5 rounded-full text-[13px]" style={{ backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 800 }}>
                {food.calories || 0} קלוריות
              </span>
            </div>
          </div>
        </div>

        {(food.servingLabel || food.note) && (
          <div className="mt-2 text-sm text-right" style={{ color: '#64748B', lineHeight: 1.6 }}>
            {food.servingLabel && <div>{food.servingLabel}</div>}
            {food.note && <div>{food.note}</div>}
          </div>
        )}

        {!food.note && (
          <div className="mt-2 text-sm text-right" style={{ color: '#64748B', lineHeight: 1.6 }}>
            {suitability.body}
          </div>
        )}
      </div>
    </div>
  );
}

function FoodDatabaseRow({
  item,
  onAdd,
  themeColor,
  themeBg,
}: {
  item: FoodDatabaseItem;
  onAdd: () => void;
  themeColor: string;
  themeBg: string;
}) {
  const suitability = getFoodSuitability(
    {
      name: item.name,
      carbs: item.carbs,
      calories: item.calories,
    },
    item
  );

  return (
    <button
      onClick={onAdd}
      className="w-full rounded-2xl p-3 text-right transition-all active:scale-[0.99]"
      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
    >
      <div className="flex flex-row-reverse items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap justify-end gap-2 mb-2">
            <span
              className="px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: suitability.bg, color: suitability.tone, fontWeight: 700, border: `1px solid ${suitability.border}` }}
            >
              {suitability.label}
            </span>
            <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}>
              {item.calories} קל׳
            </span>
            <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: themeBg, color: themeColor, fontWeight: 700 }}>
              {item.carbs} גרם
            </span>
          </div>
          <p style={{ fontWeight: 800, color: '#0F172A' }}>{item.name}</p>
          <p style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>{item.serving}</p>
          <p style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>{item.note}</p>
        </div>
      </div>
    </button>
  );
}
