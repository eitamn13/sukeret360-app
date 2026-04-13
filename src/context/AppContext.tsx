import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Gender = 'female' | 'male' | '';

export function genderedText(
  gender: Gender,
  femaleText: string,
  maleText: string
) {
  return gender === 'male' ? maleText : femaleText;
}

export interface UserProfile {
  name: string;
  age: string;
  diabetesType: '1' | '2' | '';
  gender: Gender;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  message: string;
}

export interface SavedLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface MedicationScheduleItem {
  id: string;
  time: string;
  period: string;
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  notes?: string;
  image?: string;
}

export interface MedicationLogEntry {
  medicationId: string;
  dateKey: string;
  status: 'taken' | 'missed';
  recordedAt: string;
}

export interface LoggedMeal {
  id: string;
  name: string;
  icon: string;
  carbs: number;
  loggedAt: string;
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

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  diabetesType: '',
  gender: '',
};

export const DEFAULT_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
};

export const DEFAULT_MEDS: MedicationScheduleItem[] = [
  {
    id: 'morning-metformin',
    time: '08:00',
    period: 'בוקר',
    name: 'מטפורמין',
    dosage: '500 מ"ג',
    type: 'pill',
    notes: 'ליטול עם ארוחת הבוקר',
    image: '💊',
  },
  {
    id: 'noon-pill',
    time: '13:00',
    period: 'צהריים',
    name: 'גלוקובאנס',
    dosage: '2.5/500',
    type: 'pill',
    notes: '30 דקות לפני הארוחה',
    image: '💊',
  },
  {
    id: 'night-insulin',
    time: '21:00',
    period: 'ערב',
    name: 'לנטוס',
    dosage: '10 יחידות',
    type: 'injection',
    notes: 'הזרקה בבטן או בירך',
    image: '💉',
  },
];

interface AppContextType {
  userProfile: UserProfile;
  onboardingDone: boolean;
  emergencyContact: EmergencyContact;
  savedLocation: SavedLocation | null;
  locationPermissionGranted: boolean;
  medicationSchedule: MedicationScheduleItem[];
  medicationLogs: MedicationLogEntry[];
  todayMeals: LoggedMeal[];
  theme: Theme;
  notificationPermission: NotificationPermission | 'default';

  saveUserProfile: (p: UserProfile) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  saveEmergencyContact: (c: EmergencyContact) => void;
  saveLocation: (l: SavedLocation | null) => void;
  setLocationPermissionGranted: (value: boolean) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'default'>;

  markMedicationTaken: (id: string) => void;
  markMedicationMissed: (id: string) => void;
  clearMedicationStatus: (id: string) => void;
  isMedicationTakenToday: (id: string) => boolean;
  isMedicationMissedToday: (id: string) => boolean;

  logMeal: (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function getThemeForProfile(profile: UserProfile): Theme {
  return profile.gender === 'male' ? MALE_THEME : FEMALE_THEME;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(
    safeParse<UserProfile>('userProfile', DEFAULT_PROFILE)
  );

  const [onboardingDone, setOnboardingDone] = useState(
    localStorage.getItem('onboardingDone') === 'true'
  );

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    safeParse<EmergencyContact>('emergency_contact', DEFAULT_CONTACT)
  );

  const [savedLocation, setSavedLocationState] = useState<SavedLocation | null>(
    safeParse<SavedLocation | null>('saved_location', null)
  );

  const [locationPermissionGranted, setLocationPermissionGrantedState] = useState(
    localStorage.getItem('locationPermissionGranted') === 'true'
  );

  const [medicationSchedule] = useState<MedicationScheduleItem[]>(DEFAULT_MEDS);

  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(
    safeParse<MedicationLogEntry[]>('medication_logs', [])
  );

  const [todayMeals, setTodayMeals] = useState<LoggedMeal[]>(
    safeParse<LoggedMeal[]>('todayMeals', [])
  );

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>(
    () => {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') {
        return 'default';
      }
      return Notification.permission;
    }
  );

  const theme = useMemo(() => getThemeForProfile(userProfile), [userProfile]);

  useEffect(() => {
    saveJson('userProfile', userProfile);
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('onboardingDone', onboardingDone ? 'true' : 'false');
  }, [onboardingDone]);

  useEffect(() => {
    saveJson('emergency_contact', emergencyContact);
  }, [emergencyContact]);

  useEffect(() => {
    saveJson('saved_location', savedLocation);
  }, [savedLocation]);

  useEffect(() => {
    localStorage.setItem('locationPermissionGranted', locationPermissionGranted ? 'true' : 'false');
  }, [locationPermissionGranted]);

  useEffect(() => {
    saveJson('medication_logs', medicationLogs);
  }, [medicationLogs]);

  useEffect(() => {
    saveJson('todayMeals', todayMeals);
  }, [todayMeals]);

  const isMedicationTakenToday = (id: string) => {
    return medicationLogs.some(
      (item) =>
        item.medicationId === id &&
        item.dateKey === todayKey() &&
        item.status === 'taken'
    );
  };

  const isMedicationMissedToday = (id: string) => {
    return medicationLogs.some(
      (item) =>
        item.medicationId === id &&
        item.dateKey === todayKey() &&
        item.status === 'missed'
    );
  };

  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'default'> => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'default';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const saveUserProfile = (p: UserProfile) => {
    setUserProfile(p);
  };

  const completeOnboarding = () => {
    setOnboardingDone(true);
  };

  const resetOnboarding = () => {
    localStorage.clear();
    window.location.reload();
  };

  const saveEmergencyContact = (c: EmergencyContact) => {
    setEmergencyContact(c);
  };

  const saveLocation = (l: SavedLocation | null) => {
    setSavedLocationState(l);
  };

  const setLocationPermissionGranted = (value: boolean) => {
    setLocationPermissionGrantedState(value);
  };

  const upsertMedicationStatus = (id: string, status: 'taken' | 'missed') => {
    const key = todayKey();

    setMedicationLogs((prev) => {
      const withoutCurrent = prev.filter(
        (entry) => !(entry.medicationId === id && entry.dateKey === key)
      );

      return [
        ...withoutCurrent,
        {
          medicationId: id,
          dateKey: key,
          status,
          recordedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const markMedicationTaken = (id: string) => {
    upsertMedicationStatus(id, 'taken');
  };

  const markMedicationMissed = (id: string) => {
    if (isMedicationTakenToday(id)) return;
    upsertMedicationStatus(id, 'missed');
  };

  const clearMedicationStatus = (id: string) => {
    const key = todayKey();

    setMedicationLogs((prev) =>
      prev.filter(
        (entry) => !(entry.medicationId === id && entry.dateKey === key)
      )
    );
  };

  const logMeal = (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => {
    setTodayMeals((prev) => [
      ...prev,
      {
        ...meal,
        id: Date.now().toString(),
        loggedAt: new Date().toISOString(),
      },
    ]);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') return;
    setNotificationPermission(Notification.permission);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        onboardingDone,
        emergencyContact,
        savedLocation,
        locationPermissionGranted,
        medicationSchedule,
        medicationLogs,
        todayMeals,
        theme,
        notificationPermission,
        saveUserProfile,
        completeOnboarding,
        resetOnboarding,
        saveEmergencyContact,
        saveLocation,
        setLocationPermissionGranted,
        requestBrowserNotificationPermission,
        markMedicationTaken,
        markMedicationMissed,
        clearMedicationStatus,
        isMedicationTakenToday,
        isMedicationMissedToday,
        logMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
