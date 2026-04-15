import { ChevronLeft, Clock3, Pill, Plus, Shield, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Logo } from './Logo';
import {
  Gender,
  MedicationScheduleItem,
  MedicationVisual,
  TreatmentType,
  UserProfile,
  getPeriodFromTime,
  useAppContext,
} from '../context/AppContext';
import type { ReactNode } from 'react';

const FEMALE_BRAND = {
  primary: '#C9859F',
  primaryDark: '#6F4C5A',
  secondary: '#FCE7EE',
  accent: '#E8B2C3',
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
  secondary: '#EAF3FF',
  accent: '#BFD4F4',
  border: '#DBE6F4',
  text: '#41566F',
  muted: '#73879F',
  background: 'linear-gradient(180deg, #FCFEFF 0%, #F3F8FF 52%, #FCFEFF 100%)',
  card: 'linear-gradient(145deg, #FFFFFF 0%, #F6FAFF 100%)',
  strong: 'linear-gradient(135deg, #7CA8E7 0%, #4E6F9D 100%)',
  soft: 'linear-gradient(135deg, rgba(220,235,255,0.96) 0%, rgba(247,250,255,0.98) 100%)',
  shadow: 'rgba(112, 148, 199, 0.18)',
};

const MED_VISUALS: Array<{
  value: MedicationVisual;
  label: string;
  symbol: string;
  color: string;
}> = [
  { value: 'blue-pill', label: 'כדור כחול', symbol: '💊', color: '#5B8ED8' },
  { value: 'white-pill', label: 'כדור לבן', symbol: '⚪', color: '#D8D1C8' },
  { value: 'pink-pill', label: 'כדור ורוד', symbol: '🩷', color: '#D591A9' },
  { value: 'insulin-pen', label: 'עט אינסולין', symbol: '💉', color: '#6FA56E' },
];

function createMedicationDraft(): MedicationScheduleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    dosage: '',
    time: '08:00',
    period: 'בוקר',
    type: 'pill',
    image: '⚪',
    appearanceLabel: 'כדור לבן',
    notes: '',
    notifyEmergencyAfterMinutes: 45,
  };
}

function getTreatmentLabel(treatmentType: TreatmentType) {
  if (treatmentType === 'insulin') return 'אינסולין';
  if (treatmentType === 'pills') return 'כדורים';
  if (treatmentType === 'combined') return 'שילוב';
  if (treatmentType === 'lifestyle') return 'אורח חיים';
  return 'טרם הוגדר';
}

