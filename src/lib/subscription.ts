export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    title: 'PRO חודשי',
    priceLabel: '29.90 ₪ לחודש',
    amount: 2990,
    interval: 'month' as const,
    badge: 'גמיש',
    note: 'אפשר לבטל בכל חודש',
    description: 'גישה מלאה לעוזר הרפואי, תזכורות חכמות, יותר אוטומציות והיסטוריה רחבה יותר.',
  },
  yearly: {
    id: 'yearly',
    title: 'PRO שנתי',
    priceLabel: '149 ₪ לשנה',
    amount: 14900,
    interval: 'year' as const,
    badge: 'הכי משתלם',
    note: 'חיסכון משמעותי למעקב רציף',
    description: 'כל מה שיש ב-PRO, עם מחיר משתלם יותר לשימוש קבוע לאורך השנה.',
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

export const PRO_FEATURES = [
  'עוזר רפואי מתקדם יותר',
  'יותר אוטומציות ומעקב חכם',
  'היסטוריה רחבה יותר ותובנות אישיות',
  'תזכורות חכמות לתרופות ולמדידות',
  'פחות מגבלות שימוש לאורך היום',
  'עדיפות בתכונות חדשות',
] as const;

export function getSubscriptionPlanConfig(plan: string | null | undefined) {
  return plan === 'yearly' ? SUBSCRIPTION_PLANS.yearly : SUBSCRIPTION_PLANS.monthly;
}

export function getUserFacingSubscriptionStatus(status: string | null | undefined) {
  return status === 'premium' || status === 'lifetime' ? 'PRO' : 'FREE';
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'paid':
      return 'התשלום תקין';
    case 'failed':
      return 'התשלום נכשל';
    case 'past_due':
      return 'יש בעיית גבייה';
    case 'canceled':
      return 'המנוי בוטל';
    case 'processing':
      return 'התשלום בעיבוד';
    default:
      return 'אין חיוב פעיל';
  }
}
