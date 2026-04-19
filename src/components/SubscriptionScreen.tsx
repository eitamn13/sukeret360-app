import { BadgeCheck, Crown, RefreshCw, ShieldCheck, TimerReset } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import {
  getPaymentStatusLabel,
  getUserFacingSubscriptionStatus,
  PRO_FEATURES,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '../lib/subscription';

interface SubscriptionScreenProps {
  onClose: () => void;
}

type SubscriptionSnapshot = {
  subscription_status: string;
  subscription_plan: string;
  subscription_active: boolean;
  subscription_started_at: string | null;
  subscription_renews_at: string | null;
  payment_status: string;
  billing_provider: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_currency: string;
  cancel_at_period_end: boolean;
  last_payment_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return 'אין תאריך';

  try {
    return new Date(value).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function getPlanTitle(plan: string) {
  if (plan === 'yearly') return 'PRO שנתי';
  if (plan === 'monthly') return 'PRO חודשי';
  return 'FREE';
}

export function SubscriptionScreen({ onClose }: SubscriptionScreenProps) {
  const { theme } = useAppContext();
  const { authEnabled, session } = useAuthContext();
  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'portal' | 'refresh' | null>(null);
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState<SubscriptionSnapshot | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const canManageBilling = useMemo(
    () => authEnabled && Boolean(session?.access_token),
    [authEnabled, session?.access_token]
  );

  const loadSubscriptionStatus = useCallback(async () => {
    if (!session?.access_token) {
      setStatus(null);
      return;
    }

    setLoadingStatus(true);

    try {
      const response = await fetch('/api/subscription-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { subscription?: SubscriptionSnapshot; error?: string }
        | null;

      if (!response.ok || !payload?.subscription) {
        throw new Error(payload?.error || 'status failed');
      }

      setStatus(payload.subscription);
    } catch (error) {
      console.error('Failed to load subscription status', error);
      setNotice('לא הצלחנו לטעון את מצב המנוי כרגע.');
    } finally {
      setLoadingStatus(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    void loadSubscriptionStatus();
  }, [loadSubscriptionStatus, session?.access_token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    if (!billing) return;

    if (billing === 'success') {
      setNotice('התשלום נקלט. אנחנו מעדכנים עכשיו את סטטוס המנוי שלך.');
      void loadSubscriptionStatus();
    } else if (billing === 'cancelled') {
      setNotice('החיוב בוטל לפני השלמת התשלום.');
    }

    params.delete('billing');
    const next = params.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [loadSubscriptionStatus]);

  const startCheckout = async (plan: SubscriptionPlanId) => {
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

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'checkout failed');
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error('Failed to start checkout', error);
      setNotice('לא הצלחנו לפתוח את דף התשלום כרגע.');
    } finally {
      setBusy(null);
    }
  };

  const openBillingPortal = async () => {
    if (!session?.access_token) {
      setNotice('כדי לנהל מנוי קיים צריך קודם להתחבר לחשבון.');
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

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'portal failed');
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error('Failed to open billing portal', error);
      setNotice('לא הצלחנו לפתוח את ניהול המנוי כרגע.');
    } finally {
      setBusy(null);
    }
  };

  const refreshStatus = async () => {
    setBusy('refresh');
    setNotice('');
    await loadSubscriptionStatus();
    setBusy(null);
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
        <div className="mx-auto w-full max-w-md space-y-4">
          <div
            className="rounded-[30px] p-5"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: `0 20px 44px ${theme.primaryShadow}`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => void refreshStatus()}
                className="flex h-11 min-w-[118px] items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-black"
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${theme.primaryBorder}`,
                  color: theme.primaryDark,
                }}
              >
                <RefreshCw size={16} />
                <span>{busy === 'refresh' || loadingStatus ? 'מרעננים...' : 'רענון סטטוס'}</span>
              </button>

              <div className="text-right">
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: theme.primaryBg, color: theme.primaryDark }}
                >
                  <Crown size={20} strokeWidth={1.9} />
                </div>
                <h2 className="text-[28px] font-black text-[#0F172A]">PRO לחולי סוכרת</h2>
                <p className="mt-2 text-sm leading-7 text-[#64748B]">
                  מעקב חכם יותר, פחות מגבלות שימוש, ותזכורות מתקדמות באמת.
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-[24px] p-4"
              style={{ background: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
            >
              <div className="grid grid-cols-2 gap-3">
                <StatusTile label="סטטוס" value={getUserFacingSubscriptionStatus(status?.subscription_status)} />
                <StatusTile label="מסלול" value={getPlanTitle(status?.subscription_plan ?? 'free')} />
                <StatusTile label="תשלום" value={getPaymentStatusLabel(status?.payment_status)} />
                <StatusTile label="חידוש הבא" value={formatDate(status?.subscription_renews_at ?? null)} />
              </div>

              {status?.cancel_at_period_end ? (
                <div
                  className="mt-3 rounded-[18px] px-4 py-3 text-sm font-bold"
                  style={{
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    color: '#C2410C',
                  }}
                >
                  המנוי מסומן לביטול בסוף התקופה הפעילה.
                </div>
              ) : null}
            </div>

            {notice ? (
              <NoticeBox>{notice}</NoticeBox>
            ) : null}

            {!canManageBilling ? (
              <NoticeBox>
                כדי לפתוח מנוי PRO או לנהל מנוי קיים צריך קודם להתחבר לחשבון.
              </NoticeBox>
            ) : null}

            <div className="mt-5 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center justify-between gap-3 rounded-[22px] px-4 py-3"
                  style={{ background: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
                >
                  <span className="text-sm font-bold text-[#334155]">{feature}</span>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{ background: theme.primaryBg, color: theme.primaryDark }}
                  >
                    <ShieldCheck size={16} strokeWidth={1.9} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]).map((planKey) => {
              const plan = SUBSCRIPTION_PLANS[planKey];
              const isCurrentPlan =
                status?.subscription_status !== 'free' && status?.subscription_plan === planKey;

              return (
                <div
                  key={planKey}
                  className="rounded-[26px] p-4 text-right"
                  style={{
                    background: isCurrentPlan ? theme.primaryBg : '#FFFFFF',
                    border: `2px solid ${isCurrentPlan ? theme.primary : theme.primaryBorder}`,
                    boxShadow: '0 12px 28px rgba(122, 146, 182, 0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-extrabold"
                      style={{
                        background: isCurrentPlan ? theme.primary : '#F8FAFC',
                        color: isCurrentPlan ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {isCurrentPlan ? 'המסלול שלך' : plan.badge}
                    </span>

                    <div className="text-right">
                      <p className="text-lg font-black text-[#0F172A]">{plan.title}</p>
                      <p className="mt-2 text-2xl font-black text-[#5A4740]">{plan.priceLabel}</p>
                      <p className="mt-1 text-xs font-bold text-[#64748B]">{plan.note}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#64748B]">{plan.description}</p>

                  <button
                    onClick={() => void startCheckout(planKey)}
                    disabled={busy !== null || isCurrentPlan}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-[20px] px-4 text-base font-black text-white transition-all active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      boxShadow: '0 16px 28px rgba(37, 99, 235, 0.22)',
                    }}
                  >
                    {busy === planKey ? 'פותחים...' : isCurrentPlan ? 'המסלול כבר פעיל' : 'מעבר לתשלום'}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => void openBillingPortal()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
            style={{
              background: '#FFFFFF',
              color: theme.primaryDark,
              border: `1px solid ${theme.primaryBorder}`,
            }}
          >
            {busy === 'portal' ? <TimerReset size={16} /> : <BadgeCheck size={16} />}
            <span>{busy === 'portal' ? 'פותחים...' : 'ניהול מנוי / ביטול / חידוש'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[20px] px-4 py-3 text-right"
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
    >
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#0F172A]">{value}</p>
    </div>
  );
}

function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-4 rounded-[22px] px-4 py-3 text-sm font-bold leading-7"
      style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        color: '#1D4ED8',
      }}
    >
      {children}
    </div>
  );
}
