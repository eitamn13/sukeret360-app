import { BellRing, Check, Crown, LogOut, Save, ShieldCheck, UserRound, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthContext } from '../context/AuthContext';
import type { DiabetesType, Gender, TreatmentType, UserProfile } from '../context/AppContext';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminUsers?: () => void;
  onOpenSubscription?: () => void;
}

type EmergencyContactDraft = {
  name: string;
  phone: string;
  message: string;
};

type SettingsScreen = 'home' | 'profile' | 'targets' | 'emergency' | 'account';

const DIABETES_TYPE_OPTIONS: Array<{ value: DiabetesType; label: string }> = [
  { value: 'prediabetes', label: 'טרום סוכרת' },
  { value: 'monitoring', label: 'עדיין בבדיקה' },
  { value: '2', label: 'סוג 2' },
  { value: '1', label: 'סוג 1' },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentType; label: string }> = [
  { value: 'lifestyle', label: 'אורח חיים' },
  { value: 'pills', label: 'כדורים' },
  { value: 'insulin', label: 'אינסולין' },
  { value: 'combined', label: 'טיפול משולב' },
];

const DEFAULT_EMERGENCY_CONTACT: EmergencyContactDraft = {
  name: '',
  phone: '',
  message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
};

export function ProfileSettingsModal({
  isOpen,
  onClose,
  onOpenAdminUsers,
  onOpenSubscription,
}: ProfileSettingsModalProps) {
  const { userProfile, saveEmergencyContact, saveUserProfile, theme } = useAppContext();
  const { authEnabled, deleteAccount, isAdmin, signOut } = useAuthContext();

  const [screen, setScreen] = useState<SettingsScreen>('home');
  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<Gender>(userProfile.gender);
  const [diabetesType, setDiabetesType] = useState<DiabetesType>(userProfile.diabetesType);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>(userProfile.treatmentType);
  const [targetLow, setTargetLow] = useState(userProfile.targetLow);
  const [targetHigh, setTargetHigh] = useState(userProfile.targetHigh);
  const [wakeTime, setWakeTime] = useState(userProfile.wakeTime);
  const [sleepTime, setSleepTime] = useState(userProfile.sleepTime);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState(DEFAULT_EMERGENCY_CONTACT.message);
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setScreen('home');
    setName(userProfile.name);
    setAge(userProfile.age);
    setGender(userProfile.gender);
    setDiabetesType(userProfile.diabetesType);
    setTreatmentType(userProfile.treatmentType);
    setTargetLow(userProfile.targetLow);
    setTargetHigh(userProfile.targetHigh);
    setWakeTime(userProfile.wakeTime);
    setSleepTime(userProfile.sleepTime);

    try {
      const raw = localStorage.getItem('emergency_contact');
      if (!raw) {
        setEmergencyName('');
        setEmergencyPhone('');
        setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
        return;
      }

      const parsed = JSON.parse(raw);
      setEmergencyName(parsed?.name || '');
      setEmergencyPhone(parsed?.phone || '');
      setEmergencyMessage(parsed?.message || DEFAULT_EMERGENCY_CONTACT.message);
    } catch {
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
    }
  }, [isOpen, userProfile]);

  const isValid = useMemo(() => {
    return Boolean(
      age.trim() &&
        gender &&
        diabetesType &&
        treatmentType &&
        Number(targetLow) > 0 &&
        Number(targetHigh) > Number(targetLow)
    );
  }, [age, diabetesType, gender, targetHigh, targetLow, treatmentType]);

  const handleSave = () => {
    if (!isValid) return;

    const updated: UserProfile = {
      name: name.trim() || 'משתמש',
      age: age.trim(),
      gender,
      diabetesType,
      diagnosisYear: '',
      treatmentType,
      targetLow,
      targetHigh,
      wakeTime,
      sleepTime,
    };

    saveUserProfile(updated);
    saveEmergencyContact({
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
      message: emergencyMessage.trim() || DEFAULT_EMERGENCY_CONTACT.message,
    });

    setSaved(true);
    setNotice('השינויים נשמרו בהצלחה.');

    window.setTimeout(() => {
      setSaved(false);
      setNotice('');
    }, 1200);
  };

  const handleDeleteAccount = async () => {
    if (!authEnabled) {
      const confirmed = window.confirm('למחוק את כל הנתונים מהמכשיר הזה?');
      if (!confirmed) return;
      window.localStorage.clear();
      window.location.reload();
      return;
    }

    const confirmed = window.confirm('למחוק את החשבון ואת כל הנתונים השמורים?');
    if (!confirmed) return;

    const result = await deleteAccount();
    if (!result.error) {
      window.location.reload();
      return;
    }

    window.alert(result.error);
  };

  const handleSignOut = async () => {
    await signOut();
    if (!authEnabled) {
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const titles: Record<SettingsScreen, { title: string; subtitle: string }> = {
    home: {
      title: 'הגדרות ופרופיל',
      subtitle: 'כל נושא במסך נפרד, בלי עמוד עמוס',
    },
    profile: {
      title: 'פרטים אישיים',
      subtitle: 'שם, גיל, מגדר וסוג סוכרת',
    },
    targets: {
      title: 'יעדים יומיים',
      subtitle: 'טווח סוכר, שעת קימה ושעת שינה',
    },
    emergency: {
      title: 'קשר חירום',
      subtitle: 'איש קשר להודעה במקרה חירום',
    },
    account: {
      title: 'חשבון ומנוי',
      subtitle: 'התנתקות, מחיקת חשבון ומנוי PRO',
    },
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden"
      style={{ background: theme.gradientFull, height: '100dvh', minHeight: '100dvh' }}
      dir="rtl"
    >
      <OverlayHeader
        title={titles[screen].title}
        subtitle={titles[screen].subtitle}
        theme={theme}
        onBack={screen === 'home' ? onClose : () => setScreen('home')}
        onClose={onClose}
        backLabel={screen === 'home' ? 'סגור' : 'חזרה'}
      />

      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {screen === 'home' ? (
          <div className="space-y-3">
            <MenuCard
              title="פרטים אישיים"
              description="שם, גיל, מגדר וסוג סוכרת"
              icon={<UserRound size={18} />}
              onClick={() => setScreen('profile')}
            />
            <MenuCard
              title="יעדים יומיים"
              description="טווח סוכר, שעת קימה ושעת שינה"
              icon={<BellRing size={18} />}
              onClick={() => setScreen('targets')}
            />
            <MenuCard
              title="קשר חירום"
              description="איש קשר להודעת חירום"
              icon={<ShieldCheck size={18} />}
              onClick={() => setScreen('emergency')}
            />
            <MenuCard
              title="חשבון ומנוי"
              description="מנוי PRO, התנתקות ומחיקת חשבון"
              icon={<Crown size={18} />}
              onClick={() => setScreen('account')}
            />
          </div>
        ) : null}

        {screen === 'profile' ? (
          <div className="space-y-4">
            <SectionCard title="פרטים אישיים">
              <FieldLabel label="שם מלא" />
              <LargeInput value={name} onChange={setName} placeholder="שם מלא" />

              <FieldLabel label="גיל" />
              <LargeInput value={age} onChange={setAge} placeholder="גיל" type="number" />

              <FieldLabel label="מגדר" />
              <div className="grid grid-cols-2 gap-3">
                <ChoiceButton
                  active={gender === 'female'}
                  label="אישה"
                  onClick={() => setGender('female')}
                />
                <ChoiceButton
                  active={gender === 'male'}
                  label="גבר"
                  onClick={() => setGender('male')}
                />
              </div>

              <FieldLabel label="סוג סוכרת" />
              <div className="grid grid-cols-2 gap-3">
                {DIABETES_TYPE_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={diabetesType === option.value}
                    label={option.label}
                    onClick={() => setDiabetesType(option.value)}
                  />
                ))}
              </div>

              <FieldLabel label="סוג טיפול" />
              <div className="grid grid-cols-2 gap-3">
                {TREATMENT_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={treatmentType === option.value}
                    label={option.label}
                    onClick={() => setTreatmentType(option.value)}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {screen === 'targets' ? (
          <div className="space-y-4">
            <SectionCard title="יעדי סוכר">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="יעד נמוך" />
                  <LargeInput value={targetLow} onChange={setTargetLow} type="number" />
                </div>
                <div>
                  <FieldLabel label="יעד גבוה" />
                  <LargeInput value={targetHigh} onChange={setTargetHigh} type="number" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="שעות יום">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="שעת קימה" />
                  <LargeInput value={wakeTime} onChange={setWakeTime} type="time" />
                </div>
                <div>
                  <FieldLabel label="שעת שינה" />
                  <LargeInput value={sleepTime} onChange={setSleepTime} type="time" />
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {screen === 'emergency' ? (
          <div className="space-y-4">
            <SectionCard title="פרטי איש קשר">
              <FieldLabel label="שם איש קשר" />
              <LargeInput value={emergencyName} onChange={setEmergencyName} placeholder="שם מלא" />

              <FieldLabel label="טלפון" />
              <LargeInput
                value={emergencyPhone}
                onChange={setEmergencyPhone}
                placeholder="טלפון"
                type="tel"
              />

              <FieldLabel label="נוסח הודעת חירום" />
              <textarea
                value={emergencyMessage}
                onChange={(event) => setEmergencyMessage(event.target.value)}
                className="min-h-[120px] w-full rounded-[20px] bg-white px-4 py-4 text-right text-base font-bold text-[#0F172A] outline-none"
                style={{
                  border: '1.5px solid #DCE6F2',
                }}
              />
            </SectionCard>
          </div>
        ) : null}

        {screen === 'account' ? (
          <div className="space-y-4">
            <SectionCard title="מנוי">
              <button
                type="button"
                onClick={onOpenSubscription}
                className="h-12 w-full rounded-[20px] text-sm font-black text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                }}
              >
                פתיחת מסך מנוי PRO
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={onOpenAdminUsers}
                  className="mt-3 h-12 w-full rounded-[20px] text-sm font-black text-[#0F172A]"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #DCE6F2',
                  }}
                >
                  פתיחת מסך מנהל משתמשים
                </button>
              ) : null}
            </SectionCard>

            <SectionCard title="חשבון">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] text-sm font-black text-[#0F172A]"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #DCE6F2',
                }}
              >
                <LogOut size={16} />
                <span>התנתקות</span>
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] text-sm font-black text-[#B91C1C]"
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                }}
              >
                <UserX size={16} />
                <span>מחיקת חשבון</span>
              </button>
            </SectionCard>
          </div>
        ) : null}
      </div>

      {screen !== 'home' ? (
        <div
          className="px-4 pb-4 pt-3"
          style={{
            background: 'rgba(248,251,255,0.98)',
            borderTop: `1px solid ${theme.primaryBorder}`,
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {notice ? (
            <div
              className="mb-3 rounded-[18px] px-4 py-3 text-sm font-bold"
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1D4ED8',
              }}
            >
              {notice}
            </div>
          ) : null}

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] text-base font-black text-white disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: saved ? '0 18px 34px rgba(37, 99, 235, 0.28)' : '0 18px 34px rgba(37, 99, 235, 0.18)',
            }}
          >
            <Save size={18} />
            <span>שמור שינויים</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[88px] items-center justify-between rounded-[24px] px-4 text-right transition-all active:scale-[0.98]"
      style={{
        background: '#FFFFFF',
        border: '1px solid #DCE6F2',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div className="text-right">
        <p className="text-base font-black text-[#0F172A]">{title}</p>
        <p className="mt-1 text-sm font-bold text-[#64748B]">{description}</p>
      </div>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[16px]"
        style={{ background: '#EFF6FF', color: '#2563EB' }}
      >
        {icon}
      </div>
    </button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[26px] p-4"
      style={{
        background: '#FFFFFF',
        border: '1px solid #DCE6F2',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
      }}
    >
      <p className="mb-4 text-right text-[18px] font-black text-[#0F172A]">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <p className="text-sm font-black text-[#334155]">{label}</p>;
}

function LargeInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      className="h-14 w-full rounded-[20px] bg-white px-4 text-right text-base font-bold text-[#0F172A] outline-none"
      dir="rtl"
      style={{
        border: '1.5px solid #DCE6F2',
      }}
    />
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative min-h-[62px] rounded-[20px] px-4 text-sm font-black transition-all active:scale-[0.98]"
      style={{
        background: active ? '#EFF6FF' : '#FFFFFF',
        color: active ? '#1D4ED8' : '#334155',
        border: `2px solid ${active ? '#2563EB' : '#DCE6F2'}`,
      }}
    >
      <span
        className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          background: active ? '#2563EB' : '#F8FAFC',
          color: active ? '#FFFFFF' : '#94A3B8',
          border: `1px solid ${active ? '#2563EB' : '#DCE6F2'}`,
        }}
      >
        <Check size={12} strokeWidth={2.6} />
      </span>
      {label}
    </button>
  );
}
