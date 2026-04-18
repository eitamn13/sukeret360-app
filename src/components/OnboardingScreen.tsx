import type { ReactNode } from 'react';
import { ChevronLeft, Clock3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Logo } from './Logo';
import type {
  DiabetesType,
  Gender,
  MedicationScheduleItem,
  TreatmentType,
  UserProfile,
} from '../context/AppContext';
import { useAppContext } from '../context/AppContext';

const COPY = {
  title: 'הגדרה קצרה',
  subtitle: 'נגדיר רק מה שחשוב כדי שהאפליקציה תהיה ברורה ונוחה מההתחלה.',
  next: 'המשך',
  back: 'חזרה',
  finish: 'נכנסים לאפליקציה',
  woman: 'אישה',
  man: 'גבר',
  name: 'שם',
  optional: 'לא חובה',
  age: 'גיל',
  diagnosisYear: 'שנת אבחון',
  diabetesType: 'מצב רפואי',
  treatment: 'סוג טיפול',
  lowTarget: 'יעד נמוך',
  highTarget: 'יעד גבוה',
  wakeTime: 'שעת קימה',
  sleepTime: 'שעת שינה',
  emergencyName: 'איש קשר',
  emergencyPhone: 'טלפון',
  quickDrugs: 'בחירת תרופות בלחיצה',
  addDrug: 'הוספת תרופה',
  noDrug: 'אין כרגע תרופה קבועה',
} as const;

const FEMALE_BRAND = {
  primary: '#C9859F',
  primaryDark: '#6F4C5A',
  border: '#EAD8DC',
  text: '#5A4740',
  muted: '#8D7A73',
  background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF7F1 52%, #FFFDF9 100%)',
  card: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F4 100%)',
  strong: 'linear-gradient(135deg, #D89CB3 0%, #A86B83 100%)',
  soft: 'linear-gradient(135deg, rgba(248,218,226,0.95) 0%, rgba(255,247,244,0.96) 100%)',
  shadow: 'rgba(174, 133, 148, 0.18)',
};

const MALE_BRAND = {
  primary: '#6B97D6',
  primaryDark: '#4A6587',
  border: '#DBE6F4',
  text: '#41566F',
  muted: '#73879F',
  background: 'linear-gradient(180deg, #FCFEFF 0%, #F3F8FF 52%, #FCFEFF 100%)',
  card: 'linear-gradient(145deg, #FFFFFF 0%, #F6FAFF 100%)',
  strong: 'linear-gradient(135deg, #7CA8E7 0%, #4E6F9D 100%)',
  soft: 'linear-gradient(135deg, rgba(220,235,255,0.96) 0%, rgba(247,250,255,0.98) 100%)',
  shadow: 'rgba(112, 148, 199, 0.18)',
};

const DIABETES_TYPE_OPTIONS: Array<{
  value: DiabetesType;
  label: string;
  description: string;
}> = [
  {
    value: 'prediabetes',
    label: 'טרום סוכרת',
    description: 'מעקב, תזונה והליכה',
  },
  {
    value: 'monitoring',
    label: 'עדיין בבדיקה',
    description: 'כשעדיין אין אבחון סופי',
  },
  {
    value: '2',
    label: 'סוג 2',
    description: 'כדורים, שגרה ואיזון',
  },
  {
    value: '1',
    label: 'סוג 1',
    description: 'לרוב אינסולין ומעקב תכוף',
  },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentType; label: string }> = [
  { value: 'lifestyle', label: 'אורח חיים' },
  { value: 'pills', label: 'כדורים' },
  { value: 'insulin', label: 'אינסולין' },
  { value: 'combined', label: 'משולב' },
];

