import { Heart, Sparkles } from 'lucide-react';
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
      <div className="w-full max-w-md mx-auto min-h-full flex items-center">
        <div
          className="w-full rounded-[36px] p-7 text-right"
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(228, 221, 205, 0.92)',
            boxShadow: '0 30px 70px rgba(132, 109, 98, 0.14)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-28 h-28 rounded-[34px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF6F1 55%, #F1F9FF 100%)',
                border: '1px solid #E7DDD0',
                boxShadow: '0 18px 40px rgba(151, 129, 117, 0.16)',
              }}
            >
              <Logo size={76} />
            </div>
          </div>

          <div className="text-center">
            <p style={{ color: '#9A7D73', fontWeight: 900, letterSpacing: '0.12em', fontSize: 12 }}>
              מיזם אישי עם לב גדול
            </p>
            <h1
              className="mt-3 text-[36px] leading-none"
              style={{ color: '#5A4740', fontWeight: 900, letterSpacing: '-0.04em' }}
            >
              הסוכרת שלי
            </h1>
            <p className="mt-4 text-[15px] leading-8" style={{ color: '#7F6A62', fontWeight: 600 }}>
              אפליקציה ברורה, רגועה וחכמה לחולי סוכרת,
              <br />
              עם מקום לארוחות, תרופות, מעקב ותמיכה יומיומית.
            </p>
          </div>

          <div
            className="rounded-[28px] p-5 mt-6"
            style={{
              background: 'linear-gradient(145deg, rgba(255,248,243,0.98) 0%, rgba(247,251,255,0.98) 100%)',
              border: '1px solid #E8DDD2',
            }}
          >
            <div className="flex items-center justify-start gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F6D3DD 0%, #CFE5F8 100%)', color: '#7A5764' }}
              >
                <Heart size={18} strokeWidth={2} />
              </div>
              <p style={{ color: '#5A4740', fontWeight: 900 }}>המיזם מוקדש באהבה לסבתא שלי לאה</p>
            </div>
            <p className="text-sm leading-7" style={{ color: '#7C6A63', fontWeight: 600 }}>
              בניתי את האפליקציה הזאת מתוך רצון אמיתי לתת לחולי סוכרת כלי נעים, פשוט ומכבד,
              כזה שעוזר ביום יום ולא רק מודד מספרים.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { title: 'פשוט', subtitle: 'קל להבין' },
              { title: 'חכם', subtitle: 'מזהה ועוזר' },
              { title: 'בטוח', subtitle: 'עם SOS ותזכורות' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] px-3 py-4 text-center"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E9E0D5',
                  boxShadow: '0 10px 22px rgba(141, 120, 109, 0.08)',
                }}
              >
                <p style={{ color: '#5A4740', fontWeight: 900 }}>{item.title}</p>
                <p className="mt-1 text-xs" style={{ color: '#8B776E', fontWeight: 700 }}>
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onContinue}
            className="w-full h-14 rounded-[24px] mt-7 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #8CB6E7 0%, #D997AF 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              boxShadow: '0 18px 36px rgba(146, 122, 136, 0.26)',
            }}
          >
            <Sparkles size={18} strokeWidth={2} />
            <span>נתחיל להגדיר את האפליקציה</span>
          </button>
        </div>
      </div>
    </div>
  );
}
