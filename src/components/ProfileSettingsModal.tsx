import { BellRing, Crown, LogOut, Save, ShieldCheck, UserRound, UserX } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
  { value: 'combined', label: 'משולב' },
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
  const { authEnabled, isAdmin, session, signOut } = useAuthContext();

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
      name: name.trim() || 'המשתמש/ת',
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
      onClose();
    }, 900);
  };

  const handleDeleteAccount = async () => {
    if (!authEnabled || !session?.access_token) {
      const confirmed = window.confirm('למחוק את כל הנתונים מהמכשיר הזה?');
      if (!confirmed) return;
      localStorage.clear();
      window.location.reload();
      return;
    }

    const confirmed = window.confirm('האם למחוק את החשבון ואת כל הנתונים השמורים שלו?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Delete account failed');
      }

      localStorage.clear();
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete account', error);
      window.alert('לא הצלחנו למחוק את החשבון כרגע. אפשר לנסות שוב בעוד רגע.');
    }
  };

  const handleSignOut = async () => {
    if (!authEnabled) {
      localStorage.removeItem('guest_mode_v1');
      window.location.reload();
      return;
    }

    await signOut();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col animate-slide-in-right overflow-hidden"
      style={{ background: theme.gradientFull, height: '100dvh', minHeight: '100dvh' }}
      dir="rtl"
    >
      <OverlayHeader
        title="הגדרות ופרופיל"
        subtitle="פרטים, יעדים, מנוי וקשר חירום"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        backLabel="חזרה"
      />

      <div
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4 overscroll-contain"
        style={{ paddingBottom: 'calc(13rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <SectionCard title="פרטים אישיים" icon={<UserRound size={18} />} theme={theme}>
          <div className="space-y-3">
            <FieldLabel label="שם מלא" optional />
            <LargeInput value={name} onChange={setName} placeholder="שם מלא" theme={theme} />

            <FieldLabel label="גיל" />
            <LargeInput
              value={age}
              onChange={setAge}
              placeholder="גיל"
              theme={theme}
              type="number"
            />

            <FieldLabel label="מגדר" />
            <div className="grid grid-cols-2 gap-3">
              <ChoiceButton active={gender === 'female'} label="אישה 👩" onClick={() => setGender('female')} theme={theme} />
              <ChoiceButton active={gender === 'male'} label="גבר 👨" onClick={() => setGender('male')} theme={theme} />
            </div>

            <FieldLabel label="סוג סוכרת" />
            <div className="grid grid-cols-2 gap-3">
              {DIABETES_TYPE_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={diabetesType === option.value}
                  label={option.label}
                  onClick={() => setDiabetesType(option.value)}
                  theme={theme}
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
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="יעדים יומיים" icon={<BellRing size={18} />} theme={theme}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel label="יעד נמוך" />
              <LargeInput value={targetLow} onChange={setTargetLow} placeholder="80" theme={theme} type="number" />
            </div>
            <div>
              <FieldLabel label="יעד גבוה" />
              <LargeInput value={targetHigh} onChange={setTargetHigh} placeholder="140" theme={theme} type="number" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel label="שעת קימה" />
              <TimeInput value={wakeTime} onChange={setWakeTime} theme={theme} />
            </div>
            <div>
              <FieldLabel label="שעת שינה" />
              <TimeInput value={sleepTime} onChange={setSleepTime} theme={theme} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="קשר חירום" icon={<ShieldCheck size={18} />} theme={theme}>
          <div className="space-y-3">
            <FieldLabel label="שם איש קשר" optional />
            <LargeInput value={emergencyName} onChange={setEmergencyName} placeholder="שם מלא" theme={theme} />

            <FieldLabel label="טלפון" optional />
            <LargeInput value={emergencyPhone} onChange={setEmergencyPhone} placeholder="טלפון" theme={theme} type="tel" />

            <FieldLabel label="נוסח הודעת חירום" optional />
            <textarea
              value={emergencyMessage}
              onChange={(event) => setEmergencyMessage(event.target.value)}
              className="min-h-[110px] w-full rounded-[22px] px-4 py-4 text-right text-base font-bold text-[#4D5B73] outline-none"
              style={{
                background: '#FFFFFF',
                border: `1.5px solid ${theme.primaryBorder}`,
                boxShadow: '0 10px 22px rgba(122, 146, 182, 0.08)',
              }}
            />
          </div>
        </SectionCard>

        <SectionCard title="חשבון ומנוי" icon={<Crown size={18} />} theme={theme}>
          <div className="space-y-3">
            <button
              type="button"
              onClick={onOpenSubscription}
              className="h-12 w-full rounded-[22px] font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg, #8EADE4 0%, #D49BB0 100%)' }}
            >
              פתיחת מסך מנוי PRO
            </button>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminUsers?.();
                }}
                className="h-12 w-full rounded-[22px] font-extrabold"
                style={{
                  background: '#FFFFFF',
                  color: theme.primaryDark,
                  border: `1.5px solid ${theme.primaryBorder}`,
                }}
              >
                מסך מנהל משתמשים
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <LogOut size={16} />
              <span>{authEnabled ? 'התנתקות' : 'יציאה ממצב אורח'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
              style={{
                background: '#FFF5F5',
                color: '#B91C1C',
                border: '1.5px solid #FECACA',
              }}
            >
              <UserX size={16} />
              <span>{authEnabled ? 'מחיקת חשבון' : 'מחיקת נתונים מהמכשיר'}</span>
            </button>
          </div>
        </SectionCard>
      </div>

      <div
        className="border-t px-4 pb-4 pt-3"
        style={{
          background: 'rgba(255,255,255,0.98)',
          borderColor: theme.primaryBorder,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        }}
      >
        {notice ? (
          <div
            className="mb-3 rounded-[20px] px-4 py-3 text-sm font-bold"
            style={{
              background: saved ? '#ECFDF5' : '#FFF7ED',
              color: saved ? '#047857' : '#C2410C',
              border: `1px solid ${saved ? '#A7F3D0' : '#FED7AA'}`,
            }}
          >
            {notice}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[24px] text-white disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #8EADE4 0%, #D49BB0 100%)',
            fontWeight: 900,
            boxShadow: isValid ? '0 18px 36px rgba(114, 138, 180, 0.18)' : 'none',
          }}
        >
          <Save size={18} />
          <span>שמור שינויים</span>
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  children,
  icon,
  theme,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  theme: ReturnType<typeof useAppContext>['theme'];
  title: string;
}) {
  return (
    <div
      className="rounded-[28px] p-4"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 12px 28px rgba(122, 146, 182, 0.08)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: theme.primaryBg, color: theme.primaryDark }}
        >
          {icon}
        </div>
        <h3 className="text-right text-[18px] font-black text-[#4D5B73]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, optional = false }: { label: string; optional?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      {optional ? <span className="text-xs font-bold text-[#9AA7B8]">לא חובה</span> : <span />}
      <p className="text-sm font-black text-[#5F6D84]">{label}</p>
    </div>
  );
}

function LargeInput({
  value,
  onChange,
  placeholder,
  theme,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  theme: ReturnType<typeof useAppContext>['theme'];
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      dir="rtl"
      className="h-14 w-full rounded-[22px] px-4 text-right text-base font-bold text-[#4D5B73] outline-none"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 22px rgba(122, 146, 182, 0.08)',
      }}
    />
  );
}

function TimeInput({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type="time"
      dir="rtl"
      className="h-14 w-full rounded-[22px] px-4 text-right text-base font-bold text-[#4D5B73] outline-none"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 22px rgba(122, 146, 182, 0.08)',
      }}
    />
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useAppContext>['theme'];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[62px] rounded-[22px] px-4 text-right font-extrabold transition-all"
      style={{
        background: active ? theme.primaryBg : '#FFFFFF',
        border: `2px solid ${active ? theme.primary : '#E2E8F0'}`,
        color: active ? theme.primaryDark : '#475569',
      }}
    >
      {label}
    </button>
  );
}
