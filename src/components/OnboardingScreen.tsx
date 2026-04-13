import { useState } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Gender, UserProfile, useAppContext, genderedText } from '../context/AppContext';

const ROSE = '#E11D48';
const ROSE_LIGHT = '#FFF1F2';
const ROSE_BORDER = '#FECDD3';

export function OnboardingScreen() {
  const { saveUserProfile, completeOnboarding } = useAppContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [age, setAge] = useState('');
  const [diabetesType, setDiabetesType] = useState<'1' | '2' | ''>('');

  const totalSteps = 4;

  const goNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else finish();
  };

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim() || genderedText(gender, 'לאה', 'דוד'),
      age,
      diabetesType,
      gender,
    };
    saveUserProfile(profile);
    completeOnboarding();
  };

  const canNext =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? gender !== '' :
    step === 2 ? age.trim().length > 0 && Number(age) > 0 && Number(age) < 120 :
    diabetesType !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 overflow-y-auto py-8"
      style={{ background: 'linear-gradient(160deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <OnboardingLogo />
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? '28px' : '8px',
                height: '8px',
                backgroundColor: i === step ? ROSE : i < step ? '#FDA4AF' : '#FECDD3',
              }}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-xl" style={{ boxShadow: '0 20px 60px rgba(225,29,72,0.12)' }}>
          {step === 0 && (
            <div>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-2xl text-center mb-1" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
                נעים להכיר!
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
                מה שמך? נתאים את החוויה עבורך
              </p>
              <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
                שמך
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext && goNext()}
                placeholder="לדוגמה: לאה, שרה, דוד..."
                autoFocus
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                style={{
                  border: `2px solid ${name.trim() ? ROSE_BORDER : '#F3F4F6'}`,
                  backgroundColor: name.trim() ? ROSE_LIGHT : '#F9FAFB',
                  color: '#1F2937',
                  fontWeight: 500,
                }}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl">🙋</span>
              </div>
              <h2 className="text-2xl text-center mb-1" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
                מגדר
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
                נתאים את הממשק והטקסט עבורך, {name}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'female' as Gender, label: 'נקבה', emoji: '👩' },
                  { value: 'male' as Gender, label: 'זכר', emoji: '👨' },
                ]).map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setGender(value)}
                    className="rounded-2xl p-5 text-center transition-all duration-200 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${gender === value ? ROSE : '#F3F4F6'}`,
                      backgroundColor: gender === value ? ROSE_LIGHT : '#F9FAFB',
                      boxShadow: gender === value ? `0 4px 20px ${ROSE}22` : 'none',
                    }}
                  >
                    <p className="text-3xl mb-2">{emoji}</p>
                    <p className="text-lg" style={{ color: gender === value ? ROSE : '#374151', fontWeight: 800 }}>
                      {label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl">🎂</span>
              </div>
              <h2 className="text-2xl text-center mb-1" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {genderedText(gender, `כמה את בת, ${name}?`, `כמה אתה בן, ${name}?`)}
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
                נתאים את ההמלצות לגיל שלך
              </p>
              <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
                גיל
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext && goNext()}
                placeholder="לדוגמה: 62"
                autoFocus
                dir="rtl"
                min="1"
                max="120"
                className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                style={{
                  border: `2px solid ${age ? ROSE_BORDER : '#F3F4F6'}`,
                  backgroundColor: age ? ROSE_LIGHT : '#F9FAFB',
                  color: '#1F2937',
                  fontWeight: 500,
                }}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl">💊</span>
              </div>
              <h2 className="text-2xl text-center mb-1" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
                סוג הסוכרת
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
                נתאים את ההמלצות האישיות שלך
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiabetesType(type)}
                    className="rounded-2xl p-5 text-center transition-all duration-200 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${diabetesType === type ? ROSE : '#F3F4F6'}`,
                      backgroundColor: diabetesType === type ? ROSE_LIGHT : '#F9FAFB',
                      boxShadow: diabetesType === type ? `0 4px 20px ${ROSE}22` : 'none',
                    }}
                  >
                    <p className="text-2xl mb-1" style={{ color: diabetesType === type ? ROSE : '#374151', fontWeight: 900 }}>
                      סוג {type}
                    </p>
                    <p className="text-xs" style={{ color: diabetesType === type ? '#BE123C' : '#9CA3AF' }}>
                      {type === '1' ? 'תלוית אינסולין' : 'ללא אינסולין'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={goNext}
            disabled={!canNext}
            className="w-full h-14 rounded-2xl mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
            style={{
              backgroundColor: canNext ? ROSE : '#F3F4F6',
              color: canNext ? '#FFFFFF' : '#9CA3AF',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: canNext ? `0 6px 24px ${ROSE}40` : 'none',
            }}
          >
            {step === totalSteps - 1 ? (
              <>
                <Sparkles size={18} strokeWidth={2} />
                <span>כניסה לאפליקציה</span>
              </>
            ) : (
              <>
                <span>המשך</span>
                <ChevronLeft size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="w-full mt-3 h-10 text-sm transition-colors"
              style={{ color: '#9CA3AF', fontWeight: 500 }}
            >
              חזרה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="https://i.postimg.cc/FrmVmf7S/16p-Kq.jpg"
        alt="לוגו"
        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 32px rgba(225,29,72,0.2)' }}
      />
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: '#E11D48', fontWeight: 900, letterSpacing: '-0.03em' }}>
          הסוכרת שלי
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#FDA4AF', fontWeight: 500 }}>
          התמודדות חכמה עם סוכרת
        </p>
      </div>
    </div>
  );
}
