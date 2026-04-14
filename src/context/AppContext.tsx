import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Gender = 'female' | 'male' | '';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function genderedText(
  gender: Gender,
  femaleText: string,
  maleText: string
): string {
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
  takenAt: string;
}

export interface LoggedMeal {
  id: string;
  name: string;
  icon: string;
  carbs: number;
  mealType: MealType;
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

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  diabetesType: '',
  gender: '',
};

const DEFAULT_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
};

const DEFAULT_MEDS: MedicationScheduleItem[] = [
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
    name: 'כדור לפני ארוחה',
    dosage: 'גלוקובאנס 2.5/500',
    type: 'pill',
    notes: '30 דקות לפני הארוחה',
    image: '💊',
  },
  {
    id: 'night-insulin',
    time: '21:00',
    period: 'ערב',
    name: 'הזרקת אינסולין',
    dosage: '10 יחידות לנטוס',
    type: 'injection',
    notes: 'הזרקה בבטן או בירך',
    image: '💉',
  },
];

interface AppState {
  userProfile: UserProfile;
  onboardingDone: boolean;
  theme: Theme;
  todayMeals: LoggedMeal[];
  emergencyContact: EmergencyContact;
  savedLocation: SavedLocation | null;
  locationPermissionGranted: boolean;
  notificationPermission: NotificationPermission | 'default';
  medicationSchedule: MedicationScheduleItem[];
  medicationLogs: MedicationLogEntry[];
}

interface AppContextValue extends AppState {
  saveUserProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  saveEmergencyContact: (contact: EmergencyContact) => void;
  saveLocation: (location: SavedLocation | null) => void;
  setLocationPermissionGranted: (granted: boolean) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'default'>;
  markMedicationTaken: (medicationId: string) => void;
  unmarkMedicationTaken: (medicationId: string) => void;
  isMedicationTakenToday: (medicationId: string) => boolean;
  getMedicationTakenAt: (medicationId: string) => string | null;
  logMeal: (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => void;
  clearTodayMeals: () => void;
  clearMedicationLogs: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayDateForTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getThemeForProfile(profile: UserProfile): Theme {
  return profile.gender === 'male' ? MALE_THEME : FEMALE_THEME;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    readJson<UserProfile>('userProfile', DEFAULT_PROFILE)
  );

  const [onboardingDone, setOnboardingDone] = useState<boolean>(
    () => localStorage.getItem('onboardingDone') === 'true'
  );

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() =>
    readJson<EmergencyContact>('emergency_contact', DEFAULT_CONTACT)
  );

  const [savedLocation, setSavedLocationState] = useState<SavedLocation | null>(() =>
    readJson<SavedLocation | null>('saved_location', null)
  );

  const [locationPermissionGranted, setLocationPermissionGrantedState] = useState<boolean>(
    () => localStorage.getItem('locationPermissionGranted') === 'true'
  );

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>(
    () => {
      if (typeof Notification === 'undefined') return 'default';
      return Notification.permission;
    }
  );

  const [medicationSchedule] = useState<MedicationScheduleItem[]>(DEFAULT_MEDS);

  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(() =>
    readJson<MedicationLogEntry[]>('medication_logs', [])
  );

  const [sentMedicationNotifications, setSentMedicationNotifications] = useState<string[]>(() => {
    const todayKey = getTodayKey();
    return readJson<string[]>('medication_notification_log', []).filter((entry) =>
      entry.startsWith(todayKey)
    );
  });

  const [todayMeals, setTodayMeals] = useState<LoggedMeal[]>(() =>
    readJson<LoggedMeal[]>('todayMeals', []).map((meal) => ({
      ...meal,
      icon: meal.icon || '🍽️',
      mealType: meal.mealType || 'snack',
    }))
  );

  const theme = useMemo(() => getThemeForProfile(userProfile), [userProfile]);

  useEffect(() => {
    writeJson('userProfile', userProfile);
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('onboardingDone', onboardingDone ? 'true' : 'false');
  }, [onboardingDone]);

  useEffect(() => {
    writeJson('emergency_contact', emergencyContact);
  }, [emergencyContact]);

  useEffect(() => {
    writeJson('saved_location', savedLocation);
  }, [savedLocation]);

  useEffect(() => {
    localStorage.setItem(
      'locationPermissionGranted',
      locationPermissionGranted ? 'true' : 'false'
    );
  }, [locationPermissionGranted]);

  useEffect(() => {
    writeJson('medication_logs', medicationLogs);
  }, [medicationLogs]);

  useEffect(() => {
    const todayKey = getTodayKey();
    writeJson(
      'medication_notification_log',
      sentMedicationNotifications.filter((entry) => entry.startsWith(todayKey))
    );
  }, [sentMedicationNotifications]);

  useEffect(() => {
    writeJson('todayMeals', todayMeals);
  }, [todayMeals]);

  const isMedicationTakenToday = useCallback((medicationId: string) => {
    const todayKey = getTodayKey();
    return medicationLogs.some(
      (log) => log.medicationId === medicationId && log.dateKey === todayKey
    );
  }, [medicationLogs]);

