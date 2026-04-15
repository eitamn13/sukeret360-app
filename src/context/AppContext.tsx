import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Gender = 'female' | 'male' | '';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type TreatmentType = 'insulin' | 'pills' | 'combined' | 'lifestyle' | '';
export type MedicationVisual = 'blue-pill' | 'white-pill' | 'pink-pill' | 'insulin-pen';
export type SugarContext = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'exercise' | 'custom';

export function genderedText(gender: Gender, femaleText: string, maleText: string): string {
  return gender === 'male' ? maleText : femaleText;
}

export interface UserProfile {
  name: string;
  age: string;
  diabetesType: '1' | '2' | '';
  gender: Gender;
  diagnosisYear: string;
  treatmentType: TreatmentType;
  targetLow: string;
  targetHigh: string;
  wakeTime: string;
  sleepTime: string;
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
  appearanceLabel?: string;
  notifyEmergencyAfterMinutes?: number;
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
  source?: 'vision' | 'manual' | 'database';
  servingLabel?: string;
}

export interface SugarLogEntry {
  id: string;
  dateKey: string;
  loggedAt: string;
  level: number;
  context: SugarContext;
  contextLabel: string;
  note?: string;
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
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#155E75',
  primaryBorder: '#D5E8E4',
  primaryBg: '#F3FBFA',
  primaryShadow: 'rgba(15,118,110,0.18)',
  primaryMuted: '#6A8F89',
  gradientCard: 'linear-gradient(135deg, #0F766E 0%, #155E75 52%, #1E3A5F 100%)',
  gradientFull: 'linear-gradient(180deg, #F7FBFD 0%, #EEF7F7 55%, #F7FBFA 100%)',
  headerBg: 'rgba(247,251,253,0.92)',
  headerBorder: '#DCEBE8',
  headerShadow: '0 8px 24px rgba(15,23,42,0.05)',
};

export const MALE_THEME: Theme = {
  primary: '#155E75',
  primaryDark: '#164E63',
  primaryLight: '#1D4ED8',
  primaryBorder: '#D7E7EE',
  primaryBg: '#F4FAFD',
  primaryShadow: 'rgba(21,94,117,0.2)',
  primaryMuted: '#688399',
  gradientCard: 'linear-gradient(135deg, #155E75 0%, #1D4ED8 52%, #1E3A8A 100%)',
  gradientFull: 'linear-gradient(180deg, #F7FBFD 0%, #EEF5FB 55%, #F5FAFD 100%)',
  headerBg: 'rgba(247,251,253,0.92)',
  headerBorder: '#DCE8F2',
  headerShadow: '0 8px 24px rgba(15,23,42,0.05)',
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  diabetesType: '',
  gender: '',
  diagnosisYear: '',
  treatmentType: '',
  targetLow: '80',
  targetHigh: '140',
  wakeTime: '07:00',
  sleepTime: '22:00',
};

const DEFAULT_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'אני צריך/ה עזרה דחופה. זה המיקום שלי:',
};

const DEFAULT_MEDS: MedicationScheduleItem[] = [
  {
    id: 'morning-metformin',
    time: '08:00',
    period: 'בוקר',
    name: 'מטפורמין',
    dosage: '500 מ"ג',
    type: 'pill',
    notes: 'לקחת עם ארוחת הבוקר',
    image: '💊',
    appearanceLabel: 'כדור לבן',
    notifyEmergencyAfterMinutes: 45,
  },
  {
    id: 'night-insulin',
    time: '21:00',
    period: 'ערב',
    name: 'אינסולין',
    dosage: '10 יחידות',
    type: 'injection',
    notes: 'להזריק לפי ההנחיה האישית שלך',
    image: '💉',
    appearanceLabel: 'עט אינסולין',
    notifyEmergencyAfterMinutes: 45,
  },
];

