import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';

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
  primary: '#D78DA8',
  primaryDark: '#6C544A',
  primaryLight: '#F3D5DD',
  primaryBorder: '#ECDDCD',
  primaryBg: '#FFF5F1',
  primaryShadow: 'rgba(173, 132, 121, 0.18)',
  primaryMuted: '#9C8076',
  gradientCard: 'linear-gradient(145deg, #FFFDF9 0%, #FFF6F0 46%, #FBECEF 100%)',
  gradientFull: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8F1 56%, #FFFDF9 100%)',
  headerBg: 'rgba(255, 250, 244, 0.96)',
  headerBorder: '#EFE3D8',
  headerShadow: '0 10px 28px rgba(146, 118, 103, 0.08)',
};

export const MALE_THEME: Theme = {
  primary: '#6B97D6',
  primaryDark: '#4F617F',
  primaryLight: '#DCEAFD',
  primaryBorder: '#DDE6F3',
  primaryBg: '#F4F8FE',
  primaryShadow: 'rgba(107, 151, 214, 0.18)',
  primaryMuted: '#7E8DA6',
  gradientCard: 'linear-gradient(145deg, #FEFFFE 0%, #F7FAFE 44%, #EEF5FF 100%)',
  gradientFull: 'linear-gradient(180deg, #FCFEFF 0%, #F4F8FE 56%, #FCFEFF 100%)',
  headerBg: 'rgba(250, 252, 255, 0.96)',
  headerBorder: '#E4EBF5',
  headerShadow: '0 10px 28px rgba(115, 143, 185, 0.08)',
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
  const emergencyAlertInFlight = useRef<Set<string>>(new Set());

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
