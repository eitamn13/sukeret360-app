import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Keyboard,
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';
import { cancelHebrewSpeech, preloadSpeechVoices, speakHebrewText } from '../utils/speech';

interface DoctorConsultScreenProps {
  onClose: () => void;
}

interface Message {
  id: string;
  from: 'assistant' | 'user';
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
const QUICK_TOPICS = ['סוכר', 'תרופות', 'אוכל', 'תסמינים'];

const COPY = {
  title: 'העוזר הרפואי שלי',
  subtitle: 'שיחה חיה, תשובה קצרה וברורה',
  introTitle: 'במה אפשר לעזור עכשיו?',
  introBody:
    'אפשר להיכנס לשיחה חיה בקול, לדבר חופשי ולקבל תשובות ברורות בלי להקליד.',
  liveStart: 'התחל שיחה חיה',
  liveStop: 'עצור שיחה',
  listening: 'אני מאזין עכשיו. אפשר לדבר חופשי.',
  voiceOn: 'הקול פועל.',
  voiceOff: 'הקול כבוי.',
  recognitionError: 'לא הצלחתי לשמוע טוב. אפשר לנסות שוב.',
  temporaryIssue: 'יש כרגע תקלה זמנית, אז אני עובר למענה גיבוי כדי שלא תיתקע השיחה.',
  inputPlaceholder: 'אפשר לכתוב כאן שאלה קצרה...',
  keyboardOpen: 'פתח מקלדת',
  keyboardClose: 'סגור מקלדת',
  send: 'שלח',
  welcome:
    'אני כאן כדי לעזור בנושאי סוכר, תרופות, אוכל והרגשה כללית בצורה קצרה וברורה.',
} as const;

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  from: 'assistant',
  text: COPY.welcome,
  time: nowTime(),
};

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function createFallbackReply(message: string) {
  const normalized = normalizeMessage(message);

  if (['היי', 'שלום', 'ai', 'hello', 'hey'].includes(normalized)) {
    return 'אני כאן כדי לעזור בשאלות קצרות על סוכר, תרופות, אוכל ותסמינים.';
  }

  if (normalized.includes('סוכר') && normalized.includes('לפני') && normalized.includes('ארוחה')) {
    return 'בדרך כלל יעד מקובל לפני ארוחה הוא בערך 80 עד 130 mg/dL, אבל חשוב לפעול לפי היעד האישי שהוגדר לך.';
  }

  if (normalized.includes('היפו') || normalized.includes('רעב') || normalized.includes('חולשה')) {
    return 'אם יש רעב, חולשה, רעד או הזעה, כדאי לבדוק סוכר. אם הוא נמוך, בדרך כלל נוהגים לקחת פחמימה מהירה ואז לבדוק שוב אחרי 15 דקות.';
  }

  if (
    normalized.includes('תרופה') ||
    normalized.includes('מטפורמין') ||
    normalized.includes('אינסולין')
  ) {
    return 'אם תגיד לי מה שם התרופה או מתי צריך לקחת אותה, אכוון אותך בצורה קצרה וברורה.';
  }

  if (
    normalized.includes('אוכל') ||
    normalized.includes('ארוחה') ||
    normalized.includes('פחמימה')
  ) {
    return 'בדרך כלל עדיף לבחור ארוחה עם חלבון, ירקות ופחמימה מדודה. אם תרצה, אפשר להתמקד בארוחת בוקר, צהריים או ערב.';
  }

  return 'יש כרגע תקלה זמנית בחיבור המלא, אבל עדיין אפשר להמשיך לדבר איתי ולקבל מענה קצר וברור.';
}

