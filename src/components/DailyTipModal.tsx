import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Quote,
  Stethoscope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

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
    text: 'כשנוטלים תרופה באותה שעה ובאותו הקשר יומי, כמו אחרי ארוחת הבוקר, קל יותר להתמיד ולהרגיש בשליטה.',
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

  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setAudioDone(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!isOpen) return null;

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleClose = () => {
    stopAudio();
    setAudioDone(false);
    onClose();
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

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

  const goNext = () => {
    stopAudio();
    setAudioDone(false);
    setTipIndex((index) => (index + 1) % TIPS.length);
  };

  const goPrev = () => {
    stopAudio();
    setAudioDone(false);
    setTipIndex((index) => (index - 1 + TIPS.length) % TIPS.length);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col animate-slide-in-right" dir="rtl" style={{ background: theme.gradientFull }}>
      <OverlayHeader
        title="טיפ יומי מרופא"
        subtitle={`טיפ ${tipIndex + 1} מתוך ${TIPS.length}`}
        theme={theme}
        onBack={handleClose}
        onClose={handleClose}
        rightSlot={
          <button
            onClick={handlePlay}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{
              backgroundColor: isPlaying ? '#FEF3C7' : audioDone ? '#F0FDF4' : '#FFFFFF',
              border: `1px solid ${isPlaying ? '#FCD34D' : audioDone ? '#BBF7D0' : theme.primaryBorder}`,
              color: isPlaying ? '#B45309' : audioDone ? '#15803D' : theme.primary,
            }}
            aria-label="הקראה"
          >
            {isPlaying ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}`, boxShadow: `0 18px 36px ${theme.primaryShadow}` }}
        >
          <div className="absolute top-4 left-4 opacity-10">
            <Quote size={64} style={{ color: theme.primary }} />
          </div>

          <div className="flex items-center justify-start gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            >
              <Stethoscope size={18} strokeWidth={1.8} />
            </div>
            <p style={{ color: theme.primary, fontWeight: 900 }}>{currentTip.category}</p>
          </div>

          <h2 className="text-right text-[25px] leading-tight" style={{ color: '#1F2937', fontWeight: 900 }}>
            {currentTip.title}
          </h2>

          <p className="mt-4 text-right leading-8" style={{ color: '#334155', fontWeight: 600 }}>
            {currentTip.text}
          </p>

          <div
            className="rounded-3xl p-4 mt-5"
            style={{ backgroundColor: theme.primaryBg, border: `1px solid ${theme.primaryBorder}` }}
          >
            <p style={{ color: theme.primary, fontWeight: 900, fontSize: 13 }}>מה לעשות היום</p>
            <p className="mt-2 text-right leading-7" style={{ color: '#334155', fontWeight: 700 }}>
              {currentTip.todayAction}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-start gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            >
              <Stethoscope size={14} strokeWidth={1.8} />
            </div>
            <p className="text-sm" style={{ color: theme.primary, fontWeight: 800 }}>
              {currentTip.author}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={goNext}
            className="h-12 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}`, color: theme.primary, fontWeight: 800 }}
          >
            <ChevronRight size={18} strokeWidth={2} />
            <span>הבא</span>
          </button>
          <button
            onClick={goPrev}
            className="h-12 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}`, color: theme.primary, fontWeight: 800 }}
          >
            <ChevronLeft size={18} strokeWidth={2} />
            <span>הקודם</span>
          </button>
        </div>

        <div
          className="rounded-3xl p-4"
          style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
        >
          <div className="flex items-center justify-start gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            >
              <BookOpen size={18} strokeWidth={1.8} />
            </div>
            <p style={{ color: '#1F2937', fontWeight: 900 }}>מאמרים קצרים להמשך קריאה</p>
          </div>

          <div className="space-y-3">
            {ARTICLES.map((article) => (
              <div
                key={article.title}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
              >
                <p style={{ color: '#1F2937', fontWeight: 800 }}>{article.title}</p>
                <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7, fontSize: 14 }}>
                  {article.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
