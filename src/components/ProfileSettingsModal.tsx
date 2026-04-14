import { type ReactNode, useEffect, useState } from 'react';
import { X, Check, User, Phone, Siren } from 'lucide-react';
import { Gender, TreatmentType, UserProfile, useAppContext } from '../context/AppContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EmergencyContact = {
  name: string;
  phone: string;
  message: string;
};

const DEFAULT_EMERGENCY_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'אני צריכ/ה עזרה דחופה. זה המיקום שלי:',
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
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmergencyName(parsed?.name || '');
        setEmergencyPhone(parsed?.phone || '');
        setEmergencyMessage(parsed?.message || DEFAULT_EMERGENCY_CONTACT.message);
      } else {
        setEmergencyName('');
        setEmergencyPhone('');
        setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
      }
    } catch {
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

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
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const isValid =
    name.trim().length > 0 &&
    Number(age) > 0 &&
    Number(targetHigh) > Number(targetLow);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl px-5 pt-3 pb-10"
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.2)', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: '#E5E7EB' }} />

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: theme.primaryBg }}
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h2 className="text-base" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
              הגדרות פרופיל
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              עדכון פרטים, טווחי יעד ואיש קשר
            </p>
          </div>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg }}
          >
            <User size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
          </div>
        </div>

        <div className="space-y-5">
          <SectionCard title="פרטים אישיים" themeColor={theme.primaryBg} borderColor={theme.primaryBorder}>
            <div className="space-y-3">
              <LabeledInput label="שם">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  dir="rtl"
                  className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(name.trim()), theme.primaryBorder, theme.primaryBg)}
                />
              </LabeledInput>

              <div className="grid grid-cols-2 gap-3">
                <LabeledInput label="גיל">
                  <input
                    type="number"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    dir="rtl"
                    min="1"
                    max="120"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(age), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
                <LabeledInput label="שנת אבחון">
                  <input
                    type="number"
                    value={diagnosisYear}
                    onChange={(event) => setDiagnosisYear(event.target.value)}
                    dir="rtl"
                    min="1970"
                    max={String(new Date().getFullYear())}
                    placeholder="לא חובה"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(diagnosisYear), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
              </div>

              <LabeledInput label="מגדר">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'female' as Gender, label: 'אישה', emoji: '👩' },
                    { value: 'male' as Gender, label: 'גבר', emoji: '👨' },
                  ]).map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => setGender(value)}
                      className="rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
                      style={{
                        border: `2px solid ${gender === value ? theme.primary : '#F3F4F6'}`,
                        backgroundColor: gender === value ? theme.primaryBg : '#F9FAFB',
                        boxShadow: gender === value ? `0 4px 16px ${theme.primary}20` : 'none',
                      }}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span style={{ color: gender === value ? theme.primary : '#374151', fontWeight: 700 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </LabeledInput>
            </div>
          </SectionCard>

          <SectionCard title="סוכרת וטיפול" themeColor="#F8FAFC" borderColor="#E2E8F0">
            <div className="space-y-3">
              <LabeledInput label="סוג סוכרת">
                <div className="grid grid-cols-2 gap-3">
                  {(['1', '2'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDiabetesType(type)}
                      className="rounded-2xl py-3.5 text-center transition-all duration-200 active:scale-[0.97]"
                      style={{
                        border: `2px solid ${diabetesType === type ? theme.primary : '#F3F4F6'}`,
                        backgroundColor: diabetesType === type ? theme.primaryBg : '#F9FAFB',
                        boxShadow: diabetesType === type ? `0 4px 16px ${theme.primary}20` : 'none',
                      }}
                    >
                      <p style={{ color: diabetesType === type ? theme.primary : '#374151', fontWeight: 800, fontSize: '1rem' }}>
                        סוג {type}
                      </p>
                    </button>
                  ))}
                </div>
              </LabeledInput>

              <LabeledInput label="סוג טיפול">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'insulin' as TreatmentType, label: 'אינסולין' },
                    { value: 'pills' as TreatmentType, label: 'כדורים' },
                    { value: 'combined' as TreatmentType, label: 'משולב' },
                    { value: 'lifestyle' as TreatmentType, label: 'אורח חיים' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setTreatmentType(item.value)}
                      className="rounded-2xl py-3 text-center transition-all duration-200 active:scale-[0.97]"
                      style={{
                        border: `2px solid ${treatmentType === item.value ? theme.primary : '#F3F4F6'}`,
                        backgroundColor: treatmentType === item.value ? theme.primaryBg : '#F9FAFB',
                        color: treatmentType === item.value ? theme.primary : '#374151',
                        fontWeight: 700,
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </LabeledInput>

              <div className="grid grid-cols-2 gap-3">
                <LabeledInput label="טווח נמוך">
                  <input
                    type="number"
                    value={targetLow}
                    onChange={(event) => setTargetLow(event.target.value)}
                    dir="rtl"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(targetLow), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
                <LabeledInput label="טווח גבוה">
                  <input
                    type="number"
                    value={targetHigh}
                    onChange={(event) => setTargetHigh(event.target.value)}
                    dir="rtl"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(targetHigh), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <LabeledInput label="שעת קימה">
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(event) => setWakeTime(event.target.value)}
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(wakeTime), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
                <LabeledInput label="שעת שינה">
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(event) => setSleepTime(event.target.value)}
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(sleepTime), theme.primaryBorder, theme.primaryBg)}
                  />
                </LabeledInput>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="איש קשר לחירום" themeColor={theme.primaryBg} borderColor={theme.primaryBorder}>
            <div className="flex items-center justify-end gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <Siren size={18} strokeWidth={1.8} style={{ color: theme.primary }} />
              </div>
            </div>

            <div className="space-y-3">
              <LabeledInput label="שם איש קשר">
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(event) => setEmergencyName(event.target.value)}
                  dir="rtl"
                  placeholder="אמא, אבא, בן זוג..."
                  className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(emergencyName.trim()), theme.primaryBorder, '#FFFFFF')}
                />
              </LabeledInput>

              <LabeledInput label="טלפון">
                <div className="relative">
                  <Phone
                    size={16}
                    strokeWidth={2}
                    style={{
                      color: theme.primaryMuted,
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(event) => setEmergencyPhone(event.target.value)}
                    dir="rtl"
                    placeholder="0501234567"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={fieldStyle(Boolean(emergencyPhone.trim()), theme.primaryBorder, '#FFFFFF')}
                  />
                </div>
              </LabeledInput>

              <LabeledInput label="הודעת חירום">
                <textarea
                  value={emergencyMessage}
                  onChange={(event) => setEmergencyMessage(event.target.value)}
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                  style={{
                    ...fieldStyle(Boolean(emergencyMessage.trim()), theme.primaryBorder, '#FFFFFF'),
                    minHeight: '88px',
                    resize: 'none',
                  }}
                />
              </LabeledInput>
            </div>
          </SectionCard>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full h-14 rounded-2xl mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
          style={{
            backgroundColor: saved ? '#16A34A' : isValid ? theme.primary : '#F3F4F6',
            color: isValid ? '#FFFFFF' : '#9CA3AF',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: isValid ? `0 6px 24px ${theme.primaryShadow}` : 'none',
          }}
        >
          {saved ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              <span>נשמר!</span>
            </>
          ) : (
            <span>שמור שינויים</span>
          )}
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  themeColor,
  borderColor,
  children,
}: {
  title: string;
  themeColor: string;
  borderColor: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-4"
      style={{
        border: `2px solid ${borderColor}`,
        backgroundColor: themeColor,
      }}
    >
      <h3 className="text-sm mb-4 text-right" style={{ color: '#1F2937', fontWeight: 800 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function fieldStyle(active: boolean, borderColor: string, backgroundColor: string) {
  return {
    border: `2px solid ${active ? borderColor : '#F3F4F6'}`,
    backgroundColor,
    color: '#1F2937',
    fontWeight: 500,
  };
}
