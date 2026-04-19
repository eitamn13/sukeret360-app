import { Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  DiabetesType,
  Gender,
  MedicationScheduleItem,
  TreatmentType,
  UserProfile,
} from '../context/AppContext';
import { getPeriodFromTime, useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { Logo } from './Logo';

type StepId = 0 | 1 | 2 | 3 | 4;

const TOTAL_STEPS = 5;

const DIABETES_TYPE_OPTIONS: Array<{
  value: DiabetesType;
  label: string;
  description: string;
}> = [
  {
    value: 'prediabetes',
    label: 'טרום סוכרת',
    description: 'מעקב, תזונה ופעילות למניעת החמרה',
  },
  {
    value: 'monitoring',
    label: 'עדיין בבדיקה',
    description: 'כשרוצים מעקב גם לפני אבחון סופי',
  },
  {
    value: '2',
    label: 'סוכרת סוג 2',
    description: 'לרוב טיפול תרופתי ומעקב יומי',
  },
  {
    value: '1',
    label: 'סוכרת סוג 1',
    description: 'מעקב צמוד וטיפול באינסולין',
  },
];

const TREATMENT_OPTIONS: Array<{
  value: TreatmentType;
  label: string;
  description: string;
}> = [
  { value: 'lifestyle', label: 'אורח חיים', description: 'תזונה, הליכה ומעקב' },
  { value: 'pills', label: 'כדורים', description: 'תרופות קבועות לפי שעה' },
  { value: 'insulin', label: 'אינסולין', description: 'עט או זריקה לפי תכנית טיפול' },
  { value: 'combined', label: 'טיפול משולב', description: 'כדורים ואינסולין יחד' },
];

const MEDICATION_PRESETS: Array<{
  key: string;
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  appearanceLabel: string;
  time: string;
}> = [
  {
    key: 'metformin',
    name: 'מטפורמין',
    dosage: '500 מ״ג',
    type: 'pill',
    appearanceLabel: 'כדור לבן',
    time: '08:00',
  },
  {
    key: 'jardiance',
    name: 'ג׳רדיאנס',
    dosage: '10 מ״ג',
    type: 'pill',
    appearanceLabel: 'כדור לבן',
    time: '08:00',
  },
  {
    key: 'ozempic',
    name: 'אוזמפיק',
    dosage: 'פעם בשבוע',
    type: 'injection',
    appearanceLabel: 'עט זריקה',
    time: '20:00',
  },
  {
    key: 'insulin',
    name: 'אינסולין',
    dosage: '10 יחידות',
    type: 'injection',
    appearanceLabel: 'עט אינסולין',
    time: '21:00',
  },
];

function createMedicationFromPreset(
  preset: (typeof MEDICATION_PRESETS)[number]
): MedicationScheduleItem {
  return {
    id: `${preset.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: preset.name,
    dosage: preset.dosage,
    time: preset.time,
    period: getPeriodFromTime(preset.time),
    type: preset.type,
    image: preset.type === 'injection' ? 'insulin-pen' : 'white-pill',
    appearanceLabel: preset.appearanceLabel,
    notes: '',
    notifyEmergencyAfterMinutes: 45,
  };
}

export function OnboardingScreen() {
  const { completeOnboarding, saveEmergencyContact, saveMedicationSchedule, saveUserProfile } =
    useAppContext();
  const { user } = useAuthContext();

  const [step, setStep] = useState<StepId>(0);
  const [name, setName] = useState(user?.user_metadata?.full_name?.trim?.() || '');
  const [email] = useState(user?.email?.trim() || '');
  const [gender, setGender] = useState<Gender>('');
  const [age, setAge] = useState('');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('');
  const [targetLow, setTargetLow] = useState('80');
  const [targetHigh, setTargetHigh] = useState('140');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([]);
  const [noMedicationSelected, setNoMedicationSelected] = useState(false);

  const selectedMedicationNames = new Set(medications.map((medication) => medication.name));

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(name.trim() && email.trim());
      case 1:
        return Boolean(age.trim() && gender);
      case 2:
        return Boolean(diabetesType);
      case 3:
        return Boolean(treatmentType && (noMedicationSelected || medications.length > 0 || treatmentType === 'lifestyle'));
      case 4:
        return Boolean(
          Number(targetLow) > 0 &&
            Number(targetHigh) > Number(targetLow) &&
            wakeTime &&
            sleepTime
        );
      default:
        return false;
    }
  }, [age, diabetesType, email, gender, medications.length, name, noMedicationSelected, sleepTime, step, targetHigh, targetLow, treatmentType, wakeTime]);

  const toggleMedicationPreset = (preset: (typeof MEDICATION_PRESETS)[number]) => {
    setNoMedicationSelected(false);
    setMedications((prev) => {
      const exists = prev.some((item) => item.name === preset.name);
      if (exists) {
        return prev.filter((item) => item.name !== preset.name);
      }
      return [...prev, createMedicationFromPreset(preset)];
    });
  };

  const markNoMedication = () => {
    setNoMedicationSelected(true);
    setMedications([]);
  };

  const nextStep = () => {
    if (!canContinue || step === 4) return;
    setStep((prev) => (prev + 1) as StepId);
  };

  const previousStep = () => {
    if (step === 0) return;
    setStep((prev) => (prev - 1) as StepId);
  };

  const handleFinish = () => {
    if (!canContinue) return;

    const profile: UserProfile = {
      name: name.trim() || 'משתמש',
      age: age.trim(),
      diabetesType,
      gender,
      diagnosisYear: '',
      treatmentType,
      targetLow,
      targetHigh,
      wakeTime,
      sleepTime,
    };

    saveUserProfile(profile);
    saveEmergencyContact({
      name: '',
      phone: '',
      message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
    });
    saveMedicationSchedule(
      noMedicationSelected || treatmentType === 'lifestyle'
        ? []
        : medications.map((item) => ({
            ...item,
            period: getPeriodFromTime(item.time),
          }))
    );
    completeOnboarding();
  };

  return (
    <div
      className="min-h-[100dvh] px-4 py-6"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #F8FBFF 0%, #F3F7FD 100%)' }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-[24px]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #DCE6F2',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Logo size={50} />
          </div>
        </div>

        <div
          className="rounded-[30px] p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid #DCE6F2',
            boxShadow: '0 20px 42px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={previousStep}
              disabled={step === 0}
              className="flex h-11 min-w-[100px] items-center justify-center gap-1 rounded-[18px] text-sm font-black transition-all disabled:opacity-50"
              style={{
                background: '#FFFFFF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
              }}
            >
              <ChevronRight size={16} strokeWidth={2.2} />
              <span>חזרה</span>
            </button>

            <div className="text-center">
              <h1 className="text-[28px] font-black text-[#0F172A]">התחלה פשוטה</h1>
              <p className="mt-1 text-sm font-bold text-[#64748B]">שלב {step + 1} מתוך {TOTAL_STEPS}</p>
            </div>

            <div className="w-[100px]" />
          </div>

          <div className="mt-5 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <span
                key={index}
                className="h-2 flex-1 rounded-full"
                style={{
                  background: index <= step ? '#2563EB' : '#E2E8F0',
                }}
              />
            ))}
          </div>

          <div className="mt-6">
            {step === 0 ? (
              <StepSection
                title="פרטים בסיסיים"
                description="כמה פרטים קצרים כדי לפתוח את החשבון."
              >
                <div className="space-y-3">
                  <FieldLabel label="שם מלא" />
                  <LargeInput value={name} onChange={setName} placeholder="שם מלא" />
                  <FieldLabel label="מייל" />
                  <LargeInput value={email} onChange={() => {}} placeholder="מייל" readOnly />
                </div>
              </StepSection>
            ) : null}

            {step === 1 ? (
              <StepSection
                title="גיל ומגדר"
                description="בחירה ברורה, בלי פרטים מיותרים."
              >
                <div className="space-y-3">
                  <FieldLabel label="גיל" />
                  <LargeInput
                    value={age}
                    onChange={setAge}
                    placeholder="גיל"
                    type="number"
                  />
                  <FieldLabel label="מגדר" />
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard
                      label="אישה"
                      description="התאמת פנייה בלשון נקבה"
                      active={gender === 'female'}
                      onClick={() => setGender('female')}
                    />
                    <ChoiceCard
                      label="גבר"
                      description="התאמת פנייה בלשון זכר"
                      active={gender === 'male'}
                      onClick={() => setGender('male')}
                    />
                  </div>
                </div>
              </StepSection>
            ) : null}

            {step === 2 ? (
              <StepSection
                title="סוג סוכרת"
                description="בחירה אחת שמגדירה את הזרימה המתאימה."
              >
                <div className="space-y-3">
                  {DIABETES_TYPE_OPTIONS.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      active={diabetesType === option.value}
                      onClick={() => setDiabetesType(option.value)}
                      fullWidth
                    />
                  ))}
                </div>
              </StepSection>
            ) : null}

            {step === 3 ? (
              <StepSection
                title="טיפול קבוע"
                description="אפשר לבחור טיפול ולהוסיף תרופה, או לסמן שאין תרופה קבועה."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {TREATMENT_OPTIONS.map((option) => (
                      <ChoiceCard
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        active={treatmentType === option.value}
                        onClick={() => setTreatmentType(option.value)}
                      />
                    ))}
                  </div>

                  <ChoiceCard
                    label="אין לי תרופה קבועה"
                    description="המערכת תישאר במעקב בלי תזכורות לתרופה"
                    active={noMedicationSelected}
                    onClick={markNoMedication}
                    fullWidth
                  />

                  {!noMedicationSelected && treatmentType !== 'lifestyle' ? (
                    <div className="space-y-3">
                      <FieldLabel label="בחירת תרופה" />
                      {MEDICATION_PRESETS.map((preset) => (
                        <ChoiceCard
                          key={preset.key}
                          label={preset.name}
                          description={`${preset.dosage} · ${preset.appearanceLabel} · ${preset.time}`}
                          active={selectedMedicationNames.has(preset.name)}
                          onClick={() => toggleMedicationPreset(preset)}
                          fullWidth
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </StepSection>
            ) : null}

            {step === 4 ? (
              <StepSection
                title="סיכום ואישור"
                description="עוד שני יעדים יומיים ואפשר להיכנס."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel label="יעד נמוך" />
                      <LargeInput
                        value={targetLow}
                        onChange={setTargetLow}
                        placeholder="80"
                        type="number"
                      />
                    </div>
                    <div>
                      <FieldLabel label="יעד גבוה" />
                      <LargeInput
                        value={targetHigh}
                        onChange={setTargetHigh}
                        placeholder="140"
                        type="number"
                      />
                    </div>
                  </div>

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

                  <div
                    className="rounded-[24px] p-4"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <SummaryRow label="שם" value={name || 'לא הוזן'} />
                    <SummaryRow label="מגדר" value={gender === 'male' ? 'גבר' : 'אישה'} />
                    <SummaryRow
                      label="סוג סוכרת"
                      value={
                        DIABETES_TYPE_OPTIONS.find((option) => option.value === diabetesType)?.label ||
                        'לא נבחר'
                      }
                    />
                    <SummaryRow
                      label="טיפול"
                      value={
                        noMedicationSelected
                          ? 'אין תרופה קבועה'
                          : TREATMENT_OPTIONS.find((option) => option.value === treatmentType)
                              ?.label || 'לא נבחר'
                      }
                    />
                  </div>
                </div>
              </StepSection>
            ) : null}
          </div>

          <div className="mt-6">
            <button
              onClick={step === 4 ? handleFinish : nextStep}
              disabled={!canContinue}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] text-base font-black text-white transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: canContinue ? '0 18px 34px rgba(37, 99, 235, 0.22)' : 'none',
              }}
            >
              {step === 4 ? <Check size={18} strokeWidth={2.3} /> : <ChevronLeft size={18} strokeWidth={2.3} />}
              <span>{step === 4 ? 'כניסה לאפליקציה' : 'המשך'}</span>
            </button>
          </div>

          <div
            className="mt-4 flex items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-center"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
            <ShieldCheck size={17} className="text-[#2563EB]" />
            <p className="text-sm font-bold text-[#475569]">השלבים קצרים כדי שיהיה נוח וברור גם מהטלפון</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 text-right">
        <h2 className="text-[24px] font-black text-[#0F172A]">{title}</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <p className="mb-2 text-sm font-black text-[#334155]">{label}</p>;
}

function LargeInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      readOnly={readOnly}
      className="h-14 w-full rounded-[20px] bg-white px-4 text-right text-base font-bold text-[#0F172A] outline-none"
      dir="rtl"
      style={{
        border: '1.5px solid #DCE6F2',
        background: readOnly ? '#F8FAFC' : '#FFFFFF',
      }}
    />
  );
}

function ChoiceCard({
  active,
  description,
  fullWidth = false,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  fullWidth?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-[22px] p-4 text-right transition-all active:scale-[0.98] ${fullWidth ? 'w-full' : 'min-h-[120px]'}`}
      style={{
        background: active ? '#EFF6FF' : '#FFFFFF',
        border: `2px solid ${active ? '#2563EB' : '#DCE6F2'}`,
        boxShadow: active ? '0 14px 30px rgba(37, 99, 235, 0.12)' : '0 10px 22px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="absolute left-4 top-4">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: active ? '#2563EB' : '#F8FAFC',
            color: active ? '#FFFFFF' : '#94A3B8',
            border: `1px solid ${active ? '#2563EB' : '#DCE6F2'}`,
          }}
        >
          <Check size={14} strokeWidth={2.6} />
        </span>
      </div>

      <div className="pr-0 text-right">
        <p className="text-base font-black text-[#0F172A]">{label}</p>
        <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{description}</p>
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] py-3 last:border-b-0">
      <span className="text-sm font-bold text-[#64748B]">{label}</span>
      <span className="text-sm font-black text-[#0F172A]">{value}</span>
    </div>
  );
}