const MEDICATION_PRESETS: Array<{
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  image: string;
  appearanceLabel: string;
}> = [
  {
    name: 'מטפורמין',
    dosage: '500 מ"ג',
    type: 'pill',
    image: '💊',
    appearanceLabel: 'כדור לבן',
  },
  {
    name: 'ג׳רדיאנס',
    dosage: '10 מ"ג',
    type: 'pill',
    image: '💊',
    appearanceLabel: 'כדור לבן',
  },
  {
    name: 'אוזמפיק',
    dosage: 'פעם בשבוע',
    type: 'injection',
    image: '💉',
    appearanceLabel: 'עט אינסולין',
  },
  {
    name: 'אינסולין',
    dosage: '10 יחידות',
    type: 'injection',
    image: '💉',
    appearanceLabel: 'עט אינסולין',
  },
];

function getPeriodFromTimeLocal(time: string) {
  const [hours] = time.split(':').map(Number);
  if (!Number.isFinite(hours)) return 'תרופה';
  if (hours < 11) return 'בוקר';
  if (hours < 16) return 'צהריים';
  if (hours < 20) return 'אחר הצהריים';
  return 'ערב';
}

function createMedicationDraft(
  preset?: (typeof MEDICATION_PRESETS)[number]
): MedicationScheduleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: preset?.name ?? '',
    dosage: preset?.dosage ?? '',
    time: '08:00',
    period: 'בוקר',
    type: preset?.type ?? 'pill',
    image: preset?.image ?? '💊',
    appearanceLabel: preset?.appearanceLabel ?? 'כדור',
    notes: '',
    notifyEmergencyAfterMinutes: 45,
  };
}

