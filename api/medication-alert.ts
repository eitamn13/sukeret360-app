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

type MedicationAlertBody = {
  patientName?: string;
  patientGender?: string;
  contactName?: string;
  contactPhone?: string;
  medicationName?: string;
  medicationAppearance?: string;
  medicationPeriod?: string;
  medicationTime?: string;
  message?: string;
};

function parseBody(body: unknown): MedicationAlertBody {
  if (!body) return {};

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as MedicationAlertBody;
    } catch {
      return {};
    }
  }

  if (typeof body === 'object') {
    return body as MedicationAlertBody;
  }

  return {};
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

  const body = parseBody(req.body);
  const webhookUrl = process.env.EMERGENCY_ALERT_WEBHOOK_URL;
  const webhookSecret = process.env.EMERGENCY_ALERT_WEBHOOK_SECRET;

  if (!body.contactPhone?.trim() || !body.message?.trim()) {
    return res.status(400).json({ error: 'Missing contactPhone or message.' });
  }

  if (!webhookUrl) {
    return res.status(202).json({ delivered: false, reason: 'missing_webhook' });
  }

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret ? { 'x-emergency-alert-secret': webhookSecret } : {}),
      },
      body: JSON.stringify({
        source: 'my-diabetes',
        channel: 'emergency-contact',
        patientName: body.patientName ?? '',
        patientGender: body.patientGender ?? '',
        contactName: body.contactName ?? '',
        contactPhone: body.contactPhone ?? '',
        medicationName: body.medicationName ?? '',
        medicationAppearance: body.medicationAppearance ?? '',
        medicationPeriod: body.medicationPeriod ?? '',
        medicationTime: body.medicationTime ?? '',
        message: body.message ?? '',
        sentAt: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text().catch(() => '');
      console.error('Emergency alert webhook failed:', webhookResponse.status, errorText);
      return res.status(502).json({ delivered: false, reason: 'webhook_failed' });
    }

    return res.status(200).json({ delivered: true });
  } catch (error) {
    console.error('Emergency alert handler failed:', error);
    return res.status(500).json({ delivered: false, reason: 'server_error' });
  }
}
