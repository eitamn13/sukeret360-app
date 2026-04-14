import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // תמונה עד 5 מגה
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const file = req.body; // Next.js מזהה את formData
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 🔹 כאן אתה צריך לשלוח את התמונה ל-OpenAI Vision
    // לדוגמה נשתמש במודל התמונה GPT-4
    const result = await openai.images.analyze({
      model: "gpt-4.1-mini",
      image: file, // התמונה שמתקבלת מה-frontend
      features: ["objects", "labels"], // חפצים ומזונות
    });

    // המרה לפורמט שלנו
    const foods = result.data?.objects?.map((obj: any) => ({
      name: obj.name,
      carbs: obj.carbs || 0, // אם אין, 0 פחמימות
    })) || [];

    res.status(200).json({ foods });
  } catch (error: any) {
    console.error("Vision API error:", error);
    res.status(500).json({ error: "לא הצלחנו לזהות את המזון. נסה שוב." });
  }
}
