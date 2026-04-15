import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Mic, Send, Sparkles, User, Volume2, VolumeX } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

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

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function isGreeting(message: string) {
  const normalized = message.trim().toLowerCase();
  return ['ai', 'היי', 'הי', 'שלום', 'hey', 'hello'].includes(normalized);
}

function createLocalFallbackReply(message: string) {
  const normalized = message.toLowerCase();

  if (isGreeting(message)) {
    return 'אני כאן בשבילך. אפשר לשאול אותי על סוכר, ארוחות, תרופות, היפו, היפר או הרגלים יומיים.';
  }

  if (normalized.includes('סוכר') && normalized.includes('לפני')) {
    return 'בדרך כלל יעד מקובל לפני ארוחה הוא בערך 80 עד 130 mg/dL, אבל תמיד חשוב לפעול לפי היעד שהרופא או האחות הגדירו עבורך.';
  }

  if (
    normalized.includes('היפו') ||
    normalized.includes('חלש') ||
    normalized.includes('רעד') ||
    normalized.includes('סחרחורת')
  ) {
    return 'אם יש חולשה, רעד, הזעה או סחרחורת, כדאי קודם לבדוק סוכר. אם הערך נמוך, נהוג לטפל בפחמימה מהירה ולבדוק שוב אחרי כ־15 דקות. אם יש החמרה או בלבול, צריך לפנות לעזרה רפואית מיד.';
  }

  if (normalized.includes('ארוח') || normalized.includes('פחמימ')) {
    return 'כדאי לבנות ארוחה מאוזנת עם פחמימה מדודה, חלבון וירקות. לדוגמה: יוגורט עם אגוזים, חביתה עם סלט, או עוף עם כמות מדודה של אורז או קינואה.';
  }

  if (
    normalized.includes('תרופ') ||
    normalized.includes('מטפורמין') ||
    normalized.includes('אינסולין')
  ) {
    return 'לגבי תרופות, הכי בטוח להיצמד להנחיה האישית שלך. אם תרצה, אפשר לכתוב לי את שם התרופה ואת שעת הלקיחה ואעזור להבין מה מקובל באופן כללי.';
  }

  if (normalized.includes('הליכה') || normalized.includes('ספורט') || normalized.includes('אימון')) {
    return 'פעילות גופנית מתונה יכולה לעזור לאיזון, אבל אם יש אינסולין או ערכים לא יציבים, כדאי לבדוק סוכר לפני ואחרי ולוודא שיש פחמימה זמינה במקרה הצורך.';
  }

  return 'יש כרגע קושי זמני בחיבור לעוזר המלא, אבל אני עדיין כאן כדי לעזור. נסה לנסח את השאלה בקצרה סביב סוכר, ארוחה, תרופות, תסמינים או פעילות, ואענה לפי המידע הזמין.';
}

const CHAT_ENDPOINT = '/api/chat';

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  from: 'ai',
  text: 'שלום, אני עוזר הבריאות של הסוכרת שלי. אפשר לשאול אותי על סוכר, תרופות, אוכל או תסמינים.',
  time: nowTime(),
};

const QUICK_SUGGESTIONS = [
  'מה הסוכר התקין לפני ארוחה?',
  'מתי הכי טוב לקחת מטפורמין?',
  'איזו ארוחת ערב טובה לחולי סוכרת?',
  'מה לעשות אם יש רעד או סחרחורת?',
];

