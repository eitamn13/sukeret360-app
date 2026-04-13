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
}

export interface MedicationLogEntry {
  medicationId: string;
  dateKey: string;
  takenAt: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  diabetesType: '',
  gender: '',
};

const DEFAULT_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'מצב חירום!',
};

const DEFAULT_MEDS: MedicationScheduleItem[] = [
  { id: 'morning', time: '08:00', period: 'בוקר', name: 'מטפורמין', dosage: '500 מ"ג', type: 'pill' },
  { id: 'evening', time: '21:00', period: 'ערב', name: 'אינסולין', dosage: '10 יחידות', type: 'injection' },
];

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

interface AppContextType {
  userProfile: UserProfile;
  onboardingDone: boolean;
  emergencyContact: EmergencyContact;
  savedLocation: SavedLocation | null;
  medicationSchedule: MedicationScheduleItem[];
  medicationLogs: MedicationLogEntry[];

  saveUserProfile: (p: UserProfile) => void;
  completeOnboarding: () => void;
  saveEmergencyContact: (c: EmergencyContact) => void;
  saveLocation: (l: SavedLocation | null) => void;
  markMedicationTaken: (id: string) => void;
  unmarkMedicationTaken: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(
    JSON.parse(localStorage.getItem('userProfile') || 'null') || DEFAULT_PROFILE
  );

  const [onboardingDone, setOnboardingDone] = useState(
    localStorage.getItem('onboardingDone') === 'true'
  );

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    JSON.parse(localStorage.getItem('emergency_contact') || 'null') || DEFAULT_CONTACT
  );

  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(
    JSON.parse(localStorage.getItem('saved_location') || 'null')
  );

  const [medicationSchedule] = useState(DEFAULT_MEDS);

  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(
    JSON.parse(localStorage.getItem('medication_logs') || '[]')
  );

  // 💾 SAVE
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('medication_logs', JSON.stringify(medicationLogs));
  }, [medicationLogs]);

  useEffect(() => {
    localStorage.setItem('emergency_contact', JSON.stringify(emergencyContact));
  }, [emergencyContact]);

  useEffect(() => {
    localStorage.setItem('saved_location', JSON.stringify(savedLocation));
  }, [savedLocation]);

  // 🔔 בקשת הרשאות
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const isTakenToday = (id: string) => {
    return medicationLogs.some(
      m => m.medicationId === id && m.dateKey === todayKey()
    );
  };

  // 🔥 מנוע תזכורות
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      medicationSchedule.forEach(med => {
        const [h, m] = med.time.split(':').map(Number);

        if (
          now.getHours() === h &&
          now.getMinutes() === m &&
          !isTakenToday(med.id)
        ) {
          const text = genderedText(
            userProfile.gender,
            `💊 שכחת לקחת את ${med.name}`,
            `💊 שכחת לקחת את ${med.name}`
          );

          if (Notification.permission === 'granted') {
            new Notification(text);
          }

          // ⏱️ 30 דקות
          setTimeout(() => {
            if (!isTakenToday(med.id)) {
              triggerEmergency(med);
            }
          }, 30 * 60 * 1000);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [medicationLogs, userProfile]);

  // 🚨 חירום
  const triggerEmergency = (med: MedicationScheduleItem) => {
    if (!emergencyContact.phone) return;

    const location = savedLocation
      ? `https://maps.google.com/?q=${savedLocation.lat},${savedLocation.lng}`
      : '';

    const msg = genderedText(
      userProfile.gender,
      `🚨 המטופלת לא לקחה ${med.name}\n${location}`,
      `🚨 המטופל לא לקח ${med.name}\n${location}`
    );

    window.open(`https://wa.me/${emergencyContact.phone}?text=${encodeURIComponent(msg)}`);
  };

  // ACTIONS
  const saveUserProfile = (p: UserProfile) => setUserProfile(p);

  const completeOnboarding = () => {
    setOnboardingDone(true);
    localStorage.setItem('onboardingDone', 'true');
  };

  const saveEmergencyContact = (c: EmergencyContact) => setEmergencyContact(c);

  const saveLocation = (l: SavedLocation | null) => setSavedLocation(l);

  const markMedicationTaken = (id: string) => {
    setMedicationLogs(prev => [
      ...prev,
      { medicationId: id, dateKey: todayKey(), takenAt: new Date().toISOString() }
    ]);
  };

  const unmarkMedicationTaken = (id: string) => {
    setMedicationLogs(prev =>
      prev.filter(m => !(m.medicationId === id && m.dateKey === todayKey()))
    );
  };

  return (
    <AppContext.Provider value={{
      userProfile,
      onboardingDone,
      emergencyContact,
      savedLocation,
      medicationSchedule,
      medicationLogs,

      saveUserProfile,
      completeOnboarding,
      saveEmergencyContact,
      saveLocation,
      markMedicationTaken,
      unmarkMedicationTaken
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext");
  return ctx;
};