export function DoctorConsultScreen({ onClose }: DoctorConsultScreenProps) {
  const { theme, userProfile } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pendingTranscriptRef = useRef('');
  const sendMessageRef = useRef<(text?: string) => Promise<void>>(async () => {});
  const autoSpeakRef = useRef(true);
  const liveModeRef = useRef(false);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const canUseLiveConversation = useMemo(
    () => speechRecognitionSupported && speechSynthesisSupported,
    [speechRecognitionSupported, speechSynthesisSupported]
  );

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisSupported) return;
    setIsSpeaking(false);
    cancelHebrewSpeech();
  }, [speechSynthesisSupported]);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
    if (!autoSpeak) stopSpeaking();
  }, [autoSpeak, stopSpeaking]);

  useEffect(() => {
    liveModeRef.current = liveMode;
  }, [liveMode]);

  useEffect(() => {
    preloadSpeechVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => preloadSpeechVoices();
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      cancelHebrewSpeech();
    };
  }, []);

  const beginListening = useCallback(() => {
    if (!speechRecognitionSupported || isListening) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    pendingTranscriptRef.current = '';
    setNotice(COPY.listening);

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
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setNotice(COPY.recognitionError);
    };

    recognition.onend = () => {
      setIsListening(false);
      const transcript = pendingTranscriptRef.current.trim();
      pendingTranscriptRef.current = '';

      if (transcript) {
        void sendMessageRef.current(transcript);
        return;
      }

      if (liveModeRef.current) {
        window.setTimeout(() => beginListening(), 500);
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, speechRecognitionSupported]);

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthesisSupported || !autoSpeakRef.current) {
        if (liveModeRef.current) {
          window.setTimeout(() => beginListening(), 450);
        }
        return;
      }

      stopSpeaking();
      setIsSpeaking(true);

      speakHebrewText(text, {
        gender: userProfile.gender,
        rate: 0.93,
        pitch: userProfile.gender === 'male' ? 0.95 : 1.01,
        onEnd: () => {
          setIsSpeaking(false);
          if (liveModeRef.current) {
            window.setTimeout(() => beginListening(), 450);
          }
        },
        onError: () => {
          setIsSpeaking(false);
          if (liveModeRef.current) {
            window.setTimeout(() => beginListening(), 450);
          }
        },
      });
    },
    [beginListening, speechSynthesisSupported, stopSpeaking, userProfile.gender]
  );

  const appendAssistantReply = useCallback(
    (replyText: string, userMessage: string) => {
      const replyMessage: Message = {
        id: `${Date.now()}-assistant`,
        from: 'assistant',
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
    async (rawText?: string) => {
      const messageText = (rawText ?? input).trim();
      if (!messageText || isTyping) return;

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        from: 'user',
        text: messageText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setNotice(null);
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

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }

        const replyText =
          typeof payload?.reply === 'string' && payload.reply.trim()
            ? payload.reply.trim()
            : createFallbackReply(messageText);

        appendAssistantReply(replyText, messageText);
      } catch (error) {
        console.error('DoctorConsultScreen sendMessage failed:', error);
        setNotice(COPY.temporaryIssue);
        appendAssistantReply(createFallbackReply(messageText), messageText);
      } finally {
        setIsTyping(false);
      }
    },
    [appendAssistantReply, history, input, isTyping]
  );

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (autoSpeak) {
      setAutoSpeak(false);
      setNotice(COPY.voiceOff);
      stopSpeaking();
      return;
    }

    setAutoSpeak(true);
    setNotice(COPY.voiceOn);
  };

  const toggleLiveMode = () => {
    if (!canUseLiveConversation) {
      setNotice('בדפדפן הזה שיחה קולית מלאה עדיין לא זמינה. אפשר להמשיך עם המקלדת.');
      return;
    }

    if (liveMode) {
      setLiveMode(false);
      recognitionRef.current?.stop();
      setIsListening(false);
      stopSpeaking();
      setNotice('השיחה החיה נעצרה.');
      return;
    }

    setLiveMode(true);
    beginListening();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title={COPY.title}
        subtitle={COPY.subtitle}
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
            <button
              onClick={handleVoiceToggle}
              className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
              style={{
              backgroundColor: isSpeaking
                ? '#FEF3C7'
                : autoSpeak
                  ? theme.primaryBg
                  : '#FFFFFF',
              border: `1px solid ${
                isSpeaking ? '#FCD34D' : autoSpeak ? theme.primaryBorder : '#E2E8F0'
              }`,
              color: isSpeaking ? '#B45309' : autoSpeak ? theme.primaryDark : '#64748B',
              }}
              aria-label="הקראה קולית"
            >
            {autoSpeak ? <Volume2 size={18} strokeWidth={1.8} /> : <VolumeX size={18} strokeWidth={1.8} />}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <div
            className="rounded-[28px] p-4 text-right"
            style={{
              backgroundColor: '#FFFFFF',
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: theme.primaryBg, color: theme.primaryDark }}
            >
              <Sparkles size={20} strokeWidth={1.9} />
            </div>

            <h2 className="text-[22px] font-black text-[#0F172A]">{COPY.introTitle}</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{COPY.introBody}</p>

            <div className="mt-4 grid gap-3">
              <button
                onClick={toggleLiveMode}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] text-white transition-all active:scale-[0.98]"
                style={{
                  background: liveMode
                    ? 'linear-gradient(135deg, #F43F5E 0%, #DC2626 100%)'
                    : 'linear-gradient(135deg, #8EADE4 0%, #D49BB0 100%)',
                  boxShadow: '0 18px 36px rgba(114, 138, 180, 0.18)',
                  fontWeight: 900,
                }}
              >
                {liveMode ? <MicOff size={18} strokeWidth={1.9} /> : <Mic size={18} strokeWidth={1.9} />}
                <span>{liveMode ? COPY.liveStop : COPY.liveStart}</span>
              </button>

              <div className="flex flex-wrap justify-end gap-2">
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => void sendMessage(topic)}
                    className="rounded-full px-4 py-2 text-sm"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${theme.primaryBorder}`,
                      color: theme.primaryDark,
                      fontWeight: 800,
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setKeyboardOpen((current) => !current)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: `1px solid ${theme.primaryBorder}`,
                }}
              >
                <Keyboard size={17} />
                <span>{keyboardOpen ? COPY.keyboardClose : COPY.keyboardOpen}</span>
              </button>
            </div>
          </div>

          {notice ? (
            <div
              className="flex items-start gap-2 rounded-2xl p-4"
              style={{
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                color: '#9A3412',
              }}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-bold leading-7">{notice}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === 'assistant' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[88%] rounded-[24px] px-4 py-3"
                  style={{
                    background:
                      message.from === 'assistant'
                        ? '#FFFFFF'
                        : 'linear-gradient(135deg, #8EADE4 0%, #6C8FD1 100%)',
                    color: message.from === 'assistant' ? '#334155' : '#FFFFFF',
                    border:
                      message.from === 'assistant'
                        ? `1px solid ${theme.primaryBorder}`
                        : '1px solid transparent',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor:
                          message.from === 'assistant' ? theme.primaryBg : 'rgba(255,255,255,0.2)',
                        color: message.from === 'assistant' ? theme.primaryDark : '#FFFFFF',
                      }}
                    >
                      {message.from === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                    </div>
                    <span
                      className="text-[11px]"
                      style={{
                        color: message.from === 'assistant' ? '#94A3B8' : 'rgba(255,255,255,0.78)',
                        fontWeight: 800,
                      }}
                    >
                      {message.time}
                    </span>
                  </div>
                  <p className="text-right text-sm font-bold leading-7">{message.text}</p>
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex justify-end">
                <div
                  className="rounded-[24px] px-4 py-3"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${theme.primaryBorder}`,
                  }}
                >
                  <p className="text-sm font-bold text-[#64748B]">עוד רגע, אני עונה...</p>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {keyboardOpen ? (
        <div
          className="border-t px-4 pb-4 pt-3"
          style={{
            borderColor: theme.primaryBorder,
            background: 'rgba(255,255,255,0.97)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isTyping}
              className="flex h-12 w-12 items-center justify-center rounded-2xl disabled:opacity-50"
              style={{
                background: theme.primary,
                color: '#FFFFFF',
                boxShadow: `0 10px 24px ${theme.primaryShadow}`,
              }}
              aria-label={COPY.send}
            >
              <Send size={18} strokeWidth={2} />
            </button>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={COPY.inputPlaceholder}
              className="h-12 flex-1 rounded-2xl px-4 text-right outline-none"
              dir="rtl"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${theme.primaryBorder}`,
                color: '#334155',
                fontWeight: 700,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
