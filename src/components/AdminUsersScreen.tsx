import { Crown, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SubscriptionPlan, SubscriptionStatus } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

type AdminUser = {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_seen_at: string;
  auth_provider: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_updated_at: string | null;
  billing_provider: string | null;
  stripe_customer_id: string | null;
  is_admin_managed: boolean;
};

interface AdminUsersScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(value: string | null) {
  if (!value) return 'לא זמין';

  try {
    return new Date(value).toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function getSubscriptionLabel(status: SubscriptionStatus, plan: SubscriptionPlan) {
  if (status === 'free') return 'חינמי';
  if (status === 'lifetime') return 'לכל החיים';
  if (plan === 'yearly') return 'שנתי';
  return 'חודשי';
}

export function AdminUsersScreen({ isOpen, onClose }: AdminUsersScreenProps) {
  const { theme } = useAppContext();
  const { isAdmin, session } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

  const filteredUsers = useMemo(() => {
    if (filter === 'free') {
      return users.filter((user) => user.subscription_status === 'free');
    }
    if (filter === 'paid') {
      return users.filter((user) => user.subscription_status !== 'free');
    }
    return users;
  }, [filter, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      free: users.filter((user) => user.subscription_status === 'free').length,
      paid: users.filter((user) => user.subscription_status !== 'free').length,
    }),
    [users]
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token || !isAdmin) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { users?: AdminUser[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || 'טעינת המשתמשים נכשלה');
      }

      setUsers(Array.isArray(payload?.users) ? payload.users : []);
    } catch (nextError) {
      console.error('AdminUsersScreen fetch failed:', nextError);
      setError('לא הצלחנו לטעון את המשתמשים כרגע.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, session?.access_token]);

  const updateSubscription = async (
    userId: string,
    subscriptionStatus: SubscriptionStatus,
    subscriptionPlan: SubscriptionPlan
  ) => {
    if (!session?.access_token) return;

    setSavingUserId(userId);
    setError('');

    try {
      const response = await fetch('/api/admin-users', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscriptionStatus,
          subscriptionPlan,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { user?: AdminUser; error?: string }
        | null;

      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error || 'עדכון המנוי נכשל');
      }

      setUsers((prev) =>
        prev.map((item) => (item.user_id === userId ? payload.user! : item))
      );
    } catch (nextError) {
      console.error('AdminUsersScreen update failed:', nextError);
      setError('לא הצלחנו לעדכן את המנוי כרגע.');
    } finally {
      setSavingUserId(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    void fetchUsers();

    return () => {
      document.body.style.overflow = '';
    };
  }, [fetchUsers, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col animate-slide-in-right"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="ניהול משתמשים"
        subtitle="צפייה בהרשמות, מנויים והגדרות מנהל"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <AdminStatCard label="סה״כ" value={String(stats.total)} themeColor={theme.primary} />
          <AdminStatCard label="חינמיים" value={String(stats.free)} themeColor="#F97316" />
          <AdminStatCard label="מנויים" value={String(stats.paid)} themeColor="#16A34A" />
        </div>

        <div
          className="rounded-[28px] p-4"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => void fetchUsers()}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl px-4 transition-all active:scale-[0.98]"
              style={{
                background: theme.gradientCard,
                border: `1px solid ${theme.primaryBorder}`,
                color: theme.primaryDark,
                fontWeight: 800,
              }}
            >
              <RefreshCw size={16} strokeWidth={2} />
              <span>רענון</span>
            </button>

            <div className="text-right">
              <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>מבט מנהל</p>
              <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                מי עדיין ללא מנוי ומי כבר פרימיום
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'הכול' },
              { id: 'free', label: 'ללא מנוי' },
              { id: 'paid', label: 'מנויים' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as 'all' | 'free' | 'paid')}
                className="h-11 rounded-2xl"
                style={{
                  backgroundColor: filter === option.id ? theme.primaryBg : '#FFFFFF',
                  border: `2px solid ${filter === option.id ? theme.primary : '#E2E8F0'}`,
                  color: filter === option.id ? theme.primaryDark : '#475569',
                  fontWeight: 800,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? <EmptyCard text="טוענים את המשתמשים..." /> : null}

          {error ? (
            <div
              className="rounded-2xl px-4 py-4 text-sm"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {!loading && !error && filteredUsers.length === 0 ? (
            <EmptyCard text="אין כרגע משתמשים להצגה במסנן שבחרת." />
          ) : null}

          {!loading && !error && filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isSaving = savingUserId === user.user_id;

                return (
                  <div
                    key={user.user_id}
                    className="rounded-[24px] p-4"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {user.subscription_status === 'free' ? (
                          <Users size={18} className="text-[#64748B]" />
                        ) : (
                          <Crown size={18} className="text-[#D97706]" />
                        )}
                        {user.is_admin_managed ? (
                          <span
                            className="rounded-full px-2 py-1 text-[11px]"
                            style={{
                              backgroundColor: '#EEF2FF',
                              color: '#4338CA',
                              fontWeight: 800,
                            }}
                          >
                            מנוהל ידנית
                          </span>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-base font-black text-[#0F172A]">
                          {user.full_name || 'ללא שם'}
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#64748B]">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InfoTile label="סטטוס מנוי" value={getSubscriptionLabel(user.subscription_status, user.subscription_plan)} />
                      <InfoTile label="ספק כניסה" value={user.auth_provider || 'email'} />
                      <InfoTile label="נרשם בתאריך" value={formatDateTime(user.created_at)} />
                      <InfoTile label="כניסה אחרונה" value={formatDateTime(user.last_seen_at)} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <PlanButton
                        label="חינמי"
                        active={user.subscription_status === 'free'}
                        onClick={() => void updateSubscription(user.user_id, 'free', 'free')}
                        disabled={isSaving}
                        tone="neutral"
                      />
                      <PlanButton
                        label="חודשי"
                        active={
                          user.subscription_status === 'premium' &&
                          user.subscription_plan === 'monthly'
                        }
                        onClick={() => void updateSubscription(user.user_id, 'premium', 'monthly')}
                        disabled={isSaving}
                        tone="blue"
                      />
                      <PlanButton
                        label="שנתי"
                        active={
                          user.subscription_status === 'premium' &&
                          user.subscription_plan === 'yearly'
                        }
                        onClick={() => void updateSubscription(user.user_id, 'premium', 'yearly')}
                        disabled={isSaving}
                        tone="green"
                      />
                    </div>

                    <button
                      onClick={() => void updateSubscription(user.user_id, 'lifetime', 'lifetime')}
                      disabled={isSaving}
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl"
                      style={{
                        backgroundColor: user.subscription_status === 'lifetime' ? '#FEF3C7' : '#FFFFFF',
                        border: `1px solid ${user.subscription_status === 'lifetime' ? '#F59E0B' : '#E2E8F0'}`,
                        color: user.subscription_status === 'lifetime' ? '#B45309' : '#475569',
                        fontWeight: 800,
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>{isSaving ? 'שומרים...' : 'לכל החיים'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({
  label,
  themeColor,
  value,
}: {
  label: string;
  value: string;
  themeColor: string;
}) {
  return (
    <div
      className="rounded-[24px] p-4 text-center"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
      }}
    >
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-[26px] font-black" style={{ color: themeColor }}>
        {value}
      </p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-8 text-center"
      style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 700 }}
    >
      {text}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
    >
      <p className="text-xs font-bold text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-[#334155]">{value}</p>
    </div>
  );
}

function PlanButton({
  active,
  disabled,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
  tone: 'neutral' | 'blue' | 'green';
}) {
  const styleMap = {
    neutral: {
      activeBg: '#F1F5F9',
      activeBorder: '#64748B',
      activeText: '#334155',
    },
    blue: {
      activeBg: '#DBEAFE',
      activeBorder: '#3B82F6',
      activeText: '#1D4ED8',
    },
    green: {
      activeBg: '#DCFCE7',
      activeBorder: '#22C55E',
      activeText: '#15803D',
    },
  } as const;

  const style = styleMap[tone];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-2xl font-extrabold disabled:opacity-60"
      style={{
        backgroundColor: active ? style.activeBg : '#FFFFFF',
        border: `1px solid ${active ? style.activeBorder : '#E2E8F0'}`,
        color: active ? style.activeText : '#475569',
      }}
    >
      {label}
    </button>
  );
}
