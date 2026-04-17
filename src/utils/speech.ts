import type { Gender } from '../context/AppContext';

const FEMALE_HINTS = ['carmit', 'yael', 'female', 'woman', 'siri'];
const MALE_HINTS = ['asaf', 'male', 'man', 'david'];
const NATURAL_HINTS = ['google', 'microsoft', 'natural', 'premium'];

function getVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [] as SpeechSynthesisVoice[];
  }

  return window.speechSynthesis.getVoices();
}

function scoreVoice(voice: SpeechSynthesisVoice, gender: Gender) {
  const haystack = `${voice.name} ${voice.voiceURI} ${voice.lang}`.toLowerCase();

  let score = 0;

  if (voice.lang.toLowerCase().startsWith('he')) score += 6;
  if (voice.lang.toLowerCase().includes('il')) score += 2;
  if (NATURAL_HINTS.some((hint) => haystack.includes(hint))) score += 3;
  if (voice.default) score += 1;

  if (gender === 'female' && FEMALE_HINTS.some((hint) => haystack.includes(hint))) score += 3;
  if (gender === 'male' && MALE_HINTS.some((hint) => haystack.includes(hint))) score += 3;

  return score;
}

export function preloadSpeechVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.getVoices();
}

export function getPreferredHebrewVoice(gender: Gender) {
  const voices = getVoices();
  if (voices.length === 0) return null;

  const ranked = [...voices].sort((a, b) => scoreVoice(b, gender) - scoreVoice(a, gender));
  return ranked[0] ?? null;
}

export function cancelHebrewSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
}

export function speakHebrewText(
  text: string,
  options: {
    gender: Gender;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getPreferredHebrewVoice(options.gender);

  utterance.lang = preferredVoice?.lang || 'he-IL';
  utterance.voice = preferredVoice || null;
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1;
  utterance.onend = () => {
    options.onEnd?.();
  };
  utterance.onerror = () => {
    options.onError?.();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}