interface AppState {
  userProfile: UserProfile;
  onboardingDone: boolean;
  theme: Theme;
  mealLogs: LoggedMeal[];
  todayMeals: LoggedMeal[];
  sugarLogs: SugarLogEntry[];
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
  saveMedicationSchedule: (schedule: MedicationScheduleItem[]) => void;
  markMedicationTaken: (medicationId: string) => void;
  unmarkMedicationTaken: (medicationId: string) => void;
  isMedicationTakenToday: (medicationId: string) => boolean;
  getMedicationTakenAt: (medicationId: string) => string | null;
  logMeal: (meal: Omit<LoggedMeal, 'id' | 'loggedAt'>) => void;
  clearTodayMeals: () => void;
  clearMedicationLogs: () => void;
  logSugar: (entry: Omit<SugarLogEntry, 'id' | 'dateKey' | 'loggedAt'>) => void;
  clearSugarLogs: () => void;
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
    // ignore storage failures
  }
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getPeriodFromTime(time: string): string {
  const [rawHours] = time.split(':').map(Number);

  if (!Number.isFinite(rawHours)) {
    return 'תרופה';
  }

  if (rawHours < 11) return 'בוקר';
  if (rawHours < 16) return 'צהריים';
  if (rawHours < 20) return 'אחר הצהריים';
  return 'ערב';
}

function getTodayDateForTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function getThemeForProfile(profile: UserProfile): Theme {
  return profile.gender === 'male' ? MALE_THEME : FEMALE_THEME;
}

function normalizeMealLogs(): LoggedMeal[] {
  const legacyTodayMeals = readJson<LoggedMeal[]>('todayMeals', []);
  const mealLogs = readJson<LoggedMeal[]>('meal_logs', legacyTodayMeals);

  return mealLogs
    .map((meal) => ({
      ...meal,
      icon: meal.icon || '🍽️',
      mealType: meal.mealType || 'snack',
      source: meal.source || 'manual',
    }))
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
}

function normalizeMedicationSchedule(): MedicationScheduleItem[] {
  const saved = readJson<MedicationScheduleItem[]>('medication_schedule', DEFAULT_MEDS);

  return saved.map((item) => ({
    ...item,
    period: item.period || getPeriodFromTime(item.time),
    image: item.image || (item.type === 'injection' ? '💉' : '💊'),
    appearanceLabel:
      item.appearanceLabel ||
      (item.type === 'injection' ? 'עט אינסולין' : 'כדור'),
    notifyEmergencyAfterMinutes:
      typeof item.notifyEmergencyAfterMinutes === 'number'
        ? item.notifyEmergencyAfterMinutes
        : 45,
  }));
}

