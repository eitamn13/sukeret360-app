import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `אתה עוזר בריאות מקצועי המתמחה בסוכרת.
דבר בעברית פשוטה וברורה.
תן תשובות קצרות וברורות.
היה תומך ונעים.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "לא הצלחתי לענות";

    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
