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
  '\u05de\u05d4 \u05d4\u05e1\u05d5\u05db\u05e8 \u05d4\u05ea\u05e7\u05d9\u05df \u05dc\u05e4\u05e0\u05d9 \u05d0\u05e8\u05d5\u05d7\u05d4?',
  '\u05de\u05d4 \u05e2\u05d5\u05e9\u05d9\u05dd \u05d0\u05dd \u05d9\u05e9 \u05e8\u05e2\u05d3 \u05d0\u05d5 \u05d7\u05d5\u05dc\u05e9\u05d4?',
  '\u05de\u05ea\u05d9 \u05d4\u05db\u05d9 \u05d8\u05d5\u05d1 \u05dc\u05e7\u05d7\u05ea \u05de\u05d8\u05e4\u05d5\u05e8\u05de\u05d9\u05df?',
  '\u05d0\u05d9\u05d6\u05d5 \u05d0\u05e8\u05d5\u05d7\u05ea \u05e2\u05e8\u05d1 \u05d8\u05d5\u05d1\u05d4 \u05dc\u05e1\u05d5\u05db\u05e8\u05ea?',
];

const TEXT = {
  title: '\u05d4\u05e2\u05d5\u05d6\u05e8 \u05d4\u05e8\u05e4\u05d5\u05d0\u05d9 \u05e9\u05dc\u05d9',
  subtitle: '\u05e9\u05d9\u05d7\u05d4 \u05e7\u05d5\u05dc\u05d9\u05ea \u05e7\u05e6\u05e8\u05d4 \u05d5\u05d1\u05e8\u05d5\u05e8\u05d4',
  introTitle: '\u05d1\u05de\u05d4 \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e2\u05d6\u05d5\u05e8 \u05e2\u05db\u05e9\u05d9\u05d5?',
  introBody:
    '\u05d0\u05e4\u05e9\u05e8 \u05dc\u05dc\u05d7\u05d5\u05e5 \u05e2\u05dc \u05d4\u05de\u05d9\u05e7\u05e8\u05d5\u05e4\u05d5\u05df \u05d5\u05dc\u05d3\u05d1\u05e8 \u05d1\u05e7\u05d5\u05dc, \u05d0\u05d5 \u05dc\u05db\u05ea\u05d5\u05d1 \u05e9\u05d0\u05dc\u05d4 \u05e7\u05e6\u05e8\u05d4.',
  listenReady: '\u05d0\u05e0\u05d9 \u05de\u05d0\u05d6\u05d9\u05df. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d3\u05d1\u05e8 \u05d7\u05d5\u05e4\u05e9\u05d9.',
  listenError: '\u05dc\u05d0 \u05d4\u05e6\u05dc\u05d7\u05ea\u05d9 \u05dc\u05e7\u05dc\u05d5\u05d8 \u05d0\u05ea \u05d4\u05d4\u05e7\u05dc\u05d8\u05d4. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e0\u05e1\u05d5\u05ea \u05e9\u05d5\u05d1.',
  voiceOff: '\u05d4\u05de\u05e2\u05e0\u05d4 \u05d4\u05e7\u05d5\u05dc\u05d9 \u05db\u05d5\u05d1\u05d4.',
  voiceOn: '\u05d4\u05de\u05e2\u05e0\u05d4 \u05d4\u05e7\u05d5\u05dc\u05d9 \u05e4\u05e2\u05d9\u05dc.',
  temporaryIssue:
    '\u05d9\u05e9 \u05ea\u05e7\u05dc\u05d4 \u05d6\u05de\u05e0\u05d9\u05ea. \u05d0\u05e0\u05d9 \u05e2\u05d5\u05d1\u05e8 \u05dc\u05de\u05e2\u05e0\u05d4 \u05d2\u05d9\u05d1\u05d5\u05d9 \u05db\u05d3\u05d9 \u05e9\u05dc\u05d0 \u05ea\u05d9\u05ea\u05e7\u05e2 \u05d4\u05e9\u05d9\u05d7\u05d4.',
  inputPlaceholder: '\u05d0\u05e4\u05e9\u05e8 \u05dc\u05db\u05ea\u05d5\u05d1 \u05e9\u05d0\u05dc\u05d4 \u05e7\u05e6\u05e8\u05d4...',
  send: '\u05e9\u05dc\u05d7',
  mic: '\u05d4\u05ea\u05d7\u05dc \u05d4\u05e7\u05dc\u05d8\u05d4',
  stopMic: '\u05e2\u05e6\u05d5\u05e8 \u05d4\u05e7\u05dc\u05d8\u05d4',
  welcome:
    '\u05d0\u05e0\u05d9 \u05db\u05d0\u05df \u05db\u05d3\u05d9 \u05dc\u05e2\u05d6\u05d5\u05e8 \u05dc\u05da \u05d1\u05e0\u05d5\u05e9\u05d0\u05d9 \u05e1\u05d5\u05db\u05e8, \u05ea\u05e8\u05d5\u05e4\u05d5\u05ea, \u05d0\u05d5\u05db\u05dc \u05d5\u05d4\u05e8\u05d2\u05e9\u05d4 \u05db\u05dc\u05dc\u05d9\u05ea.',
} as const;

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  from: 'ai',
  text: TEXT.welcome,
  time: nowTime(),
};

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function isGreeting(message: string) {
  const normalized = normalizeMessage(message);
  return ['ai', '\u05d4\u05d9\u05d9', '\u05d4\u05d9', '\u05e9\u05dc\u05d5\u05dd', 'hello', 'hey'].includes(normalized);
}

