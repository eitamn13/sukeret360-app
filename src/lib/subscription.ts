export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    title: 'מנוי חודשי',
    priceLabel: '19 ₪ לחודש',
    description: 'גישה מלאה לעוזר הרפואי, ניתוחי ארוחות מתקדמים ותזכורות חכמות.',
  },
  yearly: {
    id: 'yearly',
    title: 'מנוי שנתי',
    priceLabel: '149 ₪ לשנה',
    description: 'המחיר המשתלם ביותר למעקב רציף ושימוש מלא בכל הפיצ׳רים המתקדמים.',
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;
