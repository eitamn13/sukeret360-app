import { useState } from 'react';
import { Camera } from 'lucide-react';
import { DetectedFood, detectFoodsFromImage } from '../utils/vision';

export default function SimpleMealScanner() {
  const [previewUrl, setPreviewUrl] = useState('');
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setError('');
    setFoods([]);

    try {
      const result = await detectFoodsFromImage(file);
      setPreviewUrl(result.previewUrl);

      if (!result.foods.length) {
        setError('לא הצלחנו לזהות מזון. נסה שוב.');
        return;
      }

      setFoods(result.foods);
    } catch {
      setError('שגיאה בטעינת המזון. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <h2>סריקת ארוחה חכמה</h2>

      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: 10,
          backgroundColor: '#4f46e5',
          color: '#fff',
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Camera size={18} /> צלם / העלה תמונה
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

      {loading && <p style={{ marginTop: 12 }}>מאתר מזון...</p>}
      {error && <p style={{ marginTop: 12, color: 'red' }}>{error}</p>}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Meal preview"
          style={{
            width: '100%',
            marginTop: 16,
            borderRadius: 12,
            maxHeight: 260,
            objectFit: 'cover',
          }}
        />
      )}

      {foods.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>המזונות שזוהו:</h3>
          {foods.map((food, index) => (
            <div
              key={`${food.name}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 6,
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <span>
                {food.name} - {food.carbs}g פחמימות
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: 8,
              backgroundColor: '#FEF3F2',
              borderRadius: 6,
            }}
          >
            <strong>טיפים לחולי סוכרת:</strong>
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