function createLocalFallbackReply(message: string) {
  const normalized = normalizeMessage(message);

  if (isGreeting(message)) {
    return '\u05d0\u05e0\u05d9 \u05db\u05d0\u05df \u05db\u05d3\u05d9 \u05dc\u05e2\u05d6\u05d5\u05e8 \u05dc\u05da \u05d1\u05e9\u05d0\u05dc\u05d5\u05ea \u05e7\u05e6\u05e8\u05d5\u05ea \u05e2\u05dc \u05e1\u05d5\u05db\u05e8, \u05ea\u05e8\u05d5\u05e4\u05d5\u05ea, \u05d0\u05d5\u05db\u05dc \u05d5\u05ea\u05e1\u05de\u05d9\u05e0\u05d9\u05dd.';
  }

  if (normalized.includes('\u05dc\u05e4\u05e0\u05d9') && normalized.includes('\u05d0\u05e8\u05d5\u05d7\u05d4') && normalized.includes('\u05e1\u05d5\u05db\u05e8')) {
    return '\u05d1\u05d3\u05e8\u05da \u05db\u05dc\u05dc \u05d9\u05e2\u05d3 \u05de\u05e7\u05d5\u05d1\u05dc \u05dc\u05e4\u05e0\u05d9 \u05d0\u05e8\u05d5\u05d7\u05d4 \u05d4\u05d5\u05d0 \u05d1\u05e2\u05e8\u05da 80 \u05e2\u05d3 130 mg/dL, \u05d0\u05d1\u05dc \u05d4\u05db\u05d9 \u05d7\u05e9\u05d5\u05d1 \u05dc\u05e4\u05e2\u05d5\u05dc \u05dc\u05e4\u05d9 \u05d4\u05d9\u05e2\u05d3 \u05d4\u05d0\u05d9\u05e9\u05d9.';
  }

  if (normalized.includes('\u05e8\u05e2\u05d3') || normalized.includes('\u05d7\u05d5\u05dc\u05e9') || normalized.includes('\u05d4\u05d9\u05e4\u05d5')) {
    return '\u05d0\u05dd \u05d9\u05e9 \u05e8\u05e2\u05d3, \u05d7\u05d5\u05dc\u05e9\u05d4 \u05d0\u05d5 \u05d4\u05d6\u05e2\u05d4, \u05db\u05d3\u05d0\u05d9 \u05e7\u05d5\u05d3\u05dd \u05dc\u05d1\u05d3\u05d5\u05e7 \u05e1\u05d5\u05db\u05e8. \u05d0\u05dd \u05d4\u05d5\u05d0 \u05e0\u05de\u05d5\u05da, \u05e0\u05d4\u05d5\u05d2 \u05dc\u05e7\u05d7\u05ea \u05e4\u05d7\u05de\u05d9\u05de\u05d4 \u05de\u05d4\u05d9\u05e8\u05d4 \u05d5\u05dc\u05d1\u05d3\u05d5\u05e7 \u05e9\u05d5\u05d1 \u05d0\u05d7\u05e8\u05d9 15 \u05d3\u05e7\u05d5\u05ea.';
  }

  if (normalized.includes('\u05ea\u05e8\u05d5\u05e4') || normalized.includes('\u05de\u05d8\u05e4\u05d5\u05e8\u05de\u05d9\u05df') || normalized.includes('\u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df')) {
    return '\u05dc\u05d2\u05d1\u05d9 \u05ea\u05e8\u05d5\u05e4\u05d5\u05ea, \u05d4\u05db\u05d9 \u05d1\u05d8\u05d5\u05d7 \u05dc\u05d4\u05d9\u05e6\u05de\u05d3 \u05dc\u05d4\u05e0\u05d7\u05d9\u05d4 \u05d4\u05d0\u05d9\u05e9\u05d9\u05ea \u05e9\u05dc\u05da. \u05d0\u05dd \u05ea\u05d0\u05de\u05e8 \u05dc\u05d9 \u05d0\u05ea \u05e9\u05dd \u05d4\u05ea\u05e8\u05d5\u05e4\u05d4 \u05d0\u05d5 \u05d4\u05e9\u05e2\u05d4, \u05d0\u05e1\u05d1\u05d9\u05e8 \u05de\u05d4 \u05de\u05e7\u05d5\u05d1\u05dc \u05d1\u05d0\u05d5\u05e4\u05df \u05db\u05dc\u05dc\u05d9.';
  }

  if (normalized.includes('\u05d0\u05d5\u05db\u05dc') || normalized.includes('\u05d0\u05e8\u05d5\u05d7\u05d4') || normalized.includes('\u05e4\u05d7\u05de')) {
    return '\u05d1\u05d3\u05e8\u05da \u05db\u05dc\u05dc \u05e2\u05d3\u05d9\u05e3 \u05dc\u05d1\u05d7\u05d5\u05e8 \u05d0\u05e8\u05d5\u05d7\u05d4 \u05e2\u05dd \u05d7\u05dc\u05d1\u05d5\u05df, \u05d9\u05e8\u05e7\u05d5\u05ea \u05d5\u05e4\u05d7\u05de\u05d9\u05de\u05d4 \u05de\u05d3\u05d5\u05d3\u05d4. \u05dc\u05de\u05e9\u05dc \u05d9\u05d5\u05d2\u05d5\u05e8\u05d8 \u05e2\u05dd \u05d0\u05d2\u05d5\u05d6\u05d9\u05dd \u05d0\u05d5 \u05e1\u05dc\u05d8 \u05e2\u05dd \u05ea\u05d5\u05e1\u05e4\u05ea \u05d7\u05dc\u05d1\u05d5\u05df.';
  }

  return '\u05d9\u05e9 \u05db\u05e8\u05d2\u05e2 \u05ea\u05e7\u05dc\u05d4 \u05d6\u05de\u05e0\u05d9\u05ea \u05d1\u05d7\u05d9\u05d1\u05d5\u05e8 \u05d4\u05de\u05dc\u05d0, \u05d0\u05d1\u05dc \u05d0\u05e0\u05d9 \u05e2\u05d3\u05d9\u05d9\u05df \u05db\u05d0\u05df. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05d4\u05de\u05e9\u05d9\u05da \u05d1\u05e7\u05d5\u05dc \u05d0\u05d5 \u05dc\u05db\u05ea\u05d5\u05d1 \u05e9\u05d0\u05dc\u05d4 \u05e7\u05e6\u05e8\u05d4.';
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
    if (!autoSpeak) stopSpeaking();
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

      const userMessage: Message = {
        id: Date.now().toString(),
        from: 'user',
        text: messageText,
        time: nowTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setNotice(null);

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
        setNotice(TEXT.temporaryIssue);
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
    setNotice(TEXT.listenReady);

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
      setNotice(TEXT.listenError);
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
      setNotice(TEXT.voiceOff);
      return;
    }

    autoSpeakRef.current = true;
    setAutoSpeak(true);
    setNotice(TEXT.voiceOn);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title={TEXT.title}
        subtitle={TEXT.subtitle}
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
            aria-label={'\u05d4\u05e7\u05e8\u05d0\u05d4 \u05e7\u05d5\u05dc\u05d9\u05ea'}
          >
            {autoSpeak ? <Volume2 size={18} strokeWidth={1.8} /> : <VolumeX size={18} strokeWidth={1.8} />}
          </button>
        }
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div
          className="rounded-3xl p-4 text-right"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div className="text-right">
            <div
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: theme.primaryBg, color: theme.primaryDark }}
            >
              <Sparkles size={18} strokeWidth={1.8} />
            </div>

            <div>
              <p style={{ color: '#0F172A', fontWeight: 900 }}>{TEXT.introTitle}</p>
              <p className="mt-1 text-sm leading-6" style={{ color: '#64748B', fontWeight: 700 }}>
                {TEXT.introBody}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {speechRecognitionSupported ? (
              <button
                onClick={startListening}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] transition-all active:scale-[0.98]"
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)'
                    : theme.gradientCard,
                  color: '#FFFFFF',
                  boxShadow: isListening
                    ? '0 14px 28px rgba(239, 68, 68, 0.22)'
                    : `0 14px 28px ${theme.primaryShadow}`,
                  fontWeight: 900,
                }}
              >
                <Mic size={20} strokeWidth={1.9} />
                <span>{isListening ? TEXT.stopMic : TEXT.mic}</span>
              </button>
            ) : null}

            <div className="flex flex-wrap justify-start gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void sendMessage(suggestion)}
                  className="rounded-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${theme.primaryBorder}`,
                    color: theme.primaryDark,
                    fontWeight: 800,
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className="flex items-start gap-2 rounded-2xl p-4 text-right"
            style={{
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              color: '#9A3412',
            }}
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-7 font-bold">{notice}</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className="max-w-[85%] rounded-[24px] px-4 py-3"
                style={{
                  background:
                    message.from === 'ai'
                      ? '#FFFFFF'
                      : 'linear-gradient(135deg, #8EADE4 0%, #6C8FD1 100%)',
                  color: message.from === 'ai' ? '#334155' : '#FFFFFF',
                  border:
                    message.from === 'ai' ? `1px solid ${theme.primaryBorder}` : '1px solid transparent',
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        message.from === 'ai' ? theme.primaryBg : 'rgba(255,255,255,0.2)',
                      color: message.from === 'ai' ? theme.primaryDark : '#FFFFFF',
                    }}
                  >
                    {message.from === 'ai' ? <Sparkles size={14} /> : <User size={14} />}
                  </div>
                  <span
                    className="text-[11px]"
                    style={{
                      color: message.from === 'ai' ? '#94A3B8' : 'rgba(255,255,255,0.78)',
                      fontWeight: 800,
                    }}
                  >
                    {message.time}
                  </span>
                </div>
                <p className="text-right text-sm leading-7 font-bold">{message.text}</p>
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
                <p className="text-sm font-bold text-[#64748B]">
                  {'\u05e2\u05d5\u05d3 \u05e8\u05d2\u05e2, \u05d0\u05e0\u05d9 \u05e2\u05d5\u05e0\u05d4...'}
                </p>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="border-t px-4 pb-4 pt-3"
        style={{
          borderColor: theme.primaryBorder,
          background: 'rgba(255,255,255,0.94)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isTyping}
            className="flex h-12 w-12 items-center justify-center rounded-2xl disabled:opacity-50"
            style={{
              background: theme.gradientCard,
              color: '#FFFFFF',
              boxShadow: `0 10px 24px ${theme.primaryShadow}`,
            }}
            aria-label={TEXT.send}
          >
            <Send size={18} strokeWidth={2} />
          </button>

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={TEXT.inputPlaceholder}
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
    </div>
  );
}
