import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import {
  clearAppLocalState,
  fetchRemoteAppSnapshot,
  isSupabaseConfigured,
  RemoteAppSnapshot,
  saveRemoteAppSnapshot,
} from '../lib/supabase';

export type Gender = 'female' | 'male' | '';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type TreatmentType = 'insulin' | 'pills' | 'combined' | 'lifestyle' | '';
export type DiabetesType = '1' | '2' | 'prediabetes' | 'monitoring' | '';
export type MedicationVisual = 'blue-pill' | 'white-pill' | 'pink-pill' | 'insulin-pen';
export type SugarContext = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'exercise' | 'custom';

export function genderedText(gender: Gender, femaleText: string, maleText: string): string {
  return gender === 'male' ? maleText : femaleText;
}

export function getDiabetesTypeLabel(diabetesType: DiabetesType): string {
  switch (diabetesType) {
    case '1':
      return 'סוכרת סוג 1';
    case '2':
      return 'סוכרת סוג 2';
    case 'prediabetes':
      return 'טרום סוכרת';
    case 'monitoring':
      return 'עדיין בבדיקה';
    default:
      return 'עדיין לא הוגדר';
  }
}

export function isLifestyleFocusedProfile(
  diabetesType: DiabetesType,
  treatmentType: TreatmentType
) {
  return diabetesType === 'prediabetes' || diabetesType === 'monitoring' || treatmentType === 'lifestyle';
}

export interface UserProfile {
  name: string;
  age: string;
  diabetesType: DiabetesType;
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
  calories?: number;
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

const APP_THEME: Theme = {
  primary: '#2563EB',
  primaryDark: '#1E3A8A',
  primaryLight: '#DBEAFE',
  primaryBorder: '#D7E3F4',
  primaryBg: '#EFF6FF',
  primaryShadow: 'rgba(37, 99, 235, 0.16)',
  primaryMuted: '#64748B',
  gradientCard: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)',
  gradientFull: 'linear-gradient(180deg, #F8FBFF 0%, #F2F7FD 100%)',
  headerBg: 'rgba(248, 251, 255, 0.98)',
  headerBorder: '#DCE6F2',
  headerShadow: '0 10px 24px rgba(30, 58, 138, 0.06)',
};

export const FEMALE_THEME: Theme = APP_THEME;
export const MALE_THEME: Theme = APP_THEME;

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
    image: 'white-pill',
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
    image: 'insulin-pen',
    appearanceLabel: 'עט אינסולין',
    notifyEmergencyAfterMinutes: 45,
  },
];

