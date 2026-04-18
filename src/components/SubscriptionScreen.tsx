import { Crown, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';

interface SubscriptionScreenProps {
  onClose: () => void;
}

const PLANS = {
  monthly: {
    title: 'PRO חודשי',
    price: '19 ₪ לחודש',
    badge: 'גמיש',
    note: 'אפשר לעצור בכל חודש',
  },
  yearly: {
    title: 'PRO שנתי',
    price: '149 ₪ לשנה',
    badge: 'הכי משתלם',
    note: 'חיסכון משמעותי למעקב רציף',
  },
} as const;

const PRO_FEATURES = [
  'שיחה חיה עם העוזר הרפואי בקול',
  'ניתוח ארוחות מתקדם יותר עם תובנות',
  'תזכורות חכמות להתראות וליומן',
  'SOS אוטומטי ודוחות למשפחה ולמנהל',
];

export function SubscriptionScreen({ onClose }: SubscriptionScreenProps) {
  const { theme } = useAppContext();
  const { authEnabled, session } = useAuthContext();
  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'portal' | null>(null);
  const [notice, setNotice] = useState('');

  const canPurchase = useMemo(() => authEnabled && Boolean(session?.access_token), [authEnabled, session?.access_token]);

  const startCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!authEnabled) {
      setNotice('כדי להפעיל מנוי בתשלום צריך לחבר את השרת עם Supabase ו-Stripe.');
      return;
    }

    if (!session?.access_token) {
      setNotice('כדי לפתוח מנוי PRO צריך קודם להתחבר לחשבון.');
      return;
    }

    setBusy(plan);
    setNotice('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Checkout failed');
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error('Failed to start checkout', error);
      setNotice('לא הצלחנו לפתוח את דף התשלום כרגע. אפשר לנסות שוב בעוד רגע.');
    } finally {
      setBusy(null);
    }
  };

  const openBillingPortal = async () => {
    if (!authEnabled) {
      setNotice('אזור המנוי יפעל ברגע שיחובר Stripe בשרת.');
      return;
    }

    if (!session?.access_token) {
      setNotice('כדי לנהל מנוי קיים צריך להתחבר לחשבון.');
      return;
    }

    setBusy('portal');
    setNotice('');

    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Portal failed');
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error('Failed to open billing portal', error);
      setNotice('לא הצלחנו לפתוח את אזור ניהול המנוי כרגע.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex flex-col overflow-hidden"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="מנוי PRO"
        subtitle="פחות בלגן, יותר אוטומציה ועזרה חכמה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="rounded-[30px] p-5"
          style={{
            background: 'rgba(255,255,255,0.96)',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: `0 20px 44px ${theme.primaryShadow}`,
          }}
        >
          <div className="text-right">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: theme.primaryBg, color: theme.primaryDark }}
            >
              <Crown size={20} strokeWidth={1.9} />
            </div>
            <h2 className="text-[28px] font-black text-[#4D5B73]">למה כדאי לשדרג?</h2>
            <p className="mt-2 text-sm leading-7 text-[#7C889A]">
              מנוי אחד פשוט וברור שנותן את הפיצ'רים המתקדמים שבאמת עוזרים ביום-יום.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-between gap-3 rounded-[22px] px-4 py-3"
                style={{ background: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <span className="text-sm font-bold text-[#4D5B73]">{feature}</span>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl"
                  style={{ background: theme.primaryBg, color: theme.primaryDark }}
                >
                  <ShieldCheck size={16} strokeWidth={1.9} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            {(Object.keys(PLANS) as Array<'monthly' | 'yearly'>).map((planKey) => (
              <button
                key={planKey}
                onClick={() => void startCheckout(planKey)}
                className="rounded-[26px] p-4 text-right transition-all active:scale-[0.99]"
                style={{
                  background:
                    planKey === 'yearly'
                      ? 'linear-gradient(135deg, rgba(126,166,229,0.16) 0%, rgba(212,155,176,0.14) 100%)'
                      : '#FFFFFF',
                  border: `1px solid ${planKey === 'yearly' ? theme.primary : theme.primaryBorder}`,
                  boxShadow: '0 12px 28px rgba(122, 146, 182, 0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{
                      background: planKey === 'yearly' ? theme.primaryBg : '#F8FAFC',
                      color: planKey === 'yearly' ? theme.primaryDark : '#64748B',
                    }}
                  >
                    {PLANS[planKey].badge}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#4D5B73]">{PLANS[planKey].title}</p>
                    <p className="mt-2 text-2xl font-black text-[#5A4740]">{PLANS[planKey].price}</p>
                    <p className="mt-1 text-xs font-bold text-[#8A97A8]">{PLANS[planKey].note}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#8A97A8]">
                    {planKey === 'yearly' ? 'שקט לאורך זמן בלי לחדש כל חודש' : 'מסלול נוח להתחלה מהירה'}
                  </span>
                  <div
                    className="flex h-11 min-w-[122px] items-center justify-center rounded-2xl px-4 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #8EADE4 0%, #D49BB0 100%)',
                      fontWeight: 900,
                    }}
                  >
                    {busy === planKey ? 'פותחים...' : 'שדרג עכשיו'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => void openBillingPortal()}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
            style={{
              background: '#FFFFFF',
              color: theme.primaryDark,
              border: `1px solid ${theme.primaryBorder}`,
            }}
          >
            {busy === 'portal' ? <TimerReset size={16} /> : <Sparkles size={16} />}
            <span>{busy === 'portal' ? 'פותחים...' : 'ניהול חיוב ומנויים'}</span>
          </button>

          {!canPurchase ? (
            <div
              className="mt-4 rounded-[22px] px-4 py-3 text-sm font-bold leading-7"
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1D4ED8',
              }}
            >
              כדי לפתוח תשלום אמיתי צריך להתחבר לחשבון ולחבר את השרת ל-Supabase ו-Stripe.
            </div>
          ) : null}

          {notice ? (
            <div
              className="mt-4 rounded-[22px] px-4 py-3 text-sm font-bold leading-7"
              style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                color: '#C2410C',
              }}
            >
              {notice}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
