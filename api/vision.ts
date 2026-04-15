type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): {
    json(payload: unknown): void;
    end(payload?: string): void;
  };
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

type VisionRequestBody = {
  imageBase64?: string;
  mimeType?: string;
};

type DetectedFood = {
  name: string;
  carbs: number;
  calories: number;
};

function parseRequestBody(body: unknown): VisionRequestBody {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as VisionRequestBody;
    } catch {
      return {};
    }
  }

  if (typeof body === 'object') {
    return body as VisionRequestBody;
  }

  return {};
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

function clampNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 10) / 10;
}

function normalizeFoods(rawText: string): DetectedFood[] {
  if (!rawText.trim()) {
    return [{ name: 'לא זוהה', carbs: 0, calories: 0 }];
  }

  const arrayStart = rawText.indexOf('[');
  const arrayEnd = rawText.lastIndexOf(']');
  const candidate =
    arrayStart >= 0 && arrayEnd > arrayStart
      ? rawText.slice(arrayStart, arrayEnd + 1)
      : rawText;

  try {
    const parsed = JSON.parse(candidate) as Array<{
      name?: unknown;
      carbs?: unknown;
      calories?: unknown;
    }>;

    const foods = parsed
      .map((item) => {
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!name) {
          return null;
        }

        return {
          name,
          carbs: clampNumber(item?.carbs),
          calories: clampNumber(item?.calories),
        };
      })
      .filter((item): item is DetectedFood => item !== null);

    return foods.length > 0 ? foods : [{ name: 'לא זוהה', carbs: 0, calories: 0 }];
  } catch {
    return [{ name: 'לא זוהה', carbs: 0, calories: 0 }];
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType } = parseRequestBody(req.body);
  const cleanedBase64 = typeof imageBase64 === 'string' ? imageBase64.replace(/\s/g, '') : '';
  const safeMimeType = typeof mimeType === 'string' && mimeType ? mimeType : 'image/jpeg';

  if (!cleanedBase64) {
    return res.status(400).json({ error: 'Missing image payload.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY.' });
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'זהה את המאכלים שבתמונה והחזר רק JSON במבנה הזה: ' +
                  '[{"name":"שם המזון","carbs":מספר,"calories":מספר}]. ' +
                  'אם אי אפשר לזהות מזון, החזר [{"name":"לא זוהה","carbs":0,"calories":0}]. ' +
                  'הערך calories צריך להיות קילוקלוריות משוערות למנה שנראית בתמונה.',
              },
              {
                type: 'input_image',
                image_url: `data:${safeMimeType};base64,${cleanedBase64}`,
              },
            ],
          },
        ],
        max_output_tokens: 350,
      }),
    });

    const data = (await openAiResponse.json()) as OpenAIResponsesResult;

    if (!openAiResponse.ok) {
      return res.status(openAiResponse.status).json({
        error: data.error?.message || 'OpenAI request failed.',
      });
    }

    const foods = normalizeFoods(extractOutputText(data));
    return res.status(200).json({ foods });
  } catch (error) {
    console.error('Vision API error:', error);
    return res.status(500).json({ error: 'לא הצלחנו לזהות את המזון. נסה שוב.' });
  }
}
