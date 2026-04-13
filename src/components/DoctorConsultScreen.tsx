import { X, Send, Sparkles, User, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
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

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

const CHAT_ENDPOINT = '/api/chat';

const INITIAL_MESSAGE: Message = {
  id: 'm0',
  from: 'ai',
  text: 'שלום! אני עוזרת הבריאות שלך, מבוססת בינה מלאכותית. אוכל לענות על שאלות לגבי סוכרת, תזונה, תרופות ופעילות גופנית. במה אוכל לעזור לך היום?',
  time: nowTime(),
};

const QUICK_SUGGESTIONS = [
  'מה הסוכר התקין לפני ארוחה?',
  'מתי הכי טוב לקחת מטפורמין?',
  'איזה ספורט מתאים לסוכרתיות?',
  'מה מותר לאכול בארוחת בוקר?',
];

export function DoctorConsultScreen({ onClose }: DoctorConsultScreenProps) {
  const { theme } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isTyping) return;

    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: messageText,
      time: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          history,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('Chat API error:', res.status, data);
        throw new Error(`HTTP ${res.status}`);
      }

      const replyText: string =
        data?.reply ?? 'מצטערת, לא הצלחתי להשיב כרגע. נסי שוב.';

      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: replyText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, replyMsg]);
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: messageText },
        { role: 'assistant', content: replyText },
      ]);
    } catch (err) {
      console.error('DoctorConsultScreen sendMessage failed:', err);
      setError('לא ניתן להתחבר לשירות כרגע. בדקי את החיבור לאינטרנט ונסי שוב.');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(messageText);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 pt-12 pb-4"
        style={{ background: theme.gradientCard, boxShadow: `0 4px 20px ${theme.primaryShadow}` }}
      >
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          aria-label="סגור"
        >
          <X size={22} strokeWidth={2} color="white" />
        </button>

        <div className="text-center">
          <h1 className="text-lg text-white" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
            עוזרת בריאות AI
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              className="w-2 h-2 rounded-full bg-green-300 inline-block"
              style={{ boxShadow: '0 0 6px rgba(134,239,172,0.8)' }}
            />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              GPT-4o-mini · זמינה תמיד
            </p>
          </div>
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Sparkles size={20} strokeWidth={1.5} color="white" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: msg.from === 'ai' ? theme.gradientCard : '#F3F4F6' }}
            >
              {msg.from === 'ai' ? (
                <Sparkles size={16} strokeWidth={1.5} color="white" />
              ) : (
                <User size={17} strokeWidth={1.5} style={{ color: '#374151' }} />
              )}
            </div>

            <div className="max-w-[78%]">
              <div
                className="px-4 py-3.5 text-sm leading-relaxed"
                style={{
                  backgroundColor: msg.from === 'user' ? theme.primary : '#FFFFFF',
                  color: msg.from === 'user' ? '#FFFFFF' : '#1F2937',
                  fontWeight: 400,
                  borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  border: msg.from === 'ai' ? `1.5px solid ${theme.primaryBorder}` : 'none',
                  boxShadow:
                    msg.from === 'ai'
                      ? `0 2px 8px ${theme.primary}14`
                      : `0 4px 12px ${theme.primaryShadow}`,
                  textAlign: 'right',
                  direction: 'rtl',
                }}
              >
                {msg.text}
              </div>
              <p
                className={`text-xs mt-1.5 ${msg.from === 'user' ? 'text-left' : 'text-right'}`}
                style={{ color: '#9CA3AF' }}
              >
                {msg.time}
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
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: theme.primaryMuted,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mx-1"
            style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}
          >
            <AlertCircle size={20} strokeWidth={2} style={{ color: '#DC2626', flexShrink: 0 }} />
            <p className="text-sm text-right flex-1" style={{ color: '#DC2626', fontWeight: 500 }}>
              {error}
            </p>
          </div>
        )}

        {showSuggestions && (
          <div className="space-y-2.5 mt-2">
            <p
              className="text-xs text-right pr-1"
              style={{ color: theme.primaryMuted, fontWeight: 600 }}
            >
              שאלות מהירות:
            </p>
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-right px-5 py-4 rounded-2xl text-sm transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${theme.primaryBorder}`,
                  color: theme.primary,
                  fontWeight: 600,
                  boxShadow: `0 2px 8px ${theme.primary}0A`,
                }}
              >
                {s}
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
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
            style={{
              background: input.trim() && !isTyping ? theme.gradientCard : '#F3F4F6',
              boxShadow: input.trim() && !isTyping ? `0 4px 14px ${theme.primaryShadow}` : 'none',
            }}
          >
            <Send size={20} strokeWidth={2} color={input.trim() && !isTyping ? 'white' : '#9CA3AF'} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאלי כל שאלה על הסוכרת שלך..."
            dir="rtl"
            className="flex-1 h-12 px-4 rounded-2xl text-sm outline-none transition-all"
            style={{
              backgroundColor: theme.primaryBg,
              border: `1.5px solid ${input ? theme.primary : theme.primaryBorder}`,
              color: '#1F2937',
              fontWeight: 400,
              boxShadow: input ? `0 0 0 3px ${theme.primaryShadow}22` : 'none',
            }}
          />
        </div>
        <p className="text-xs text-center mt-2.5" style={{ color: theme.primaryMuted, fontWeight: 400 }}>
          תשובות AI אינן תחליף לייעוץ רפואי מקצועי
        </p>
      </div>
    </div>
  );
}
