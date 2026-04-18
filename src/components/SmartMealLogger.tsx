import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Search, Trash2 } from 'lucide-react';
import { FOOD_DATABASE, type FoodDatabaseItem } from '../data/foodDatabase';
import { type MealType, useAppContext } from '../context/AppContext';
import { type DetectedFood, detectFoodsFromImage } from '../utils/vision';
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
  bg: string;
  border: string;
  tone: string;
};

function normalizeFoodName(value: string) {
  return value
    .toLowerCase()
    .replace(/['׳"“”]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findFoodTemplateByName(name: string) {
  const normalized = normalizeFoodName(name);

  return FOOD_DATABASE.find((item) => {
    const candidates = [item.name, ...(item.aliases ?? [])]
      .map((candidate) => normalizeFoodName(candidate))
      .filter(Boolean);

    return candidates.some(
      (candidate) =>
        normalized === candidate ||
        normalized.includes(candidate) ||
        candidate.includes(normalized)
    );
  });
}

function getFoodSuitability(
  food: Pick<SelectedMealFood, 'name' | 'carbs' | 'calories'>,
  match?: FoodDatabaseItem
): SuitabilitySummary {
  const category = match?.category ?? '';
  const normalizedName = normalizeFoodName(food.name);

  const processedSnack =
    category.includes('חטיף') ||
    normalizedName.includes('דוריטוס') ||
    normalizedName.includes('ציפס') ||
    normalizedName.includes('שוקולד');

  if (processedSnack || food.carbs >= 28 || food.calories >= 320) {
    return {
      label: 'פחות מתאים',
      title: 'כדאי לאכול במתינות',
      body: 'יש כאן עומס פחמימות או מזון מעובד, לכן עדיף לאכול מעט או לשלב עם חלבון וירקות.',
      bg: '#FEF2F2',
      border: '#FECACA',
      tone: '#B91C1C',
    };
  }

  if (food.carbs <= 12 && food.calories <= 180) {
    return {
      label: 'מתאים יחסית',
      title: 'בחירה נוחה יותר לאיזון',
      body: 'נראה שמדובר בפריט עדין יותר מבחינת פחמימות וקלוריות.',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      tone: '#15803D',
    };
  }

  return {
    label: 'בכמות מדודה',
    title: 'אפשרי, אבל במידה',
    body: 'עדיף לשלב עם ירקות, חלבון או שומן טוב כדי לקבל ארוחה מאוזנת יותר.',
    bg: '#FFFBEB',
    border: '#FDE68A',
    tone: '#B45309',
  };
}

function getMealSuitability(totalCarbs: number, totalCalories: number, foods: SelectedMealFood[]) {
  const lessFriendly = foods.some(
    (food) => getFoodSuitability(food, findFoodTemplateByName(food.name)).label === 'פחות מתאים'
  );

  if (!foods.length) {
    return {
      label: 'ממתין לניתוח',
      title: 'עוד לא הוספו מזונות',
      body: 'אחרי שנוסיף מזון נראה כאן אם הארוחה נראית מתאימה יותר לחולי סוכרת.',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      tone: '#475569',
    };
  }

  if (lessFriendly || totalCarbs >= 50 || totalCalories >= 650) {
    return {
      label: 'דורש זהירות',
      title: 'הארוחה כבדה יחסית',
      body: 'כדאי להקטין כמות, להפחית חטיפים ולשלב יותר ירקות או חלבון.',
      bg: '#FEF2F2',
      border: '#FECACA',
      tone: '#B91C1C',
    };
  }

  if (totalCarbs > 20) {
    return {
      label: 'כדאי לשים לב',
      title: 'הארוחה סבירה, אבל במידה',
      body: 'כדאי לעקוב אחרי הכמות ולשלב רכיבים שממתנים עלייה בסוכר.',
      bg: '#FFFBEB',
      border: '#FDE68A',
      tone: '#B45309',
    };
  }

  return {
    label: 'נראה מאוזן',
    title: 'הארוחה נראית מתאימה יחסית',
    body: 'לפי הזיהוי והכמות המשוערת, זו נראית בחירה נוחה יותר לאיזון.',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    tone: '#15803D',
  };
}

function createFoodFromDatabase(item: FoodDatabaseItem, servings: number): SelectedMealFood {
  const units = servings > 0 ? servings : 1;
  return {
    name: item.name,
    carbs: Math.round(item.carbs * units * 10) / 10,
    calories: Math.round(item.calories * units),
    source: 'database',
    servingLabel: units === 1 ? item.serving : `${units} מנות · ${item.serving}`,
    note: item.note,
  };
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-[26px] p-4 text-right"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 16px 32px rgba(15, 23, 42, 0.06)',
      }}
    >
      <p style={{ fontWeight: 900, fontSize: 22, color: '#0F172A' }}>{title}</p>
      <p style={{ color: '#475569', marginTop: 8, lineHeight: 1.7, fontWeight: 700, fontSize: 15 }}>
        {body}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = '#0F172A',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-2"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(148, 163, 184, 0.22)' }}
    >
      <p style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>{label}</p>
      <p style={{ color: tone, fontWeight: 900, fontSize: 16, marginTop: 4 }}>{value}</p>
    </div>
  );
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

  const mealSuitability = useMemo(
    () => getMealSuitability(totalCarbs, totalCalories, selectedFoods),
    [selectedFoods, totalCalories, totalCarbs]
  );

  const databaseResults = useMemo(() => {
    const query = normalizeFoodName(foodSearch);
    const source = query
      ? FOOD_DATABASE.filter((item) =>
          normalizeFoodName(item.name).includes(query) ||
          (item.aliases ?? []).some((alias) => normalizeFoodName(alias).includes(query))
        )
      : FOOD_DATABASE;
    return source.slice(0, query ? 6 : 4);
  }, [foodSearch]);

  const recentFoods = useMemo(() => {
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

  const addFood = (food: SelectedMealFood) => {
    setSelectedFoods((prev) => [food, ...prev]);
    setErrorMessage('');
  };

  const removeFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const addDatabaseFood = (item: FoodDatabaseItem) => {
    addFood(createFoodFromDatabase(item, foodServings));
    setFoodSearch('');
    setFoodServings(1);
  };

  const addManualFood = () => {
    if (!newFoodName.trim()) {
      setErrorMessage('צריך לכתוב שם מזון לפני ההוספה.');
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
  };

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { foods, previewUrl } = await detectFoodsFromImage(file);
      const detectedFoods = foods
        .filter((food) => food.name !== 'לא זוהה')
        .map<SelectedMealFood>((food) => {
          const match = findFoodTemplateByName(food.name);
          return {
            ...food,
            carbs: match?.carbs ?? food.carbs ?? 0,
            calories: match?.calories ?? food.calories ?? 0,
            source: 'vision',
            servingLabel:
              match?.serving ??
              ((food.confidence ?? 1) < 0.72 ? 'זיהוי ראשוני מתמונה' : undefined),
            note:
              (food.confidence ?? 1) < 0.72
                ? 'מומלץ לבדוק שהפריט והכמות נכונים לפני שמירה.'
                : match?.note,
          };
        });

      setImagePreviewUrl(previewUrl);
      setSelectedFoods(detectedFoods);
      setStep(2);

      if (!detectedFoods.length) {
        setErrorMessage('לא הצלחנו לזהות מזון בתמונה. אפשר להמשיך עם מאגר המזון או להוסיף ידנית.');
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
      setErrorMessage('צריך להוסיף לפחות פריט אחד לפני השמירה.');
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
      className="fixed inset-0 z-[10000] overflow-y-auto"
      style={{ background: theme.gradientFull }}
      dir="rtl"
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-md">
        <div
          className="sticky top-0 z-20 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <OverlayHeader
            title="רישום ארוחה"
            subtitle={
              step === 2 ? 'צילום קטן, תיקון מהיר ושמירה מסודרת' : 'בחירה קלה, צילום או חיפוש'
            }
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
                  className="h-2 flex-1 rounded-full transition-all"
                  style={{
                    background:
                      index <= step
                        ? primaryButtonBackground
                        : 'linear-gradient(90deg, #E2E8F0, #F1F5F9)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className="space-y-4 px-4 pb-8 pt-4"
          style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
        >
          {errorMessage ? (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
            >
              {errorMessage}
            </div>
          ) : null}

          {step === 0 ? (
            <div className="space-y-4">
              <InfoCard
                title="איזו ארוחה זו?"
                body="בוחרים סוג ארוחה, ואז ממשיכים לצילום או לחיפוש פשוט במאגר."
              />

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MEAL_TYPE_META).map(([value, meta]) => {
                  const active = mealType === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setMealType(value as MealType)}
                      className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
                      style={{
                        minHeight: 116,
                        border: `2px solid ${active ? meta.accent : '#E2E8F0'}`,
                        backgroundColor: active ? `${meta.accent}14` : '#FFFFFF',
                        boxShadow: active ? `0 14px 30px ${meta.accent}22` : 'none',
                      }}
                    >
                      <div className="mb-3 text-[1.8rem]">{meta.icon}</div>
                      <p style={{ fontWeight: 900, color: '#0F172A', fontSize: 19 }}>{meta.label}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                className="h-14 w-full rounded-2xl text-base text-white transition-all active:scale-[0.99]"
                style={{ background: primaryButtonBackground, boxShadow: primaryButtonShadow, fontWeight: 800 }}
              >
                המשך לצילום או לחיפוש
              </button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div
                className="rounded-[28px] border-2 border-dashed p-5 text-center"
                style={{ borderColor: theme.primaryBorder, backgroundColor: '#FFFFFF' }}
              >
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px]"
                  style={{ background: primaryButtonBackground, color: 'white' }}
                >
                  <Camera size={28} />
                </div>
                <p style={{ fontWeight: 900, fontSize: 22, marginTop: 16, color: '#0F172A' }}>
                  צלמו או העלו תמונה
                </p>
                <p
                  style={{
                    color: '#475569',
                    marginTop: 10,
                    lineHeight: 1.8,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  נזהה מזון, נחשב פחמימות וקלוריות ונראה אם זו ארוחה נוחה יותר לחולי סוכרת.
                </p>
                <label
                  className="mt-5 inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl px-6"
                  style={{ background: primaryButtonBackground, color: 'white', boxShadow: primaryButtonShadow, fontWeight: 800 }}
                >
                  <Camera size={18} />
                  העלאת תמונה
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>

              <button
                onClick={() => setStep(2)}
                className="h-12 w-full rounded-2xl text-sm transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  fontWeight: 700,
                }}
              >
                דלג לחיפוש ידני
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div
                className="rounded-[24px] p-4"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[22px]"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="תצוגת ארוחה"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="mb-2 flex flex-wrap justify-start gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs"
                        style={{
                          backgroundColor: `${MEAL_TYPE_META[mealType].accent}18`,
                          color: MEAL_TYPE_META[mealType].accent,
                          fontWeight: 800,
                        }}
                      >
                        {MEAL_TYPE_META[mealType].icon} {MEAL_TYPE_META[mealType].label}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs"
                        style={{ backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 800 }}
                      >
                        {selectedFoods.length} פריטים
                      </span>
                    </div>
                    <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 20 }}>
                      מה יש בארוחה?
                    </p>
                    <p
                      style={{
                        color: '#475569',
                        marginTop: 6,
                        lineHeight: 1.7,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      התוצאה תמיד ניתנת לעריכה. אפשר להחליף תמונה, לבחור מהמאגר או להוסיף ידנית.
                    </p>
                    <label
                      className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl px-3.5"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        fontWeight: 700,
                      }}
                    >
                      <Camera size={15} />
                      החלף תמונה
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[24px] p-4"
                style={{ backgroundColor: mealSuitability.bg, border: `1px solid ${mealSuitability.border}` }}
              >
                <div className="mb-3 flex flex-wrap justify-start gap-2">
                  <MetricCard label="פחמימות" value={`${totalCarbs} גרם`} />
                  <MetricCard label="קלוריות" value={`${totalCalories}`} />
                  <MetricCard label="התאמה" value={mealSuitability.label} tone={mealSuitability.tone} />
                </div>
                <p style={{ color: mealSuitability.tone, fontWeight: 900, fontSize: 20 }}>
                  {mealSuitability.title}
                </p>
                <p
                  className="mt-2 text-sm"
                  style={{ color: mealSuitability.tone, lineHeight: 1.8, fontWeight: 700 }}
                >
                  {mealSuitability.body}
                </p>
              </div>

              <div
                className="rounded-[24px] p-4"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span style={{ color: '#64748B', fontSize: 13, fontWeight: 700 }}>
                    {selectedFoods.length} פריטים
                  </span>
                  <p style={{ color: '#0F172A', fontWeight: 900 }}>פריטי הארוחה</p>
                </div>

                <div className="space-y-2">
                  {!selectedFoods.length ? (
                    <div
                      className="rounded-2xl p-4 text-center text-sm"
                      style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                    >
                      עדיין לא נוספו מזונות. אפשר לבחור מהמאגר, מהיסטוריה אישית או להוסיף ידנית.
                    </div>
                  ) : null}

                  {selectedFoods.map((food, index) => (
                    <FoodRow key={`${food.name}-${index}`} food={food} onRemove={() => removeFood(index)} />
                  ))}
                </div>
              </div>

              {recentFoods.length ? (
                <div
                  className="rounded-[24px] p-4"
                  style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                >
                  <p className="mb-3 text-right" style={{ color: '#0F172A', fontWeight: 900 }}>
                    בחירה מהירה מההיסטוריה
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {recentFoods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() =>
                          addFood({
                            name: food.name,
                            carbs: food.carbs,
                            calories: food.calories,
                            source: 'database',
                            servingLabel: food.serving,
                          })
                        }
                        className="rounded-[22px] p-3 text-right transition-all active:scale-[0.98]"
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div className="mb-2 text-2xl">{food.icon}</div>
                        <p style={{ color: '#0F172A', fontWeight: 800 }}>{food.name}</p>
                        <p className="mt-1 text-xs" style={{ color: '#64748B', fontWeight: 700 }}>
                          {food.carbs} גרם · {food.calories} קלוריות
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div
                className="rounded-[24px] p-4"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Search size={18} color="#64748B" />
                  <p style={{ color: '#0F172A', fontWeight: 900 }}>מאגר מזון לחולי סוכרת</p>
                </div>

                <div className="grid grid-cols-[1fr_92px] gap-3">
                  <input
                    value={foodSearch}
                    onChange={(event) => setFoodSearch(event.target.value)}
                    placeholder="חפשו מזון, למשל לחם, יוגורט, טונה"
                    dir="rtl"
                    className="h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                  />

                  <input
                    type="number"
                    min="1"
                    value={foodServings}
                    onChange={(event) =>
                      setFoodServings(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="h-12 rounded-2xl px-4 outline-none text-center text-[15px] font-semibold text-slate-800"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                  />
                </div>

                <div className="mt-3 space-y-2">
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

              <div
                className="rounded-[24px] p-4"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <p className="mb-3 text-right" style={{ color: '#0F172A', fontWeight: 900 }}>
                  הוספה ידנית
                </p>
                <div className="space-y-3">
                  <input
                    value={newFoodName}
                    onChange={(event) => setNewFoodName(event.target.value)}
                    placeholder="שם המזון"
                    dir="rtl"
                    className="h-12 w-full rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                  />
                  <div className="grid grid-cols-[1fr_1fr_56px] gap-3">
                    <input
                      type="number"
                      value={newFoodCalories}
                      onChange={(event) =>
                        setNewFoodCalories(event.target.value ? Number(event.target.value) : '')
                      }
                      placeholder="קלוריות"
                      dir="rtl"
                      className="h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                    />
                    <input
                      type="number"
                      value={newFoodCarbs}
                      onChange={(event) =>
                        setNewFoodCarbs(event.target.value ? Number(event.target.value) : '')
                      }
                      placeholder="גרם פחמימות"
                      dir="rtl"
                      className="h-12 rounded-2xl px-4 outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-400"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E1EE' }}
                    />
                    <button
                      onClick={addManualFood}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: primaryButtonBackground, color: 'white', boxShadow: primaryButtonShadow }}
                      aria-label="הוסף ידנית"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setStep(1)}
                  className="h-12 rounded-2xl"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                  }}
                >
                  חזרה לצילום
                </button>
                <button
                  onClick={saveMeals}
                  className="h-12 rounded-2xl text-white"
                  style={{
                    background: primaryButtonBackground,
                    fontWeight: 800,
                    boxShadow: primaryButtonShadow,
                  }}
                >
                  שמירת הארוחה ליומן
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div
            className="fixed inset-0 z-30 flex items-center justify-center p-5"
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

              <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 23, marginTop: 18 }}>
                מנתחים את התמונה...
              </p>
              <p
                style={{
                  color: '#475569',
                  marginTop: 10,
                  lineHeight: 1.75,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                מזהים את המזון, מחשבים פחמימות וקלוריות,
                <br />
                וזה יכול לקחת כמה שניות.
              </p>

              <div
                className="mt-5 rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                אין צורך ללחוץ שוב. אנחנו כבר בודקים בשבילך.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FoodRow({ food, onRemove }: { food: SelectedMealFood; onRemove: () => void }) {
  const match = findFoodTemplateByName(food.name);
  const suitability = getFoodSuitability(food, match);

  return (
    <div
      className="rounded-2xl p-3"
      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onRemove}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
          aria-label="מחק פריט"
        >
          <Trash2 size={15} />
        </button>

        <div className="flex-1 text-right">
          <div className="mb-2 flex flex-wrap justify-start gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[12px]"
              style={{
                backgroundColor: suitability.bg,
                color: suitability.tone,
                fontWeight: 800,
                border: `1px solid ${suitability.border}`,
              }}
            >
              {suitability.label}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[12px]"
              style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontWeight: 800 }}
            >
              {food.carbs} גרם פחמימות
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[12px]"
              style={{ backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 800 }}
            >
              {food.calories || 0} קלוריות
            </span>
          </div>

          <p style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>{food.name}</p>

          {food.servingLabel || food.note ? (
            <div className="mt-2 text-right" style={{ color: '#475569', lineHeight: 1.6, fontSize: 13 }}>
              {food.servingLabel ? <div>{food.servingLabel}</div> : null}
              {food.note ? <div>{food.note}</div> : null}
            </div>
          ) : (
            <div className="mt-2 text-right" style={{ color: '#475569', lineHeight: 1.6, fontSize: 13 }}>
              {suitability.body}
            </div>
          )}
        </div>
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
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
        </div>

        <div className="flex-1 text-right">
          <div className="mb-2 flex flex-wrap justify-start gap-2">
            <span
              className="rounded-full px-2 py-1 text-xs"
              style={{
                backgroundColor: suitability.bg,
                color: suitability.tone,
                fontWeight: 700,
                border: `1px solid ${suitability.border}`,
              }}
            >
              {suitability.label}
            </span>
            <span
              className="rounded-full px-2 py-1 text-xs"
              style={{ backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}
            >
              {item.calories} קל׳
            </span>
            <span
              className="rounded-full px-2 py-1 text-xs"
              style={{ backgroundColor: themeBg, color: themeColor, fontWeight: 700 }}
            >
              {item.carbs} גרם
            </span>
          </div>
          <p style={{ fontWeight: 800, color: '#0F172A', fontSize: 15.5 }}>{item.name}</p>
          <p style={{ color: '#475569', fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>
            {item.serving}
          </p>
          <p style={{ color: '#64748B', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            {item.note}
          </p>
        </div>
      </div>
    </button>
  );
}
