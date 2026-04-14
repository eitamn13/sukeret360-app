type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status(code: number): {
    json(payload: unknown): void;
  };
};

function parseBody(body: unknown): { message?: string } {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { message?: string };
    } catch {
      return {};
    }
  }

  if (typeof body === 'object') {
    return body as { message?: string };
  }

  return {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = parseBody(req.body);

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "אתה עוזר בריאות לסוכרת. דבר בעברית פשוטה וברורה.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "OpenAI request failed", details: data });
    }

    const reply = data.choices?.[0]?.message?.content || "לא הצלחתי לענות 😔";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
