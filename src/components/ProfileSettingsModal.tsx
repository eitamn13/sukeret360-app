import { type ReactNode, useEffect, useState } from 'react';
import {
  BellRing,
  Check,
  Clock3,
  HeartHandshake,
  Phone,
  Save,
  UserRound,
} from 'lucide-react';
import { Gender, TreatmentType, UserProfile, useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EmergencyContactDraft = {
  name: string;
  phone: string;
  message: string;
};

const DEFAULT_EMERGENCY_CONTACT: EmergencyContactDraft = {
  name: '',
  phone: '',
  message: 'אני צריך/ה עזרה דחופה. זה המיקום שלי:',
};

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { userProfile, saveUserProfile, saveEmergencyContact, theme } = useAppContext();

  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<Gender>(userProfile.gender);
  const [diabetesType, setDiabetesType] = useState<'1' | '2' | ''>(userProfile.diabetesType);
  const [diagnosisYear, setDiagnosisYear] = useState(userProfile.diagnosisYear);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>(userProfile.treatmentType);
  const [targetLow, setTargetLow] = useState(userProfile.targetLow);
  const [targetHigh, setTargetHigh] = useState(userProfile.targetHigh);
  const [wakeTime, setWakeTime] = useState(userProfile.wakeTime);
  const [sleepTime, setSleepTime] = useState(userProfile.sleepTime);
  const [saved, setSaved] = useState(false);

  const [emergencyName, setEmergencyName] = useState(DEFAULT_EMERGENCY_CONTACT.name);
  const [emergencyPhone, setEmergencyPhone] = useState(DEFAULT_EMERGENCY_CONTACT.phone);
  const [emergencyMessage, setEmergencyMessage] = useState(DEFAULT_EMERGENCY_CONTACT.message);

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
    setDiagnosisYear(userProfile.diagnosisYear);
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

  const isValid =
    name.trim().length > 0 &&
    Number(age) > 0 &&
    Number(targetLow) > 0 &&
    Number(targetHigh) > Number(targetLow);

  const handleSave = () => {
    const updated: UserProfile = {
      name: name.trim() || userProfile.name,
      age,
      gender,
      diabetesType,
      diagnosisYear,
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
    window.setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col animate-slide-in-right overflow-hidden"
      style={{ background: theme.gradientFull, height: '100dvh', minHeight: '100dvh' }}
    >
      <OverlayHeader
        title="הגדרות ופרופיל"
        subtitle="פרטים, יעדים וקשר חירום"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        backLabel="חזרה"
      />

      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain"
        style={{ paddingBottom: 'calc(12rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <SectionCard
          title="פרטים"
          subtitle="שם, גיל ומגדר"
          icon={<UserRound size={18} />}
          theme={theme}
        >
          <div className="space-y-3">
            <LabeledField label="שם מלא">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                style={fieldStyle(Boolean(name.trim()), theme.primaryBorder)}
              />
            </LabeledField>

            <div className="grid grid-cols-2 gap-3 items-end">
              <LabeledField label="גיל">
                <input
                  type="number"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  min="1"
                  max="120"
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                  style={fieldStyle(Boolean(age), theme.primaryBorder)}
                />
              </LabeledField>

              <LabeledField label="שנת אבחון">
                <input
                  type="number"
                  value={diagnosisYear}
                  onChange={(event) => setDiagnosisYear(event.target.value)}
                  min="1970"
                  max={String(new Date().getFullYear())}
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                  style={fieldStyle(Boolean(diagnosisYear), theme.primaryBorder)}
                />
              </LabeledField>
            </div>

            <LabeledField label="מגדר">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female' as Gender, label: 'אישה', emoji: '👩' },
                  { value: 'male' as Gender, label: 'גבר', emoji: '👨' },
                ].map((option) => {
                  const selected = gender === option.value;
                  const accent =
                    option.value === 'male'
                      ? {
                          border: '#2563EB',
                          background: '#EFF6FF',
                          text: '#1D4ED8',
                          shadow: 'rgba(37,99,235,0.14)',
                        }
                      : {
                          border: '#EC4899',
                          background: '#FFF1F7',
                          text: '#BE185D',
                          shadow: 'rgba(236,72,153,0.14)',
                        };

                  return (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                      style={{
                        border: `2px solid ${selected ? accent.border : '#E2E8F0'}`,
                        backgroundColor: selected ? accent.background : '#FFFFFF',
                        boxShadow: selected ? `0 10px 22px ${accent.shadow}` : 'none',
                      }}
                    >
                      <p className="text-2xl mb-2">{option.emoji}</p>
                      <p style={{ color: selected ? accent.text : '#334155', fontWeight: 800 }}>
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </LabeledField>
          </div>
        </SectionCard>

        <SectionCard
          title="יעדים"
          subtitle="סוג סוכרת, טיפול ושעות"
          icon={<BellRing size={18} />}
          theme={theme}
        >
          <div className="space-y-3">
            <LabeledField label="סוג סוכרת">
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiabetesType(type)}
                    className="rounded-2xl p-4 text-right transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${diabetesType === type ? theme.primary : '#E2E8F0'}`,
                      backgroundColor: diabetesType === type ? theme.primaryBg : '#FFFFFF',
                    }}
                  >
                    <p style={{ color: diabetesType === type ? theme.primary : '#0F172A', fontWeight: 900, fontSize: 18 }}>
                      סוג {type}
                    </p>
                    <p style={{ color: '#64748B', fontSize: 13, marginTop: 5 }}>
                      {type === '1' ? 'לרוב תלוי באינסולין' : 'לרוב משלב כדורים ואורח חיים'}
                    </p>
                  </button>
                ))}
              </div>
            </LabeledField>

            <LabeledField label="סוג טיפול">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'insulin' as TreatmentType, label: 'אינסולין' },
                  { value: 'pills' as TreatmentType, label: 'כדורים' },
                  { value: 'combined' as TreatmentType, label: 'משולב' },
                  { value: 'lifestyle' as TreatmentType, label: 'אורח חיים' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTreatmentType(option.value)}
                    className="rounded-2xl py-3.5 text-center transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${treatmentType === option.value ? theme.primary : '#E2E8F0'}`,
                      backgroundColor: treatmentType === option.value ? theme.primaryBg : '#FFFFFF',
                      color: treatmentType === option.value ? theme.primary : '#334155',
                      fontWeight: 800,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </LabeledField>

            <div className="grid grid-cols-2 gap-3">
              <LabeledField label="יעד נמוך">
                <input
                  type="number"
                  value={targetLow}
                  onChange={(event) => setTargetLow(event.target.value)}
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                  style={fieldStyle(Boolean(targetLow), theme.primaryBorder)}
                />
              </LabeledField>
              <LabeledField label="יעד גבוה">
                <input
                  type="number"
                  value={targetHigh}
                  onChange={(event) => setTargetHigh(event.target.value)}
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                  style={fieldStyle(Boolean(targetHigh), theme.primaryBorder)}
                />
              </LabeledField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LabeledField label="שעת קימה">
                <TimeField
                  value={wakeTime}
                  onChange={setWakeTime}
                  active={Boolean(wakeTime)}
                  borderColor={theme.primaryBorder}
                />
              </LabeledField>
              <LabeledField label="שעת שינה">
                <TimeField
                  value={sleepTime}
                  onChange={setSleepTime}
                  active={Boolean(sleepTime)}
                  borderColor={theme.primaryBorder}
                />
              </LabeledField>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="חירום"
          subtitle="איש קשר להודעה מהירה"
          icon={<HeartHandshake size={18} />}
          theme={theme}
        >
          <div className="space-y-3">
            <LabeledField label="שם איש קשר">
              <input
                type="text"
                value={emergencyName}
                onChange={(event) => setEmergencyName(event.target.value)}
                placeholder="אמא, בן זוג, אח, בת..."
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right outline-none"
                style={fieldStyle(Boolean(emergencyName.trim()), theme.primaryBorder)}
              />
            </LabeledField>

            <LabeledField label="טלפון">
              <div className="relative">
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(event) => setEmergencyPhone(event.target.value)}
                  placeholder="0501234567"
                  dir="rtl"
                  className="w-full h-14 rounded-2xl text-right outline-none"
                  style={{
                    ...fieldStyle(Boolean(emergencyPhone.trim()), theme.primaryBorder),
                    paddingRight: '2.85rem',
                    paddingLeft: '1rem',
                  }}
                />
              </div>
            </LabeledField>

            <LabeledField label="נוסח הודעת חירום">
              <textarea
                value={emergencyMessage}
                onChange={(event) => setEmergencyMessage(event.target.value)}
                dir="rtl"
                className="w-full px-4 py-3.5 rounded-2xl text-right outline-none"
                style={{
                  ...fieldStyle(Boolean(emergencyMessage.trim()), theme.primaryBorder),
                  minHeight: 104,
                  resize: 'none',
                }}
              />
            </LabeledField>
          </div>
        </SectionCard>

      </div>

      <div
        className="flex-shrink-0 px-4 pt-3"
        style={{
          paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${theme.primaryBorder}`,
        }}
      >
        <div
          className="rounded-[28px] bg-white p-3.5"
          style={{
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: `0 -14px 38px ${theme.primary}22`,
          }}
        >
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full h-[58px] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #16A34A, #15803D)'
                : isValid
                  ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`
                  : 'linear-gradient(135deg, #A8B6CB 0%, #7B8AA3 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              boxShadow: isValid ? `0 20px 38px ${theme.primaryShadow}` : '0 14px 28px rgba(100, 116, 139, 0.22)',
              opacity: 1,
            }}
          >
          {saved ? (
            <>
              <Check size={18} strokeWidth={2.6} />
              <span>נשמר בהצלחה</span>
            </>
          ) : (
            <>
              <Save size={18} strokeWidth={2.2} />
              <span>שמור שינויים</span>
            </>
          )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  theme,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  theme: ReturnType<typeof useAppContext>['theme'];
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[28px] p-4"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${theme.primaryBorder}`,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
        >
          {icon}
        </div>

        <div className="text-right flex-1">
          <h3 style={{ color: '#0F172A', fontWeight: 900, fontSize: 17 }}>{title}</h3>
          <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-right mb-2" style={{ color: '#475569', fontWeight: 800 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function fieldStyle(active: boolean, borderColor: string) {
  return {
    border: `2px solid ${active ? borderColor : '#E2E8F0'}`,
    backgroundColor: active ? '#F8FCFD' : '#FFFFFF',
    color: '#0F172A',
    fontWeight: 700,
  };
}

function TimeField({
  value,
  onChange,
  active,
  borderColor,
}: {
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  borderColor: string;
}) {
  return (
    <div className="relative">
      <Clock3
        size={16}
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748B',
          pointerEvents: 'none',
        }}
      />
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-14 rounded-[20px] outline-none"
        style={{
          ...fieldStyle(active, borderColor),
          textAlign: 'center',
          direction: 'ltr',
          paddingRight: '2.7rem',
          paddingLeft: '1rem',
          WebkitAppearance: 'none',
          appearance: 'none',
          letterSpacing: '0.06em',
          fontSize: '1rem',
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          boxShadow: active ? '0 10px 22px rgba(148, 163, 184, 0.08)' : 'none',
        }}
      />
    </div>
  );
}
