
// src/pages/api/vision.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

// ביטול פרסינג אוטומטי כדי לקבל קובץ
export const config = {
  api: {
    bodyParser: false,
  },
};

// סוג הנתונים שנחזיר
interface DetectedFood {
  name: string;
  carbs: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new formidable.IncomingForm();
    const data = await new Promise<{ filePath: string }>((resolve, reject) => {
      form.parse(req, (err, fields, files: any) => {
        if (err) return reject(err);
        if (!files.file) return reject(new Error("No file uploaded"));
        resolve({ filePath: files.file.filepath });
      });
    });

    const imageBuffer = fs.readFileSync(data.filePath);

    // 🔹 כאן נשלח ל-OpenAI API (GPT-4o Mini או DALL·E / Vision)
    const response = await fetch("https://api.openai.com/v1/images/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: imageBuffer,
    });

    const json = await response.json();

    // 🔹 לדוגמה, ממיר את התשובה לרשימת מזונות
    const foods: DetectedFood[] = (json.items || []).map((item: any) => ({
      name: item.name || "לא מזוהה",
      carbs: item.carbs || 10, // ברירת מחדל פחמימות
    }));

    res.status(200).json({ foods });
  } catch (err) {
    console.error("Vision API error:", err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
}