interface AppState {
  remoteReady: boolean;
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
const APP_STORAGE_PREFIX = 'sukeret360';
const STORAGE_KEYS = [
  'userProfile',
  'onboardingDone',
  'emergency_contact',
  'saved_location',
  'locationPermissionGranted',
  'medication_schedule',
  'medication_logs',
  'meal_logs',
  'todayMeals',
  'sugar_logs',
  'medication_notification_log',
  'sugar_emergency_alert_log',
] as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildScopedStorageKey(scope: string, key: string) {
  return `${APP_STORAGE_PREFIX}:${scope}:${key}`;
}

function readScopedJson<T>(scope: string, key: string, fallback: T): T {
  try {
    const scopedKey = buildScopedStorageKey(scope, key);
    const scopedRaw = localStorage.getItem(scopedKey);
    if (scopedRaw) {
      return JSON.parse(scopedRaw) as T;
    }

    return readJson<T>(key, fallback);
  } catch {
    return fallback;
  }
}

function writeScopedJson(scope: string, key: string, value: unknown) {
  try {
    localStorage.setItem(buildScopedStorageKey(scope, key), JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

function readScopedBoolean(scope: string, key: string, fallback = false) {
  try {
    const scopedValue = localStorage.getItem(buildScopedStorageKey(scope, key));
    if (scopedValue !== null) {
      return scopedValue === 'true';
    }

    const legacyValue = localStorage.getItem(key);
    if (legacyValue !== null) {
      return legacyValue === 'true';
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function writeScopedBoolean(scope: string, key: string, value: boolean) {
  try {
    localStorage.setItem(buildScopedStorageKey(scope, key), value ? 'true' : 'false');
  } catch {
    // ignore storage failures
  }
}

function clearScopedAppState(scope: string) {
  if (typeof window === 'undefined') return;

  for (const key of STORAGE_KEYS) {
    window.localStorage.removeItem(buildScopedStorageKey(scope, key));
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

function buildMedicationAlertMessage(
  patientName: string,
  gender: Gender,
  medication: MedicationScheduleItem
) {
  const displayName = patientName.trim() || genderedText(gender, 'המטופלת', 'המטופל');
  const appearance = medication.appearanceLabel ? ` (${medication.appearanceLabel})` : '';
  const markedWord = genderedText(gender, 'סימנה', 'סימן');

  return `${displayName} עדיין לא ${markedWord} שלקח/ה את ${medication.name}${appearance} של ${medication.period}, שנקבעה לשעה ${medication.time}.`;
}

function buildLocationSuffix(savedLocation: SavedLocation | null) {
  if (!savedLocation) return '';
  return ` מיקום אחרון: https://maps.google.com/?q=${savedLocation.lat},${savedLocation.lng}`;
}

function buildCriticalSugarAlertMessage(
  patientName: string,
  gender: Gender,
  entry: SugarLogEntry,
  savedLocation: SavedLocation | null
) {
  const displayName = patientName.trim() || genderedText(gender, 'המטופלת', 'המטופל');
  const severity = entry.level < 55 ? 'נמוכה מאוד' : 'גבוהה מאוד';
  return `${displayName} מדד/ה סוכר ${severity}: ${entry.level} mg/dL (${entry.contextLabel}). כדאי לבדוק מיד וליצור קשר.${buildLocationSuffix(savedLocation)}`;
}

function getThemeForProfile(): Theme {
  return APP_THEME;
}

function normalizeMedicationScheduleFrom(schedule: MedicationScheduleItem[] = []): MedicationScheduleItem[] {
  const base = schedule.length > 0 ? schedule : DEFAULT_MEDS;

  return base.map((item) => ({
    ...item,
    period: item.period || getPeriodFromTime(item.time),
    image: item.image || (item.type === 'injection' ? 'insulin-pen' : 'white-pill'),
    appearanceLabel:
      item.appearanceLabel ||
      (item.type === 'injection' ? 'עט אינסולין' : 'כדור'),
    notifyEmergencyAfterMinutes:
      typeof item.notifyEmergencyAfterMinutes === 'number'
        ? item.notifyEmergencyAfterMinutes
        : 45,
  }));
}

function normalizeMealLogsFrom(meals: LoggedMeal[] = []): LoggedMeal[] {
  return meals
    .map((meal) => ({
      ...meal,
      icon: meal.icon || 'meal',
      mealType: meal.mealType || 'snack',
      source: meal.source || 'manual',
      calories: typeof meal.calories === 'number' ? meal.calories : undefined,
    }))
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
}

function normalizeSugarLogsFrom(logs: SugarLogEntry[] = []): SugarLogEntry[] {
  return [...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
}

function normalizeRemoteSnapshot(snapshot: RemoteAppSnapshot): RemoteAppSnapshot {
  return {
    onboardingDone: Boolean(snapshot.onboardingDone),
    userProfile: normalizeUserProfile(snapshot.userProfile),
    emergencyContact: {
      ...DEFAULT_CONTACT,
      ...(snapshot.emergencyContact ?? DEFAULT_CONTACT),
    },
    savedLocation: snapshot.savedLocation ?? null,
    locationPermissionGranted: Boolean(snapshot.locationPermissionGranted),
    medicationSchedule: normalizeMedicationScheduleFrom(snapshot.medicationSchedule),
    medicationLogs: Array.isArray(snapshot.medicationLogs) ? snapshot.medicationLogs : [],
    mealLogs: normalizeMealLogsFrom(snapshot.mealLogs),
    sugarLogs: normalizeSugarLogsFrom(snapshot.sugarLogs),
  };
}

function normalizeMealLogs(scope: string): LoggedMeal[] {
  const legacyTodayMeals = readScopedJson<LoggedMeal[]>(scope, 'todayMeals', []);
  const mealLogs = readScopedJson<LoggedMeal[]>(scope, 'meal_logs', legacyTodayMeals);

  return normalizeMealLogsFrom(mealLogs);
}

function normalizeMedicationSchedule(scope: string): MedicationScheduleItem[] {
  const saved = readScopedJson<MedicationScheduleItem[]>(scope, 'medication_schedule', DEFAULT_MEDS);

  return normalizeMedicationScheduleFrom(saved);
}

function normalizeUserProfile(profile: UserProfile): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
  };
}

export function AppProvider({
  children,
  storageScope = 'guest',
}: {
  children: ReactNode;
  storageScope?: string;
}) {
  const { authEnabled, user } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    normalizeUserProfile(readScopedJson<UserProfile>(storageScope, 'userProfile', DEFAULT_PROFILE))
  );

  const [onboardingDone, setOnboardingDone] = useState<boolean>(
    () => readScopedBoolean(storageScope, 'onboardingDone')
  );

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() =>
    readScopedJson<EmergencyContact>(storageScope, 'emergency_contact', DEFAULT_CONTACT)
  );

  const [savedLocation, setSavedLocationState] = useState<SavedLocation | null>(() =>
    readScopedJson<SavedLocation | null>(storageScope, 'saved_location', null)
  );

  const [locationPermissionGranted, setLocationPermissionGrantedState] = useState<boolean>(
    () => readScopedBoolean(storageScope, 'locationPermissionGranted')
  );

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>(
    () => {
      if (typeof Notification === 'undefined') return 'default';
      return Notification.permission;
    }
  );

  const [medicationSchedule, setMedicationSchedule] = useState<MedicationScheduleItem[]>(
    () => normalizeMedicationSchedule(storageScope)
  );

  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(() =>
    readScopedJson<MedicationLogEntry[]>(storageScope, 'medication_logs', [])
  );

  const [mealLogs, setMealLogs] = useState<LoggedMeal[]>(() => normalizeMealLogs(storageScope));

  const [sugarLogs, setSugarLogs] = useState<SugarLogEntry[]>(() =>
    normalizeSugarLogsFrom(readScopedJson<SugarLogEntry[]>(storageScope, 'sugar_logs', []))
  );
  const [remoteReady, setRemoteReady] = useState<boolean>(() => !(authEnabled && isSupabaseConfigured && user));

  const [sentMedicationNotifications, setSentMedicationNotifications] = useState<string[]>(() => {
    const todayKey = getTodayKey();
    return readScopedJson<string[]>(storageScope, 'medication_notification_log', []).filter((entry) =>
      entry.startsWith(todayKey)
    );
  });
  const [sentSugarEmergencyAlerts, setSentSugarEmergencyAlerts] = useState<string[]>(() =>
    readScopedJson<string[]>(storageScope, 'sugar_emergency_alert_log', [])
  );
  const emergencyAlertInFlight = useRef<Set<string>>(new Set());
  const remoteHydrating = useRef(false);
  const lastRemoteSnapshot = useRef('');

  const theme = useMemo(() => getThemeForProfile(), []);
  const userId = user?.id ?? null;

  const todayMeals = useMemo(() => {
    const todayKey = getTodayKey();
    return mealLogs.filter((meal) => meal.loggedAt.startsWith(todayKey));
  }, [mealLogs]);

  const remoteSnapshot = useMemo<RemoteAppSnapshot>(
    () => ({
      onboardingDone,
      userProfile,
      emergencyContact,
      savedLocation,
      locationPermissionGranted,
      medicationSchedule,
      medicationLogs,
      mealLogs,
      sugarLogs,
    }),
    [
      onboardingDone,
      userProfile,
      emergencyContact,
      savedLocation,
      locationPermissionGranted,
      medicationSchedule,
      medicationLogs,
      mealLogs,
      sugarLogs,
    ]
  );
  const serializedRemoteSnapshot = useMemo(() => JSON.stringify(remoteSnapshot), [remoteSnapshot]);

  useEffect(() => {
    writeScopedJson(storageScope, 'userProfile', userProfile);
  }, [storageScope, userProfile]);

  useEffect(() => {
    writeScopedBoolean(storageScope, 'onboardingDone', onboardingDone);
  }, [onboardingDone, storageScope]);

  useEffect(() => {
    writeScopedJson(storageScope, 'emergency_contact', emergencyContact);
  }, [emergencyContact, storageScope]);

  useEffect(() => {
    writeScopedJson(storageScope, 'saved_location', savedLocation);
  }, [savedLocation, storageScope]);

  useEffect(() => {
    writeScopedBoolean(storageScope, 'locationPermissionGranted', locationPermissionGranted);
  }, [locationPermissionGranted, storageScope]);

  useEffect(() => {
    writeScopedJson(storageScope, 'medication_schedule', medicationSchedule);
  }, [medicationSchedule, storageScope]);

  useEffect(() => {
    writeScopedJson(storageScope, 'medication_logs', medicationLogs);
  }, [medicationLogs, storageScope]);

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
    writeScopedJson(storageScope, 'meal_logs', mealLogs);
    writeScopedJson(storageScope, 'todayMeals', todayMeals);
  }, [mealLogs, storageScope, todayMeals]);

  useEffect(() => {
    writeScopedJson(storageScope, 'sugar_logs', sugarLogs);
  }, [storageScope, sugarLogs]);

  useEffect(() => {
    let active = true;

    if (!(authEnabled && isSupabaseConfigured && userId)) {
      setRemoteReady(true);
      lastRemoteSnapshot.current = serializedRemoteSnapshot;
      return () => {
        active = false;
      };
    }

    setRemoteReady(false);

    void fetchRemoteAppSnapshot(userId).then((snapshot) => {
      if (!active) return;

      remoteHydrating.current = true;

      if (snapshot) {
        const normalized = normalizeRemoteSnapshot(snapshot);

        setUserProfile(normalized.userProfile);
        setOnboardingDone(normalized.onboardingDone);
        setEmergencyContact(normalized.emergencyContact);
        setSavedLocationState(normalized.savedLocation);
        setLocationPermissionGrantedState(normalized.locationPermissionGranted);
        setMedicationSchedule(normalized.medicationSchedule);
        setMedicationLogs(normalized.medicationLogs);
        setMealLogs(normalized.mealLogs);
        setSugarLogs(normalized.sugarLogs);
        lastRemoteSnapshot.current = JSON.stringify(normalized);
      } else {
        lastRemoteSnapshot.current = serializedRemoteSnapshot;
      }

      remoteHydrating.current = false;
      setRemoteReady(true);
    });

    return () => {
      active = false;
    };
  }, [authEnabled, serializedRemoteSnapshot, userId]);

  useEffect(() => {
    if (!(authEnabled && isSupabaseConfigured && userId) || !remoteReady || remoteHydrating.current) {
      return;
    }

    const serialized = serializedRemoteSnapshot;

    if (serialized === lastRemoteSnapshot.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveRemoteAppSnapshot(userId, remoteSnapshot).then(() => {
        lastRemoteSnapshot.current = serialized;
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [authEnabled, userId, remoteReady, remoteSnapshot, serializedRemoteSnapshot]);

  useEffect(() => {
    const todayKey = getTodayKey();
    writeScopedJson(
      storageScope,
      'medication_notification_log',
      sentMedicationNotifications.filter((entry) => entry.startsWith(todayKey))
    );
  }, [sentMedicationNotifications, storageScope]);

  useEffect(() => {
    writeScopedJson(storageScope, 'sugar_emergency_alert_log', sentSugarEmergencyAlerts);
  }, [sentSugarEmergencyAlerts, storageScope]);

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

  const resetOnboarding = useCallback(() => {
    clearScopedAppState(storageScope);
    if (storageScope === 'guest') {
      clearAppLocalState();
    }
    window.location.reload();
  }, [storageScope]);

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
          image: item.image || (item.type === 'injection' ? 'insulin-pen' : 'white-pill'),
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
    if (medicationSchedule.length === 0) return;

    const canSendBrowserNotifications =
      typeof Notification !== 'undefined' && notificationPermission === 'granted';

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
        const emergencyKey = `${todayKey}:${medication.id}:emergency`;
        const emergencyUnavailableKey = `${todayKey}:${medication.id}:emergency-unavailable`;
        const overdueThreshold = medication.notifyEmergencyAfterMinutes ?? 45;

        if (
          canSendBrowserNotifications &&
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
        }

        if (canSendBrowserNotifications && !sentMedicationNotifications.includes(dueKey)) {
          new Notification('זמן לקחת תרופה', {
            body: `${medication.name} • ${medication.dosage} בשעה ${medication.time}`,
            tag: dueKey,
          });
          nextNotificationKeys.push(dueKey);
        }

        if (
          minutesLate >= overdueThreshold &&
          emergencyContact.phone.trim() &&
          !sentMedicationNotifications.includes(emergencyKey) &&
          !sentMedicationNotifications.includes(emergencyUnavailableKey) &&
          !emergencyAlertInFlight.current.has(emergencyKey)
        ) {
          emergencyAlertInFlight.current.add(emergencyKey);

          void fetch('/api/medication-alert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientName: userProfile.name,
              patientGender: userProfile.gender,
              contactName: emergencyContact.name,
              contactPhone: emergencyContact.phone,
              medicationName: medication.name,
              medicationAppearance: medication.appearanceLabel,
              medicationPeriod: medication.period,
              medicationTime: medication.time,
              message: buildMedicationAlertMessage(userProfile.name, userProfile.gender, medication),
            }),
          })
            .then(async (response) => {
              const payload = (await response.json().catch(() => null)) as
                | { delivered?: boolean; reason?: string }
                | null;

              if (!response.ok) {
                throw new Error(payload?.reason || 'Failed to send emergency alert');
              }

              if (payload?.delivered) {
                setSentMedicationNotifications((prev) =>
                  Array.from(new Set([...prev, emergencyKey]))
                );

                if (typeof Notification !== 'undefined' && notificationPermission === 'granted') {
                  new Notification('עודכן איש קשר לחירום', {
                    body: emergencyContact.name
                      ? `נשלחה הודעה אוטומטית אל ${emergencyContact.name}.`
                      : 'נשלחה הודעה אוטומטית לאיש הקשר לחירום.',
                    tag: emergencyKey,
                  });
                }

                return;
              }

              if (payload?.reason === 'missing_webhook') {
                setSentMedicationNotifications((prev) =>
                  Array.from(new Set([...prev, emergencyUnavailableKey]))
                );
              }
            })
            .catch((error) => {
              console.error('Automatic medication alert failed:', error);
            })
            .finally(() => {
              emergencyAlertInFlight.current.delete(emergencyKey);
            });
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
    emergencyContact.phone,
    medicationLogs,
    medicationSchedule,
    notificationPermission,
    sentMedicationNotifications,
    userProfile.gender,
    userProfile.name,
  ]);

  useEffect(() => {
    const latestSugar = sugarLogs[0];

    if (!latestSugar || latestSugar.dateKey !== getTodayKey() || !emergencyContact.phone.trim()) {
      return;
    }

    const isCriticalSugar = latestSugar.level < 55 || latestSugar.level > 320;
    if (!isCriticalSugar) return;

    const alertKey = `sugar:${latestSugar.id}`;
    if (sentSugarEmergencyAlerts.includes(alertKey) || emergencyAlertInFlight.current.has(alertKey)) {
      return;
    }

    emergencyAlertInFlight.current.add(alertKey);

    void fetch('/api/medication-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientName: userProfile.name,
        patientGender: userProfile.gender,
        contactName: emergencyContact.name,
        contactPhone: emergencyContact.phone,
        medicationName: 'קריאת סוכר חריגה',
        medicationAppearance: latestSugar.level < 55 ? 'סוכר נמוך מאוד' : 'סוכר גבוה מאוד',
        medicationPeriod: latestSugar.contextLabel,
        medicationTime: new Date(latestSugar.loggedAt).toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        message: buildCriticalSugarAlertMessage(
          userProfile.name,
          userProfile.gender,
          latestSugar,
          savedLocation
        ),
      }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { delivered?: boolean; reason?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.reason || 'Failed to send sugar emergency alert');
        }

        setSentSugarEmergencyAlerts((prev) => Array.from(new Set([...prev, alertKey])));

        if (payload?.delivered && typeof Notification !== 'undefined' && notificationPermission === 'granted') {
          new Notification('SOS אוטומטי הופעל', {
            body: emergencyContact.name
              ? `נשלחה הודעה אוטומטית אל ${emergencyContact.name} בגלל קריאת סוכר חריגה.`
              : 'נשלחה הודעה אוטומטית בגלל קריאת סוכר חריגה.',
            tag: alertKey,
          });
        }
      })
      .catch((error) => {
        console.error('Automatic sugar emergency alert failed:', error);
      })
      .finally(() => {
        emergencyAlertInFlight.current.delete(alertKey);
      });
  }, [
    emergencyContact.name,
    emergencyContact.phone,
    notificationPermission,
    savedLocation,
    sentSugarEmergencyAlerts,
    sugarLogs,
    userProfile.gender,
    userProfile.name,
  ]);

  const value = useMemo<AppContextValue>(
    () => ({
      remoteReady,
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
      remoteReady,
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
      resetOnboarding,
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
