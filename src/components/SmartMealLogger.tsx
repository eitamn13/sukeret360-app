import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { FOOD_DATABASE, FoodDatabaseItem } from '../data/foodDatabase';
import { MealType, genderedText, useAppContext } from '../context/AppContext';
import { DetectedFood, detectFoodsFromImage } from '../utils/vision';

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

function buildMealInsight(totalCarbs: number, foods: SelectedMealFood[]) {
  if (foods.length === 0) {
    return {
      title: 'אפשר לדייק את הארוחה',
      body: 'הוסיפו לפחות פריט אחד כדי לקבל סיכום פחמימות ותובנה חכמה.',
      bg: '#FFF7ED',
      border: '#FED7AA',
      color: '#C2410C',
    };
  }

  const hasFiberRichFood = foods.some((food) =>
    /עדש|חומוס|אבוקדו|מלפפון|עגבני|שיבולת|קינואה|אורז מלא/.test(food.name)
  );
  const hasProteinFood = foods.some((food) =>
    /עוף|ביצה|יוגורט|סלמון|קוטג|גבינה|טונה|אינסולין/.test(food.name) === false &&
    /עוף|ביצה|יוגורט|סלמון|קוטג|גבינה|טונה/.test(food.name)
  );

  if (totalCarbs <= 20) {
    return {
      title: 'ארוחה קלה בפחמימות',
      body: 'הארוחה נראית יחסית מתונה. אם זו ארוחה עיקרית, שווה לבדוק שיש גם חלבון או שומן טוב לשובע.',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      color: '#15803D',
    };
  }

  if (totalCarbs <= 45) {
    return {
      title: 'טווח פחמימות מאוזן',
      body: hasFiberRichFood || hasProteinFood
        ? 'נראה שיש כאן איזון טוב יותר לארוחה. שילוב של סיבים או חלבון יכול לעזור למתן קפיצות סוכר.'
        : 'כמות הפחמימות סבירה, ומומלץ לצרף ירקות או חלבון כדי לשפר יציבות אחרי האוכל.',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      color: '#1D4ED8',
    };
  }

  return {
    title: 'עומס פחמימות גבוה יחסית',
    body: 'כדאי לשקול להקטין מנה או להוסיף יותר חלבון, ירקות או קטניות כדי לרכך עלייה אפשרית בסוכר.',
    bg: '#FEF2F2',
    border: '#FECACA',
    color: '#B91C1C',
  };
}

