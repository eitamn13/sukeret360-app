import { useEffect, useState } from 'react';
import { Camera, Plus, X } from 'lucide-react';
import { MealType, genderedText, useAppContext } from '../context/AppContext';
import { DetectedFood, detectFoodsFromImage } from '../utils/vision';

const MEAL_TYPE_META: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'בוקר', icon: '☀️' },
  lunch: { label: 'צהריים', icon: '🍽️' },
  dinner: { label: 'ערב', icon: '🌆' },
  snack: { label: 'חטיף', icon: '🍎' },
};

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, theme, userProfile } = useAppContext();
  const gender = userProfile.gender;

  const [step, setStep] = useState(0);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [manualMeals, setManualMeals] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number>(0);

  const totalCarbs = manualMeals.reduce((sum, food) => sum + food.carbs, 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { foods, previewUrl } = await detectFoodsFromImage(file);
      const detectedFoods = foods.filter((food) => food.name !== 'לא זוהה');

      setImagePreviewUrl(previewUrl);
      setManualMeals(detectedFoods);
      setStep(2);

      if (detectedFoods.length === 0) {
        setErrorMessage(
          genderedText(
            gender,
            'לא הצלחנו לזהות אוכל בתמונה. אפשר להוסיף פריטים ידנית.',
            'לא הצלחנו לזהות אוכל בתמונה. אפשר להוסיף פריטים ידנית.'
          )
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        genderedText(gender, 'שגיאה בזיהוי המזון. נסי שוב.', 'שגיאה בזיהוי המזון. נסה שוב.')
      );
    } finally {
      setLoading(false);
    }
  };

  const removeMeal = (index: number) => {
    setManualMeals((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const addManualFood = () => {
    if (!newFoodName.trim()) {
      setErrorMessage(genderedText(gender, 'אנא הזיני שם מזון', 'אנא הזן שם מזון'));
      return;
    }

    setManualMeals((prev) => [
      ...prev,
      {
        name: newFoodName.trim(),
        carbs: newFoodCarbs > 0 ? newFoodCarbs : 0,
      },
    ]);
    setErrorMessage('');
    setNewFoodName('');
    setNewFoodCarbs(0);
  };

  const saveMeals = () => {
    if (manualMeals.length === 0) {
      setErrorMessage(
        genderedText(gender, 'יש להוסיף לפחות פריט מזון אחד.', 'יש להוסיף לפחות פריט מזון אחד.')
      );
      return;
    }

    manualMeals.forEach((food) =>
      logMeal({
        name: food.name,
        carbs: food.carbs,
        icon: MEAL_TYPE_META[mealType].icon,
        mealType,
      })
    );

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: theme.primaryBg,
          borderRadius: 24,
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          direction: 'rtl',
          position: 'relative',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>
            {genderedText(gender, 'רישום ארוחה חכמה', 'רישום ארוחה חכמה')}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#FEF3F2',
              color: '#B91C1C',
              padding: 12,
              borderRadius: 12,
              zIndex: 10001,
              width: '90%',
              textAlign: 'center',
            }}
          >
            {errorMessage}
            <button
              onClick={() => setErrorMessage('')}
              style={{
                marginTop: 6,
                padding: 6,
                backgroundColor: '#B91C1C',
                color: '#fff',
                borderRadius: 6,
              }}
            >
              {genderedText(gender, 'סגור', 'סגור')}
            </button>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-3">
            <p>{genderedText(gender, 'בחרי סוג ארוחה:', 'בחר סוג ארוחה:')}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MEAL_TYPE_META).map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => setMealType(value as MealType)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${mealType === value ? theme.primary : '#E5E7EB'}`,
                    backgroundColor: mealType === value ? theme.primary : '#F9FAFB',
                    color: mealType === value ? '#fff' : '#1F2937',
                    fontWeight: 700,
                  }}
                >
                  {meta.icon} {meta.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.primary,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {genderedText(gender, 'המשך', 'המשך')}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p>
              {genderedText(
                gender,
                'צלמי או העלי תמונה של הארוחה:',
                'צלם או העלה תמונה של הארוחה:'
              )}
            </p>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: 12,
                background: theme.primary,
                color: '#fff',
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              <Camera size={18} />{' '}
              {genderedText(gender, 'העלי תמונה', 'העלה תמונה')}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(event) =>
                  event.target.files?.[0] && handleImageUpload(event.target.files[0])
                }
              />
            </label>

            {loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: '#E5E7EB',
                  borderRadius: 12,
                  marginTop: 6,
                }}
              >
                <span>{genderedText(gender, 'מאתרת אוכל...', 'מאתר אוכל...')}</span>
              </div>
            )}

            {!loading && imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Meal preview"
                style={{
                  width: '100%',
                  borderRadius: 16,
                  maxHeight: 260,
                  objectFit: 'cover',
                }}
              />
            )}

            {!loading && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: '#FEF3F2',
                  border: '1px solid #E5E7EB',
                }}
              >
                <p>אחרי ההעלאה נעבור ישר לעריכה ולשמירה של הארוחה.</p>
                <p style={{ marginTop: 6 }}>
                  {genderedText(
                    gender,
                    'אם הזיהוי לא יצליח, תוכלי להוסיף מזונות ידנית.',
                    'אם הזיהוי לא יצליח, תוכל להוסיף מזונות ידנית.'
                  )}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(0)}
              disabled={loading}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#E5E7EB',
                color: '#1F2937',
                fontWeight: 700,
              }}
            >
              {genderedText(gender, 'חזרי לבחירת סוג ארוחה', 'חזור לבחירת סוג ארוחה')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p>{genderedText(gender, 'סיכום הארוחה:', 'סיכום הארוחה:')}</p>

            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Meal preview"
                style={{
                  width: '100%',
                  borderRadius: 16,
                  maxHeight: 220,
                  objectFit: 'cover',
                }}
              />
            )}

            {manualMeals.map((food, index) => (
              <div
                key={`${food.name}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                }}
              >
                <span>
                  {food.name} - {food.carbs}g פחמימות
                </span>
                <button onClick={() => removeMeal(index)}>
                  <X size={16} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="שם מזון"
                value={newFoodName}
                onChange={(event) => setNewFoodName(event.target.value)}
                style={{ flex: 2, padding: 10, borderRadius: 10, border: '1px solid #E5E7EB' }}
              />
              <input
                type="number"
                placeholder="פחמימות"
                value={newFoodCarbs || ''}
                onChange={(event) => setNewFoodCarbs(Number(event.target.value))}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #E5E7EB' }}
              />
              <button
                onClick={addManualFood}
                style={{
                  backgroundColor: theme.primary,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 10,
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                border: `1px solid ${theme.primaryBorder}`,
              }}
            >
              <strong>סה״כ פחמימות:</strong> {Math.round(totalCarbs * 10) / 10} גרם
            </div>

            <button
              onClick={saveMeals}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.primary,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {genderedText(gender, 'שמור ארוחה', 'שמור ארוחה')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
