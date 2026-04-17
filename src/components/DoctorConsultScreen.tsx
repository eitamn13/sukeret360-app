import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Mic, Send, Sparkles, User, Volume2, VolumeX } from 'lucide-react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';
import { cancelHebrewSpeech, preloadSpeechVoices, speakHebrewText } from '../utils/speech';

interface DoctorConsultScreenProps {
  onClose: () => void;
}

interface Message {
  id: string;
  from: 'ai' | 'user';
  text: string;
  time: string;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const CHAT_ENDPOINT = '/api/chat';

const QUICK_SUGGESTIONS = [
  'מה הסוכר התקין לפני ארוחה?',
  'מה עושים אם יש רעד או חולשה?',
  'מתי הכי טוב לקחת מטפורמין?',
  'איזו ארוחת ערב טובה לסוכרת?',
];

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  from: 'ai',
  text: 'אני כאן בתור העוזר הרפואי שלך. אפשר לדבר איתי בקול על סוכר, אוכל, תרופות או הרגשה, ואענה בצורה קצרה וברורה.',
  time: nowTime(),
};

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function isGreeting(message: string) {
  const normalized = normalizeMessage(message);
  return ['ai', 'היי', 'הי', 'שלום', 'hello', 'hey'].includes(normalized);
}

function createLocalFallbackReply(message: string) {
  const normalized = normalizeMessage(message);

  if (isGreeting(message)) {
    return 'אני כאן כדי לעזור לך בקול או בכתיבה. אפשר לשאול על סוכר, תרופות, אוכל, תסמינים או מה כדאי לעשות עכשיו.';
  }

  if (normalized.includes('לפני') && normalized.includes('ארוחה') && normalized.includes('סוכר')) {
    return 'בדרך כלל יעד מקובל לפני ארוחה הוא בערך 80 עד 130 mg/dL, אבל הכי חשוב לפעול לפי היעד האישי שהרופא הגדיר.';
  }

  if (
    normalized.includes('היפו') ||
    normalized.includes('רעד') ||
    normalized.includes('סחרחורת') ||
    normalized.includes('חולשה')
  ) {
    return 'אם יש רעד, חולשה, הזעה או סחרחורת, כדאי קודם לבדוק סוכר. אם הוא נמוך, נהוג לקחת פחמימה מהירה ולבדוק שוב אחרי כ-15 דקות. אם יש בלבול או החמרה, צריך לפנות מיד לעזרה רפואית.';
  }

  if (
    normalized.includes('תרופה') ||
    normalized.includes('תרופות') ||
    normalized.includes('מטפורמין') ||
    normalized.includes('אינסולין')
  ) {
    return 'לגבי תרופות, הכי בטוח להיצמד להנחיה האישית שלך. אם תכתוב או תגיד לי את שם התרופה והשעה, אוכל להסביר מה מקובל באופן כללי.';
  }

  if (normalized.includes('אוכל') || normalized.includes('ארוחה') || normalized.includes('פחמ')) {
    return 'בדרך כלל עדיף לבחור ארוחה פשוטה עם חלבון, ירקות ופחמימה מדודה. למשל יוגורט עם אגוזים, חביתה עם סלט, או עוף עם אורז בכמות קטנה.';
  }

  return 'יש כרגע תקלה זמנית בחיבור המלא, אבל אני עדיין כאן. אפשר להמשיך לדבר איתי בקול או לכתוב שאלה קצרה על סוכר, תרופות, אוכל או הרגשה.';
}