function findFoodTemplateByName(name: string): FoodDatabaseItem | undefined {
  const normalized = name.trim().toLowerCase();
  return FOOD_DATABASE.find((item) => item.name.toLowerCase() === normalized);
}

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, theme, userProfile } = useAppContext();
  const gender = userProfile.gender;

  const [step, setStep] = useState(0);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedMealFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number | ''>('');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodServings, setFoodServings] = useState<number>(1);

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

  const mealInsight = useMemo(() => buildMealInsight(totalCarbs, selectedFoods), [selectedFoods, totalCarbs]);

  const databaseResults = useMemo(() => {
    const query = foodSearch.trim().toLowerCase();
    if (!query) {
      return FOOD_DATABASE.slice(0, 6);
    }

    return FOOD_DATABASE.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 6);
  }, [foodSearch]);

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
            carbs: food.carbs || match?.carbs || 0,
            source: 'vision',
            servingLabel: match?.serving,
            note: match?.note,
          };
        });

      setImagePreviewUrl(previewUrl);
      setSelectedFoods(detectedFoods);
      setStep(2);

      if (detectedFoods.length === 0) {
        setErrorMessage(
          genderedText(
            gender,
            'לא הצלחנו לזהות מזון בתמונה. אפשר להוסיף פריטים ידנית או מהמאגר.',
            'לא הצלחנו לזהות מזון בתמונה. אפשר להוסיף פריטים ידנית או מהמאגר.'
          )
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        genderedText(
          gender,
          'יש בעיה בזיהוי התמונה כרגע. אפשר להוסיף פריטים ידנית ולהמשיך.',
          'יש בעיה בזיהוי התמונה כרגע. אפשר להוסיף פריטים ידנית ולהמשיך.'
        )
      );
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const addManualFood = () => {
    if (!newFoodName.trim()) {
      setErrorMessage(genderedText(gender, 'אנא הזיני שם מזון', 'אנא הזן שם מזון'));
      return;
    }

    setSelectedFoods((prev) => [
      {
        name: newFoodName.trim(),
        carbs: typeof newFoodCarbs === 'number' && newFoodCarbs > 0 ? newFoodCarbs : 0,
        source: 'manual',
      },
      ...prev,
    ]);
    setNewFoodName('');
    setNewFoodCarbs('');
    setErrorMessage('');
  };

  const addDatabaseFood = (item: FoodDatabaseItem) => {
    const servings = foodServings > 0 ? foodServings : 1;
    const carbs = Math.round(item.carbs * servings * 10) / 10;

    setSelectedFoods((prev) => [
      {
        name: item.name,
        carbs,
        source: 'database',
        servingLabel: servings === 1 ? item.serving : `${servings} מנות • ${item.serving}`,
        note: item.note,
      },
      ...prev,
    ]);
    setFoodSearch('');
    setFoodServings(1);
  };

  const removeFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveMeals = () => {
    if (selectedFoods.length === 0) {
      setErrorMessage(
        genderedText(
          gender,
          'יש להוסיף לפחות פריט מזון אחד לפני השמירה.',
          'יש להוסיף לפחות פריט מזון אחד לפני השמירה.'
        )
      );
      return;
    }

    selectedFoods.forEach((food) =>
      logMeal({
        name: food.name,
        carbs: food.carbs,
        icon: MEAL_TYPE_META[mealType].icon,
        mealType,
        source: food.source,
        servingLabel: food.servingLabel,
      })
    );

    onClose();
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleImageUpload(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.46)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[28px]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          boxShadow: '0 30px 80px rgba(15,23,42,0.28)',
          direction: 'rtl',
        }}
      >
        <div
          className="sticky top-0 z-10 px-5 pt-5 pb-4 rounded-t-[28px]"
          style={{
            background: 'rgba(255,255,255,0.9)',
            borderBottom: `1px solid ${theme.primaryBorder}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            >
              <X size={20} />
            </button>

            <div className="text-center flex-1">
              <h2 style={{ fontWeight: 900, fontSize: 22, color: '#0F172A' }}>רישום ארוחה חכמה</h2>
              <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13 }}>
                צילום, זיהוי, מאגר מזון וסיכום פחמימות במקום אחד
              </p>
            </div>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: theme.gradientCard, color: 'white' }}
            >
              <Sparkles size={18} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-2 rounded-full flex-1 transition-all"
                style={{
                  background:
                    index <= step
                      ? theme.gradientCard
                      : 'linear-gradient(90deg, #E2E8F0, #F1F5F9)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {errorMessage && (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
            >
              {errorMessage}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div
                className="rounded-3xl p-5"
                style={{ background: theme.gradientCard, color: 'white' }}
              >
                <p style={{ fontWeight: 800, fontSize: 22 }}>איזו ארוחה זו?</p>
                <p style={{ opacity: 0.85, marginTop: 6 }}>
                  בחירה נכונה תעזור לנו לשמור היסטוריה מדויקת ולהבין טוב יותר את היום שלך.
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
                        border: `2px solid ${active ? meta.accent : '#E2E8F0'}`,
                        backgroundColor: active ? `${meta.accent}14` : '#FFFFFF',
                        boxShadow: active ? `0 14px 30px ${meta.accent}25` : 'none',
                      }}
                    >
                      <div className="text-3xl">{meta.icon}</div>
                      <p style={{ fontWeight: 800, marginTop: 8, color: '#0F172A' }}>{meta.label}</p>
                      <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                        תיעוד מותאם לארוחה {meta.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full h-14 rounded-2xl text-white text-base transition-all active:scale-[0.99]"
                style={{ background: theme.gradientCard, fontWeight: 800, boxShadow: `0 16px 32px ${theme.primaryShadow}` }}
              >
                המשך לצילום או העלאה
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div
                className="rounded-3xl p-5 border-2 border-dashed text-center"
                style={{ borderColor: theme.primaryBorder, backgroundColor: theme.primaryBg }}
              >
                <div
                  className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                  style={{ background: theme.gradientCard, color: 'white' }}
                >
                  <Camera size={26} />
                </div>
                <p style={{ fontWeight: 800, fontSize: 20, marginTop: 16, color: '#0F172A' }}>
                  צלמו את הצלחת או העלו תמונה
                </p>
                <p style={{ color: '#64748B', marginTop: 6 }}>
                  ננסה לזהות את המזון, להעריך פחמימות, ואז תוכלו לתקן הכל ידנית בקלות.
                </p>

                <label
                  className="inline-flex items-center gap-2 mt-5 px-5 h-12 rounded-2xl cursor-pointer"
                  style={{ background: theme.gradientCard, color: 'white', fontWeight: 800 }}
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

              {loading && (
                <div
                  className="rounded-3xl p-5 text-center"
                  style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                >
                  <p style={{ color: '#0F172A', fontWeight: 800, fontSize: 18 }}>מנתחים את הארוחה...</p>
                  <p style={{ color: '#64748B', marginTop: 8 }}>
                    מזהים מזונות, בודקים פחמימות ומכינים מסך עריכה.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-2xl text-sm transition-all active:scale-[0.99]"
                style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700 }}
              >
                דלגי לעריכה ידנית
              </button>

              <button
                onClick={() => setStep(0)}
                className="w-full h-11 rounded-2xl text-sm"
                style={{ backgroundColor: 'transparent', color: '#64748B', fontWeight: 700 }}
              >
                חזרה לשלב הקודם
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div
                    className="rounded-3xl overflow-hidden"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                  >
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B', fontSize: 13, fontWeight: 700 }}>צילום הארוחה</span>
                      <span
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ backgroundColor: `${MEAL_TYPE_META[mealType].accent}18`, color: MEAL_TYPE_META[mealType].accent, fontWeight: 800 }}
                      >
                        {MEAL_TYPE_META[mealType].icon} {MEAL_TYPE_META[mealType].label}
                      </span>
                    </div>

                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Meal preview"
                        style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="p-6 text-center" style={{ color: '#64748B' }}>
                        לא הועלתה תמונה. אפשר עדיין לבנות ארוחה מדויקת ידנית.
                      </div>
                    )}
                  </div>

                  <div
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontWeight: 800, color: '#0F172A' }}>פריטי הארוחה</p>
                      <span style={{ color: '#64748B', fontSize: 13 }}>{selectedFoods.length} פריטים</span>
                    </div>

                    <div className="space-y-2">
                      {selectedFoods.length === 0 && (
                        <div
                          className="rounded-2xl p-4 text-sm text-center"
                          style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                        >
                          עדיין לא נוספו מזונות. אפשר להוסיף ידנית או מתוך המאגר.
                        </div>
                      )}

                      {selectedFoods.map((food, index) => (
                        <div
                          key={`${food.name}-${index}`}
                          className="rounded-2xl p-3 flex items-start gap-3"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        >
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                          >
                            {food.source === 'vision' ? '📷' : food.source === 'database' ? '📚' : '✍️'}
                          </div>

                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => removeFood(index)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
                              >
                                <Trash2 size={15} />
                              </button>
                              <div>
                                <p style={{ fontWeight: 800, color: '#0F172A' }}>{food.name}</p>
                                <p style={{ color: '#475569', fontSize: 14 }}>{food.carbs} גרם פחמימות</p>
                              </div>
                            </div>
                            {(food.servingLabel || food.note) && (
                              <div className="mt-2 text-xs" style={{ color: '#64748B' }}>
                                {food.servingLabel && <div>{food.servingLabel}</div>}
                                {food.note && <div>{food.note}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: mealInsight.bg, border: `1px solid ${mealInsight.border}` }}
                  >
                    <p style={{ color: mealInsight.color, fontWeight: 900, fontSize: 19 }}>{mealInsight.title}</p>
                    <p style={{ color: mealInsight.color, opacity: 0.9, marginTop: 8, lineHeight: 1.6 }}>
                      {mealInsight.body}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div
                        className="rounded-2xl p-3 text-center"
                        style={{ backgroundColor: '#FFFFFF', border: `1px solid ${mealInsight.border}` }}
                      >
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>סה״כ פחמימות</p>
                        <p style={{ color: mealInsight.color, fontWeight: 900, fontSize: 24 }}>{totalCarbs}</p>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-center"
                        style={{ backgroundColor: '#FFFFFF', border: `1px solid ${mealInsight.border}` }}
                      >
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>פריטים</p>
                        <p style={{ color: mealInsight.color, fontWeight: 900, fontSize: 24 }}>{selectedFoods.length}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                  >
                    <p style={{ fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>הוספה ידנית מהירה</p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newFoodName}
                        onChange={(event) => setNewFoodName(event.target.value)}
                        placeholder="שם המזון"
                        dir="rtl"
                        className="w-full h-12 rounded-2xl px-4 outline-none"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={addManualFood}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: theme.gradientCard, color: 'white' }}
                        >
                          <Plus size={18} />
                        </button>
                        <input
                          type="number"
                          value={newFoodCarbs}
                          onChange={(event) =>
                            setNewFoodCarbs(event.target.value ? Number(event.target.value) : '')
                          }
                          placeholder="גרם פחמימות"
                          dir="rtl"
                          className="flex-1 h-12 rounded-2xl px-4 outline-none"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Search size={16} style={{ color: theme.primary }} />
                      <p style={{ fontWeight: 800, color: '#0F172A' }}>מאגר מזון לחולי סוכרת</p>
                    </div>

                    <input
                      type="text"
                      value={foodSearch}
                      onChange={(event) => setFoodSearch(event.target.value)}
                      placeholder="חפשו מזון, פרי, לחם, קטניות..."
                      dir="rtl"
                      className="w-full h-12 rounded-2xl px-4 outline-none"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    />

                    <div className="flex items-center gap-2 mt-3 mb-3">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={foodServings}
                        onChange={(event) => setFoodServings(Number(event.target.value) || 1)}
                        className="w-24 h-10 rounded-xl px-3 outline-none"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      />
                      <span style={{ color: '#64748B', fontSize: 13 }}>מנות</span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {databaseResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addDatabaseFood(item)}
                          className="w-full rounded-2xl p-3 text-right transition-all active:scale-[0.99]"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                            >
                              <span style={{ fontSize: 20 }}>{item.icon}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className="px-2 py-1 rounded-full text-xs"
                                  style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700 }}
                                >
                                  {item.carbs} גרם
                                </span>
                                <div>
                                  <p style={{ fontWeight: 800, color: '#0F172A' }}>{item.name}</p>
                                  <p style={{ color: '#475569', fontSize: 13 }}>{item.serving}</p>
                                </div>
                              </div>
                              <p style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>
                                {item.note}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
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
                  style={{ background: theme.gradientCard, fontWeight: 800, boxShadow: `0 16px 32px ${theme.primaryShadow}` }}
                >
                  שמירת הארוחה ליומן
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
