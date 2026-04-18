import { Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface WelcomeIntroScreenProps {
  onContinue: () => void;
}

export function WelcomeIntroScreen({ onContinue }: WelcomeIntroScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto px-5 py-8"
      dir="rtl"
      style={{
        background:
          'radial-gradient(circle at top right, rgba(235, 247, 232, 0.85), transparent 24%), radial-gradient(circle at bottom left, rgba(248, 225, 231, 0.72), transparent 26%), linear-gradient(180deg, #FFFDF9 0%, #FFF8F1 56%, #F8FBFF 100%)',
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-md items-center">
        <div
          className="w-full rounded-[36px] p-7 text-right"
          style={{
            background: 'rgba(255,255,255,0.94)',
            border: '1px solid rgba(228, 221, 205, 0.92)',
            boxShadow: '0 30px 70px rgba(132, 109, 98, 0.14)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-[30px]"
              style={{
                background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF6F1 55%, #F1F9FF 100%)',
                border: '1px solid #E7DDD0',
                boxShadow: '0 18px 40px rgba(151, 129, 117, 0.16)',
              }}
            >
              <Logo size={62} />
            </div>
          </div>

          <div className="text-center">
            <h1
              className="mt-2 text-[36px] leading-none"
              style={{ color: '#5A4740', fontWeight: 900, letterSpacing: '-0.04em' }}
            >
              {'\u05d4\u05e1\u05d5\u05db\u05e8\u05ea \u05e9\u05dc\u05d9'}
            </h1>
            <p className="mt-4 text-base leading-8 text-[#7A6A63]">
              {
                '\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4 \u05e4\u05e9\u05d5\u05d8\u05d4, \u05d1\u05e8\u05d5\u05e8\u05d4 \u05d5\u05e0\u05d5\u05d7\u05d4 \u05dc\u05de\u05e2\u05e7\u05d1 \u05e1\u05d5\u05db\u05e8.'
              }
            </p>
          </div>

          <div
            className="mt-6 rounded-[28px] p-5 text-center"
            style={{
              background: 'linear-gradient(145deg, rgba(255,248,243,0.98) 0%, rgba(247,251,255,0.98) 100%)',
              border: '1px solid #E8DDD2',
            }}
          >
            <p style={{ color: '#5A4740', fontWeight: 900, fontSize: 22 }}>
              {'\u05db\u05e0\u05d9\u05e1\u05d4 \u05e7\u05dc\u05d4 \u05d5\u05de\u05d4\u05d9\u05e8\u05d4'}
            </p>
            <p className="mt-2" style={{ color: '#8D7A73', fontWeight: 700, lineHeight: 1.8 }}>
              {'\u05e0\u05d2\u05d3\u05d9\u05e8 \u05e8\u05e7 \u05de\u05d4 \u05e9\u05d7\u05e9\u05d5\u05d1 \u05d1\u05d0\u05de\u05ea.'}
            </p>
          </div>

          <button
            onClick={onContinue}
            className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-[24px] transition-all active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #8CB6E7 0%, #D997AF 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              boxShadow: '0 18px 36px rgba(146, 122, 136, 0.26)',
            }}
          >
            <Sparkles size={18} strokeWidth={2} />
            <span>{'\u05d4\u05de\u05e9\u05da \u05dc\u05db\u05e0\u05d9\u05e1\u05d4'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
