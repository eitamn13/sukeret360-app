import { X, Volume2, VolumeX, Quote, Stethoscope, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface DailyTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  {
    category: 'איזון יומי',
    title: 'ארוחה עם חלבון וירק יכולה לעזור ליציבות טובה יותר',
    text: 'כשמשלבים פחמימה עם חלבון או ירקות, קצב העלייה של הסוכר אחרי האוכל לרוב מתון יותר ונעים יותר לגוף.',
    todayAction: 'בארוחה הבאה נסי או נסה להוסיף מקור חלבון אחד וירק אחד.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'תרופות',
    title: 'שגרה קבועה מקלה מאוד על לזכור לקחת תרופות',
    text: 'כשלוקחים תרופה באותה שעה ובאותו הקשר יומי, כמו אחרי ארוחת הבוקר, קל יותר להתמיד ולהרגיש בשליטה.',
    todayAction: 'חברו כל תרופה לפעולה קבועה ביום כמו צחצוח שיניים או קפה של בוקר.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'תנועה',
    title: 'הליכה קצרה אחרי אוכל יכולה לעזור',
    text: 'גם 10 עד 15 דקות של הליכה רגועה אחרי ארוחה עשויות לעזור לתחושה כללית טובה יותר ולפעמים גם לסוכר יציב יותר.',
    todayAction: 'בחרו ארוחה אחת היום ואחריה נסו הליכה קצרה ונעימה.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'בדיקות',
    title: 'הקשר המדידה חשוב לא פחות מהמספר',
    text: 'כשמסמנים אם המדידה הייתה לפני אוכל, אחרי אוכל או לפני שינה, הרבה יותר קל להבין דפוסים ולהסיק מסקנות אמיתיות.',
    todayAction: 'במדידה הבאה סמנו גם את ההקשר שלה ולא רק את המספר.',
    author: 'העוזר הרפואי שלי',
  },
];

const ARTICLES = [
  {
    title: 'איך לזהות ארוחה שמעמיסה על הסוכר',
    summary: 'שלוש שאלות קצרות לפני האוכל: כמה פחמימות יש, האם יש חלבון, והאם יש ירקות או סיבים.',
  },
  {
    title: 'מה לעשות כששוכחים תרופה',
    summary: 'קודם מתעדים, אחר כך בודקים את השעה, ובסוף פועלים לפי ההנחיה האישית שקיבלתם מהרופא.',
  },
  {
    title: 'איך המשפחה יכולה לעזור בלי להלחיץ',
    summary: 'תזכורות עדינות, שפה רגועה ומעקב משותף עוזרים יותר מביקורת או לחץ.',
  },
];

