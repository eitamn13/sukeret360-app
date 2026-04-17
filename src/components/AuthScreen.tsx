import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Logo } from './Logo';
import { useAuthContext } from '../context/AuthContext';

export function AuthScreen() {
  const { signIn, signUp } = useAuthContext();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
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
  }, [email, password, mode, name]);

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (result.error) {
        setError('לא הצלחנו להתחבר כרגע. בדוק מייל וסיסמה ונסה שוב.');
      }
      setBusy(false);
      return;
    }

    const result = await signUp(email, password, name);

    if (result.error) {
      setError('לא הצלחנו ליצור משתמש כרגע. נסה שוב עם מייל אחר או סיסמה חזקה יותר.');
    } else if (result.needsEmailConfirmation) {
      setNotice('שלחנו אליך מייל לאישור החשבון. אחרי האישור אפשר להיכנס לאפליקציה.');
    } else {
      setNotice('החשבון נוצר בהצלחה. עוד רגע נמשיך לאפליקציה.');
    }

    setBusy(false);
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
          <h1 className="text-[34px] font-black text-[#4D5B73]">הסוכרת שלי</h1>
          <p className="mt-3 text-base leading-8 text-[#7A8698]">
            כניסה פשוטה, שמירה מאובטחת וגישה נוחה מכל מכשיר.
          </p>
        </div>

        <div
          className="rounded-[34px] p-6"
          style={{
            background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF9F5 100%)',
            border: '1px solid #E9DFD8',
            boxShadow: '0 24px 54px rgba(116, 131, 157, 0.12)',
          }}
        >
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('signin')}
              className="h-12 rounded-[20px] font-extrabold transition-all"
              style={{
                background: mode === 'signin' ? 'linear-gradient(135deg, #8EADE4 0%, #5D79AE 100%)' : '#FFFFFF',
                color: mode === 'signin' ? '#FFFFFF' : '#5F6D84',
                border: `1px solid ${mode === 'signin' ? 'transparent' : '#E3E8F1'}`,
              }}
            >
              כניסה
            </button>

            <button
              onClick={() => setMode('signup')}
              className="h-12 rounded-[20px] font-extrabold transition-all"
              style={{
                background: mode === 'signup' ? 'linear-gradient(135deg, #D49BB0 0%, #8EADE4 100%)' : '#FFFFFF',
                color: mode === 'signup' ? '#FFFFFF' : '#5F6D84',
                border: `1px solid ${mode === 'signup' ? 'transparent' : '#E3E8F1'}`,
              }}
            >
              הרשמה
            </button>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="שם מלא"
                className="h-14 w-full rounded-[22px] px-4 text-right outline-none"
                style={{
                  border: '1.5px solid #DFE6F2',
                  backgroundColor: '#FFFFFF',
                  color: '#4D5B73',
                  fontWeight: 700,
                }}
              />
            )}

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="מייל"
              type="email"
              className="h-14 w-full rounded-[22px] px-4 text-right outline-none"
              style={{
                border: '1.5px solid #DFE6F2',
                backgroundColor: '#FFFFFF',
                color: '#4D5B73',
                fontWeight: 700,
              }}
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="סיסמה"
              type="password"
              className="h-14 w-full rounded-[22px] px-4 text-right outline-none"
              style={{
                border: '1.5px solid #DFE6F2',
                backgroundColor: '#FFFFFF',
                color: '#4D5B73',
                fontWeight: 700,
              }}
            />
          </div>

          {error && (
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
          )}

          {notice && (
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
          )}

          <button
            onClick={handleSubmit}
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
            <span>{busy ? 'רגע קטן...' : mode === 'signup' ? 'יוצרים חשבון' : 'נכנסים'}</span>
          </button>

          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E7E4DF' }}
          >
            <ShieldCheck size={17} className="text-[#8DA8D6]" />
            <p className="text-sm font-bold text-[#6D7A8D]">הנתונים נשמרים בצורה מאובטחת</p>
          </div>

          <div className="mt-5 text-center text-xs leading-6 text-[#8C97A8]">
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
