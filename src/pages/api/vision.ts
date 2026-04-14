import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const buffers: Buffer[] = [];
    for await (const chunk of req) buffers.push(chunk);
    const fileBuffer = Buffer.concat(buffers);

    // כאן שולחים את הבאפרא ל-OpenAI
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "זיהוי מזון בתמונה זו: ציין שם ופחמימות בגרם." },
            { type: "input_image", image_data: fileBuffer.toString("base64") },
          ],
        },
      ],
    });

    const foods = response.output_text
      ? JSON.parse(response.output_text)
      : [{ name: "לא זוהה", carbs: 0 }];

    res.status(200).json({ foods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "לא הצלחנו לזהות את המזון. נסה שוב." });
  }
}
