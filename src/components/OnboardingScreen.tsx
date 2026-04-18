import { Check, ChevronLeft, Clock3, Pill, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type {
  DiabetesType,
  Gender,
  MedicationScheduleItem,
  TreatmentType,
  UserProfile,
} from '../context/AppContext';
import {
  FEMALE_THEME,
  MALE_THEME,
  getPeriodFromTime,
  useAppContext,
} from '../context/AppContext';
import { Logo } from './Logo';

const DIABETES_TYPE_OPTIONS: Array<{
  value: DiabetesType;
  label: string;
  description: string;
}> = [
  { value: 'prediabetes', label: 'טרום סוכרת', description: 'מעקב, תזונה ותנועה יומית' },
  { value: 'monitoring', label: 'עדיין בבדיקה', description: 'כשצריכים מעקב גם בלי אבחון סופי' },
  { value: '2', label: 'סוכרת סוג 2', description: 'לרוב כדורים ושגרה יומית' },
  { value: '1', label: 'סוכרת סוג 1', description: 'לרוב אינסולין ומעקב צמוד' },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentType; label: string; emoji: string }> = [
  { value: 'lifestyle', label: 'אורח חיים', emoji: '💪' },
  { value: 'pills', label: 'כדורים', emoji: '💊' },
  { value: 'insulin', label: 'אינסולין', emoji: '💉' },
  { value: 'combined', label: 'משולב', emoji: '🩺' },
];

const MEDICATION_PRESETS: Array<{
  key: string;
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  emoji: string;
  appearanceLabel: string;
  time: string;
}> = [
  {
    key: 'metformin',
    name: 'מטפורמין',
    dosage: '500 מ"ג',
    type: 'pill',
    emoji: '💊',
    appearanceLabel: 'כדור לבן',
    time: '08:00',
  },
  {
    key: 'jardiance',
    name: 'ג׳רדיאנס',
    dosage: '10 מ"ג',
    type: 'pill',
    emoji: '💊',
    appearanceLabel: 'כדור לבן',
    time: '08:00',
  },
  {
    key: 'ozempic',
    name: 'אוזמפיק',
    dosage: 'פעם בשבוע',
    type: 'injection',
    emoji: '💉',
    appearanceLabel: 'עט זריקה',
    time: '20:00',
  },
  {
    key: 'insulin',
    name: 'אינסולין',
    dosage: '10 יחידות',
    type: 'injection',
    emoji: '💉',
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
    image: preset.emoji,
    appearanceLabel: preset.appearanceLabel,
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
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('');
  const [targetLow, setTargetLow] = useState('80');
  const [targetHigh, setTargetHigh] = useState('140');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([]);
  const [noMedicationSelected, setNoMedicationSelected] = useState(false);

  const theme = gender === 'male' ? MALE_THEME : FEMALE_THEME;
  const totalSteps = 3;

  const selectedMedicationKeys = new Set(
    medications.map(
      (medication) =>
        MEDICATION_PRESETS.find((preset) => preset.name === medication.name)?.key ?? medication.id
    )
  );

  const canContinue =
    step === 0
      ? Boolean(gender && age.trim() && diabetesType)
      : step === 1
        ? Boolean(treatmentType)
        : Boolean(Number(targetLow) > 0 && Number(targetHigh) > Number(targetLow));

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

  const addEmptyMedication = () => {
    setNoMedicationSelected(false);
    setMedications((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: '',
        dosage: '',
        time: '08:00',
        period: 'בוקר',
        type: 'pill',
        image: '💊',
        appearanceLabel: 'כדור',
        notes: '',
        notifyEmergencyAfterMinutes: 45,
      },
    ]);
  };

  const updateMedication = (medicationId: string, patch: Partial<MedicationScheduleItem>) => {
    setMedications((prev) =>
      prev.map((medication) =>
        medication.id === medicationId
          ? {
              ...medication,
              ...patch,
              period:
                patch.time !== undefined ? getPeriodFromTime(patch.time) : medication.period,
            }
          : medication
      )
    );
  };

  const removeMedication = (medicationId: string) => {
    setMedications((prev) => prev.filter((item) => item.id !== medicationId));
  };

  const handleFinish = () => {
    const profile: UserProfile = {
      name: name.trim() || 'המשתמש/ת',
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
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
      message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
    });
    saveMedicationSchedule(
      noMedicationSelected
        ? []
        : medications
            .filter((item) => item.name.trim())
            .map((item) => ({
              ...item,
              period: getPeriodFromTime(item.time),
            }))
    );
    completeOnboarding();
  };

  const customMedications = medications.filter(
    (item) => !MEDICATION_PRESETS.some((preset) => preset.name === item.name)
  );

  return (
    <div className="min-h-[100dvh] px-4 py-6" dir="rtl" style={{ background: theme.gradientFull }}>
      <div className="mx-auto max-w-md">
        <div
          className="rounded-[34px] p-6"
          style={{
            background: 'rgba(255,255,255,0.96)',
            border: `1px solid ${theme.primaryBorder}`,
            boxShadow: `0 24px 54px ${theme.primaryShadow}`,
          }}
        >
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-[28px]"
              style={{
                background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F2 100%)',
                border: `1px solid ${theme.primaryBorder}`,
              }}
            >
              <Logo size={54} />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-[30px] font-black text-[#4D5B73]">כמה צעדים קצרים</h1>
            <p className="mt-3 text-sm leading-7 text-[#7C889A]">נגדיר רק מה שחשוב באמת וניכנס.</p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: step === index ? 30 : 10,
                  background: step === index ? theme.primary : '#E3E8F1',
                }}
              />
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {step === 0 ? (
              <>
                <SectionTitle title="נתחיל בפרטים בסיסיים" subtitle="בחירה גדולה וברורה" />

                <FieldLabel label="שם פרטי או כינוי" optional />
                <LargeInput
                  value={name}
                  onChange={setName}
                  placeholder="אפשר גם להשאיר ריק"
                  themeBorder={theme.primaryBorder}
                />

                <FieldLabel label="מגדר" />
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton
                    active={gender === 'female'}
                    label="אישה"
                    hint="👩 עיצוב נשי"
                    onClick={() => setGender('female')}
                    theme={theme}
                  />
                  <ChoiceButton
                    active={gender === 'male'}
                    label="גבר"
                    hint="👨 עיצוב גברי"
                    onClick={() => setGender('male')}
                    theme={theme}
                  />
                </div>

                <FieldLabel label="גיל" />
                <LargeInput
                  value={age}
                  onChange={setAge}
                  placeholder="למשל 62"
                  type="number"
                  themeBorder={theme.primaryBorder}
                />

                <FieldLabel label="מה הכי מתאים לך?" />
                <div className="grid grid-cols-2 gap-3">
                  {DIABETES_TYPE_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      active={diabetesType === option.value}
                      label={option.label}
                      hint={option.description}
                      onClick={() => setDiabetesType(option.value)}
                      theme={theme}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <SectionTitle title="טיפול ותרופות" subtitle="פחות כתיבה, יותר לחיצות" />

                <FieldLabel label="איך מטפלים בדרך כלל?" />
                <div className="grid grid-cols-2 gap-3">
                  {TREATMENT_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      active={treatmentType === option.value}
                      label={option.label}
                      hint={option.emoji}
                      onClick={() => setTreatmentType(option.value)}
                      theme={theme}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={markNoMedication}
                  className="flex min-h-[74px] w-full items-center justify-between rounded-[24px] px-5 text-right transition-all"
                  style={{
                    background: noMedicationSelected ? theme.primaryBg : '#FFFFFF',
                    border: `2px solid ${noMedicationSelected ? theme.primary : '#E2E8F0'}`,
                    color: noMedicationSelected ? theme.primaryDark : '#475569',
                    fontWeight: 900,
                  }}
                >
                  <span className="text-base">אין לי תרופה קבועה</span>
                  {noMedicationSelected ? <Check size={18} /> : <Pill size={18} />}
                </button>

                {!noMedicationSelected ? (
                  <>
                    <FieldLabel label="בחירה מהירה של תרופות" optional />
                    <div className="grid grid-cols-2 gap-3">
                      {MEDICATION_PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => toggleMedicationPreset(preset)}
                          className="min-h-[92px] rounded-[24px] p-4 text-right transition-all"
                          style={{
                            background: selectedMedicationKeys.has(preset.key)
                              ? theme.primaryBg
                              : '#FFFFFF',
                            border: `2px solid ${
                              selectedMedicationKeys.has(preset.key) ? theme.primary : '#E2E8F0'
                            }`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-2xl">{preset.emoji}</span>
                            {selectedMedicationKeys.has(preset.key) ? (
                              <span
                                className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                                style={{ background: theme.primary }}
                              >
                                <Check size={15} />
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-4">
                            <p className="text-[15px] font-black text-[#4D5B73]">{preset.name}</p>
                            <p className="mt-1 text-xs font-bold text-[#7F8CA0]">{preset.dosage}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addEmptyMedication}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[22px] font-extrabold"
                      style={{
                        background: '#FFFFFF',
                        color: theme.primaryDark,
                        border: `1px solid ${theme.primaryBorder}`,
                      }}
                    >
                      <Plus size={18} />
                      <span>הוספת תרופה ידנית</span>
                    </button>

                    {customMedications.length > 0 ? (
                      <div className="space-y-3">
                        {customMedications.map((medication) => (
                          <div
                            key={medication.id}
                            className="rounded-[24px] p-4"
                            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <button
                                onClick={() => removeMedication(medication.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                  background: '#FFF5F5',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                }}
                                aria-label="מחיקת תרופה"
                              >
                                <Trash2 size={16} />
                              </button>
                              <p className="font-black text-[#4D5B73]">תרופה ידנית</p>
                            </div>

                            <div className="space-y-3">
                              <LargeInput
                                value={medication.name}
                                onChange={(value) => updateMedication(medication.id, { name: value })}
                                placeholder="שם התרופה"
                                themeBorder={theme.primaryBorder}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <LargeInput
                                  value={medication.dosage}
                                  onChange={(value) => updateMedication(medication.id, { dosage: value })}
                                  placeholder="מינון"
                                  themeBorder={theme.primaryBorder}
                                />
                                <TimeInput
                                  value={medication.time}
                                  onChange={(value) => updateMedication(medication.id, { time: value })}
                                  themeBorder={theme.primaryBorder}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <SectionTitle title="יעדים וקשר חירום" subtitle="רק מה שצריך ליום יום" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="יעד נמוך" />
                    <LargeInput
                      value={targetLow}
                      onChange={setTargetLow}
                      placeholder="80"
                      type="number"
                      themeBorder={theme.primaryBorder}
                    />
                  </div>
                  <div>
                    <FieldLabel label="יעד גבוה" />
                    <LargeInput
                      value={targetHigh}
                      onChange={setTargetHigh}
                      placeholder="140"
                      type="number"
                      themeBorder={theme.primaryBorder}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="שעת קימה" />
                    <TimeInput value={wakeTime} onChange={setWakeTime} themeBorder={theme.primaryBorder} />
                  </div>
                  <div>
                    <FieldLabel label="שעת שינה" />
                    <TimeInput value={sleepTime} onChange={setSleepTime} themeBorder={theme.primaryBorder} />
                  </div>
                </div>

                <FieldLabel label="איש קשר לחירום" optional />
                <div className="grid grid-cols-2 gap-3">
                  <LargeInput
                    value={emergencyName}
                    onChange={setEmergencyName}
                    placeholder="שם מלא"
                    themeBorder={theme.primaryBorder}
                  />
                  <LargeInput
                    value={emergencyPhone}
                    onChange={setEmergencyPhone}
                    placeholder="טלפון"
                    type="tel"
                    themeBorder={theme.primaryBorder}
                  />
                </div>

                <div
                  className="rounded-[24px] p-4 text-right"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <ShieldCheck size={18} className="text-[#64748B]" />
                    <p className="font-black text-[#4D5B73]">מה נשמר בשבילך?</p>
                  </div>
                  <p className="text-sm leading-7 text-[#64748B]">
                    יעדי סוכר, תרופות, שעות היום ואיש קשר לחירום. הכול נשמר כדי להקל על השימוש היומי.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                className="flex h-14 w-24 items-center justify-center gap-1 rounded-[22px] font-extrabold"
                style={{
                  background: '#FFFFFF',
                  color: theme.primaryDark,
                  border: `1px solid ${theme.primaryBorder}`,
                }}
              >
                <ChevronLeft size={18} />
                <span>חזרה</span>
              </button>
            ) : null}

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                if (step === totalSteps - 1) {
                  handleFinish();
                  return;
                }
                setStep((current) => Math.min(current + 1, totalSteps - 1));
              }}
              className="flex h-14 flex-1 items-center justify-center rounded-[24px] text-white disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #8EADE4 0%, #D49BB0 100%)',
                fontWeight: 900,
                boxShadow: '0 18px 36px rgba(114, 138, 180, 0.18)',
              }}
            >
              {step === totalSteps - 1 ? 'סיום וכניסה לאפליקציה' : 'המשך'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-right">
      <h2 className="text-[24px] font-black text-[#4D5B73]">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-7 text-[#7C889A]">{subtitle}</p>
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
  themeBorder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  themeBorder: string;
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
        border: `1.5px solid ${themeBorder}`,
        boxShadow: '0 10px 22px rgba(122, 146, 182, 0.08)',
      }}
    />
  );
}

function TimeInput({
  value,
  onChange,
  themeBorder,
}: {
  value: string;
  onChange: (value: string) => void;
  themeBorder: string;
}) {
  return (
    <div
      className="flex h-14 items-center gap-3 rounded-[22px] px-4"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${themeBorder}`,
        boxShadow: '0 10px 22px rgba(122, 146, 182, 0.08)',
      }}
    >
      <Clock3 size={18} className="text-[#8DA8D6]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="time"
        dir="rtl"
        className="w-full bg-transparent text-right text-base font-bold text-[#4D5B73] outline-none"
      />
    </div>
  );
}

function ChoiceButton({
  active,
  label,
  hint,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
  theme: typeof FEMALE_THEME;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[84px] rounded-[22px] px-4 text-right font-extrabold transition-all"
      style={{
        background: active ? theme.primaryBg : '#FFFFFF',
        border: `2px solid ${active ? theme.primary : '#E2E8F0'}`,
        color: active ? theme.primaryDark : '#475569',
      }}
    >
      <div className="flex h-full flex-col justify-between">
        <p className="text-base">{label}</p>
        <p className="mt-2 text-xs font-bold text-[#8A97A8]">{hint}</p>
      </div>
    </button>
  );
}
