import { RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

type AdminUser = {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_seen_at: string;
};

interface AdminUsersScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(value: string) {
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

export function AdminUsersScreen({ isOpen, onClose }: AdminUsersScreenProps) {
  const { theme } = useAppContext();
  const { isAdmin, session } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usersToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return users.filter((user) => user.created_at.startsWith(today)).length;
  }, [users]);

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
      setError('לא הצלחנו לטעון את רשימת המשתמשים כרגע.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, session?.access_token]);

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
        subtitle="מי נרשם ונכנס לאפליקציה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard label="משתמשים" value={String(users.length)} themeColor={theme.primary} />
          <AdminStatCard label="נרשמו היום" value={String(usersToday)} themeColor={theme.primaryDark} />
        </div>

        <div
          className="rounded-[28px] p-4"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
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
              רענון
            </button>

            <div className="text-right">
              <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>רשימת משתמשים</p>
              <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>מבט מהיר על ההרשמות והכניסות האחרונות</p>
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl px-4 py-8 text-center" style={{ backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 700 }}>
              טוענים את המשתמשים...
            </div>
          )}

          {error && (
            <div className="rounded-2xl px-4 py-4 text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontWeight: 700 }}>
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="rounded-2xl px-4 py-8 text-center" style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 700 }}>
              עדיין אין משתמשים להצגה.
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="rounded-[24px] p-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
                    >
                      <Users size={18} strokeWidth={1.9} />
                    </div>

                    <div className="flex-1 text-right">
                      <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 17 }}>
                        {user.full_name?.trim() || 'משתמש ללא שם'}
                      </p>
                      <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>נרשם בתאריך</p>
                      <p style={{ color: '#0F172A', fontWeight: 800, marginTop: 6 }}>{formatDateTime(user.created_at)}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>נראה לאחרונה</p>
                      <p style={{ color: '#0F172A', fontWeight: 800, marginTop: 6 }}>{formatDateTime(user.last_seen_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: '#FFFDF7', border: '1px solid #F6E7B6' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#FFF4CC', color: '#B45309' }}
            >
              <ShieldCheck size={17} strokeWidth={2} />
            </div>
            <p className="text-right" style={{ color: '#92400E', fontWeight: 700, lineHeight: 1.7 }}>
              המסך הזה מיועד רק למנהל האפליקציה, והוא עובד מול השרת כדי שתוכל לראות משתמשים אמיתיים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  themeColor,
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
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <p style={{ color: '#64748B', fontSize: 13, fontWeight: 700 }}>{label}</p>
      <p style={{ color: themeColor, fontWeight: 900, fontSize: 28, marginTop: 8 }}>{value}</p>
    </div>
  );
}