export function DoctorConsultScreen({ onClose }: DoctorConsultScreenProps) {
  const { theme, userProfile } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const autoSpeakRef = useRef(true);
  const pendingTranscriptRef = useRef('');
  const greetedRef = useRef(false);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisSupported) return;
    setIsSpeaking(false);
    cancelHebrewSpeech();
  }, [speechSynthesisSupported]);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;

    if (!autoSpeak) {
      stopSpeaking();
    }
  }, [autoSpeak, stopSpeaking]);

  useEffect(() => {
    preloadSpeechVoices();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        preloadSpeechVoices();
      };
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      cancelHebrewSpeech();
    };
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthesisSupported || !autoSpeakRef.current) return;

      stopSpeaking();
      setIsSpeaking(true);

      speakHebrewText(text, {
        gender: userProfile.gender,
        rate: 0.92,
        pitch: userProfile.gender === 'male' ? 0.96 : 1.02,
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [speechSynthesisSupported, stopSpeaking, userProfile.gender]
  );

  useEffect(() => {
    if (!greetedRef.current && autoSpeakRef.current) {
      greetedRef.current = true;
      window.setTimeout(() => {
        speakText(INITIAL_MESSAGE.text);
      }, 220);
    }
  }, [speakText]);

  const pushAssistantReply = useCallback(
    (replyText: string, userMessage: string) => {
      const replyMessage: Message = {
        id: `${Date.now()}-reply`,
        from: 'ai',
        text: replyText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, replyMessage]);
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: replyText },
      ]);
      speakText(replyText);
    },
    [speakText]
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isTyping) return;

      setNotice(null);

      const userMessage: Message = {
        id: Date.now().toString(),
        from: 'user',
        text: messageText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      if (isGreeting(messageText)) {
        pushAssistantReply(createLocalFallbackReply(messageText), messageText);
        return;
      }

      setIsTyping(true);

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            history,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const replyText =
          typeof data?.reply === 'string' && data.reply.trim()
            ? data.reply.trim()
            : createLocalFallbackReply(messageText);

        pushAssistantReply(replyText, messageText);
      } catch (error) {
        console.error('DoctorConsultScreen sendMessage failed:', error);
        setNotice('יש תקלה זמנית. עברתי למענה גיבוי כדי שלא תיתקע השיחה.');
        pushAssistantReply(createLocalFallbackReply(messageText), messageText);
      } finally {
        setIsTyping(false);
      }
    },
    [history, input, isTyping, pushAssistantReply]
  );

  const startListening = () => {
    if (!speechRecognitionSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    pendingTranscriptRef.current = '';
    setNotice('אני מאזין. אפשר לדבר חופשי.');

    const recognition = new Recognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (transcript) {
        pendingTranscriptRef.current = transcript;
        setInput(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setNotice('לא הצלחתי לקלוט את ההקלטה. אפשר לנסות שוב.');
    };

    recognition.onend = () => {
      setIsListening(false);

      if (pendingTranscriptRef.current) {
        const spokenText = pendingTranscriptRef.current;
        pendingTranscriptRef.current = '';
        void sendMessage(spokenText);
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (autoSpeak) {
      setAutoSpeak(false);
      setNotice('המענה הקולי כובה. אפשר להדליק שוב מתי שתרצה.');
      return;
    }

    autoSpeakRef.current = true;
    setAutoSpeak(true);
    setNotice('המענה הקולי פעיל. אקריא את התשובות בקול.');
  };

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="העוזר הרפואי שלי"
        subtitle="שיחה קולית רגועה וברורה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
          <button
            onClick={handleVoiceToggle}
            className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
            style={{
              backgroundColor: isSpeaking ? '#FEF3C7' : autoSpeak ? theme.primaryBg : '#FFFFFF',
              border: `1px solid ${isSpeaking ? '#FCD34D' : autoSpeak ? theme.primaryBorder : '#E2E8F0'}`,
              color: isSpeaking ? '#B45309' : autoSpeak ? theme.primary : '#64748B',
            }}
            aria-label="הקראה קולית"
          >
            {autoSpeak ? <Volume2 size={18} strokeWidth={1.8} /> : <VolumeX size={18} strokeWidth={1.8} />}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          className="rounded-3xl p-4 text-right"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div className="flex flex-row-reverse items-start justify-end gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: theme.gradientCard, color: '#FFFFFF' }}
            >
              <Sparkles size={18} strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-right">
              <p style={{ color: '#0F172A', fontWeight: 900 }}>אפשר פשוט לדבר איתי בקול</p>
              <p className="mt-1 text-sm leading-6" style={{ color: '#64748B', fontWeight: 700 }}>
                לוחצים על המיקרופון, שואלים בקול, ומקבלים תשובה רפואית קצרה וברורה.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {speechRecognitionSupported && (
              <button
                onClick={startListening}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] transition-all active:scale-[0.98]"
                style={{
                  background: isListening ? 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)' : theme.gradientCard,
                  color: '#FFFFFF',
                  boxShadow: isListening ? '0 14px 28px rgba(239, 68, 68, 0.22)' : `0 14px 28px ${theme.primaryShadow}`,
                  fontWeight: 900,
                }}
              >
                <Mic size={20} strokeWidth={1.9} />
                <span>{isListening ? 'מאזין עכשיו...' : 'התחל שיחה קולית'}</span>
              </button>
            )}

            <div className="flex w-full flex-row-reverse flex-wrap justify-start gap-2">
              {['סוכר', 'תרופות', 'אוכל', 'תסמינים'].map((item) => (
                <span
                  key={item}
                  className="rounded-full px-3 py-1.5 text-sm"
                  style={{
                    backgroundColor: theme.primaryBg,
                    color: theme.primary,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end gap-3 ${message.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
              style={{ background: message.from === 'ai' ? theme.gradientCard : '#F1F5F9' }}
            >
              {message.from === 'ai' ? (
                <Sparkles size={16} strokeWidth={1.8} color="#FFFFFF" />
              ) : (
                <User size={16} strokeWidth={1.8} style={{ color: '#334155' }} />
              )}
            </div>

            <div className="max-w-[82%]">
              <div
                className="px-4 py-3.5 text-sm"
                style={{
                  backgroundColor: message.from === 'user' ? theme.primary : '#FFFFFF',
                  color: message.from === 'user' ? '#FFFFFF' : '#1F2937',
                  borderRadius:
                    message.from === 'user' ? '18px 18px 6px 18px' : '6px 18px 18px 18px',
                  border: message.from === 'ai' ? `1px solid ${theme.primaryBorder}` : 'none',
                  boxShadow:
                    message.from === 'ai'
                      ? '0 8px 20px rgba(15, 23, 42, 0.05)'
                      : `0 10px 20px ${theme.primaryShadow}`,
                  textAlign: 'right',
                  direction: 'rtl',
                  lineHeight: 1.75,
                  fontWeight: 600,
                }}
              >
                {message.text}
              </div>
              <p className="mt-1.5 text-right text-xs" style={{ color: '#94A3B8' }}>
                {message.time}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
              style={{ background: theme.gradientCard }}
            >
              <Sparkles size={16} strokeWidth={1.8} color="#FFFFFF" />
            </div>
            <div
              className="flex items-center gap-1.5 rounded-[20px] px-5 py-3.5"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${theme.primaryBorder}`,
              }}
            >
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: theme.primaryMuted,
                    animation: `bounce 1.2s ease-in-out ${index * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {notice && (
          <div
            className="flex flex-row-reverse items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
            }}
          >
            <AlertCircle size={18} strokeWidth={2} style={{ color: '#1D4ED8', flexShrink: 0 }} />
            <p className="flex-1 text-right text-sm" style={{ color: '#1D4ED8', fontWeight: 700 }}>
              {notice}
            </p>
          </div>
        )}

        {showSuggestions && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                className="w-full rounded-2xl px-4 py-3.5 text-right text-sm transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${theme.primaryBorder}`,
                  color: '#1F2937',
                  fontWeight: 800,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div
        className="flex-shrink-0 bg-white px-4 pt-3 pb-6"
        style={{ borderTop: `1px solid ${theme.primaryBorder}` }}
      >
        {speechRecognitionSupported && (
          <button
            onClick={startListening}
            className="mb-3 flex h-14 w-full items-center justify-center gap-2 rounded-[22px] transition-all active:scale-[0.98]"
            style={{
              background: isListening ? 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)' : theme.gradientCard,
              color: '#FFFFFF',
              boxShadow: isListening ? '0 14px 28px rgba(239, 68, 68, 0.22)' : `0 14px 28px ${theme.primaryShadow}`,
              fontWeight: 900,
            }}
          >
            <Mic size={20} strokeWidth={1.9} />
            <span>{isListening ? 'מאזין עכשיו...' : 'דברו איתי עכשיו'}</span>
          </button>
        )}

        <div className="flex flex-row-reverse items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="או אם נוח, אפשר גם לכתוב שאלה קצרה..."
            dir="rtl"
            className="h-12 flex-1 rounded-2xl px-4 text-sm outline-none"
            style={{
              backgroundColor: '#F8FAFC',
              border: `1px solid ${theme.primaryBorder}`,
              color: '#0F172A',
              fontWeight: 600,
            }}
          />

          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isTyping}
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: input.trim() && !isTyping ? theme.gradientCard : '#E2E8F0',
              boxShadow: input.trim() && !isTyping ? `0 12px 24px ${theme.primaryShadow}` : 'none',
            }}
            aria-label="שליחה"
          >
            <Send size={18} strokeWidth={1.9} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
}
