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
    title: 'ארוחה עם חלבון וסיבים יכולה לעזור ליציבות טובה יותר',
    text: 'כדאי לשלב פחמימה יחד עם חלבון או ירקות, למשל לחם מלא עם ביצה, יוגורט או גבינה. שילוב כזה יכול לעזור למתן עלייה חדה בסוכר אחרי הארוחה.',
    todayAction: 'בארוחה הבאה נסו להוסיף מקור חלבון אחד וירק אחד.',
    author: 'צוות ליווי סוכרת דיגיטלי',
  },
  {
    category: 'תרופות',
    title: 'שגרה קבועה מפחיתה פספוסים',
    text: 'כשלוקחים תרופות באותה שעה ובאותו הקשר יומי, כמו אחרי צחצוח שיניים או עם ארוחת הבוקר, קל יותר לזכור ולהתמיד לאורך זמן.',
    todayAction: 'בחרו פעולה יומית קבועה שתהיה העוגן שלכם לתרופה.',
    author: 'צוות ליווי סוכרת דיגיטלי',
  },
  {
    category: 'הליכה ותנועה',
    title: 'הליכה קצרה אחרי אוכל יכולה לעזור',
    text: 'גם הליכה קלה של 10–15 דקות אחרי ארוחה יכולה להיות צעד טוב לשיפור התחושה הכללית ולהפחתת עומס הסוכר אחרי אכילה.',
    todayAction: 'אחרי אחת הארוחות היום, נסו הליכה קצרה אפילו בתוך הבית.',
    author: 'צוות ליווי סוכרת דיגיטלי',
  },
  {
    category: 'בדיקות',
    title: 'מדידה עם הקשר שווה יותר מנתון בודד',
    text: 'כשמסמנים אם המדידה הייתה לפני אוכל, אחרי אוכל או לפני שינה, אפשר להבין טוב יותר מה השפיע על הסוכר ולזהות דפוסים לאורך זמן.',
    todayAction: 'ברישום הבא בחרו גם את ההקשר של המדידה.',
    author: 'צוות ליווי סוכרת דיגיטלי',
  },
];

const ARTICLES = [
  {
    title: 'איך לזהות ארוחה שמעמיסה על הסוכר',
    summary: 'שלוש שאלות פשוטות לפני האכילה: כמה פחמימות יש, האם יש חלבון, והאם יש ירקות או סיבים.',
  },
  {
    title: 'מה לעשות כששוכחים תרופה',
    summary: 'תיעוד מהיר באפליקציה, בדיקת השעה, והתייעצות לפי ההנחיה האישית שקיבלתם מהרופא.',
  },
  {
    title: 'איך המשפחה יכולה לעזור בלי להלחיץ',
    summary: 'תזכורות עדינות, מעקב משותף, ושיחה קצרה במקום ביקורת או לחץ.',
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
    const utterance = new SpeechSynthesisUtterance(`${currentTip.title}. ${currentTip.text}. ${currentTip.todayAction}`);
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
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl px-5 pt-3 pb-10 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
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
              טיפ יומי מקצועי
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              {tipIndex + 1} / {TIPS.length} • {currentTip.category}
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

          <p className="text-xs mb-2" style={{ color: theme.primary, fontWeight: 800 }}>
            {currentTip.category}
          </p>
          <p className="text-lg text-right" style={{ color: '#1F2937', fontWeight: 900, lineHeight: 1.5 }}>
            {currentTip.title}
          </p>

          <div className="flex items-start gap-3 my-4 relative">
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary, minHeight: '100%' }} />
            <p
              className="text-right leading-relaxed"
              style={{ color: '#1F2937', fontWeight: 500, fontSize: '0.98rem', lineHeight: '1.8' }}
            >
              {currentTip.text}
            </p>
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

          <div className="flex items-center justify-end gap-2 pt-3 mt-4" style={{ borderTop: `1px solid ${theme.primaryBorder}` }}>
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
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הבא</span>
          </button>
          <button
            onClick={goPrev}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <span className="text-sm" style={{ color: theme.primary, fontWeight: 600 }}>הקודם</span>
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
              <span className="text-base" style={{ color: '#ffffff', fontWeight: 700 }}>מנגן...</span>
              <VolumeX size={20} color="#ffffff" strokeWidth={2} />
            </>
          ) : audioDone ? (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: '#16A34A' }} />
              <span className="text-base" style={{ color: '#16A34A', fontWeight: 700 }}>הטיפ הושמע</span>
            </>
          ) : (
            <>
              <Volume2 size={20} strokeWidth={2} style={{ color: theme.primary }} />
              <span className="text-base" style={{ color: theme.primary, fontWeight: 700 }}>האזן/י לטיפ</span>
            </>
          )}
        </button>

        <div className="mt-5">
          <div className="flex items-center justify-end gap-2 mb-3">
            <p style={{ color: '#1F2937', fontWeight: 800 }}>מאמרים קצרים להמשך קריאה</p>
            <BookOpen size={17} strokeWidth={1.8} style={{ color: theme.primary }} />
          </div>

          <div className="space-y-2.5">
            {ARTICLES.map((article) => (
              <div
                key={article.title}
                className="rounded-2xl p-4"
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
