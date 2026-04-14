// /components/SimpleMealScanner.tsx
import React, { useState } from "react";
import { Camera, Plus } from "lucide-react";
import { useAppContext } from "../context/AppContext";

interface DetectedFood {
  name: string;
  carbs: number;
}

export default function SimpleMealScanner() {
  const { logMeal, theme } = useAppContext();
  const [image, setImage] = useState<File | null>(null);
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (file: File) => {
    setImage(file);
    setLoading(true);
    setError("");
    setFoods([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/vision", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.foods || data.foods.length === 0) {
        setError("לא הצלחנו לזהות מזון. נסה שוב.");
        return;
      }

      setFoods(data.foods);
    } catch (err) {
      console.error(err);
      setError("שגיאה בטעינת המזון. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const saveFood = (food: DetectedFood) => {
    logMeal({
      ...food,
      id: Date.now().toString(),
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <h2>סריקת ארוחה חכמה</h2>

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: 10,
          backgroundColor: theme.primary,
          color: "#fff",
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Camera size={18} /> צלם / העלה תמונה
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
      </label>

      {loading && (
        <p style={{ marginTop: 12 }}>מאתר מזון...</p>
      )}

      {error && (
        <p style={{ marginTop: 12, color: "red" }}>{error}</p>
      )}

      {foods.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>המזונות שזוהו:</h3>
          {foods.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 6,
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <span>{f.name} - {f.carbs}g פחמימות</span>
              <button
                onClick={() => saveFood(f)}
                style={{ backgroundColor: theme.primary, color: "#fff", padding: "4px 8px", borderRadius: 4 }}
              >
                שמור
              </button>
            </div>
          ))}

          <div
            style={{
              marginTop: 12,
              padding: 8,
              backgroundColor: "#FEF3F2",
              borderRadius: 6,
            }}
          >
            <strong>טיפים לחולי סכרת:</strong>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li>הוסף סיבים בתזונה</li>
              <li>הקפד על שתיית מים אחרי הארוחה</li>
              <li>בדוק את רמת הסוכר לפי הצורך</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
