import React, { useState } from "react";
import { useAppContext, genderedText } from "../context/AppContext";
import { X, Camera, Plus } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
interface DetectedFood { name: string; carbs: number }

export function SmartMealLogger({ onClose }: { onClose: () => void }) {
  const { logMeal, theme, userProfile } = useAppContext();
  const gender = userProfile.gender;

  const [step, setStep] = useState(0);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [image, setImage] = useState<File | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<DetectedFood[]>([]);
  const [manualMeals, setManualMeals] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCarbs, setNewFoodCarbs] = useState<number>(0);

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "breakfast", label: "בוקר" },
    { value: "lunch", label: "צהריים" },
    { value: "dinner", label: "ערב" },
    { value: "snack", label: "חטיף" },
  ];

  const handleImageUpload = async (file: File) => {
    setImage(file);
    setLoading(true);
    setAISuggestions([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/vision", { method: "POST", body: formData });
      const data = await response.json();

      let foods: DetectedFood[] = [{ name: "לא זוהה", carbs: 0 }];
      if (data.foods) {
        try {
          foods = Array.isArray(data.foods) ? data.foods : JSON.parse(data.foods);
        } catch {
          foods = [{ name: data.foods.toString(), carbs: 0 }];
        }
      }
      setAISuggestions(foods);
      if (foods.length === 0) setErrorMessage(genderedText(gender, "לא הצלחנו לזהות אוכל בתמונה.", "לא הצלחנו לזהות אוכל בתמונה."));
    } catch (err) {
      console.error(err);
      setErrorMessage(genderedText(gender, "שגיאה בזיהוי המזון. נסי שוב.", "שגיאה בזיהוי המזון. נסה שוב."));
    } finally {
      setLoading(false);
    }
  };

  const addMeal = (food: DetectedFood) => setManualMeals(prev => [...prev, food]);
  const removeMeal = (index: number) => setManualMeals(prev => prev.filter((_, i) => i !== index));

  const addManualFood = () => {
    if (!newFoodName) {
      setErrorMessage(genderedText(gender, "אנא הזן שם מזון", "אנא הזן שם מזון"));
      return;
    }
    addMeal({ name: newFoodName, carbs: newFoodCarbs });
    setNewFoodName("");
    setNewFoodCarbs(0);
  };

  const saveMeals = () => {
    if (manualMeals.length === 0) {
      setErrorMessage(genderedText(gender, "יש להוסיף לפחות מזון אחד.", "יש להוסיף לפחות מזון אחד."));
      return;
    }
    manualMeals.forEach(food =>
      logMeal({
        ...food,
        id: Date.now().toString(),
        loggedAt: new Date().toISOString(),
        mealType,
      })
    );
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", background: theme.primaryBg, borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", direction: "rtl", position: "relative" }}>

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>{genderedText(gender, "רישום ארוחה חכמה", "רישום ארוחה חכמה")}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={22} /></button>
        </div>

        {/* Error Modal */}
        {errorMessage && (
          <div style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#FEF3F2",
            color: "#B91C1C",
            padding: 12,
            borderRadius: 12,
            zIndex: 10001,
            width: "90%",
            textAlign: "center"
          }}>
            {errorMessage}
            <button onClick={() => setErrorMessage("")} style={{ marginTop: 6, padding: 6, backgroundColor: "#B91C1C", color: "#fff", borderRadius: 6 }}>
              {genderedText(gender, "סגור", "סגור")}
            </button>
          </div>
        )}

        {/* Step 0 */}
        {step === 0 && (
          <div className="space-y-3">
            <p>{genderedText(gender, "בחרי סוג ארוחה:", "בחר סוג ארוחה:")}</p>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map(m => (
                <button key={m.value} onClick={() => setMealType(m.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${mealType === m.value ? theme.primary : "#E5E7EB"}`,
                    backgroundColor: mealType === m.value ? theme.primary : "#F9FAFB",
                    color: mealType === m.value ? "#fff" : "#1F2937",
                    fontWeight: 700
                  }}
                >{m.label}</button>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 12, backgroundColor: theme.primary, color: "#fff", fontWeight: 700 }}>
              {genderedText(gender, "המשך", "המשך")}
            </button>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-3">
            <p>{genderedText(gender, "צלמי או העלי תמונה של הארוחה:", "צלם או העלה תמונה של הארוחה:")}</p>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 12, background: theme.primary, color: "#fff", borderRadius: 12, fontWeight: 700 }}>
              <Camera size={18} /> {genderedText(gender, "העלי תמונה", "העלה תמונה")}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            </label>

            {loading && <p>{genderedText(gender, "מאתרת אוכל...", "מאתר אוכל...")}</p>}

            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((f, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, border: "1px solid #E5E7EB", borderRadius: 12 }}>
                  <span>{f.name} - {f.carbs}g פחמימות</span>
                  <button onClick={() => addMeal(f)}><Plus size={16} /></button>
                </div>
              ))
            ) : !loading && (
              <div style={{ padding: 10, borderRadius: 12, backgroundColor: "#FEF3F2", border: "1px solid #E5E7EB" }}>
                <p>{genderedText(gender, "לא הצלחנו לזהות אוכל בתמונה.", "לא הצלחנו לזהות אוכל בתמונה.")}</p>
                <button onClick={() => setAISuggestions([])} style={{ marginTop: 6, padding: 6, borderRadius: 6, backgroundColor: theme.primary, color: "#fff", fontWeight: 700 }}>
                  {genderedText(gender, "נסה שוב", "נסה שוב")}
                </button>
                <p style={{ marginTop: 6 }}>{genderedText(gender, "או הוסף מזון ידנית בשלב הבא.", "או הוסף מזון ידנית בשלב הבא.")}</p>
              </div>
            )}

            <button onClick={() => setStep(2)} style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 12, backgroundColor: theme.primary, color: "#fff", fontWeight: 700 }}>
              {genderedText(gender, "המשך", "המשך")}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-3">
            <p>{genderedText(gender, "סיכום הארוחה:", "סיכום הארוחה:")}</p>
            {manualMeals.map((f, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, border: "1px solid #E5E7EB", borderRadius: 12 }}>
                <span>{f.name} - {f.carbs}g פחמימות</span>
                <button onClick={() => removeMeal(idx)}><X size={16} /></button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 6 }}>
              <input type="text" placeholder="שם מזון" value={newFoodName} onChange={(e) => setNewFoodName(e.target.value)} style={{ flex: 2, padding: 6, borderRadius: 6, border: "1px solid #E5E7EB" }} />
              <input type="number" placeholder="פחמימות" value={newFoodCarbs} onChange={(e) => setNewFoodCarbs(Number(e.target.value))} style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #E5E7EB" }} />
              <button onClick={addManualFood} style={{ backgroundColor: theme.primary, color: "#fff", padding: "6px 12px", borderRadius: 6 }}>{genderedText(gender, "הוסף", "הוסף")}</button>
            </div>

            <button onClick={saveMeals} style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 12, backgroundColor: theme.primary, color: "#fff", fontWeight: 700 }}>
              {genderedText(gender, "שמור", "שמור")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