export function OnboardingScreen() {
  const {
    saveUserProfile,
    completeOnboarding,
    saveEmergencyContact,
    saveMedicationSchedule,
  } = useAppContext();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [age, setAge] = useState('');
  const [diabetesType, setDiabetesType] = useState<'1' | '2' | ''>('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('');
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [targetLow, setTargetLow] = useState('80');
  const [targetHigh, setTargetHigh] = useState('140');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([createMedicationDraft()]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('אני צריך/ה עזרה דחופה. זה המיקום שלי:');

  const totalSteps = 5;
  const brand = gender === 'male' ? MALE_BRAND : FEMALE_BRAND;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 35 }, (_, index) => String(currentYear - index));
  }, []);

  const canNext =
    step === 0
      ? name.trim().length > 0 && gender !== ''
      : step === 1
        ? age.trim().length > 0 && Number(age) > 0 && Number(age) < 120 && diabetesType !== '' && treatmentType !== ''
        : step === 2
          ? Number(targetLow) > 0 && Number(targetHigh) > Number(targetLow) && wakeTime.trim().length > 0 && sleepTime.trim().length > 0
          : step === 3
            ? medications.every((medication) => !medication.name.trim() || Boolean(medication.time.trim()))
            : true;

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
      message: emergencyMessage.trim() || 'אני צריך/ה עזרה דחופה. זה המיקום שלי:',
    });

    saveMedicationSchedule(
      medications
        .filter((medication) => medication.name.trim())
        .map((medication) => ({
          ...medication,
          period: getPeriodFromTime(medication.time),
        }))
    );

    completeOnboarding();
  };

  const updateMedication = (medicationId: string, patch: Partial<MedicationScheduleItem>) => {
    setMedications((prev) =>
      prev.map((medication) =>
        medication.id === medicationId
          ? {
              ...medication,
              ...patch,
              period: patch.time !== undefined ? getPeriodFromTime(patch.time) : medication.period,
            }
          : medication
      )
    );
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, createMedicationDraft()]);
  };

  const removeMedication = (medicationId: string) => {
    setMedications((prev) => (prev.length === 1 ? [createMedicationDraft()] : prev.filter((item) => item.id !== medicationId)));
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto px-4 py-8"
      dir="rtl"
      style={{ background: brand.background }}
    >
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div
            className="w-24 h-24 rounded-[32px] flex items-center justify-center"
            style={{
              background: brand.card,
              border: `1px solid ${brand.border}`,
              boxShadow: `0 18px 38px ${brand.shadow}`,
            }}
          >
            <Logo size={70} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-[30px]" style={{ color: brand.text, fontWeight: 900, letterSpacing: '-0.03em' }}>
            הסוכרת שלי
          </h1>
          <p className="mt-2 text-sm" style={{ color: brand.muted, fontWeight: 700 }}>
            נגדיר את האפליקציה כך שתתאים בדיוק לך
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === step ? 34 : 10,
                height: 10,
                background: index === step ? brand.strong : index < step ? brand.accent : '#E9E3DC',
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
          {step === 0 && (
            <div className="space-y-4">
              <SectionHeader
                brand={brand}
                eyebrow="שלב ראשון"
                title="כמה פרטים קצרים"
                subtitle="שם ומגדר כדי שהאפליקציה תדבר ותיראה נכון כבר מההתחלה."
              />

              <FieldLabel text="איך קוראים לך?" brand={brand} />
              <TextInput
                value={name}
                onChange={setName}
                placeholder="למשל: רות, דוד, מרים"
                brand={brand}
              />

              <FieldLabel text="מגדר" brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female' as Gender, label: 'אישה', emoji: '👩' },
                  { value: 'male' as Gender, label: 'גבר', emoji: '👨' },
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
                      <p className="text-3xl mb-2">{item.emoji}</p>
                      <p style={{ color: active ? brand.primaryDark : brand.text, fontWeight: 900 }}>{item.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SectionHeader
                brand={brand}
                eyebrow="שלב שני"
                title="המצב הרפואי שלך"
                subtitle="רק מה שחשוב כדי לבנות מסך בית ותזכורות שמתאימים לך."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="גיל" brand={brand} />
                  <TextInput value={age} onChange={setAge} placeholder="62" type="number" brand={brand} />
                </div>
                <div>
                  <FieldLabel text="שנת אבחון" brand={brand} />
                  <SelectInput value={diagnosisYear} onChange={setDiagnosisYear} brand={brand}>
                    <option value="">לא חובה</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              <FieldLabel text="סוג סוכרת" brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiabetesType(type)}
                    className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${diabetesType === type ? brand.primary : '#E7DED3'}`,
                      background: diabetesType === type ? brand.soft : '#FFFFFF',
                    }}
                  >
                    <p style={{ color: brand.text, fontWeight: 900, fontSize: 20 }}>סוג {type}</p>
                    <p className="mt-2 text-sm" style={{ color: brand.muted, lineHeight: 1.6 }}>
                      {type === '1' ? 'לרוב תלוי באינסולין' : 'לרוב טיפול בכדורים או אורח חיים'}
                    </p>
                  </button>
                ))}
              </div>

              <FieldLabel text="סוג טיפול עיקרי" brand={brand} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'insulin' as TreatmentType, label: 'אינסולין' },
                  { value: 'pills' as TreatmentType, label: 'כדורים' },
                  { value: 'combined' as TreatmentType, label: 'שילוב' },
                  { value: 'lifestyle' as TreatmentType, label: 'אורח חיים' },
                ].map((item) => (
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
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionHeader
                brand={brand}
                eyebrow="שלב שלישי"
                title="יעדים ושגרה"
                subtitle="יעדי סוכר ושעות היום שלך כדי שהתזכורות יהיו פשוטות וברורות."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="יעד נמוך" brand={brand} />
                  <TextInput value={targetLow} onChange={setTargetLow} type="number" brand={brand} />
                </div>
                <div>
                  <FieldLabel text="יעד גבוה" brand={brand} />
                  <TextInput value={targetHigh} onChange={setTargetHigh} type="number" brand={brand} />
                </div>
              </div>

              <div
                className="rounded-[28px] p-4"
                style={{
                  background: brand.soft,
                  border: `1px solid ${brand.border}`,
                }}
              >
                <div className="text-right mb-3">
                  <p style={{ color: brand.text, fontWeight: 900 }}>השגרה שלך</p>
                  <p className="mt-1 text-sm" style={{ color: brand.muted, lineHeight: 1.7 }}>
                    נשתמש בשעות האלה לתזכורות ולסדר היום באפליקציה.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TimeFieldCard label="שעת קימה" value={wakeTime} onChange={setWakeTime} brand={brand} />
                  <TimeFieldCard label="שעת שינה" value={sleepTime} onChange={setSleepTime} brand={brand} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionHeader
                brand={brand}
                eyebrow="שלב רביעי"
                title="התרופות שלך"
                subtitle="שם, שעה ומראה, כדי שיהיה קל לזהות ולסמן לקיחה."
              />

              <div className="space-y-3">
                {medications.map((medication, index) => (
                  <div
                    key={medication.id}
                    className="rounded-[28px] p-4"
                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${brand.border}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => removeMedication(medication.id)}
                        disabled={medications.length === 1}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: medications.length === 1 ? '#D6CBBF' : '#CC6677',
                          border: `1px solid ${medications.length === 1 ? '#EEE5DB' : '#F2C8CE'}`,
                        }}
                        aria-label="מחק תרופה"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="text-right">
                        <p style={{ color: brand.text, fontWeight: 900 }}>תרופה {index + 1}</p>
                        <p className="text-sm" style={{ color: brand.muted }}>{medication.period}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <TextInput
                        value={medication.name}
                        onChange={(value) => updateMedication(medication.id, { name: value })}
                        placeholder="שם התרופה"
                        brand={brand}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <TimeFieldCompact
                          value={medication.time}
                          onChange={(value) => updateMedication(medication.id, { time: value })}
                          brand={brand}
                        />
                        <TextInput
                          value={medication.dosage}
                          onChange={(value) => updateMedication(medication.id, { dosage: value })}
                          placeholder="מינון"
                          brand={brand}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <ChoiceChip
                          label="כדור"
                          active={medication.type === 'pill'}
                          brand={brand}
                          icon={<Pill size={16} />}
                          onClick={() => updateMedication(medication.id, { type: 'pill' })}
                        />
                        <ChoiceChip
                          label="זריקה"
                          active={medication.type === 'injection'}
                          brand={brand}
                          icon={<Shield size={16} />}
                          onClick={() => updateMedication(medication.id, { type: 'injection', image: '💉', appearanceLabel: 'עט אינסולין' })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {MED_VISUALS.map((visual) => (
                          <button
                            key={visual.value}
                            onClick={() => updateMedication(medication.id, { image: visual.symbol, appearanceLabel: visual.label })}
                            className="rounded-[24px] p-3 text-right transition-all active:scale-[0.98]"
                            style={{
                              border: `2px solid ${medication.appearanceLabel === visual.label ? brand.primary : '#E7DED3'}`,
                              background: medication.appearanceLabel === visual.label ? brand.soft : '#FFFFFF',
                            }}
                          >
                            <div className="flex items-center justify-start gap-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: `${visual.color}18`, color: visual.color }}
                              >
                                <span style={{ fontSize: 20 }}>{visual.symbol}</span>
                              </div>
                              <p style={{ color: brand.text, fontWeight: 800 }}>{visual.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={medication.notes || ''}
                        onChange={(event) => updateMedication(medication.id, { notes: event.target.value })}
                        placeholder="הערה קצרה, למשל: לקחת עם אוכל"
                        dir="rtl"
                        className="w-full px-4 py-3 rounded-[22px] text-right outline-none"
                        style={{
                          minHeight: 90,
                          resize: 'none',
                          backgroundColor: '#FFFFFF',
                          border: `1px solid ${brand.border}`,
                          color: brand.text,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMedication}
                className="w-full h-12 rounded-[22px] flex items-center justify-center gap-2"
                style={{
                  background: brand.soft,
                  color: brand.primaryDark,
                  border: `1px solid ${brand.border}`,
                  fontWeight: 800,
                }}
              >
                <Plus size={18} />
                <span>הוסף תרופה נוספת</span>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <SectionHeader
                brand={brand}
                eyebrow="שלב חמישי"
                title="איש קשר לחירום"
                subtitle="כדי שנוכל לעזור מהר יותר במצב דחוף."
              />

              <FieldLabel text="שם איש קשר" brand={brand} />
              <TextInput
                value={emergencyName}
                onChange={setEmergencyName}
                placeholder="אמא, בן זוג, נכד/ה..."
                brand={brand}
              />

              <FieldLabel text="טלפון איש קשר" brand={brand} />
              <TextInput
                value={emergencyPhone}
                onChange={setEmergencyPhone}
                placeholder="0501234567"
                type="tel"
                brand={brand}
              />

              <FieldLabel text="הודעת בסיס לחירום" brand={brand} />
              <textarea
                value={emergencyMessage}
                onChange={(event) => setEmergencyMessage(event.target.value)}
                dir="rtl"
                className="w-full px-4 py-3 rounded-[24px] text-right outline-none"
                style={{
                  minHeight: 108,
                  resize: 'none',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${brand.border}`,
                  color: brand.text,
                  fontWeight: 700,
                }}
              />

              <div
                className="rounded-[28px] p-4"
                style={{ background: brand.soft, border: `1px solid ${brand.border}` }}
              >
                <p style={{ color: brand.primaryDark, fontWeight: 900 }}>סיכום קצר</p>
                <p className="mt-2 text-sm leading-7" style={{ color: brand.muted }}>
                  סוכרת סוג {diabetesType || '—'} · {getTreatmentLabel(treatmentType)} · יעד {targetLow}-{targetHigh}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (step === totalSteps - 1) {
                finish();
                return;
              }
              setStep((current) => current + 1);
            }}
            disabled={!canNext}
            className="w-full h-14 rounded-[24px] mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: brand.strong,
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: canNext ? `0 18px 36px ${brand.shadow}` : 'none',
            }}
          >
            {step === totalSteps - 1 ? (
              <>
                <Sparkles size={18} strokeWidth={2} />
                <span>כניסה לאפליקציה</span>
              </>
            ) : (
              <>
                <span>המשך</span>
                <ChevronLeft size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep((current) => current - 1)}
              className="w-full mt-3 h-10 text-sm transition-colors"
              style={{ color: brand.muted, fontWeight: 800 }}
            >
              חזרה לשלב הקודם
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  brand,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <div className="text-center">
      <p style={{ color: brand.primary, fontWeight: 900, fontSize: 13, letterSpacing: '0.08em' }}>{eyebrow}</p>
      <h2 className="text-[30px] leading-tight mt-2" style={{ color: brand.text, fontWeight: 900, letterSpacing: '-0.03em' }}>
        {title}
      </h2>
      <p className="text-sm mt-2" style={{ color: brand.muted, lineHeight: 1.8 }}>
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ text, brand }: { text: string; brand: typeof FEMALE_BRAND }) {
  return (
    <label className="block text-sm text-right mb-2" style={{ color: brand.muted, fontWeight: 800 }}>
      {text}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  brand,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  brand: typeof FEMALE_BRAND;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      dir="rtl"
      className="w-full h-14 px-4 rounded-[22px] text-right outline-none transition-all"
      style={{
        border: `1.5px solid ${value ? brand.primary : brand.border}`,
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
  brand,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  brand: typeof FEMALE_BRAND;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full h-14 px-4 rounded-[22px] text-right outline-none transition-all"
      style={{
        border: `1.5px solid ${value ? brand.primary : brand.border}`,
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
  onClick,
  brand,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  brand: typeof FEMALE_BRAND;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[22px] px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      style={{
        border: `1.5px solid ${active ? brand.primary : '#E7DED3'}`,
        background: active ? brand.soft : '#FFFFFF',
        color: active ? brand.primaryDark : brand.text,
        fontWeight: 800,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TimeFieldCard({
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
      className="rounded-[26px] p-3"
      style={{ backgroundColor: '#FFFFFF', border: `1px solid ${brand.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <Clock3 size={16} strokeWidth={1.9} style={{ color: brand.muted }} />
        <span style={{ color: brand.muted, fontSize: 13, fontWeight: 800 }}>{label}</span>
      </div>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 rounded-[18px] text-center text-lg outline-none"
        style={{
          border: `1px solid ${brand.border}`,
          backgroundColor: brand.secondary,
          color: brand.text,
          fontWeight: 800,
          direction: 'ltr',
        }}
      />
    </div>
  );
}

function TimeFieldCompact({
  value,
  onChange,
  brand,
}: {
  value: string;
  onChange: (value: string) => void;
  brand: typeof FEMALE_BRAND;
}) {
  return (
    <div
      className="rounded-[22px] px-4 h-14 flex items-center justify-between"
      style={{ border: `1px solid ${brand.border}`, backgroundColor: '#FFFFFF' }}
    >
      <Clock3 size={16} strokeWidth={1.9} style={{ color: brand.muted }} />
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent outline-none text-lg text-center"
        style={{ color: brand.text, fontWeight: 800, direction: 'ltr' }}
      />
    </div>
  );
}
