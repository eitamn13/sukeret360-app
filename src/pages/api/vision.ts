import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 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
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // מאפשר קבצי תמונה עד 5 מגה
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body.file; // אם אתה שולח כ-FormData
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // שלח את התמונה ל־OpenAI Vision (דוגמה למודל GPT-4o Mini Vision)
    const response = await openai.images.analyze({
      model: "gpt-4o-mini",
      image: file,
      task: "Identify food and approximate carbs",
    });

    // נניח ש־response.data מכיל רשימת מאכלים עם פחמימות
    const foods = response.data.foods || [];

    res.status(200).json({ foods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error detecting food" });
  }
}
