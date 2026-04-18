import { Chrome, LockKeyhole, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { useAuthContext } from '../context/AuthContext';

const COPY = {
  appName: '\u05d4\u05e1\u05d5\u05db\u05e8\u05ea \u05e9\u05dc\u05d9',
  subtitle: '\u05db\u05e0\u05d9\u05e1\u05d4 \u05e7\u05dc\u05d4, \u05de\u05d0\u05d5\u05d1\u05d8\u05d7\u05ea \u05d5\u05de\u05e7\u05e6\u05d5\u05e2\u05d9\u05ea.',
  google: '\u05db\u05e0\u05d9\u05e1\u05d4 \u05e2\u05dd Google',
  orEmail: '\u05d0\u05d5 \u05e2\u05dd \u05de\u05d9\u05d9\u05dc',
  signIn: '\u05db\u05e0\u05d9\u05e1\u05d4',
  signUp: '\u05d4\u05e8\u05e9\u05de\u05d4',
  fullName: '\u05e9\u05dd \u05de\u05dc\u05d0',
  email: '\u05de\u05d9\u05d9\u05dc',
  password: '\u05e1\u05d9\u05e1\u05de\u05d4',
  signInBusy: '\u05e8\u05d2\u05e2 \u05e7\u05d8\u05df...',
  signInAction: '\u05e0\u05db\u05e0\u05e1\u05d9\u05dd',
  signUpAction: '\u05d9\u05d5\u05e6\u05e8\u05d9\u05dd \u05d7\u05e9\u05d1\u05d5\u05df',
  secured: '\u05d4\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05e0\u05e9\u05de\u05e8\u05d9\u05dd \u05d1\u05e6\u05d5\u05e8\u05d4 \u05de\u05d0\u05d5\u05d1\u05d8\u05d7\u05ea',
  privacy: '\u05de\u05d3\u05d9\u05e0\u05d9\u05d5\u05ea \u05e4\u05e8\u05d8\u05d9\u05d5\u05ea',
  deleteAccount: '\u05de\u05d7\u05d9\u05e7\u05ea \u05d7\u05e9\u05d1\u05d5\u05df',
  serverSetup:
    '\u05db\u05d3\u05d9 \u05dc\u05d4\u05e4\u05e2\u05d9\u05dc \u05db\u05e0\u05d9\u05e1\u05d4 \u05e2\u05dd Google \u05e6\u05e8\u05d9\u05da \u05dc\u05d7\u05d1\u05e8 \u05d0\u05ea Supabase \u05d5\u05d0\u05ea \u05d4\u05de\u05e9\u05ea\u05e0\u05d9\u05dd \u05d1\u05e1\u05d1\u05d9\u05d1\u05d4.',
  signInError:
    '\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d4\u05ea\u05d7\u05d1\u05e8 \u05db\u05e8\u05d2\u05e2. \u05db\u05d3\u05d0\u05d9 \u05dc\u05d1\u05d3\u05d5\u05e7 \u05de\u05d9\u05d9\u05dc \u05d5\u05e1\u05d9\u05e1\u05de\u05d4 \u05d5\u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1.',
  signUpError:
    '\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05e0\u05d5 \u05dc\u05d9\u05e6\u05d5\u05e8 \u05d7\u05e9\u05d1\u05d5\u05df \u05db\u05e8\u05d2\u05e2. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1 \u05e2\u05dd \u05de\u05d9\u05d9\u05dc \u05d0\u05d7\u05e8 \u05d0\u05d5 \u05e1\u05d9\u05e1\u05de\u05d4 \u05d7\u05d6\u05e7\u05d4 \u05d9\u05d5\u05ea\u05e8.',
  signUpNotice:
    '\u05e9\u05dc\u05d7\u05e0\u05d5 \u05de\u05d9\u05d9\u05dc \u05dc\u05d0\u05d9\u05e9\u05d5\u05e8 \u05d4\u05d7\u05e9\u05d1\u05d5\u05df. \u05d0\u05d7\u05e8\u05d9 \u05d4\u05d0\u05d9\u05e9\u05d5\u05e8 \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05d9\u05db\u05e0\u05e1.',
  signUpSuccess: '\u05d4\u05d7\u05e9\u05d1\u05d5\u05df \u05e0\u05d5\u05e6\u05e8 \u05d1\u05d4\u05e6\u05dc\u05d7\u05d4. \u05e2\u05d5\u05d3 \u05e8\u05d2\u05e2 \u05e0\u05de\u05e9\u05d9\u05da \u05e4\u05e0\u05d9\u05de\u05d4.',
  googleError:
    '\u05db\u05e8\u05d2\u05e2 \u05d0\u05d9 \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05d9\u05db\u05e0\u05e1 \u05e2\u05dd Google. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1 \u05d1\u05e2\u05d5\u05d3 \u05e8\u05d2\u05e2.',
} as const;

export function AuthScreen() {
  const { authEnabled, signIn, signInWithGoogle, signUp } = useAuthContext();
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
      if (result.error) {
        setError(COPY.signInError);
      }
      setBusy(false);
      return;
    }

    const result = await signUp(email, password, name);
    if (result.error) {
      setError(COPY.signUpError);
    } else if (result.needsEmailConfirmation) {
      setNotice(COPY.signUpNotice);
    } else {
      setNotice(COPY.signUpSuccess);
    }

    setBusy(false);
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await signInWithGoogle();
    if (result.error) {
      setError(COPY.googleError);
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] px-4 py-8"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F6FAFF 45%, #FFF8F4 100%)',
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[32px]"
            style={{
              background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF7F2 100%)',
              border: '1px solid #EBDDD4',
              boxShadow: '0 18px 36px rgba(139, 118, 106, 0.12)',
            }}
          >
            <Logo size={56} />
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
          <button
            onClick={() => void handleGoogleSignIn()}
            disabled={busy || !authEnabled}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-[24px] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)',
              border: '1.5px solid #DCE6F5',
              color: '#48617F',
              fontWeight: 900,
              boxShadow: '0 14px 28px rgba(114, 138, 180, 0.1)',
            }}
          >
            <Chrome size={18} />
            <span>{COPY.google}</span>
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E6E0D7]" />
            <span className="text-xs font-bold text-[#8C97A8]">{COPY.orEmail}</span>
            <div className="h-px flex-1 bg-[#E6E0D7]" />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('signin')}
              className="h-12 rounded-[20px] font-extrabold transition-all"
              style={{
                background:
                  mode === 'signin'
                    ? 'linear-gradient(135deg, #8EADE4 0%, #5D79AE 100%)'
                    : '#FFFFFF',
                color: mode === 'signin' ? '#FFFFFF' : '#5F6D84',
                border: `1px solid ${mode === 'signin' ? 'transparent' : '#E3E8F1'}`,
              }}
            >
              {COPY.signIn}
            </button>

            <button
              onClick={() => setMode('signup')}
              className="h-12 rounded-[20px] font-extrabold transition-all"
              style={{
                background:
                  mode === 'signup'
                    ? 'linear-gradient(135deg, #D49BB0 0%, #8EADE4 100%)'
                    : '#FFFFFF',
                color: mode === 'signup' ? '#FFFFFF' : '#5F6D84',
                border: `1px solid ${mode === 'signup' ? 'transparent' : '#E3E8F1'}`,
              }}
            >
              {COPY.signUp}
            </button>
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

          {error ? (
            <div
              className="mt-4 rounded-[22px] p-4 text-sm leading-7"
              style={{
                background: '#FFF2F2',
                border: '1px solid #F4C9CF',
                color: '#9B4A57',
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {notice ? (
            <div
              className="mt-4 rounded-[22px] p-4 text-sm leading-7"
              style={{
                background: '#F1F8FF',
                border: '1px solid #D6E7FF',
                color: '#4A6487',
                fontWeight: 700,
              }}
            >
              {notice}
            </div>
          ) : null}

          {!authEnabled ? (
            <div
              className="mt-4 rounded-[22px] p-4 text-sm leading-7"
              style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                color: '#C2410C',
                fontWeight: 700,
              }}
            >
              {COPY.serverSetup}
            </div>
          ) : null}

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
            <span>{busy ? COPY.signInBusy : mode === 'signup' ? COPY.signUpAction : COPY.signInAction}</span>
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
            {' \u00b7 '}
            <a href="/delete-account.html" className="underline underline-offset-4">
              {COPY.deleteAccount}
            </a>
          </div>
        </div>
      </div>
    </div>
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
      className="flex h-14 items-center gap-3 rounded-[22px] px-4"
      style={{
        border: '1.5px solid #DFE6F2',
        backgroundColor: '#FFFFFF',
        color: '#4D5B73',
        fontWeight: 700,
      }}
    >
      <div className="text-[#8DA8D6]">{icon}</div>
      <div className="flex-1 text-right text-[#4D5B73]" aria-label={placeholder}>
        {children}
      </div>
    </div>
  );
}
