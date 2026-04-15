export interface DetectedFood {
  name: string;
  carbs: number;
  calories: number;
}

type VisionResponse = {
  foods?: unknown;
  error?: string;
};

function clampNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 10) / 10;
}

function parseJsonSafely(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizeDetectedFoods(input: unknown): DetectedFood[] {
  const parsed = typeof input === 'string' ? parseJsonSafely(input) : input;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { name, carbs: 0, calories: 0 } : null;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const name =
        typeof (item as { name?: unknown }).name === 'string'
          ? (item as { name: string }).name.trim()
          : '';

      if (!name) {
        return null;
      }

      return {
        name,
        carbs: clampNumber((item as { carbs?: unknown }).carbs),
        calories: clampNumber((item as { calories?: unknown }).calories),
      };
    })
    .filter((item): item is DetectedFood => item !== null);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));

    reader.readAsDataURL(file);
  });
}

function extractBase64Payload(dataUrl: string): { mimeType: string; base64: string } {
  const [header, base64 = ''] = dataUrl.split(',', 2);
  const mimeTypeMatch = header.match(/^data:(.+);base64$/);

  return {
    mimeType: mimeTypeMatch?.[1] ?? 'image/jpeg',
    base64,
  };
}

export async function detectFoodsFromImage(file: File): Promise<{
  foods: DetectedFood[];
  previewUrl: string;
}> {
  const previewUrl = await readFileAsDataUrl(file);
  const { mimeType, base64 } = extractBase64Payload(previewUrl);

  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
    }),
  });

  const data = (await response.json()) as VisionResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Vision request failed.');
  }

  return {
    foods: normalizeDetectedFoods(data.foods),
    previewUrl,
  };
}