export function DailyTipModal({ isOpen, onClose }: DailyTipModalProps) {
  const { theme } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDone, setAudioDone] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => new Date().getDate() % TIPS.length);

  const currentTip = TIPS[tipIndex];

  if (!isOpen) return null;

  const handlePlay = () => {
    if (isPlaying) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${currentTip.title}. ${currentTip.text}. ${currentTip.todayAction}`
    );
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    setIsPlaying(true);
    setAudioDone(false);
    utterance.onend = () => {
      setIsPlaying(false);
      setAudioDone(true);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    onClose();
  };

  const goNext = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setAudioDone(false);
    setTipIndex((index) => (index + 1) % TIPS.length);
  };

  const goPrev = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setAudioDone(false);
    setTipIndex((index) => (index - 1 + TIPS.length) % TIPS.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      dir="rtl"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl px-5 pt-3 pb-10 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
        style={{ boxShadow: `0 -8px 60px ${theme.primary}30` }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: theme.primaryBorder }} />

        <div className="grid grid-cols-[88px_1fr_88px] items-center gap-3 mb-4">
          <button
            onClick={handleClose}
            className="h-10 px-3 rounded-xl flex flex-row-reverse items-center justify-center gap-1.5 justify-self-start transition-colors"
            style={{ backgroundColor: theme.primaryBg, color: theme.primary, border: `1px solid ${theme.primaryBorder}` }}
          >
            <ChevronRight size={18} strokeWidth={2} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>חזרה</span>
          </button>

          <div className="text-center">
            <h2 className="text-base" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
              טיפ יומי מקצועי
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              {tipIndex + 1} / {TIPS.length} • {currentTip.category}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors justify-self-end"
            style={{ backgroundColor: theme.primaryBg }}
            aria-label="סגור"
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>
        </div>

        <div
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <Quote size={56} style={{ color: theme.primary }} />
          </div>

          <div className="flex flex-row-reverse items-center justify-end gap-2 mb-2">
            <Stethoscope size={17} strokeWidth={1.8} style={{ color: theme.primary }} />
            <p className="text-xs" style={{ color: theme.primary, fontWeight: 800 }}>
              {currentTip.category}
            </p>
          </div>

          <p className="text-lg text-right" style={{ color: '#1F2937', fontWeight: 900, lineHeight: 1.5 }}>
            {currentTip.title}
          </p>

          <div className="flex flex-row-reverse items-start gap-3 my-4 relative">
            <p
              className="text-right leading-relaxed"
              style={{ color: '#1F2937', fontWeight: 500, fontSize: '0.98rem', lineHeight: '1.8' }}
            >
              {currentTip.text}
            </p>
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary, minHeight: '100%' }} />
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
          >
            <p style={{ color: theme.primary, fontWeight: 800, fontSize: 13 }}>מה לעשות היום</p>
            <p style={{ color: '#334155', fontWeight: 600, marginTop: 6, lineHeight: 1.7 }}>
              {currentTip.todayAction}
            </p>
          </div>

          <div className="flex flex-row-reverse items-center justify-end gap-2 pt-3 mt-4" style={{ borderTop: `1px solid ${theme.primaryBorder}` }}>
            <p className="text-xs text-right" style={{ color: theme.primary, fontWeight: 600 }}>
              {currentTip.author}
            </p>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primaryBorder }}>
              <Stethoscope size={14} strokeWidth={1.5} style={{ color: theme.primary }} />
            </div>
          </div>
        </div>

        <div className="flex flex-row-reverse items-center gap-2 mb-4">
          <button
            onClick={goNext}
            className="flex-1 h-11 rounded-xl flex flex-row-reverse items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <ChevronRight size={16} strokeWidth={2} style={{ color: theme.primary }} />
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הבא</span>
          </button>
          <button
            onClick={goPrev}
            className="flex-1 h-11 rounded-xl flex flex-row-reverse items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <ChevronLeft size={16} strokeWidth={2} style={{ color: theme.primary }} />
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הקודם</span>
          </button>
        </div>

        <button
          onClick={handlePlay}
          className="w-full h-14 rounded-2xl flex flex-row-reverse items-center justify-center gap-3 transition-all duration-300 active:scale-[0.97]"
          style={{
            backgroundColor: isPlaying ? theme.primary : audioDone ? '#F0FDF4' : theme.primaryBg,
            border: `1.5px solid ${isPlaying ? theme.primary : audioDone ? '#BBF7D0' : theme.primaryBorder}`,
            boxShadow: isPlaying ? `0 4px 20px ${theme.primaryShadow}` : 'none',
          }}
        >
          {isPlaying ? (
            <>
              <VolumeX size={20} color="#ffffff" strokeWidth={2} />
              <span className="text-base" style={{ color: '#ffffff', fontWeight: 700 }}>מנגן...</span>
            </>
          ) : audioDone ? (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: '#16A34A' }} />
              <span className="text-base" style={{ color: '#16A34A', fontWeight: 700 }}>הטיפ הושמע</span>
            </>
          ) : (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: theme.primary }} />
              <span className="text-base" style={{ color: theme.primary, fontWeight: 700 }}>האזנה לטיפ</span>
            </>
          )}
        </button>

        <div className="mt-5">
          <div className="flex flex-row-reverse items-center justify-end gap-2 mb-3">
            <BookOpen size={17} strokeWidth={1.8} style={{ color: theme.primary }} />
            <p style={{ color: '#1F2937', fontWeight: 800 }}>מאמרים קצרים להמשך קריאה</p>
          </div>

          <div className="space-y-2.5">
            {ARTICLES.map((article) => (
              <div
                key={article.title}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
              >
                <p style={{ color: '#1F2937', fontWeight: 800 }}>{article.title}</p>
                <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7, fontSize: 14 }}>
                  {article.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