function normalizeUserProfile(profile: UserProfile): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    normalizeUserProfile(readJson<UserProfile>('userProfile', DEFAULT_PROFILE))
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

  const [medicationSchedule, setMedicationSchedule] = useState<MedicationScheduleItem[]>(
    normalizeMedicationSchedule
  );

  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(() =>
    readJson<MedicationLogEntry[]>('medication_logs', [])
  );

  const [mealLogs, setMealLogs] = useState<LoggedMeal[]>(normalizeMealLogs);

  const [sugarLogs, setSugarLogs] = useState<SugarLogEntry[]>(() =>
    readJson<SugarLogEntry[]>('sugar_logs', []).sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    )
  );

  const [sentMedicationNotifications, setSentMedicationNotifications] = useState<string[]>(() => {
    const todayKey = getTodayKey();
    return readJson<string[]>('medication_notification_log', []).filter((entry) =>
      entry.startsWith(todayKey)
    );
  });

  const theme = useMemo(() => getThemeForProfile(userProfile), [userProfile]);

  const todayMeals = useMemo(() => {
    const todayKey = getTodayKey();
    return mealLogs.filter((meal) => meal.loggedAt.startsWith(todayKey));
  }, [mealLogs]);

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
    writeJson('medication_schedule', medicationSchedule);
  }, [medicationSchedule]);

  useEffect(() => {
    writeJson('medication_logs', medicationLogs);
  }, [medicationLogs]);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;

    const syncNotificationPermission = () => {
      setNotificationPermission(Notification.permission);
    };

    syncNotificationPermission();
    window.addEventListener('focus', syncNotificationPermission);
    document.addEventListener('visibilitychange', syncNotificationPermission);

    return () => {
      window.removeEventListener('focus', syncNotificationPermission);
      document.removeEventListener('visibilitychange', syncNotificationPermission);
    };
  }, []);

  useEffect(() => {
    writeJson('meal_logs', mealLogs);
    writeJson('todayMeals', todayMeals);
  }, [mealLogs, todayMeals]);

  useEffect(() => {
    writeJson('sugar_logs', sugarLogs);
  }, [sugarLogs]);

  useEffect(() => {
    const todayKey = getTodayKey();
    writeJson(
      'medication_notification_log',
      sentMedicationNotifications.filter((entry) => entry.startsWith(todayKey))
    );
  }, [sentMedicationNotifications]);

  const isMedicationTakenToday = useCallback(
    (medicationId: string) => {
      const todayKey = getTodayKey();
      return medicationLogs.some(
        (log) => log.medicationId === medicationId && log.dateKey === todayKey
      );
    },
    [medicationLogs]
  );

  const getMedicationTakenAt = useCallback(
    (medicationId: string) => {
      const todayKey = getTodayKey();
      const entry = medicationLogs.find(
        (log) => log.medicationId === medicationId && log.dateKey === todayKey
      );
      return entry?.takenAt ?? null;
    },
    [medicationLogs]
  );

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
    setUserProfile(normalizeUserProfile(profile));
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

  const saveMedicationSchedule = (schedule: MedicationScheduleItem[]) => {
    setMedicationSchedule(
      schedule
        .filter((item) => item.name.trim() && item.time.trim())
        .map((item, index) => ({
          ...item,
          id: item.id || `${Date.now()}-${index}`,
          period: item.period || getPeriodFromTime(item.time),
          image: item.image || (item.type === 'injection' ? '💉' : '💊'),
          appearanceLabel:
            item.appearanceLabel ||
            (item.type === 'injection' ? 'עט אינסולין' : 'כדור'),
          notifyEmergencyAfterMinutes:
            typeof item.notifyEmergencyAfterMinutes === 'number'
              ? item.notifyEmergencyAfterMinutes
              : 45,
        }))
    );
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
    setMealLogs((prev) => [
      {
        ...meal,
        id: Date.now().toString(),
        loggedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const clearTodayMeals = () => {
    const todayKey = getTodayKey();
    setMealLogs((prev) => prev.filter((meal) => !meal.loggedAt.startsWith(todayKey)));
  };

  const clearMedicationLogs = () => {
    setMedicationLogs([]);
  };

  const logSugar = (entry: Omit<SugarLogEntry, 'id' | 'dateKey' | 'loggedAt'>) => {
    const loggedAt = new Date().toISOString();
    const dateKey = loggedAt.split('T')[0];

    setSugarLogs((prev) => [
      {
        ...entry,
        id: `${Date.now()}`,
        loggedAt,
        dateKey,
      },
      ...prev,
    ]);
  };

  const clearSugarLogs = () => {
    setSugarLogs([]);
  };

  useEffect(() => {
    const todayKey = getTodayKey();
    setSentMedicationNotifications((prev) =>
      prev.filter((entry) => entry.startsWith(todayKey))
    );
  }, [medicationLogs]);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (notificationPermission !== 'granted') return;
    if (medicationSchedule.length === 0) return;

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
        const overdueThreshold = medication.notifyEmergencyAfterMinutes ?? 45;

        if (
          minutesLate >= overdueThreshold &&
          !sentMedicationNotifications.includes(overdueKey)
        ) {
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
      mealLogs,
      todayMeals,
      sugarLogs,
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
      saveMedicationSchedule,
      markMedicationTaken,
      unmarkMedicationTaken,
      isMedicationTakenToday,
      getMedicationTakenAt,
      logMeal,
      clearTodayMeals,
      clearMedicationLogs,
      logSugar,
      clearSugarLogs,
    }),
    [
      userProfile,
      onboardingDone,
      theme,
      mealLogs,
      todayMeals,
      sugarLogs,
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
