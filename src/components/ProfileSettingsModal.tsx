import { type ReactNode, useEffect, useState } from 'react';
import { X, Check, User, Phone, Siren, ShieldPlus } from 'lucide-react';
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
  message: '׳׳ ׳™ ׳¦׳¨׳™׳›/׳” ׳¢׳–׳¨׳” ׳“׳—׳•׳₪׳”. ׳–׳” ׳”׳׳™׳§׳•׳ ׳©׳׳™:',
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

  const treatmentLabel =
    treatmentType === 'insulin'
      ? '׳׳™׳ ׳¡׳•׳׳™׳'
      : treatmentType === 'pills'
      ? '׳›׳“׳•׳¨׳™׳'
      : treatmentType === 'combined'
      ? '׳׳©׳•׳׳‘'
      : treatmentType === 'lifestyle'
      ? '׳׳•׳¨׳— ׳—׳™׳™׳'
      : '׳׳ ׳׳•׳’׳“׳¨';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <div
        className="flex-shrink-0 px-5 pt-12 pb-4"
        style={{
          backgroundColor: theme.headerBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${theme.primaryBorder}`,
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ border: `1.5px solid ${theme.primaryBorder}`, backgroundColor: 'white' }}
            aria-label="׳ס׳ג׳ו׳ר"
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h2 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>׳ה׳ג׳ד׳ר׳ו׳ת ׳פ׳ר׳ו׳פ׳י׳ל</h2>
            <p style={{ color: theme.primaryMuted, fontWeight: 600, fontSize: 13 }}>
              ׳פ׳ר׳ט׳י׳ם ׳א׳י׳ש׳י׳י׳ם, ׳ט׳ו׳ו׳ח ׳י׳ע׳ד ׳ו׳ק׳ש׳ר ׳ח׳י׳ר׳ו׳ם
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
          >
            <User size={18} strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          className="rounded-3xl p-5"
          style={{ background: theme.gradientCard, color: '#FFFFFF' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <ShieldPlus size={20} />
            </div>
            <div className="text-right flex-1">
              <p style={{ fontWeight: 900, fontSize: 20 }}>{name || '׳מ׳ט׳ו׳פ׳ל/׳ת'}</p>
              <p style={{ opacity: 0.88, marginTop: 6, lineHeight: 1.7 }}>
                {diabetesType ? `׳ס׳ו׳כ׳ר׳ת ׳ס׳ו׳ג ${diabetesType}` : '׳ס׳ו׳כ׳ר׳ת'} ג€¢ {treatmentLabel} ג€¢ ׳י׳ע׳ד {targetLow || '--'}-{targetHigh || '--'}
              </p>
            </div>
          </div>
        </div>

        <SectionCard title="׳פ׳ר׳ט׳י׳ם ׳א׳י׳ש׳י׳י׳ם" themeColor={theme.primaryBg} borderColor={theme.primaryBorder}>
          <div className="space-y-3">
            <LabeledInput label="׳ש׳ם ׳מ׳ל׳א">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                style={fieldStyle(Boolean(name.trim()), theme.primaryBorder, '#FFFFFF')}
              />
            </LabeledInput>

            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="׳ג׳י׳ל">
                <input
                  type="number"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  dir="rtl"
                  min="1"
                  max="120"
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(age), theme.primaryBorder, '#FFFFFF')}
                />
              </LabeledInput>

              <LabeledInput label="׳ש׳נ׳ת ׳א׳ב׳ח׳ו׳ן">
                <input
                  type="number"
                  value={diagnosisYear}
                  onChange={(event) => setDiagnosisYear(event.target.value)}
                  dir="rtl"
                  min="1970"
                  max={String(new Date().getFullYear())}
                  placeholder="׳ל׳א ׳ח׳ו׳ב׳ה"
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(diagnosisYear), theme.primaryBorder, '#FFFFFF')}
                />
              </LabeledInput>
            </div>

            <LabeledInput label="׳מ׳ג׳ד׳ר">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'female' as Gender, label: '׳א׳י׳ש׳ה', emoji: '👩' },
                  { value: 'male' as Gender, label: '׳ג׳ב׳ר', emoji: '👨' },
                ]).map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setGender(value)}
                    className="rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${gender === value ? theme.primary : '#E2E8F0'}`,
                      backgroundColor: gender === value ? '#FFFFFF' : '#F8FAFC',
                      boxShadow: gender === value ? `0 10px 24px ${theme.primary}20` : 'none',
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

        <SectionCard title="׳ס׳ו׳כ׳ר׳ת ׳ו׳ט׳י׳פ׳ו׳ל" themeColor="#FFFFFF" borderColor={theme.primaryBorder}>
          <div className="space-y-3">
            <LabeledInput label="׳ס׳ו׳ג ׳ס׳ו׳כ׳ר׳ת">
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiabetesType(type)}
                    className="rounded-2xl py-3.5 text-center transition-all duration-200 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${diabetesType === type ? theme.primary : '#E2E8F0'}`,
                      backgroundColor: diabetesType === type ? theme.primaryBg : '#F8FAFC',
                      boxShadow: diabetesType === type ? `0 10px 24px ${theme.primary}18` : 'none',
                    }}
                  >
                    <p style={{ color: diabetesType === type ? theme.primary : '#374151', fontWeight: 800, fontSize: '1rem' }}>
                      ׳ס׳ו׳ג {type}
                    </p>
                  </button>
                ))}
              </div>
            </LabeledInput>

            <LabeledInput label="׳ס׳ו׳ג ׳ט׳י׳פ׳ו׳ל">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'insulin' as TreatmentType, label: '׳א׳י׳נ׳ס׳ו׳ל׳י׳ן' },
                  { value: 'pills' as TreatmentType, label: '׳כ׳ד׳ו׳ר׳י׳ם' },
                  { value: 'combined' as TreatmentType, label: '׳מ׳ש׳ו׳ל׳ב' },
                  { value: 'lifestyle' as TreatmentType, label: '׳א׳ו׳ר׳ח ׳ח׳י׳י׳ם' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTreatmentType(item.value)}
                    className="rounded-2xl py-3 text-center transition-all duration-200 active:scale-[0.97]"
                    style={{
                      border: `2px solid ${treatmentType === item.value ? theme.primary : '#E2E8F0'}`,
                      backgroundColor: treatmentType === item.value ? theme.primaryBg : '#F8FAFC',
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
              <LabeledInput label="׳י׳ע׳ד ׳נ׳מ׳ו׳ך">
                <input
                  type="number"
                  value={targetLow}
                  onChange={(event) => setTargetLow(event.target.value)}
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(targetLow), theme.primaryBorder, '#F8FAFC')}
                />
              </LabeledInput>
              <LabeledInput label="׳י׳ע׳ד ׳ג׳ב׳ו׳ה">
                <input
                  type="number"
                  value={targetHigh}
                  onChange={(event) => setTargetHigh(event.target.value)}
                  dir="rtl"
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(targetHigh), theme.primaryBorder, '#F8FAFC')}
                />
              </LabeledInput>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="׳ש׳ע׳ת ׳ק׳י׳מ׳ה">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(event) => setWakeTime(event.target.value)}
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(wakeTime), theme.primaryBorder, '#F8FAFC')}
                />
              </LabeledInput>
              <LabeledInput label="׳ש׳ע׳ת ׳ש׳י׳נ׳ה">
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(event) => setSleepTime(event.target.value)}
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(sleepTime), theme.primaryBorder, '#F8FAFC')}
                />
              </LabeledInput>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="׳א׳י׳ש ׳ק׳ש׳ר ׳ל׳ח׳י׳ר׳ו׳ם" themeColor={theme.primaryBg} borderColor={theme.primaryBorder}>
          <div className="space-y-3">
            <LabeledInput label="׳ש׳ם ׳א׳י׳ש ׳ק׳ש׳ר">
              <input
                type="text"
                value={emergencyName}
                onChange={(event) => setEmergencyName(event.target.value)}
                dir="rtl"
                placeholder="׳א׳מ׳א, ׳א׳ב׳א, ׳ב׳ן ׳ז׳ו׳ג..."
                className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                style={fieldStyle(Boolean(emergencyName.trim()), theme.primaryBorder, '#FFFFFF')}
              />
            </LabeledInput>

            <LabeledInput label="׳ט׳ל׳פ׳ו׳ן">
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
                  className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                  style={fieldStyle(Boolean(emergencyPhone.trim()), theme.primaryBorder, '#FFFFFF')}
                />
              </div>
            </LabeledInput>

            <LabeledInput label="׳ה׳ו׳ד׳ע׳ת ׳ח׳י׳ר׳ו׳ם">
              <textarea
                value={emergencyMessage}
                onChange={(event) => setEmergencyMessage(event.target.value)}
                dir="rtl"
                className="w-full px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                style={{
                  ...fieldStyle(Boolean(emergencyMessage.trim()), theme.primaryBorder, '#FFFFFF'),
                  minHeight: '96px',
                  resize: 'none',
                }}
              />
            </LabeledInput>
          </div>
        </SectionCard>

        <div className="h-24" />
      </div>

      <div
        className="flex-shrink-0 px-4 pt-3 pb-6 bg-white"
        style={{ borderTop: `1px solid ${theme.primaryBorder}`, boxShadow: `0 -4px 20px ${theme.primary}10` }}
      >
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
          style={{
            backgroundColor: saved ? '#16A34A' : isValid ? theme.primary : '#F3F4F6',
            color: isValid ? '#FFFFFF' : '#9CA3AF',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: isValid ? `0 6px 24px ${theme.primaryShadow}` : 'none',
          }}
        >
          {saved ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              <span>׳נ׳ש׳מ׳ר!</span>
            </>
          ) : (
            <>
              <Siren size={18} strokeWidth={2} />
              <span>׳ש׳מ׳ו׳ר ׳ש׳י׳נ׳ו׳י׳י׳ם</span>
            </>
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
        border: `1.5px solid ${borderColor}`,
        backgroundColor: themeColor,
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.05)',
      }}
    >
      <h3 className="text-sm mb-4 text-right" style={{ color: '#1F2937', fontWeight: 900 }}>
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
      <label className="block text-sm text-right mb-2" style={{ color: '#475569', fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function fieldStyle(active: boolean, borderColor: string, backgroundColor: string) {
  return {
    border: `2px solid ${active ? borderColor : '#E2E8F0'}`,
    backgroundColor,
    color: '#1F2937',
    fontWeight: 500,
  };
}
