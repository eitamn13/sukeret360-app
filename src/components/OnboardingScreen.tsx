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
  setupTitle: '\u05d4\u05d2\u05d3\u05e8\u05d4 \u05e7\u05e6\u05e8\u05d4',
  setupSubtitle:
    '\u05e0\u05d2\u05d3\u05d9\u05e8 \u05e8\u05e7 \u05de\u05d4 \u05e9\u05d7\u05e9\u05d5\u05d1, \u05db\u05d3\u05d9 \u05e9\u05d4\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4 \u05ea\u05d4\u05d9\u05d4 \u05e0\u05d5\u05d7\u05d4 \u05dc\u05e9\u05d9\u05de\u05d5\u05e9.',
  next: '\u05d4\u05de\u05e9\u05da',
  back: '\u05d7\u05d6\u05e8\u05d4',
  finish: '\u05e0\u05db\u05e0\u05e1\u05d9\u05dd \u05dc\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4',
  woman: '\u05d0\u05d9\u05e9\u05d4',
  man: '\u05d2\u05d1\u05e8',
  name: '\u05e9\u05dd',
  optional: '\u05dc\u05d0 \u05d7\u05d5\u05d1\u05d4',
  age: '\u05d2\u05d9\u05dc',
  diagnosisYear: '\u05e9\u05e0\u05ea \u05d0\u05d1\u05d7\u05d5\u05df',
  type: '\u05e1\u05d5\u05d2 \u05de\u05e6\u05d1',
  treatment: '\u05e1\u05d5\u05d2 \u05d8\u05d9\u05e4\u05d5\u05dc',
  lowTarget: '\u05d9\u05e2\u05d3 \u05e0\u05de\u05d5\u05da',
  highTarget: '\u05d9\u05e2\u05d3 \u05d2\u05d1\u05d5\u05d4',
  wakeTime: '\u05e9\u05e2\u05ea \u05e7\u05d9\u05de\u05d4',
  sleepTime: '\u05e9\u05e2\u05ea \u05e9\u05d9\u05e0\u05d4',
  emergencyName: '\u05e9\u05dd \u05d0\u05d9\u05e9 \u05e7\u05e9\u05e8',
  emergencyPhone: '\u05d8\u05dc\u05e4\u05d5\u05df',
  emergencyMessage: '\u05d4\u05d5\u05d3\u05e2\u05ea \u05d7\u05d9\u05e8\u05d5\u05dd',
  messageDefault:
    '\u05d0\u05e0\u05d9 \u05e6\u05e8\u05d9\u05da/\u05d4 \u05e2\u05d6\u05e8\u05d4 \u05d3\u05d7\u05d5\u05e4\u05d4. \u05d6\u05d4 \u05d4\u05de\u05d9\u05e7\u05d5\u05dd \u05e9\u05dc\u05d9:',
  quickDrugs: '\u05d1\u05d7\u05d9\u05e8\u05d4 \u05de\u05d4\u05d9\u05e8\u05d4 \u05e9\u05dc \u05ea\u05e8\u05d5\u05e4\u05d5\u05ea',
  moreDrugs: '\u05d4\u05d5\u05e1\u05e4\u05ea \u05ea\u05e8\u05d5\u05e4\u05d4',
  noDrug: '\u05d0\u05d9\u05df \u05dc\u05d9 \u05e2\u05db\u05e9\u05d9\u05d5 \u05ea\u05e8\u05d5\u05e4\u05d4 \u05e7\u05d1\u05d5\u05e2\u05d4',
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
    label: '\u05d8\u05e8\u05d5\u05dd \u05e1\u05d5\u05db\u05e8\u05ea',
    description: '\u05de\u05e2\u05e7\u05d1 \u05e2\u05d3\u05d9\u05df, \u05ea\u05d6\u05d5\u05e0\u05d4 \u05d5\u05d4\u05dc\u05d9\u05db\u05d4',
  },
  {
    value: 'monitoring',
    label: '\u05e2\u05d3\u05d9\u05d9\u05df \u05d1\u05d1\u05d3\u05d9\u05e7\u05d4',
    description: '\u05de\u05ea\u05d0\u05d9\u05dd \u05dc\u05de\u05d9 \u05e9\u05e2\u05d3\u05d9\u05d9\u05df \u05d1\u05ea\u05d4\u05dc\u05d9\u05da \u05d1\u05d9\u05e8\u05d5\u05e8',
  },
  {
    value: '2',
    label: '\u05e1\u05d5\u05d2 2',
    description: '\u05dc\u05e8\u05d5\u05d1 \u05db\u05d3\u05d5\u05e8\u05d9\u05dd \u05d5\u05de\u05e2\u05e7\u05d1 \u05d9\u05d5\u05de\u05d9',
  },
  {
    value: '1',
    label: '\u05e1\u05d5\u05d2 1',
    description: '\u05dc\u05e8\u05d5\u05d1 \u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df \u05d5\u05de\u05e2\u05e7\u05d1 \u05ea\u05db\u05d5\u05e3',
  },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentType; label: string }> = [
  { value: 'lifestyle', label: '\u05d0\u05d5\u05e8\u05d7 \u05d7\u05d9\u05d9\u05dd' },
  { value: 'pills', label: '\u05db\u05d3\u05d5\u05e8\u05d9\u05dd' },
  { value: 'insulin', label: '\u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df' },
  { value: 'combined', label: '\u05de\u05e9\u05d5\u05dc\u05d1' },
];

