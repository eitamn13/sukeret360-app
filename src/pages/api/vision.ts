// pages/api/vision.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: false },
};

interface DetectedFood {
  name: string;
  carbs: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const buffers: Buffer[] = [];
    for await (const chunk of req) buffers.push(chunk);
    const fileBuffer = Buffer.concat(buffers);

    // שולחים ל-OpenAI עם הנחיה מפורשת ל-JSON
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
אנא זיהוי את המזון בתמונה המצורפת והחזר JSON במבנה הבא:
[
  { "name": "שם המזון", "carbs": פחמימות בגרם }
]
אם לא ניתן לזהות מזון, החזר [{ "name": "לא זוהה", "carbs": 0 }].
`
            },
            { type: "input_image", image_data: fileBuffer.toString("base64") },
          ],
        },
      ],
    });

    // בטוח מפני JSON לא תקין
    let foods: DetectedFood[] = [{ name: "לא זוהה", carbs: 0 }];
    if (response.output_text) {
      try {
        const parsed = JSON.parse(response.output_text);
        if (Array.isArray(parsed)) foods = parsed;
      } catch {
        // fallback: אם JSON לא תקין, מחזיר את הטקסט כהצעה אחת
        foods = [{ name: response.output_text || "לא זוהה", carbs: 0 }];
      }
    }

    res.status(200).json({ foods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "לא הצלחנו לזהות את המזון. נסה שוב." });
  }
}