export function DoctorConsultScreen({ onClose }: DoctorConsultScreenProps) {
  const { theme } = useAppContext();
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoSpeakRef = useRef(true);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisSupported) return;
    utteranceRef.current = null;
    setIsSpeaking(false);
    window.speechSynthesis.cancel();
  }, [speechSynthesisSupported]);

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthesisSupported || !autoSpeakRef.current) return;

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.96;
      utterance.pitch = 0.95;
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [speechSynthesisSupported, stopSpeaking]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping, messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [stopSpeaking]);

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

  const startListening = () => {
    if (!speechRecognitionSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

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
        setInput(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setNotice('לא הצלחנו לקלוט את ההקלטה. אפשר לנסות שוב או להקליד.');
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isTyping) return;

      setNotice(null);

      const userMsg: Message = {
        id: Date.now().toString(),
        from: 'user',
        text: messageText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      if (isGreeting(messageText)) {
        const greetingReply =
          'אני כאן בשבילך. אפשר לשאול אותי על סוכר, תרופות, ארוחות, תסמינים או מה לעשות עכשיו כדי להישאר מאוזן יותר.';
        pushAssistantReply(greetingReply, messageText);
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
          console.error('Chat API error:', response.status, data);
          throw new Error(`HTTP ${response.status}`);
        }

        const replyText =
          typeof data?.reply === 'string' && data.reply.trim()
            ? data.reply.trim()
            : 'אני כאן, אבל לא הצלחתי לענות כרגע כמו שצריך. אפשר לנסות שוב בעוד רגע.';

        pushAssistantReply(replyText, messageText);
      } catch (error) {
        console.error('DoctorConsultScreen sendMessage failed:', error);
        const fallbackReply = createLocalFallbackReply(messageText);
        setNotice('יש תקלה זמנית בחיבור לעוזר המלא, אז עברתי למענה גיבוי כדי שלא תיתקע.');
        pushAssistantReply(fallbackReply, messageText);
      } finally {
        setIsTyping(false);
      }
    },
    [history, input, isTyping, pushAssistantReply]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (autoSpeak || isSpeaking) {
      stopSpeaking();
      setAutoSpeak(false);
      return;
    }

    setAutoSpeak(true);
    setNotice('הקראה קולית הופעלה מחדש.');
  };

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="עוזר בריאות AI"
        subtitle="שיחה רגועה, ברורה ומותאמת לשאלות על סוכרת"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
          <div className="flex items-center gap-2">
            {speechSynthesisSupported && (
              <button
                onClick={handleVoiceToggle}
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                style={{
                  backgroundColor: autoSpeak ? theme.primaryBg : '#FFF1F2',
                  border: `1.5px solid ${autoSpeak ? theme.primaryBorder : '#FECACA'}`,
                  color: autoSpeak ? theme.primary : '#DC2626',
                }}
                aria-label="הקראה קולית"
              >
                {autoSpeak ? (
                  <Volume2 size={18} strokeWidth={1.8} />
                ) : (
                  <VolumeX size={18} strokeWidth={1.8} />
                )}
              </button>
            )}

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: theme.gradientCard, color: '#FFFFFF' }}
            >
              <Sparkles size={18} strokeWidth={1.5} />
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <div
          className="rounded-[26px] p-4"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
            border: `1px solid ${theme.primaryBorder}`,
          }}
        >
          <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 16 }}>איך הכי נוח להשתמש בי?</p>
          <p style={{ color: '#64748B', lineHeight: 1.7, marginTop: 8, fontSize: 14 }}>
            שאלות קצרות מקבלות תשובות ברורות יותר. למשל: "מה הסוכר התקין לפני ארוחה?" או "מה לעשות אם יש רעד?".
          </p>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end gap-3 ${message.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: message.from === 'ai' ? theme.gradientCard : '#F3F4F6' }}
            >
              {message.from === 'ai' ? (
                <Sparkles size={16} strokeWidth={1.5} color="white" />
              ) : (
                <User size={17} strokeWidth={1.5} style={{ color: '#374151' }} />
              )}
            </div>

            <div className="max-w-[78%]">
              <div
                className="px-4 py-3.5 text-sm leading-relaxed"
                style={{
                  backgroundColor: message.from === 'user' ? theme.primary : '#FFFFFF',
                  color: message.from === 'user' ? '#FFFFFF' : '#1F2937',
                  fontWeight: 500,
                  borderRadius:
                    message.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  border: message.from === 'ai' ? `1.5px solid ${theme.primaryBorder}` : 'none',
                  boxShadow:
                    message.from === 'ai'
                      ? `0 2px 8px ${theme.primary}14`
                      : `0 4px 12px ${theme.primaryShadow}`,
                  textAlign: 'right',
                  direction: 'rtl',
                  lineHeight: 1.8,
                }}
              >
                {message.text}
              </div>
              <p
                className={`text-xs mt-1.5 ${message.from === 'user' ? 'text-left' : 'text-right'}`}
                style={{ color: '#94A3B8' }}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: theme.gradientCard }}
            >
              <Sparkles size={16} strokeWidth={1.5} color="white" />
            </div>
            <div
              className="px-5 py-3.5 flex items-center gap-1.5"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1.5px solid ${theme.primaryBorder}`,
                borderRadius: '4px 18px 18px 18px',
                boxShadow: `0 2px 8px ${theme.primary}14`,
              }}
            >
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full"
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
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
            }}
          >
            <AlertCircle size={18} strokeWidth={2} style={{ color: '#1D4ED8', flexShrink: 0 }} />
            <p className="text-sm text-right flex-1" style={{ color: '#1D4ED8', fontWeight: 600 }}>
              {notice}
            </p>
          </div>
        )}

        {showSuggestions && (
          <div className="space-y-2.5 mt-2">
            <p className="text-xs text-right pr-1" style={{ color: theme.primaryMuted, fontWeight: 700 }}>
              שאלות מהירות:
            </p>
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                className="w-full text-right px-5 py-4 rounded-2xl text-sm transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${theme.primaryBorder}`,
                  color: theme.primary,
                  fontWeight: 700,
                  boxShadow: `0 2px 8px ${theme.primary}0A`,
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
        className="flex-shrink-0 px-4 pt-3 pb-6 bg-white"
        style={{
          borderTop: `1.5px solid ${theme.primaryBorder}`,
          boxShadow: `0 -4px 20px ${theme.primary}10`,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
            style={{
              background: input.trim() && !isTyping ? theme.gradientCard : '#F3F4F6',
              boxShadow: input.trim() && !isTyping ? `0 4px 14px ${theme.primaryShadow}` : 'none',
            }}
          >
            <Send size={20} strokeWidth={2} color={input.trim() && !isTyping ? 'white' : '#9CA3AF'} />
          </button>

          {speechRecognitionSupported && (
            <button
              onClick={startListening}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: isListening ? '#DBEAFE' : theme.primaryBg,
                border: `1.5px solid ${isListening ? '#60A5FA' : theme.primaryBorder}`,
                color: isListening ? '#1D4ED8' : theme.primary,
              }}
            >
              <Mic size={19} strokeWidth={2} />
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'מקשיב עכשיו...' : 'כתבו שאלה על סוכר, תרופות, ארוחות או תסמינים'}
            dir="rtl"
            className="flex-1 h-12 px-4 rounded-2xl text-sm outline-none transition-all"
            style={{
              backgroundColor: theme.primaryBg,
              border: `1.5px solid ${input ? theme.primary : theme.primaryBorder}`,
              color: '#1F2937',
              fontWeight: 500,
              boxShadow: input ? `0 0 0 3px ${theme.primaryShadow}22` : 'none',
            }}
          />
        </div>

        <p className="text-xs text-center mt-2.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
          תשובות AI אינן מחליפות ייעוץ רפואי מקצועי
        </p>
      </div>
    </div>
  );
}