const MEDICATION_PRESETS: Array<{
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  image: string;
  appearanceLabel: string;
}> = [
  {
    name: '\u05de\u05d8\u05e4\u05d5\u05e8\u05de\u05d9\u05df',
    dosage: '500 \u05de"\u05d2',
    type: 'pill',
    image: '\ud83d\udc8a',
    appearanceLabel: '\u05db\u05d3\u05d5\u05e8 \u05dc\u05d1\u05df',
  },
  {
    name: '\u05d2\u05f3\u05e8\u05d3\u05d9\u05d0\u05e0\u05e1',
    dosage: '10 \u05de"\u05d2',
    type: 'pill',
    image: '\ud83d\udc8a',
    appearanceLabel: '\u05db\u05d3\u05d5\u05e8 \u05dc\u05d1\u05df',
  },
  {
    name: '\u05d0\u05d5\u05d6\u05de\u05e4\u05d9\u05e7',
    dosage: '\u05e4\u05e2\u05dd \u05d1\u05e9\u05d1\u05d5\u05e2',
    type: 'injection',
    image: '\ud83d\udc89',
    appearanceLabel: '\u05e2\u05d8 \u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df',
  },
  {
    name: '\u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df',
    dosage: '10 \u05d9\u05d7\u05d9\u05d3\u05d5\u05ea',
    type: 'injection',
    image: '\ud83d\udc89',
    appearanceLabel: '\u05e2\u05d8 \u05d0\u05d9\u05e0\u05e1\u05d5\u05dc\u05d9\u05df',
  },
];

function getPeriodFromTimeLocal(time: string) {
  const [hours] = time.split(':').map(Number);
  if (!Number.isFinite(hours)) return '\u05ea\u05e8\u05d5\u05e4\u05d4';
  if (hours < 11) return '\u05d1\u05d5\u05e7\u05e8';
  if (hours < 16) return '\u05e6\u05d4\u05e8\u05d9\u05d9\u05dd';
  if (hours < 20) return '\u05d0\u05d7\u05e8 \u05d4\u05e6\u05d4\u05e8\u05d9\u05d9\u05dd';
  return '\u05e2\u05e8\u05d1';
}