export function OnboardingScreen() {
  const { completeOnboarding, saveEmergencyContact, saveMedicationSchedule, saveUserProfile } =
    useAppContext();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [age, setAge] = useState('');
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('');
  const [targetLow, setTargetLow] = useState('80');
  const [targetHigh, setTargetHigh] = useState('140');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const totalSteps = 3;
  const brand = gender === 'male' ? MALE_BRAND : FEMALE_BRAND;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 35 }, (_, index) => String(currentYear - index));
  }, []);

  const canContinue =
    step === 0
      ? gender !== '' && age.trim().length > 0
      : step === 1
        ? diabetesType !== '' &&
          treatmentType !== '' &&
          Number(targetLow) > 0 &&
          Number(targetHigh) > Number(targetLow)
        : true;

  const updateMedication = (
    medicationId: string,
    patch: Partial<MedicationScheduleItem>
  ) => {
    setMedications((prev) =>
      prev.map((medication) =>
        medication.id === medicationId
          ? {
              ...medication,
              ...patch,
              period:
                patch.time !== undefined
                  ? getPeriodFromTimeLocal(patch.time)
                  : medication.period,
            }
          : medication
      )
    );
  };

  const addMedicationFromPreset = (preset: (typeof MEDICATION_PRESETS)[number]) => {
    setMedications((prev) => [...prev, createMedicationDraft(preset)]);
  };

  const addEmptyMedication = () => {
    setMedications((prev) => [...prev, createMedicationDraft()]);
  };

  const removeMedication = (medicationId: string) => {
    setMedications((prev) => prev.filter((item) => item.id !== medicationId));
  };

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim() || 'משתמש/ת',
      age,
      diabetesType,
      gender,
      diagnosisYear,
      treatmentType,
      targetLow,
      targetHigh,
      wakeTime,
      sleepTime,
    };

    saveUserProfile(profile);
    saveEmergencyContact({
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
      message: 'אני צריך/ה עזרה דחופה. זה המיקום שלי:',
    });
    saveMedicationSchedule(
      medications
        .filter((medication) => medication.name.trim())
        .map((medication) => ({
          ...medication,
          period: medication.period || getPeriodFromTimeLocal(medication.time),
        }))
    );
    completeOnboarding();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto px-4 py-5"
      dir="rtl"
      style={{ background: brand.background }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[32px]"
            style={{
              background: brand.card,
              border: `1px solid ${brand.border}`,
              boxShadow: `0 18px 38px ${brand.shadow}`,
            }}
          >
            <Logo size={58} />
          </div>
        </div>

        <div className="mb-5 text-center">
          <h1
            className="text-[30px]"
            style={{ color: brand.text, fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            {COPY.title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: brand.muted, fontWeight: 700 }}>
            {COPY.subtitle}
          </p>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === step ? 38 : 12,
                height: 12,
                background:
                  index === step ? brand.strong : index < step ? brand.primary : '#E9E3DC',
              }}
            />
          ))}
        </div>

        <div
          className="rounded-[34px] p-5"
          style={{
            background: brand.card,
            border: `1px solid ${brand.border}`,
            boxShadow: `0 24px 60px ${brand.shadow}`,
          }}
        >
          {step === 0 ? (
            <div className="space-y-5">
              <SectionTitle
                brand={brand}
                title="נתחיל בכמה פרטים"
                subtitle="בחירה פשוטה, עם כמה שפחות הקלדה."
              />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female' as Gender, label: COPY.woman, emoji: '👩' },
                  { value: 'male' as Gender, label: COPY.man, emoji: '👨' },
                ].map((item) => {
                  const active = gender === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setGender(item.value)}
                      className="rounded-[28px] px-4 py-5 text-center transition-all active:scale-[0.98]"
                      style={{
                        minHeight: 144,
                        border: `2px solid ${active ? brand.primary : '#E7DED3'}`,
                        background: active ? brand.soft : '#FFFFFF',
                        boxShadow: active ? `0 16px 30px ${brand.shadow}` : 'none',
                      }}
                    >
                      <p className="mb-3 text-4xl">{item.emoji}</p>
                      <p
                        style={{
                          color: active ? brand.primaryDark : brand.text,
                          fontWeight: 900,
                          fontSize: 20,
                        }}
                      >
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel text={COPY.name} brand={brand} />
                  <TextInput
                    value={name}
                    onChange={setName}
                    placeholder={COPY.optional}
                    brand={brand}
                    heightClass="h-16"
                  />
                </div>

                <div>
                  <FieldLabel text={COPY.age} brand={brand} />
                  <TextInput
                    value={age}
                    onChange={setAge}
                    type="number"
                    placeholder="62"
                    brand={brand}
                    heightClass="h-16"
                  />
                </div>

                <div>
                  <FieldLabel text={COPY.diagnosisYear} brand={brand} />
                  <SelectInput
                    value={diagnosisYear}
                    onChange={setDiagnosisYear}
                    brand={brand}
                    heightClass="h-16"
                  >
                    <option value="">{COPY.optional}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <SectionTitle
                brand={brand}
                title="מה מתאים לך?"
                subtitle="נבחר מצב רפואי, סוג טיפול ויעדים ליום."
              />

              <div>
                <FieldLabel text={COPY.diabetesType} brand={brand} />
                <div className="grid grid-cols-2 gap-3">
                  {DIABETES_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setDiabetesType(type.value)}
                      className="rounded-[24px] px-4 py-4 text-right transition-all active:scale-[0.98]"
                      style={{
                        minHeight: 122,
                        border: `2px solid ${
                          diabetesType === type.value ? brand.primary : '#E7DED3'
                        }`,
                        background: diabetesType === type.value ? brand.soft : '#FFFFFF',
                      }}
                    >
                      <p style={{ color: brand.text, fontWeight: 900, fontSize: 18 }}>
                        {type.label}
                      </p>
                      <p
                        className="mt-2 text-sm"
                        style={{ color: brand.muted, lineHeight: 1.7, fontWeight: 700 }}
                      >
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel text={COPY.treatment} brand={brand} />
                <div className="grid grid-cols-2 gap-3">
                  {TREATMENT_OPTIONS.map((item) => (
                    <ChoiceChip
                      key={item.value}
                      label={item.label}
                      active={treatmentType === item.value}
                      brand={brand}
                      onClick={() => setTreatmentType(item.value)}
                      size="large"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ValueCard
                  label={COPY.lowTarget}
                  value={targetLow}
                  onChange={setTargetLow}
                  brand={brand}
                />
                <ValueCard
                  label={COPY.highTarget}
                  value={targetHigh}
                  onChange={setTargetHigh}
                  brand={brand}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimeCard label={COPY.wakeTime} value={wakeTime} onChange={setWakeTime} brand={brand} />
                <TimeCard
                  label={COPY.sleepTime}
                  value={sleepTime}
                  onChange={setSleepTime}
                  brand={brand}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <SectionTitle
                brand={brand}
                title="תרופות וקשר חירום"
                subtitle="פחות לכתוב, יותר לבחור בלחיצה."
              />

              <div>
                <FieldLabel text={COPY.quickDrugs} brand={brand} />
                <div className="grid grid-cols-2 gap-3">
                  {MEDICATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => addMedicationFromPreset(preset)}
                      className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
                      style={{
                        minHeight: 110,
                        background: '#FFFFFF',
                        border: `1.5px solid ${brand.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-3xl">{preset.image}</span>
                        <div className="text-right">
                          <p style={{ color: brand.text, fontWeight: 900, fontSize: 18 }}>
                            {preset.name}
                          </p>
                          <p className="mt-2 text-sm" style={{ color: brand.muted, fontWeight: 700 }}>
                            {preset.dosage}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addEmptyMedication}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[22px]"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${brand.border}`,
                    color: brand.primaryDark,
                    fontWeight: 900,
                  }}
                >
                  <Plus size={18} />
                  <span>{COPY.addDrug}</span>
                </button>

                <button
                  onClick={() => setMedications([])}
                  className="flex h-14 items-center justify-center rounded-[22px] px-4"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${brand.border}`,
                    color: brand.muted,
                    fontWeight: 900,
                  }}
                >
                  {COPY.noDrug}
                </button>
              </div>

              {medications.length > 0 ? (
                <div className="space-y-3">
                  {medications.map((medication, index) => (
                    <div
                      key={medication.id}
                      className="rounded-[24px] p-4"
                      style={{
                        background: '#FFFFFF',
                        border: `1.5px solid ${brand.border}`,
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <button
                          onClick={() => removeMedication(medication.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl"
                          style={{ background: '#FFF1F2', color: '#E11D48' }}
                          aria-label="מחק תרופה"
                        >
                          <Trash2 size={16} />
                        </button>
                        <p style={{ color: brand.text, fontWeight: 900 }}>
                          {`תרופה ${index + 1}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <TextInput
                          value={medication.name}
                          onChange={(value) => updateMedication(medication.id, { name: value })}
                          placeholder="שם התרופה"
                          brand={brand}
                        />
                        <TextInput
                          value={medication.dosage}
                          onChange={(value) => updateMedication(medication.id, { dosage: value })}
                          placeholder="מינון"
                          brand={brand}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <TimeInput
                          value={medication.time}
                          onChange={(value) => updateMedication(medication.id, { time: value })}
                          brand={brand}
                        />
                        <ChoiceChip
                          label={medication.type === 'injection' ? 'זריקה' : 'כדור'}
                          active
                          brand={brand}
                          onClick={() =>
                            updateMedication(medication.id, {
                              type: medication.type === 'pill' ? 'injection' : 'pill',
                              image: medication.type === 'pill' ? '💉' : '💊',
                              appearanceLabel:
                                medication.type === 'pill' ? 'עט אינסולין' : 'כדור',
                            })
                          }
                          size="medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div
                className="rounded-[24px] p-4"
                style={{ background: '#FFFFFF', border: `1.5px solid ${brand.border}` }}
              >
                <FieldLabel text={COPY.emergencyName} brand={brand} />
                <TextInput
                  value={emergencyName}
                  onChange={setEmergencyName}
                  placeholder={COPY.optional}
                  brand={brand}
                />
                <div className="mt-3" />
                <FieldLabel text={COPY.emergencyPhone} brand={brand} />
                <TextInput
                  value={emergencyPhone}
                  onChange={setEmergencyPhone}
                  placeholder="0501234567"
                  brand={brand}
                />
                <p
                  className="mt-3 text-right text-sm"
                  style={{ color: brand.muted, lineHeight: 1.7, fontWeight: 700 }}
                >
                  הודעת החירום תיקבע אוטומטית וניתן לשנות אותה אחר כך בהגדרות.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep((current) => current - 1)}
                className="flex h-14 items-center justify-center gap-1 rounded-[22px] px-5"
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${brand.border}`,
                  color: brand.primaryDark,
                  fontWeight: 900,
                }}
              >
                <ChevronLeft size={18} />
                <span>{COPY.back}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={step === totalSteps - 1 ? finish : () => setStep((current) => current + 1)}
              disabled={!canContinue}
              className="flex h-14 flex-1 items-center justify-center rounded-[24px] px-6 disabled:opacity-55"
              style={{
                background: brand.strong,
                color: '#FFFFFF',
                fontWeight: 900,
                boxShadow: `0 18px 36px ${brand.shadow}`,
              }}
            >
              {step === totalSteps - 1 ? COPY.finish : COPY.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  brand,
}: {
  title: string;
  subtitle: string;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <div className="text-right">
      <h2 style={{ color: brand.text, fontWeight: 900, fontSize: 28 }}>{title}</h2>
      <p className="mt-2 text-sm" style={{ color: brand.muted, lineHeight: 1.8, fontWeight: 700 }}>
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ text, brand }: { text: string; brand: typeof FEMALE_BRAND }) {
  return (
    <p className="mb-2 text-right text-sm" style={{ color: brand.muted, fontWeight: 800 }}>
      {text}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  brand,
  heightClass = 'h-14',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  brand: typeof FEMALE_BRAND;
  heightClass?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      dir="rtl"
      className={`${heightClass} w-full rounded-[22px] px-4 text-right outline-none`}
      style={{
        border: `1.5px solid ${brand.border}`,
        backgroundColor: '#FFFFFF',
        color: brand.text,
        fontWeight: 700,
      }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  children,
  brand,
  heightClass = 'h-14',
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  brand: typeof FEMALE_BRAND;
  heightClass?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir="rtl"
      className={`${heightClass} w-full rounded-[22px] px-4 text-right outline-none`}
      style={{
        border: `1.5px solid ${brand.border}`,
        backgroundColor: '#FFFFFF',
        color: brand.text,
        fontWeight: 700,
      }}
    >
      {children}
    </select>
  );
}

function ChoiceChip({
  label,
  active,
  brand,
  onClick,
  size,
}: {
  label: string;
  active: boolean;
  brand: typeof FEMALE_BRAND;
  onClick: () => void;
  size: 'medium' | 'large';
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[22px] text-center transition-all active:scale-[0.98] ${
        size === 'large' ? 'py-4 text-base' : 'py-3.5 text-sm'
      }`}
      style={{
        border: `2px solid ${active ? brand.primary : '#E7DED3'}`,
        background: active ? brand.soft : '#FFFFFF',
        color: active ? brand.primaryDark : brand.text,
        fontWeight: 800,
      }}
    >
      {label}
    </button>
  );
}

function ValueCard({
  label,
  value,
  onChange,
  brand,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <div
      className="rounded-[24px] p-4"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${brand.border}`,
      }}
    >
      <FieldLabel text={label} brand={brand} />
      <TextInput value={value} onChange={onChange} type="number" brand={brand} heightClass="h-16" />
    </div>
  );
}

function TimeCard({
  label,
  value,
  onChange,
  brand,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <div
      className="rounded-[24px] p-4"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${brand.border}`,
      }}
    >
      <FieldLabel text={label} brand={brand} />
      <TimeInput value={value} onChange={onChange} brand={brand} />
    </div>
  );
}

function TimeInput({
  value,
  onChange,
  brand,
}: {
  value: string;
  onChange: (value: string) => void;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <label
      className="flex h-16 items-center gap-3 rounded-[22px] px-4"
      style={{
        border: `1.5px solid ${brand.border}`,
        backgroundColor: '#FFFFFF',
        color: brand.text,
      }}
    >
      <Clock3 size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="time"
        dir="ltr"
        className="w-full bg-transparent text-left outline-none"
        style={{ color: brand.text, fontWeight: 800 }}
      />
    </label>
  );
}
