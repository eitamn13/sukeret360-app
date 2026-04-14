// src/components/SmartMealLogger.tsx
import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { X, Camera, Plus } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface DetectedFood {
  name: string;
  carbs: number;
}

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, theme } = useAppContext();

  const [step, setStep] = useState(0);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [image, setImage] = useState<File | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<DetectedFood[]>([]);
  const [manualMeals, setManualMeals] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(false);

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "breakfast", label: "בוקר" },
    { value: "lunch", label: "צהריים" },
    { value: "dinner", label: "ערב" },
    { value: "snack", label: "חטיף" },
  ];

  const handleImageUpload = async (file: File) => {
    setImage(file);
    setLoading(true);

    // 🔹 כאן תשלח את התמונה ל-API אמיתי
    // לדוגמה בלבד, מחזיר שני מזונות
    setTimeout(() => {
      setAISuggestions([
        { name: "לחם מלא", carbs: 15 },
        { name: "עגבנייה", carbs: 3 },
      ]);
      setLoading(false);
    }, 1000);
  };

  const addMeal = (food: DetectedFood) => {
    setManualMeals((prev) => [...prev, food]);
  };

  const removeMeal = (index: number) => {
    setManualMeals((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMeals = () => {
    manualMeals.forEach((food) => logMeal({ ...food, id: Date.now().toString(), loggedAt: new Date().toISOString() }));
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
          background: theme.primaryBg,
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          direction: "rtl",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>רישום ארוחה חכמה</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>

        {/* שלב 1: בחירת סוג ארוחה */}
        {step === 0 && (
          <div className="space-y-3">
            <p>בחר סוג ארוחה:</p>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMealType(m.value)}
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    border: `2px solid ${mealType === m.value ? theme.primary : "#E5E7EB"}`,
                    backgroundColor: mealType === m.value ? theme.primary : "#F9FAFB",
                    color: mealType === m.value ? "#fff" : "#1F2937",
                    fontWeight: 700,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                backgroundColor: theme.primary,
                color: "white",
                fontWeight: 700,
              }}
            >
              המשך
            </button>
          </div>
        )}

        {/* שלב 2: צילום / העלאת תמונה */}
        {step === 1 && (
          <div className="space-y-3">
            <p>צלם או העלה תמונה של הארוחה:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
            {loading && <p>מאתר אוכל...</p>}
            {aiSuggestions.map((f, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                <span>{f.name} - {f.carbs}g פחמימות</span>
                <button onClick={() => addMeal(f)}>
                  <Plus size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setStep(2)}
              style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, backgroundColor: theme.primary, color: "white", fontWeight: 700 }}
            >
              המשך
            </button>
          </div>
        )}

        {/* שלב 3: סיכום / עריכה */}
        {step === 2 && (
          <div className="space-y-3">
            <p>סיכום הארוחה:</p>
            {manualMeals.map((f, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                <span>{f.name} - {f.carbs}g פחמימות</span>
                <button onClick={() => removeMeal(idx)}>
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={saveMeals}
              style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, backgroundColor: theme.primary, color: "white", fontWeight: 700 }}
            >
              שמור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
