import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Gender = 'female' | 'male' | '';

export interface UserProfile {
  name: string;
  age: string;
  diabetesType: '1' | '2' | '';
  gender: Gender;
}

export interface LoggedMeal {
  id: string;
  name: string;
  icon: string;
  carbs: number;
  loggedAt: Date;
}

export interface Theme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBorder: string;
  primaryBg: string;
  primaryShadow: string;
  primaryMuted: string;
  gradientCard: string;
  gradientFull: string;
  headerBg: string;
  headerBorder: string;
  headerShadow: string;
}

export const FEMALE_THEME: Theme = {
  primary: '#E11D48',
  primaryDark: '#BE123C',
  primaryLight: '#9F1239',
  primaryBorder: '#FECDD3',
  primaryBg: '#FFF1F2',
  primaryShadow: 'rgba(225,29,72,0.35)',
  primaryMuted: '#FDA4AF',
  gradientCard: 'linear-gradient(135deg, #E11D48 0%, #BE123C 55%, #9F1239 100%)',
  gradientFull: 'linear-gradient(160deg, #FFF1F2 0%, #FFE4E6 60%, #FECDD3 100%)',
  headerBg: 'rgba(255,241,242,0.94)',
  headerBorder: '#FECDD3',
  headerShadow: '0 2px 16px rgba(225,29,72,0.08)',
};

export const MALE_THEME: Theme = {
  primary: '#1D4ED8',
  primaryDark: '#1E40AF',
  primaryLight: '#1E3A8A',
  primaryBorder: '#BFDBFE',
  primaryBg: '#EFF6FF',
  primaryShadow: 'rgba(29,78,216,0.35)',
  primaryMuted: '#93C5FD',
  gradientCard: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 55%, #1E3A8A 100%)',
  gradientFull: 'linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 60%, #BFDBFE 100%)',
  headerBg: 'rgba(239,246,255,0.94)',
  headerBorder: '#BFDBFE',
  headerShadow: '0 2px 16px rgba(29,78,216,0.08)',
};

interface AppState {
  completedExercises: Set<string>;
  completedMedications: Set<string>;
  userProfile: UserProfile;
  onboardingDone: boolean;
  theme: Theme;
  todayMeals: LoggedMeal[];
}

interface AppContextValue extends AppState {
  toggleExercise: (id: string) => void;
  toggleMedication: (id: string) => void;
  saveUserProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;
  logMeal: (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function setFromStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveToStorage(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('userProfile');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { name: '', age: '', diabetesType: '', gender: '' };
}

function getThemeForProfile(profile: UserProfile): Theme {
  return profile.gender === 'male' ? MALE_THEME : FEMALE_THEME;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    () => setFromStorage('completedExercises')
  );
  const [completedMedications, setCompletedMedications] = useState<Set<string>>(
    () => setFromStorage('completedMedications')
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(getProfile);
  const [theme, setTheme] = useState<Theme>(() => getThemeForProfile(getProfile()));
  const [onboardingDone, setOnboardingDone] = useState<boolean>(
    () => localStorage.getItem('onboardingDone') === 'true'
  );
  const [todayMeals, setTodayMeals] = useState<LoggedMeal[]>([]);

  useEffect(() => { saveToStorage('completedExercises', completedExercises); }, [completedExercises]);
  useEffect(() => { saveToStorage('completedMedications', completedMedications); }, [completedMedications]);

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleMedication = (id: string) => {
    setCompletedMedications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setTheme(getThemeForProfile(profile));
    localStorage.setItem('userProfile', JSON.stringify(profile));
  };

  const completeOnboarding = () => {
    setOnboardingDone(true);
    localStorage.setItem('onboardingDone', 'true');
  };

  const logMeal = (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => {
    setTodayMeals((prev) => [
      ...prev,
      { ...meal, id: Date.now().toString(), loggedAt: new Date() },
    ]);
  };

  return (
    <AppContext.Provider value={{
      completedExercises, completedMedications, userProfile, onboardingDone, theme, todayMeals,
      toggleExercise, toggleMedication, saveUserProfile, completeOnboarding, logMeal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function genderedText(gender: Gender, female: string, male: string): string {
  return gender === 'male' ? male : female;
}
