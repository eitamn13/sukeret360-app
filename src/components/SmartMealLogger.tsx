import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Camera,
  Check,
  Loader2,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { FOOD_DATABASE, type FoodDatabaseItem } from '../data/foodDatabase';
import { type MealType, useAppContext } from '../context/AppContext';
import { type DetectedFood, detectFoodsFromImage } from '../utils/vision';
import { OverlayHeader } from './OverlayHeader';

const MEAL_TYPE_META: Record<MealType, { label: string; color: string; icon: LucideIcon }> = {
  breakfast: { label: 'בוקר', color: '#D97706', icon: Sun },
  lunch: { label: 'צהריים', color: '#0F766E', icon: UtensilsCrossed },
  dinner: { label: 'ערב', color: '#4338CA', icon: Moon },
  snack: { label: 'נשנוש', color: '#2563EB', icon: Apple },
};

type SelectedMealFood = DetectedFood & {
  source: 'vision' | 'manual' | 'database';
  servingLabel?: string;
  note?: string;
};

type MealStep = 0 | 1 | 2;

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
        normalized === candidate || normalized.includes(candidate) || candidate.includes(normalized)
    );
  });
}

function getFoodSuitability(
  food: Pick<SelectedMealFood, 'name' | 'carbs' | 'calories'>,
  match?: FoodDatabaseItem
) {
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
      body: 'יש כאן עומס פחמימות או מזון מעובד, לכן עדיף לאכול במידה ולשלב עם חלבון וירקות.',
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
      title: 'עוד לא נוספו מזונות',
      body: 'אחרי שנוסיף מזון, נראה כאן אם הארוחה מתאימה יותר לחולי סוכרת.',
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
    label: 'נראית מאוזנת',
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

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, mealLogs, theme } = useAppContext();
  const [step, setStep] = useState<MealStep>(0);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const addFood = (food: SelectedMealFood) => {
    setSelectedFoods((prev) => [food, ...prev]);
    setErrorMessage('');
    if (step < 2) setStep(2);
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
        icon: `meal-${mealType}`,
        mealType,
        source: food.source,
        servingLabel: food.servingLabel,
      })
    );

    onClose();
  };

  const currentMealMeta = MEAL_TYPE_META[mealType];

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden" style={{ background: theme.gradientFull }} dir="rtl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <div
          className="sticky top-0 z-20"
          style={{
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <OverlayHeader
            title="רישום ארוחה"
            subtitle={
              step === 0
                ? 'בחירה קצרה וסיום בלי עומס'
                : step === 1
                  ? 'צילום או חיפוש במאגר'
                  : 'בדיקה מהירה ושמירה'
            }
            theme={theme}
            onBack={() => (step > 0 ? setStep((prev) => (prev - 1) as MealStep) : onClose())}
            onClose={onClose}
            backLabel={step > 0 ? 'חזרה' : 'סגור'}
          />

          <div className="px-5 pb-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background: index <= step ? '#2563EB' : '#E2E8F0',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {step === 0 ? (
            <div className="space-y-4">
              <InfoCard
                title="איזו ארוחה זו?"
                body="נבחר סוג ארוחה כדי לחשב בצורה ברורה יותר את הכמות המתאימה."
              />

              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(MEAL_TYPE_META) as MealType[]).map((option) => {
                  const optionMeta = MEAL_TYPE_META[option];
                  const Icon = optionMeta.icon;
                  return (
                    <ChoiceCard
                      key={option}
                      active={mealType === option}
                      title={optionMeta.label}
                      subtitle="לחיצה לבחירה"
                      icon={<Icon size={18} strokeWidth={2} />}
                      onClick={() => setMealType(option)}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] text-base font-black text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 18px 34px rgba(37, 99, 235, 0.22)',
                }}
              >
                <Check size={18} strokeWidth={2.3} />
                <span>המשך</span>
              </button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <InfoCard
                title={`${currentMealMeta.label} · בחירת מקור`}
                body="אפשר לצלם, להעלות תמונה או לבחור מזון מוכר מתוך המאגר."
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[88px] w-full items-center justify-between rounded-[24px] px-4 text-right"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #DCE6F2',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div className="text-right">
                  <p className="text-base font-black text-[#0F172A]">צילום או העלאת תמונה</p>
                  <p className="mt-1 text-sm font-bold text-[#64748B]">המערכת תנסה לזהות מזון, פחמימות וקלוריות</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#EFF6FF] text-[#2563EB]">
                  <Camera size={18} strokeWidth={2} />
                </div>
              </button>

              <InfoCard
                title="מאגר מזון"
                body="אפשר לחפש מזון מוכר ולהוסיף בלחיצה אחת."
              />

              <div
                className="rounded-[24px] p-4"
                style={{ background: '#FFFFFF', border: '1px solid #DCE6F2' }}
              >
                <div
                  className="flex h-12 items-center gap-3 rounded-[18px] px-4"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <Search size={16} className="text-[#64748B]" />
                  <input
                    value={foodSearch}
                    onChange={(event) => setFoodSearch(event.target.value)}
                    placeholder="חיפוש מזון"
                    className="h-full w-full bg-transparent text-right text-sm font-bold text-[#0F172A] outline-none"
                    dir="rtl"
                  />
                </div>

                <div className="mt-3 grid gap-3">
                  {databaseResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addDatabaseFood(item)}
                      className="flex items-center justify-between rounded-[18px] px-4 py-3 text-right"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="text-right">
                        <p className="text-sm font-black text-[#0F172A]">{item.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#64748B]">
                          {item.carbs} גרם פחמימות · {item.calories} קלוריות
                        </p>
                      </div>
                      <Plus size={16} className="text-[#2563EB]" />
                    </button>
                  ))}
                </div>
              </div>

              {recentFoods.length ? (
                <div
                  className="rounded-[24px] p-4"
                  style={{ background: '#FFFFFF', border: '1px solid #DCE6F2' }}
                >
                  <p className="mb-3 text-right text-sm font-black text-[#0F172A]">בחירה מהירה מהיומן</p>
                  <div className="grid gap-3">
                    {recentFoods.map((item) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          addFood({
                            name: item.name,
                            carbs: item.carbs,
                            calories: item.calories,
                            source: 'database',
                            servingLabel: item.serving,
                          })
                        }
                        className="flex items-center justify-between rounded-[18px] px-4 py-3 text-right"
                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div className="text-right">
                          <p className="text-sm font-black text-[#0F172A]">{item.name}</p>
                          <p className="mt-1 text-xs font-bold text-[#64748B]">{item.serving}</p>
                        </div>
                        <Plus size={16} className="text-[#2563EB]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              {imagePreviewUrl ? (
                <div
                  className="overflow-hidden rounded-[24px]"
                  style={{ border: '1px solid #DCE6F2', background: '#FFFFFF' }}
                >
                  <img
                    src={imagePreviewUrl}
                    alt="תמונה שנבחרה"
                    className="h-[160px] w-full object-cover"
                  />
                </div>
              ) : null}

              <div
                className="rounded-[24px] p-4"
                style={{
                  background: mealSuitability.bg,
                  border: `1px solid ${mealSuitability.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black"
                    style={{ background: '#FFFFFF', color: mealSuitability.tone }}
                  >
                    {mealSuitability.label}
                  </span>
                  <p className="text-right text-lg font-black" style={{ color: mealSuitability.tone }}>
                    {mealSuitability.title}
                  </p>
                </div>
                <p className="mt-3 text-right text-sm font-bold leading-7" style={{ color: mealSuitability.tone }}>
                  {mealSuitability.body}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricCard label="פחמימות" value={`${totalCarbs} גרם`} tone={mealSuitability.tone} />
                  <MetricCard label="קלוריות" value={`${totalCalories}`} tone={mealSuitability.tone} />
                </div>
              </div>

              <div className="space-y-3">
                {selectedFoods.length === 0 ? (
                  <InfoCard
                    title="עדיין אין פריטים"
                    body="אפשר לחזור לצילום או להוסיף מזון ידנית מתוך מאגר המזון."
                  />
                ) : (
                  selectedFoods.map((food, index) => {
                    const suitability = getFoodSuitability(food, findFoodTemplateByName(food.name));
                    return (
                      <div
                        key={`${food.name}-${index}`}
                        className="rounded-[24px] p-4"
                        style={{ background: '#FFFFFF', border: '1px solid #DCE6F2' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => removeFood(index)}
                            className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                            style={{ background: '#FEF2F2', color: '#B91C1C' }}
                            aria-label="הסר"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex-1 text-right">
                            <p className="text-base font-black text-[#0F172A]">{food.name}</p>
                            <p className="mt-2 text-sm font-bold text-[#64748B]">
                              {food.carbs} גרם פחמימות · {food.calories} קלוריות
                            </p>
                            {food.servingLabel ? (
                              <p className="mt-1 text-xs font-bold text-[#64748B]">{food.servingLabel}</p>
                            ) : null}
                            {food.note ? (
                              <p className="mt-2 text-xs font-bold leading-6 text-[#64748B]">{food.note}</p>
                            ) : null}
                          </div>
                        </div>

                        <div
                          className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black"
                          style={{ background: suitability.bg, color: suitability.tone }}
                        >
                          {suitability.label}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className="rounded-[24px] p-4"
                style={{ background: '#FFFFFF', border: '1px solid #DCE6F2' }}
              >
                <p className="mb-3 text-right text-sm font-black text-[#0F172A]">הוספה מהירה ידנית</p>
                <div className="space-y-3">
                  <input
                    value={newFoodName}
                    onChange={(event) => setNewFoodName(event.target.value)}
                    placeholder="שם המזון"
                    className="h-12 w-full rounded-[18px] bg-white px-4 text-right text-sm font-bold text-[#0F172A] outline-none"
                    style={{ border: '1px solid #DCE6F2' }}
                    dir="rtl"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={newFoodCarbs}
                      onChange={(event) =>
                        setNewFoodCarbs(event.target.value ? Number(event.target.value) : '')
                      }
                      placeholder="פחמימות"
                      type="number"
                      className="h-12 w-full rounded-[18px] bg-white px-4 text-right text-sm font-bold text-[#0F172A] outline-none"
                      style={{ border: '1px solid #DCE6F2' }}
                      dir="rtl"
                    />
                    <input
                      value={newFoodCalories}
                      onChange={(event) =>
                        setNewFoodCalories(event.target.value ? Number(event.target.value) : '')
                      }
                      placeholder="קלוריות"
                      type="number"
                      className="h-12 w-full rounded-[18px] bg-white px-4 text-right text-sm font-bold text-[#0F172A] outline-none"
                      style={{ border: '1px solid #DCE6F2' }}
                      dir="rtl"
                    />
                  </div>

                  <button
                    onClick={addManualFood}
                    className="h-12 w-full rounded-[20px] text-sm font-black text-[#0F172A]"
                    style={{ background: '#F8FAFC', border: '1px solid #DCE6F2' }}
                  >
                    הוספת פריט ידנית
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              className="mt-4 rounded-[20px] px-4 py-3 text-sm font-bold leading-7"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
              }}
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div
          className="border-t px-4 pb-4 pt-3"
          style={{
            background: 'rgba(248,251,255,0.98)',
            borderColor: theme.primaryBorder,
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {step === 2 ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(1)}
                className="h-12 rounded-[20px] text-sm font-black text-[#334155]"
                style={{ background: '#FFFFFF', border: '1px solid #DCE6F2' }}
              >
                חזרה לצילום
              </button>
              <button
                onClick={saveMeals}
                className="h-12 rounded-[20px] text-sm font-black text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                }}
              >
                שמירת הארוחה ליומן
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className="absolute inset-0 z-[10001] flex items-center justify-center px-6"
          style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-xs rounded-[28px] bg-white px-6 py-8 text-center"
            style={{ boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)' }}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <Loader2 size={28} className="animate-spin" />
              </div>
            </div>
            <p className="text-[22px] font-black text-[#0F172A]">מנתחים את התמונה</p>
            <p className="mt-3 text-sm font-bold leading-7 text-[#64748B]">
              מזהים מזון, פחמימות וקלוריות. אין צורך ללחוץ שוב.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-[24px] p-4 text-right"
      style={{
        background: '#FFFFFF',
        border: '1px solid #DCE6F2',
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <p className="text-[20px] font-black text-[#0F172A]">{title}</p>
      <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{body}</p>
    </div>
  );
}

function ChoiceCard({
  active,
  icon,
  onClick,
  subtitle,
  title,
}: {
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative min-h-[116px] rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
      style={{
        background: active ? '#EFF6FF' : '#FFFFFF',
        border: `2px solid ${active ? '#2563EB' : '#DCE6F2'}`,
        boxShadow: active ? '0 14px 30px rgba(37, 99, 235, 0.12)' : '0 10px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: active ? '#2563EB' : '#F8FAFC',
          color: active ? '#FFFFFF' : '#94A3B8',
          border: `1px solid ${active ? '#2563EB' : '#DCE6F2'}`,
        }}
      >
        <Check size={13} strokeWidth={2.8} />
      </div>

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[16px]"
        style={{ background: '#EFF6FF', color: '#2563EB' }}
      >
        {icon}
      </div>

      <p className="text-base font-black text-[#0F172A]">{title}</p>
      <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{subtitle}</p>
    </button>
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
      className="rounded-[18px] px-3 py-3"
      style={{ background: '#FFFFFF', border: '1px solid rgba(148, 163, 184, 0.25)' }}
    >
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-base font-black" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}
