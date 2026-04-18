import { Chrome, Facebook, LockKeyhole, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { useAuthContext } from '../context/AuthContext';

const COPY = {
  appName: 'הסוכרת שלי',
  subtitle: 'כניסה פשוטה, בטוחה ונוחה לשימוש יומיומי.',
  google: 'המשך עם Google',
  facebook: 'המשך עם Facebook',
  orEmail: 'או עם מייל וסיסמה',
  signIn: 'כניסה',
  signUp: 'הרשמה',
  fullName: 'שם מלא',
  email: 'מייל',
  password: 'סיסמה',
  busy: 'עוד רגע...',
  signInAction: 'נכנסים לאפליקציה',
  signUpAction: 'יוצרים חשבון חדש',
  secured: 'הפרטים נשמרים בצורה מאובטחת',
  privacy: 'מדיניות פרטיות',
  deleteAccount: 'מחיקת חשבון',
  serverSetup: 'כדי לאפשר כניסה עם Google או Facebook צריך לחבר Supabase בשרת.',
  signInError: 'לא הצלחנו להתחבר כרגע. כדאי לבדוק מייל וסיסמה ולנסות שוב.',
  signUpError: 'לא הצלחנו ליצור חשבון כרגע. אפשר לנסות שוב בעוד רגע.',
  signUpNotice: 'שלחנו מייל לאישור החשבון. אחרי האישור אפשר להיכנס.',
  signUpSuccess: 'החשבון נוצר בהצלחה. ממשיכים פנימה.',
  oauthError: 'כרגע אי אפשר להשלים את הכניסה דרך הספק שבחרת. אפשר לנסות שוב.',
} as const;

export function AuthScreen() {
  const { authEnabled, signIn, signInWithGoogle, signInWithFacebook, signUp } = useAuthContext();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.trim().length < 6) return false;
    if (mode === 'signup' && !name.trim()) return false;
    return true;
  }, [email, mode, name, password]);

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === 'signin') {
      const result = await signIn(email, password);
      setBusy(false);

      if (result.error) {
        setError(COPY.signInError);
      }
      return;
    }

    const result = await signUp(email, password, name);
    setBusy(false);

    if (result.error) {
      setError(COPY.signUpError);
      return;
    }

    setNotice(result.needsEmailConfirmation ? COPY.signUpNotice : COPY.signUpSuccess);
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    if (busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const result =
      provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();

    if (result.error) {
      setError(COPY.oauthError);
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] px-4 py-8"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F7FBFF 48%, #FFF8F1 100%)',
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[32px]"
            style={{
              background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F2 100%)',
              border: '1px solid #E9DED5',
              boxShadow: '0 18px 40px rgba(136, 117, 106, 0.14)',
            }}
          >
            <Logo size={58} />
          </div>
        </div>

        <div className="mb-5 text-center">
          <h1 className="text-[34px] font-black text-[#4D5B73]">{COPY.appName}</h1>
          <p className="mt-3 text-base leading-8 text-[#7A8698]">{COPY.subtitle}</p>
        </div>

        <div
          className="rounded-[34px] p-6"
          style={{
            background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF9F5 100%)',
            border: '1px solid #E9DFD8',
            boxShadow: '0 24px 54px rgba(116, 131, 157, 0.12)',
          }}
        >
          <div className="space-y-3">
            <SocialButton
              onClick={() => void handleOAuth('google')}
              disabled={busy || !authEnabled}
              icon={<Chrome size={18} />}
              label={COPY.google}
            />

            <SocialButton
              onClick={() => void handleOAuth('facebook')}
              disabled={busy || !authEnabled}
              icon={<Facebook size={18} />}
              label={COPY.facebook}
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E6E0D7]" />
            <span className="text-xs font-bold text-[#8C97A8]">{COPY.orEmail}</span>
            <div className="h-px flex-1 bg-[#E6E0D7]" />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <ModeButton
              active={mode === 'signin'}
              label={COPY.signIn}
              onClick={() => setMode('signin')}
              tone="blue"
            />
            <ModeButton
              active={mode === 'signup'}
              label={COPY.signUp}
              onClick={() => setMode('signup')}
              tone="rose"
            />
          </div>

          <div className="space-y-3">
            {mode === 'signup' ? (
              <FieldRow icon={<UserPlus size={18} />} placeholder={COPY.fullName}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={COPY.fullName}
                  className="h-14 w-full bg-transparent text-right outline-none"
                  dir="rtl"
                />
              </FieldRow>
            ) : null}

            <FieldRow icon={<Mail size={18} />} placeholder={COPY.email}>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={COPY.email}
                type="email"
                className="h-14 w-full bg-transparent text-right outline-none"
                dir="rtl"
              />
            </FieldRow>

            <FieldRow icon={<LockKeyhole size={18} />} placeholder={COPY.password}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={COPY.password}
                type="password"
                className="h-14 w-full bg-transparent text-right outline-none"
                dir="rtl"
              />
            </FieldRow>
          </div>

          {error ? <NoticeCard tone="error">{error}</NoticeCard> : null}
          {notice ? <NoticeCard tone="info">{notice}</NoticeCard> : null}
          {!authEnabled ? <NoticeCard tone="warn">{COPY.serverSetup}</NoticeCard> : null}

          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || busy}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[24px] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #D49BB0 0%, #7EA6E5 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              boxShadow: canSubmit ? '0 18px 36px rgba(114, 138, 180, 0.18)' : 'none',
            }}
          >
            {mode === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{busy ? COPY.busy : mode === 'signup' ? COPY.signUpAction : COPY.signInAction}</span>
          </button>

          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E7E4DF' }}
          >
            <ShieldCheck size={17} className="text-[#8DA8D6]" />
            <p className="text-sm font-bold text-[#6D7A8D]">{COPY.secured}</p>
          </div>

          <div className="mt-5 text-center text-xs leading-6 text-[#8C97A8]">
            <a href="/privacy-policy.html" className="underline underline-offset-4">
              {COPY.privacy}
            </a>
            {' · '}
            <a href="/delete-account.html" className="underline underline-offset-4">
              {COPY.deleteAccount}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialButton({
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
      className="flex h-14 w-full items-center justify-center gap-3 rounded-[24px] disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)',
        border: '1.5px solid #DCE6F5',
        color: '#48617F',
        fontWeight: 900,
        boxShadow: '0 14px 28px rgba(114, 138, 180, 0.1)',
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
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: 'blue' | 'rose';
}) {
  const background =
    tone === 'blue'
      ? 'linear-gradient(135deg, #8EADE4 0%, #5D79AE 100%)'
      : 'linear-gradient(135deg, #D49BB0 0%, #8EADE4 100%)';

  return (
    <button
      onClick={onClick}
      className="h-12 rounded-[20px] font-extrabold transition-all"
      style={{
        background: active ? background : '#FFFFFF',
        color: active ? '#FFFFFF' : '#5F6D84',
        border: `1px solid ${active ? 'transparent' : '#E3E8F1'}`,
      }}
    >
      {label}
    </button>
  );
}

function FieldRow({
  children,
  icon,
  placeholder,
}: {
  children: ReactNode;
  icon: ReactNode;
  placeholder: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[22px] px-4"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4EAF4',
        boxShadow: '0 10px 24px rgba(122, 146, 182, 0.08)',
      }}
      aria-label={placeholder}
    >
      <div className="text-[#89A3CC]">{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NoticeCard({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'error' | 'info' | 'warn';
}) {
  const styleMap = {
    error: {
      background: '#FEF2F2',
      border: '#FECACA',
      color: '#B91C1C',
    },
    info: {
      background: '#EFF6FF',
      border: '#BFDBFE',
      color: '#1D4ED8',
    },
    warn: {
      background: '#FFF7ED',
      border: '#FED7AA',
      color: '#C2410C',
    },
  } as const;

  const style = styleMap[tone];

  return (
    <div
      className="mt-4 rounded-[22px] px-4 py-3 text-sm font-bold leading-7"
      style={{
        backgroundColor: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {children}
    </div>
  );
}
