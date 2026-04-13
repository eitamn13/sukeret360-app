import { X, Volume2, VolumeX, Quote, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface DailyTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  {
    text: 'שתיית כוס מים כ-15 דקות לפני הארוחה מסייעת במיתון עליות חדות ברמות הסוכר.',
    author: 'פרופ\' א. כהן, אנדוקרינולוג',
    category: 'תזונה',
  },
  {
    text: 'הליכה קצרה של 10-15 דקות לאחר ארוחה עוזרת לשרירים לקלוט גלוקוז ומפחיתה את רמת הסוכר.',
    author: 'ד"ר מ. לוי, פיזיותרפיסטית',
    category: 'פעילות גופנית',
  },
  {
    text: 'תרגילי כיסא פשוטים – הרמת רגליים לסירוגין 10 פעמים – ניתן לבצע בכל עת וסייעים לאיזון הסוכר.',
    author: 'ד"ר ש. ברקוביץ, רפואת ספורט',
    category: 'פעילות גופנית',
  },
  {
    text: 'שינה סדירה של 7-8 שעות בלילה משפרת את הרגישות לאינסולין ומסייעת לאיזון הסוכר לאורך היום.',
    author: 'פרופ\' ר. שמיר, אנדוקרינולוג',
    category: 'שינה',
  },
  {
    text: 'בדיקת כפות הרגליים מדי יום חשובה לסוכרתיים – שריטה קטנה שלא מורגשת עלולה להתפתח לפצע.',
    author: 'ד"ר ת. אברהם, רופאת משפחה',
    category: 'טיפול עצמי',
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
    const utterance = new SpeechSynthesisUtterance(currentTip.text);
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    setIsPlaying(true);
    setAudioDone(false);
    utterance.onend = () => { setIsPlaying(false); setAudioDone(true); };
    utterance.onerror = () => { setIsPlaying(false); };
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
    setTipIndex((i) => (i + 1) % TIPS.length);
  };

  const goPrev = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setAudioDone(false);
    setTipIndex((i) => (i - 1 + TIPS.length) % TIPS.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl px-5 pt-3 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: `0 -8px 60px ${theme.primary}30` }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: theme.primaryBorder }} />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: theme.primaryBg }}
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h2 className="text-base" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
              טיפ יומי ממומחים
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              {tipIndex + 1} / {TIPS.length} — {currentTip.category}
            </p>
          </div>

          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryBg }}>
            <Stethoscope size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <Quote size={56} style={{ color: theme.primary }} />
          </div>

          <div className="flex items-start gap-3 mb-4 relative">
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.primary, minHeight: '100%' }}
            />
            <p
              className="text-right leading-relaxed"
              style={{ color: '#1F2937', fontWeight: 600, fontSize: '1rem', lineHeight: '1.7' }}
            >
              {currentTip.text}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${theme.primaryBorder}` }}>
            <p className="text-xs text-right" style={{ color: theme.primary, fontWeight: 600 }}>
              {currentTip.author}
            </p>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primaryBorder }}>
              <Stethoscope size={14} strokeWidth={1.5} style={{ color: theme.primary }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={goNext}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <ChevronRight size={16} strokeWidth={2} style={{ color: theme.primary }} />
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הקודם</span>
          </button>
          <button
            onClick={goPrev}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הבא</span>
            <ChevronLeft size={16} strokeWidth={2} style={{ color: theme.primary }} />
          </button>
        </div>

        <button
          onClick={handlePlay}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.97]"
          style={{
            backgroundColor: isPlaying ? theme.primary : audioDone ? '#F0FDF4' : theme.primaryBg,
            border: `1.5px solid ${isPlaying ? theme.primary : audioDone ? '#BBF7D0' : theme.primaryBorder}`,
            boxShadow: isPlaying ? `0 4px 20px ${theme.primaryShadow}` : 'none',
          }}
        >
          {isPlaying ? (
            <>
              <div className="flex items-end gap-0.5 h-5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-white"
                    style={{ animation: `soundbar 0.6s ease-in-out ${i * 0.1}s infinite alternate`, height: `${i % 2 === 0 ? 60 : 100}%` }}
                  />
                ))}
              </div>
              <span className="text-base" style={{ color: '#ffffff', fontWeight: 700 }}>מנגן...</span>
              <VolumeX size={20} color="#ffffff" strokeWidth={2} />
            </>
          ) : audioDone ? (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: '#16A34A' }} />
              <span className="text-base" style={{ color: '#16A34A', fontWeight: 700 }}>הושמע בהצלחה</span>
            </>
          ) : (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: theme.primary }} />
              <span className="text-base" style={{ color: theme.primary, fontWeight: 700 }}>האזן/י לטיפ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
