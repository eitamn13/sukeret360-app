import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Mic, Send, Sparkles, User, Volume2, VolumeX } from 'lucide-react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';

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
  text: 'אני כאן בתור "העוזר הרפואי שלי". אפשר לשאול כאן על סוכר, תרופות, אוכל או הרגשה, ואני אענה קצר, רגוע וברור.',
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
    return 'אני כאן בתור "העוזר הרפואי שלי". אפשר לשאול על סוכר, תרופות, אוכל, תסמינים או מה כדאי לעשות עכשיו.';
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
    return 'אם יש רעד, חולשה, הזעה או סחרחורת, כדאי קודם לבדוק סוכר. אם הוא נמוך, נהוג לקחת פחמימה מהירה ולבדוק שוב אחרי כ־15 דקות. אם יש החמרה או בלבול, צריך לפנות מיד לעזרה רפואית.';
  }

  if (
    normalized.includes('תרופה') ||
    normalized.includes('תרופות') ||
    normalized.includes('מטפורמין') ||
    normalized.includes('אינסולין')
  ) {
    return 'לגבי תרופות, הכי בטוח להיצמד להנחיה האישית שלך. אם כותבים לי את שם התרופה והשעה, אוכל להסביר מה מקובל באופן כללי.';
  }

  if (
    normalized.includes('אוכל') ||
    normalized.includes('ארוחה') ||
    normalized.includes('פחמ')
  ) {
    return 'בדרך כלל עדיף לבחור ארוחה פשוטה עם חלבון, ירקות ופחמימה מדודה. למשל יוגורט עם אגוזים, חביתה עם סלט, או עוף עם אורז בכמות קטנה.';
  }

  return 'יש כרגע תקלה זמנית בחיבור המלא, אבל "העוזר הרפואי שלי" עדיין כאן. אפשר לכתוב שאלה קצרה על סוכר, תרופות, אוכל או הרגשה.';
}

export function DoctorConsultScreen({ onClose }: DoctorConsultScreenProps) {
  const { theme } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoSpeakRef = useRef(false);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisSupported) return;
    utteranceRef.current = null;
    setIsSpeaking(false);
    window.speechSynthesis.cancel();
  }, [speechSynthesisSupported]);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;

    if (!autoSpeak) {
      stopSpeaking();
    }
  }, [autoSpeak, stopSpeaking]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthesisSupported || !autoSpeakRef.current) return;

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.95;
      utterance.pitch = 1;
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
      setNotice('לא הצלחתי לקלוט את ההקלטה. אפשר לנסות שוב.');
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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (autoSpeak) {
      setAutoSpeak(false);
      setNotice('הקראה כבויה.');
      return;
    }

    autoSpeakRef.current = true;
    setAutoSpeak(true);
    setNotice('הקראה פעילה.');
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
        subtitle="שאלות קצרות, תשובה רפואית ברורה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
          <button
            onClick={handleVoiceToggle}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
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
          <div className="flex w-full flex-col items-start text-right">
            <div className="flex w-full items-center justify-start gap-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: theme.gradientCard, color: '#FFFFFF' }}
              >
                <Sparkles size={17} strokeWidth={1.8} />
              </div>
              <p style={{ color: '#0F172A', fontWeight: 900 }}>במה אפשר לעזור עכשיו?</p>
            </div>
            <div className="mt-3 flex w-full flex-wrap justify-start gap-2">
              {['סוכר', 'תרופות', 'אוכל', 'תסמינים'].map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-full text-sm"
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
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: message.from === 'ai' ? theme.gradientCard : '#F1F5F9' }}
            >
              {message.from === 'ai' ? (
                <Sparkles size={16} strokeWidth={1.8} color="#FFFFFF" />
              ) : (
                <User size={16} strokeWidth={1.8} style={{ color: '#334155' }} />
              )}
            </div>

            <div className="max-w-[80%]">
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
                  fontWeight: 500,
                }}
              >
                {message.text}
              </div>
              <p className="text-xs mt-1.5 text-right" style={{ color: '#94A3B8' }}>
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
              <Sparkles size={16} strokeWidth={1.8} color="#FFFFFF" />
            </div>
            <div
              className="px-5 py-3.5 flex items-center gap-1.5 rounded-[20px]"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${theme.primaryBorder}`,
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
            className="flex flex-row-reverse items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
            }}
          >
            <AlertCircle size={18} strokeWidth={2} style={{ color: '#1D4ED8', flexShrink: 0 }} />
            <p className="text-sm text-right flex-1" style={{ color: '#1D4ED8', fontWeight: 700 }}>
              {notice}
            </p>
          </div>
        )}

        {showSuggestions && (
          <div className="space-y-2">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                className="w-full text-right px-4 py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98]"
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
        className="flex-shrink-0 px-4 pt-3 pb-6 bg-white"
        style={{ borderTop: `1px solid ${theme.primaryBorder}` }}
      >
        <div className="flex flex-row-reverse items-center gap-3">
          {speechRecognitionSupported && (
            <button
              onClick={startListening}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{
                backgroundColor: isListening ? '#FEF2F2' : theme.primaryBg,
                border: `1px solid ${isListening ? '#FECACA' : theme.primaryBorder}`,
                color: isListening ? '#DC2626' : theme.primary,
              }}
              aria-label="הקלטה קולית"
            >
              <Mic size={18} strokeWidth={1.9} />
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="אפשר לכתוב שאלה קצרה..."
            dir="rtl"
            className="flex-1 h-12 px-4 rounded-2xl text-sm outline-none"
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
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
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