  const getMedicationTakenAt = useCallback((medicationId: string) => {
    const todayKey = getTodayKey();
    const entry = medicationLogs.find(
      (log) => log.medicationId === medicationId && log.dateKey === todayKey
    );
    return entry?.takenAt ?? null;
  }, [medicationLogs]);

  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'default'> => {
    if (typeof Notification === 'undefined') return 'default';

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch {
      return 'default';
    }
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const completeOnboarding = () => {
    setOnboardingDone(true);
  };

  const resetOnboarding = () => {
    localStorage.clear();
    window.location.reload();
  };

  const saveEmergencyContact = (contact: EmergencyContact) => {
    setEmergencyContact(contact);
  };

  const saveLocation = (location: SavedLocation | null) => {
    setSavedLocationState(location);
  };

  const setLocationPermissionGranted = (granted: boolean) => {
    setLocationPermissionGrantedState(granted);
  };

  const markMedicationTaken = (medicationId: string) => {
    const todayKey = getTodayKey();

    setMedicationLogs((prev) => {
      const withoutOld = prev.filter(
        (log) => !(log.medicationId === medicationId && log.dateKey === todayKey)
      );

      return [
        ...withoutOld,
        {
          medicationId,
          dateKey: todayKey,
          takenAt: new Date().toISOString(),
        },
      ];
    });
  };

  const unmarkMedicationTaken = (medicationId: string) => {
    const todayKey = getTodayKey();

    setMedicationLogs((prev) =>
      prev.filter(
        (log) => !(log.medicationId === medicationId && log.dateKey === todayKey)
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

  const clearTodayMeals = () => {
    setTodayMeals([]);
  };

  const clearMedicationLogs = () => {
    setMedicationLogs([]);
  };

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      void requestBrowserNotificationPermission();
    }
  }, []);

  useEffect(() => {
    const todayKey = getTodayKey();
    setSentMedicationNotifications((prev) =>
      prev.filter((entry) => entry.startsWith(todayKey))
    );
  }, [medicationLogs]);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (notificationPermission !== 'granted') return;

    const checkMedicationReminders = () => {
      const todayKey = getTodayKey();
      const now = new Date();
      const takenMedicationIds = new Set(
        medicationLogs
          .filter((log) => log.dateKey === todayKey)
          .map((log) => log.medicationId)
      );

      const nextNotificationKeys: string[] = [];

      for (const medication of medicationSchedule) {
        if (takenMedicationIds.has(medication.id)) {
          continue;
        }

        const scheduledAt = getTodayDateForTime(medication.time);
        const minutesLate = Math.floor((now.getTime() - scheduledAt.getTime()) / 60000);

        if (minutesLate < 0) {
          continue;
        }

        const dueKey = `${todayKey}:${medication.id}:due`;
        const overdueKey = `${todayKey}:${medication.id}:overdue`;

        if (minutesLate >= 30 && !sentMedicationNotifications.includes(overdueKey)) {
          new Notification('תזכורת דחופה לתרופה', {
            body: emergencyContact.name
              ? `${medication.name} עדיין לא סומנה. אפשר לעדכן גם את ${emergencyContact.name}.`
              : `${medication.name} עדיין לא סומנה במסך התרופות.`,
            tag: overdueKey,
          });
          nextNotificationKeys.push(overdueKey);
          continue;
        }

        if (!sentMedicationNotifications.includes(dueKey)) {
          new Notification('זמן לקחת תרופה', {
            body: `${medication.name} • ${medication.dosage} בשעה ${medication.time}`,
            tag: dueKey,
          });
          nextNotificationKeys.push(dueKey);
        }
      }

      if (nextNotificationKeys.length > 0) {
        setSentMedicationNotifications((prev) =>
          Array.from(new Set([...prev, ...nextNotificationKeys]))
        );
      }
    };

    checkMedicationReminders();
    const intervalId = window.setInterval(checkMedicationReminders, 60_000);

    return () => window.clearInterval(intervalId);
  }, [
    emergencyContact.name,
    medicationLogs,
    medicationSchedule,
    notificationPermission,
    sentMedicationNotifications,
  ]);

  const value = useMemo<AppContextValue>(
    () => ({
      userProfile,
      onboardingDone,
      theme,
      todayMeals,
      emergencyContact,
      savedLocation,
      locationPermissionGranted,
      notificationPermission,
      medicationSchedule,
      medicationLogs,
      saveUserProfile,
      completeOnboarding,
      resetOnboarding,
      saveEmergencyContact,
      saveLocation,
      setLocationPermissionGranted,
      requestBrowserNotificationPermission,
      markMedicationTaken,
      unmarkMedicationTaken,
      isMedicationTakenToday,
      getMedicationTakenAt,
      logMeal,
      clearTodayMeals,
      clearMedicationLogs,
    }),
    [
      userProfile,
      onboardingDone,
      theme,
      todayMeals,
      emergencyContact,
      savedLocation,
      locationPermissionGranted,
      notificationPermission,
      medicationSchedule,
      medicationLogs,
      isMedicationTakenToday,
      getMedicationTakenAt,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
