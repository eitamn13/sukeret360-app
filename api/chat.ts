type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader?(name: string, value: string | string[]): void;
  status(code: number): {
    json(payload: unknown): void;
    end(payload?: string): void;
  };
};

type ChatHistoryEntry = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  message?: string;
  history?: unknown;
};

type OpenAIResponsesResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function createQuickReply(message: string): string | null {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return null;
  }

  if (['ai', 'היי', 'הי', 'שלום', 'hello', 'hey'].includes(normalized)) {
    return 'אני כאן בתור "העוזר הרפואי שלי". אפשר לשאול על סוכר, תרופות, אוכל, תסמינים או מה כדאי לעשות עכשיו.';
  }

  if (normalized.includes('סוכר') && normalized.includes('לפני') && normalized.includes('ארוחה')) {
    return 'בדרך כלל יעד מקובל לפני ארוחה הוא בערך 80 עד 130 mg/dL, אבל חשוב לפעול לפי היעד האישי שהרופא הגדיר.';
  }

  if (
    normalized.includes('היפו') ||
    normalized.includes('רעד') ||
    normalized.includes('סחרחורת') ||
    normalized.includes('חולשה')
  ) {
    return 'אם יש רעד, חולשה, הזעה או סחרחורת, כדאי קודם לבדוק סוכר. אם הוא נמוך, נהוג לקחת פחמימה מהירה ולבדוק שוב אחרי כ־15 דקות. אם יש החמרה, בלבול או קושי לדבר, צריך לפנות מיד לעזרה רפואית.';
  }

  if (normalized.includes('מטפורמין')) {
    return 'מטפורמין נלקח בדרך כלל עם אוכל או אחרי אוכל כדי להפחית אי נוחות בבטן, אבל הכי חשוב לפעול לפי ההנחיה האישית שקיבלת.';
  }

  if (
    normalized.includes('אוכל') ||
    normalized.includes('ארוחה') ||
    normalized.includes('פחמ')
  ) {
    return 'בדרך כלל עדיף לבחור ארוחה פשוטה עם חלבון, ירקות ופחמימה מדודה. למשל יוגורט עם אגוזים, חביתה עם סלט, או עוף עם אורז בכמות קטנה.';
  }

  return null;
}

function parseRequestBody(body: unknown): ChatRequestBody {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as ChatRequestBody;
    } catch {
      return {};
    }
  }

  if (typeof body === 'object') {
    return body as ChatRequestBody;
  }

  return {};
}

function normalizeHistory(history: unknown): ChatHistoryEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const role = (entry as { role?: unknown }).role;
      const content = (entry as { content?: unknown }).content;

      if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
        return null;
      }

      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return null;
      }

      return {
        role,
        content: trimmedContent,
      };
    })
    .filter((entry): entry is ChatHistoryEntry => entry !== null)
    .slice(-8);
}

function extractOutputText(response: OpenAIResponsesResult): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text.trim();
      }
    }
  }

  return '';
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY.' });
  }

  const { message, history } = parseRequestBody(req.body);
  const userMessage = typeof message === 'string' ? message.trim() : '';

  if (!userMessage) {
    return res.status(400).json({ error: 'Message required.' });
  }

  const quickReply = createQuickReply(userMessage);

  if (quickReply) {
    return res.status(200).json({ reply: quickReply });
  }

  const conversation = normalizeHistory(history).map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        instructions:
          'You are "העוזר הרפואי שלי", the medical helper inside the diabetes app "הסוכרת שלי". ' +
          'Reply in warm, simple, professional Hebrew. ' +
          'Keep answers short and easy for older adults to understand. ' +
          'Answer the user directly in the first sentence. ' +
          'Prefer 2 to 4 short sentences. ' +
          'Use bullet points only when steps are clearer than prose. ' +
          'Avoid repeating greetings when the user asked a concrete question. ' +
          'If the user describes an emergency, tell them to contact a medical professional or emergency services immediately. ' +
          'Do not claim to replace a doctor. ' +
          'Focus on practical next steps.',
        input: [
          ...conversation,
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_output_tokens: 320,
        store: false,
      }),
    });

    const data = (await openAiResponse.json()) as OpenAIResponsesResult;

    if (!openAiResponse.ok) {
      console.error('Chat API upstream error:', data);
      return res.status(openAiResponse.status).json({
        error: data.error?.message || 'OpenAI request failed.',
      });
    }

    const reply = extractOutputText(data) || 'מצטערת, לא הצלחתי לענות כרגע. נסו שוב בעוד רגע.';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Chat service unavailable.' });
  }
}
