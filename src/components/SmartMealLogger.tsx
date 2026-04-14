// src/components/SmartMealLogger.tsx
import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { X, Camera, Plus, Trash2 } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface DetectedFood {
  name: string;
  carbs: number;
  image?: string;
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 🔹 API אמיתי לזיהוי אוכל
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // data.foods = [{ name: 'לחם מלא', carbs: 15, image: '🍞' }, ...]
      setAISuggestions(data.foods || []);
    } catch (error) {
      console.error("Error detecting food:", error);
      alert("לא הצלחנו לזהות את המזון. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const addMeal = (food: DetectedFood) => setManualMeals((prev) => [...prev, food]);
  const removeMeal = (index: number) => setManualMeals((prev) => prev.filter((_, i) => i !== index));

  const saveMeals = () => {
    manualMeals.forEach((food) =>
      logMeal({
        ...food,
        id: Date.now().toString(),
        loggedAt: new Date().toISOString(),
      })
    );
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
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: theme.primaryBg,
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          direction: "rtl",
        }}
      >
        {/* כותרת וסגירה */}
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>רישום ארוחה חכמה</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>

        {/* שלב 1: בחירת סוג ארוחה */}
        {step === 0 && (
          <div className="space-y-3">
            <p>בחר סוג הארוחה:</p>
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

        {/* שלב 2: צילום או העלאת תמונה */}
        {step === 1 && (
          <div className="space-y-3">
            <p>צלם או העלה תמונה של הארוחה:</p>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                padding: 12,
                background: theme.primary,
                color: "white",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              <Camera size={18} />
              העלה תמונה
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
            </label>

            {loading && <p>מאתר אוכל...</p>}

            {aiSuggestions.length > 0 && (
              <div className="space-y-2">
                {aiSuggestions.map((f, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    <span>{f.name} - {f.carbs}g פחמימות {f.image}</span>
                    <button onClick={() => addMeal(f)}>
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
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

        {/* שלב 3: סיכום ושמירה */}
        {step === 2 && (
          <div className="space-y-3">
            <p>סיכום הארוחה:</p>
            {manualMeals.map((f, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px", border: "1px solid #E5E7EB", borderRadius: 12 }}>
                <span>{f.name} - {f.carbs}g פחמימות {f.image}</span>
                <button onClick={() => removeMeal(idx)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={saveMeals}
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
              שמור ארוחה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
