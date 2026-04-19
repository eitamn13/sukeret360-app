import { Chrome, LockKeyhole, LogIn, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { useAuthContext } from '../context/AuthContext';

interface AuthScreenProps {
  onContinueGuest?: () => void;
  showGuestOption?: boolean;
}

type AuthMode = 'signin' | 'signup';

export function AuthScreen({ onContinueGuest, showGuestOption = false }: AuthScreenProps) {
  const { authEnabled, signIn, signInWithGoogle, signUp } = useAuthContext();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'info'>('info');

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.trim().length < 6) return false;
    if (mode === 'signup' && !name.trim()) return false;
    return true;
  }, [email, mode, name, password]);

  const setFeedback = (text: string, tone: 'error' | 'info') => {
    setMessage(text);
    setMessageTone(tone);
  };

  const handleSubmit = async () => {
    if (!canSubmit || busy || !authEnabled) return;

    setBusy(true);
    setMessage('');

    if (mode === 'signin') {
      const result = await signIn(email, password);
      setBusy(false);

      if (result.error) {
        setFeedback('לא הצלחנו להתחבר כרגע. כדאי לבדוק מייל וסיסמה ולנסות שוב.', 'error');
      }
      return;
    }

    const result = await signUp(email, password, name);
    setBusy(false);

    if (result.error) {
      setFeedback('לא הצלחנו ליצור חשבון כרגע. אפשר לנסות שוב בעוד רגע.', 'error');
      return;
    }

    setFeedback(
      result.needsEmailConfirmation
        ? 'שלחנו מייל לאישור החשבון. אחרי האישור אפשר להיכנס.'
        : 'החשבון נוצר בהצלחה. ממשיכים לאפליקציה.',
      'info'
    );
  };

  const handleGoogle = async () => {
    if (!authEnabled || busy) return;

    setBusy(true);
    setMessage('');
    const result = await signInWithGoogle();

    if (result.error) {
      setFeedback('לא הצלחנו לפתוח את ההתחברות עם Google כרגע. אפשר לנסות שוב בעוד רגע.', 'error');
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] px-4 py-8"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #F8FBFF 0%, #F3F7FD 100%)' }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[28px]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE6F2',
              boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Logo size={56} />
          </div>
        </div>

        <div className="mb-5 text-center">
          <h1 className="text-[34px] font-black text-[#0F172A]">הסוכרת שלי</h1>
          <p className="mt-3 text-base leading-8 text-[#64748B]">
            כדי להשתמש באפליקציה צריך להתחבר או ליצור חשבון. הכניסה פשוטה, ברורה וקלה לשימוש.
          </p>
        </div>

        <div
          className="rounded-[30px] p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE6F2',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <ModeButton active={mode === 'signin'} label="כניסה" onClick={() => setMode('signin')} />
            <ModeButton active={mode === 'signup'} label="הרשמה" onClick={() => setMode('signup')} />
          </div>

          <div className="space-y-3">
            <ProviderButton
              label="המשך עם Google"
              icon={<Chrome size={18} />}
              onClick={() => void handleGoogle()}
              disabled={!authEnabled || busy}
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E2E8F0]" />
            <span className="text-xs font-bold text-[#64748B]">או עם מייל וסיסמה</span>
            <div className="h-px flex-1 bg-[#E2E8F0]" />
          </div>

          <div className="space-y-3">
            {mode === 'signup' ? (
              <FieldRow icon={<UserRound size={18} />}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="שם מלא"
                  className="h-14 w-full bg-transparent text-right text-base font-bold text-[#0F172A] outline-none"
                  dir="rtl"
                />
              </FieldRow>
            ) : null}

            <FieldRow icon={<Mail size={18} />}>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="מייל"
                type="email"
                className="h-14 w-full bg-transparent text-right text-base font-bold text-[#0F172A] outline-none"
                dir="rtl"
              />
            </FieldRow>

            <FieldRow icon={<LockKeyhole size={18} />}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="סיסמה"
                type="password"
                className="h-14 w-full bg-transparent text-right text-base font-bold text-[#0F172A] outline-none"
                dir="rtl"
              />
            </FieldRow>
          </div>

          {message ? <MessageCard tone={messageTone}>{message}</MessageCard> : null}

          {!authEnabled ? (
            <MessageCard tone="error">
              שירות ההתחברות אינו זמין כרגע. אפשר לנסות שוב בעוד רגע.
            </MessageCard>
          ) : null}

          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || busy || !authEnabled}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[22px] text-base font-black text-white transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: canSubmit ? '0 18px 34px rgba(37, 99, 235, 0.24)' : 'none',
            }}
          >
            <LogIn size={18} />
            <span>{busy ? 'טוענים...' : mode === 'signup' ? 'יצירת חשבון' : 'כניסה לאפליקציה'}</span>
          </button>

          {showGuestOption && onContinueGuest ? (
            <button
              onClick={onContinueGuest}
              className="mt-3 h-12 w-full rounded-[20px] text-sm font-black text-[#334155]"
              style={{
                background: '#F8FAFC',
                border: '1px solid #DCE6F2',
              }}
            >
              המשך בלי חשבון
            </button>
          ) : null}

          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-center"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
            <ShieldCheck size={17} className="text-[#2563EB]" />
            <p className="text-sm font-bold text-[#475569]">המידע נשמר בצורה מאובטחת</p>
          </div>

          <div className="mt-5 text-center text-xs leading-6 text-[#64748B]">
            <a href="/privacy-policy.html" className="underline underline-offset-4">
              מדיניות פרטיות
            </a>
            {' · '}
            <a href="/delete-account.html" className="underline underline-offset-4">
              מחיקת חשבון
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderButton({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-[22px] text-base font-extrabold text-[#0F172A] disabled:opacity-60"
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #DCE6F2',
        boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-12 rounded-[20px] text-sm font-black transition-all"
      style={{
        background: active ? '#2563EB' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#475569',
        border: `1.5px solid ${active ? '#2563EB' : '#DCE6F2'}`,
        boxShadow: active ? '0 12px 24px rgba(37, 99, 235, 0.18)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

function FieldRow({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div
      className="flex h-14 items-center gap-3 rounded-[20px] px-4"
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #DCE6F2',
      }}
    >
      <div className="text-[#64748B]">{icon}</div>
      {children}
    </div>
  );
}

function MessageCard({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'error' | 'info';
}) {
  return (
    <div
      className="mt-4 rounded-[20px] px-4 py-3 text-sm font-bold leading-7"
      style={{
        background: tone === 'error' ? '#FEF2F2' : '#EFF6FF',
        border: tone === 'error' ? '1px solid #FECACA' : '1px solid #BFDBFE',
        color: tone === 'error' ? '#B91C1C' : '#1D4ED8',
      }}
    >
      {children}
    </div>
  );
}