function createMedicationDraft(preset?: (typeof MEDICATION_PRESETS)[number]): MedicationScheduleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: preset?.name ?? '',
    dosage: preset?.dosage ?? '',
    time: '08:00',
    period: '\u05d1\u05d5\u05e7\u05e8',
    type: preset?.type ?? 'pill',
    image: preset?.image ?? '\ud83d\udc8a',
    appearanceLabel: preset?.appearanceLabel ?? '\u05db\u05d3\u05d5\u05e8',
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
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [targetLow, setTargetLow] = useState('80');
  const [targetHigh, setTargetHigh] = useState('140');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState<string>(COPY.messageDefault);

  const totalSteps = 4;
  const brand = gender === 'male' ? MALE_BRAND : FEMALE_BRAND;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 35 }, (_, index) => String(currentYear - index));
  }, []);

  const canContinue =
    step === 0
      ? gender !== ''
      : step === 1
        ? age.trim().length > 0 && diabetesType !== '' && treatmentType !== ''
        : step === 2
          ? Number(targetLow) > 0 && Number(targetHigh) > Number(targetLow)
          : true;

  const updateMedication = (medicationId: string, patch: Partial<MedicationScheduleItem>) => {
    setMedications((prev) =>
      prev.map((medication) =>
        medication.id === medicationId
          ? {
              ...medication,
              ...patch,
              period: patch.time !== undefined ? getPeriodFromTimeLocal(patch.time) : medication.period,
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
      name: name.trim() || '\u05de\u05e9\u05ea\u05de\u05e9/\u05ea',
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
      message: emergencyMessage.trim() || COPY.messageDefault,
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
    <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-8" dir="rtl" style={{ background: brand.background }}>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
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

        <div className="mb-6 text-center">
          <h1 className="text-[30px]" style={{ color: brand.text, fontWeight: 900, letterSpacing: '-0.03em' }}>
            {COPY.setupTitle}
          </h1>
          <p className="mt-2 text-sm" style={{ color: brand.muted, fontWeight: 700 }}>
            {COPY.setupSubtitle}
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === step ? 34 : 10,
                height: 10,
                background:
                  index === step ? brand.strong : index < step ? brand.primary : '#E9E3DC',
              }}
            />
          ))}
        </div>

        <div
          className="rounded-[34px] p-6"
          style={{
            background: brand.card,
            border: `1px solid ${brand.border}`,
            boxShadow: `0 24px 60px ${brand.shadow}`,
          }}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <SectionTitle
                brand={brand}
                title={'\u05de\u05d9 \u05de\u05e9\u05ea\u05de\u05e9 \u05d1\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4?'}
                subtitle={'\u05e0\u05d1\u05d7\u05e8 \u05de\u05d2\u05d3\u05e8 \u05d5\u05e0\u05d5\u05e1\u05d9\u05e3 \u05e9\u05dd \u05d0\u05dd \u05e8\u05d5\u05e6\u05d9\u05dd.'}
              />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female' as Gender, label: COPY.woman, emoji: '\ud83d\udc69' },
                  { value: 'male' as Gender, label: COPY.man, emoji: '\ud83d\udc68' },
                ].map((item) => {
                  const active = gender === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setGender(item.value)}
                      className="rounded-[26px] p-4 text-center transition-all active:scale-[0.98]"
                      style={{
                        border: `2px solid ${active ? brand.primary : '#E7DED3'}`,
                        background: active ? brand.soft : '#FFFFFF',
                        boxShadow: active ? `0 16px 30px ${brand.shadow}` : 'none',
                      }}
                    >
                      <p className="mb-2 text-3xl">{item.emoji}</p>
                      <p style={{ color: active ? brand.primaryDark : brand.text, fontWeight: 900 }}>
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <FieldLabel text={COPY.name} brand={brand} />
              <TextInput value={name} onChange={setName} placeholder={COPY.optional} brand={brand} />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <SectionTitle
                brand={brand}
                title={'\u05de\u05d4 \u05de\u05ea\u05d0\u05d9\u05dd \u05dc\u05da?'}
                subtitle={'\u05e0\u05d1\u05d7\u05e8 \u05e1\u05d5\u05d2 \u05de\u05e6\u05d1 \u05d5\u05d8\u05d9\u05e4\u05d5\u05dc \u05e2\u05d9\u05e7\u05e8\u05d9.'}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text={COPY.age} brand={brand} />
                  <TextInput value={age} onChange={setAge} type="number" placeholder="62" brand={brand} />
                </div>
                <div>
                  <FieldLabel text={COPY.diagnosisYear} brand={brand} />
                  <SelectInput value={diagnosisYear} onChange={setDiagnosisYear} brand={brand}>
                    <option value="">{COPY.optional}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              <FieldLabel text={COPY.type} brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {DIABETES_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setDiabetesType(type.value)}
                    className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${diabetesType === type.value ? brand.primary : '#E7DED3'}`,
                      background: diabetesType === type.value ? brand.soft : '#FFFFFF',
                    }}
                  >
                    <p style={{ color: brand.text, fontWeight: 900, fontSize: 18 }}>{type.label}</p>
                    <p className="mt-2 text-sm" style={{ color: brand.muted, lineHeight: 1.6 }}>
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>

              <FieldLabel text={COPY.treatment} brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {TREATMENT_OPTIONS.map((item) => (
                  <ChoiceChip
                    key={item.value}
                    label={item.label}
                    active={treatmentType === item.value}
                    brand={brand}
                    onClick={() => setTreatmentType(item.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <SectionTitle
                brand={brand}
                title={'\u05d9\u05e2\u05d3\u05d9\u05dd \u05d5\u05e9\u05e2\u05d5\u05ea'}
                subtitle={'\u05d9\u05e2\u05d3 \u05e1\u05d5\u05db\u05e8 \u05d5\u05e9\u05d2\u05e8\u05d4 \u05d9\u05d5\u05de\u05d9\u05ea \u05e4\u05e9\u05d5\u05d8\u05d4.'}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text={COPY.lowTarget} brand={brand} />
                  <TextInput value={targetLow} onChange={setTargetLow} type="number" brand={brand} />
                </div>
                <div>
                  <FieldLabel text={COPY.highTarget} brand={brand} />
                  <TextInput value={targetHigh} onChange={setTargetHigh} type="number" brand={brand} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimeCard label={COPY.wakeTime} value={wakeTime} onChange={setWakeTime} brand={brand} />
                <TimeCard label={COPY.sleepTime} value={sleepTime} onChange={setSleepTime} brand={brand} />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <SectionTitle
                brand={brand}
                title={'\u05ea\u05e8\u05d5\u05e4\u05d5\u05ea \u05d5\u05d7\u05d9\u05e8\u05d5\u05dd'}
                subtitle={'\u05e2\u05d3\u05d9\u05e3 \u05dc\u05d1\u05d7\u05d5\u05e8 \u05d1\u05dc\u05d7\u05d9\u05e6\u05d4. \u05e4\u05d7\u05d5\u05ea \u05dc\u05db\u05ea\u05d5\u05d1.'}
              />

              <FieldLabel text={COPY.quickDrugs} brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {MEDICATION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => addMedicationFromPreset(preset)}
                    className="rounded-[22px] p-4 text-right transition-all active:scale-[0.98]"
                    style={{
                      background: '#FFFFFF',
                      border: `1.5px solid ${brand.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl">{preset.image}</span>
                      <div className="text-right">
                        <p style={{ color: brand.text, fontWeight: 900 }}>{preset.name}</p>
                        <p className="mt-1 text-sm" style={{ color: brand.muted }}>
                          {preset.dosage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addEmptyMedication}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[20px]"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${brand.border}`,
                    color: brand.primaryDark,
                    fontWeight: 800,
                  }}
                >
                  <Plus size={17} />
                  <span>{COPY.moreDrugs}</span>
                </button>
                <button
                  onClick={() => setMedications([])}
                  className="flex h-12 items-center justify-center rounded-[20px] px-4"
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${brand.border}`,
                    color: brand.muted,
                    fontWeight: 800,
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
                          aria-label={'\u05de\u05d7\u05e7 \u05ea\u05e8\u05d5\u05e4\u05d4'}
                        >
                          <Trash2 size={16} />
                        </button>
                        <p style={{ color: brand.text, fontWeight: 900 }}>
                          {`\u05ea\u05e8\u05d5\u05e4\u05d4 ${index + 1}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <TextInput
                          value={medication.name}
                          onChange={(value) => updateMedication(medication.id, { name: value })}
                          placeholder={'\u05e9\u05dd \u05d4\u05ea\u05e8\u05d5\u05e4\u05d4'}
                          brand={brand}
                        />
                        <TextInput
                          value={medication.dosage}
                          onChange={(value) => updateMedication(medication.id, { dosage: value })}
                          placeholder={'\u05de\u05d9\u05e0\u05d5\u05df'}
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
                          label={
                            medication.type === 'injection'
                              ? '\u05d6\u05e8\u05d9\u05e7\u05d4'
                              : '\u05db\u05d3\u05d5\u05e8'
                          }
                          active
                          brand={brand}
                          onClick={() =>
                            updateMedication(medication.id, {
                              type: medication.type === 'pill' ? 'injection' : 'pill',
                              image: medication.type === 'pill' ? '\ud83d\udc89' : '\ud83d\udc8a',
                            })
                          }
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
                <TextInput value={emergencyName} onChange={setEmergencyName} placeholder={COPY.optional} brand={brand} />
                <div className="mt-3" />
                <FieldLabel text={COPY.emergencyPhone} brand={brand} />
                <TextInput value={emergencyPhone} onChange={setEmergencyPhone} placeholder="0501234567" brand={brand} />
                <div className="mt-3" />
                <FieldLabel text={COPY.emergencyMessage} brand={brand} />
                <textarea
                  value={emergencyMessage}
                  onChange={(event) => setEmergencyMessage(event.target.value)}
                  rows={3}
                  dir="rtl"
                  className="w-full rounded-[22px] px-4 py-3 text-right outline-none"
                  style={{
                    border: `1.5px solid ${brand.border}`,
                    backgroundColor: '#FFFFFF',
                    color: brand.text,
                    fontWeight: 700,
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep((current) => current - 1)}
                className="flex h-13 items-center justify-center gap-1 rounded-[22px] px-5"
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
              className="flex h-13 flex-1 items-center justify-center rounded-[24px] px-6 disabled:opacity-55"
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
      <h2 style={{ color: brand.text, fontWeight: 900, fontSize: 26 }}>{title}</h2>
      <p className="mt-2 text-sm" style={{ color: brand.muted, lineHeight: 1.7, fontWeight: 700 }}>
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
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      dir="rtl"
      className="h-14 w-full rounded-[22px] px-4 text-right outline-none"
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
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir="rtl"
      className="h-14 w-full rounded-[22px] px-4 text-right outline-none"
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
}: {
  label: string;
  active: boolean;
  brand: typeof FEMALE_BRAND;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[22px] py-3.5 text-center transition-all active:scale-[0.98]"
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
      className="flex h-14 items-center gap-3 rounded-[22px] px-4"
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
