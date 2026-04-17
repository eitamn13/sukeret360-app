import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Quote,
  Stethoscope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';
import { cancelHebrewSpeech, preloadSpeechVoices, speakHebrewText } from '../utils/speech';

interface DailyTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  {
    category: 'איזון יומי',
    title: 'ארוחה עם חלבון וירק יכולה לעזור ליציבות טובה יותר',
    text: 'כשמשלבים פחמימה עם חלבון או ירקות, העלייה של הסוכר אחרי האוכל לרוב מתונה ונעימה יותר.',
    todayAction: 'בארוחה הבאה נסו להוסיף מקור חלבון אחד וירק אחד.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'תרופות',
    title: 'שגרה קבועה מקלה מאוד על לזכור לקחת תרופות',
    text: 'כשנוטלים תרופה באותה שעה ובאותו הקשר יומי, קל יותר להתמיד ולהרגיש בשליטה.',
    todayAction: 'חברו כל תרופה לפעולה קבועה ביום כמו קפה של בוקר או ארוחת ערב.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'תנועה',
    title: 'הליכה קצרה אחרי אוכל יכולה לעזור',
    text: 'גם עשר עד חמש עשרה דקות של הליכה רגועה אחרי ארוחה עשויות לעזור לתחושה כללית טובה יותר ולסוכר יציב יותר.',
    todayAction: 'בחרו ארוחה אחת היום ואחריה נסו הליכה קצרה ונעימה.',
    author: 'העוזר הרפואי שלי',
  },
  {
    category: 'בדיקות',
    title: 'הקשר המדידה חשוב לא פחות מהמספר',
    text: 'כשמסמנים אם המדידה הייתה לפני אוכל, אחרי אוכל או לפני שינה, הרבה יותר קל להבין דפוסים.',
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
  const { theme, userProfile } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDone, setAudioDone] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => new Date().getDate() % TIPS.length);

  const currentTip = TIPS[tipIndex];

  const stopAudio = useCallback(() => {
    cancelHebrewSpeech();
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsPlaying(true);
    setAudioDone(false);

    speakHebrewText(`${currentTip.title}. ${currentTip.text}. ${currentTip.todayAction}`, {
      gender: userProfile.gender,
      rate: 0.9,
      pitch: userProfile.gender === 'male' ? 0.96 : 1.02,
      onEnd: () => {
        setIsPlaying(false);
        setAudioDone(true);
      },
      onError: () => {
        setIsPlaying(false);
      },
    });
  }, [currentTip.text, currentTip.title, currentTip.todayAction, isPlaying, stopAudio, userProfile.gender]);

  useEffect(() => {
    preloadSpeechVoices();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      setAudioDone(false);
      return;
    }

    const timer = window.setTimeout(() => {
      handlePlay();
    }, 180);

    return () => {
      window.clearTimeout(timer);
      stopAudio();
    };
  }, [handlePlay, isOpen, stopAudio]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopAudio();
    setAudioDone(false);
    onClose();
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
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
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: `0 18px 36px ${theme.primaryShadow}`,
          }}
        >
          <div className="absolute top-4 left-4 opacity-10">
            <Quote size={64} style={{ color: theme.primary }} />
          </div>

          <div className="mb-3 flex flex-row-reverse items-center justify-end gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
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
            className="mt-5 rounded-3xl p-4"
            style={{ backgroundColor: theme.primaryBg, border: `1px solid ${theme.primaryBorder}` }}
          >
            <p style={{ color: theme.primary, fontWeight: 900, fontSize: 13 }}>מה לעשות היום</p>
            <p className="mt-2 text-right leading-7" style={{ color: '#334155', fontWeight: 700 }}>
              {currentTip.todayAction}
            </p>
          </div>

          <div className="mt-5 flex flex-row-reverse items-center justify-end gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
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
            className="flex h-12 items-center justify-center gap-2 rounded-2xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}`, color: theme.primary, fontWeight: 800 }}
          >
            <ChevronRight size={18} strokeWidth={2} />
            <span>הבא</span>
          </button>
          <button
            onClick={goPrev}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl transition-all active:scale-[0.98]"
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
          <div className="mb-3 flex flex-row-reverse items-center justify-end gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            >
              <BookOpen size={18} strokeWidth={1.8} />
            </div>
            <p style={{ color: '#1F2937', fontWeight: 900 }}>עוד מידע קצר ושימושי</p>
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
