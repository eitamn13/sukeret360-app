import { useMemo, useState } from 'react';
import { ChevronLeft, Clock3, Pill, Plus, Shield, Sparkles, Trash2 } from 'lucide-react';
import {
  Gender,
  MedicationScheduleItem,
  MedicationVisual,
  TreatmentType,
  UserProfile,
  getPeriodFromTime,
  useAppContext,
} from '../context/AppContext';

const BRAND = {
  navy: '#123B5D',
  teal: '#0F766E',
  tealDark: '#115E59',
  bg: '#F6FBFD',
  card: '#FFFFFF',
  border: '#D8E7EB',
  muted: '#6B7F8E',
  text: '#0F172A',
  soft: '#EDF7F8',
  alert: '#DC2626',
};

const MED_VISUALS: Array<{
  value: MedicationVisual;
  label: string;
  symbol: string;
  color: string;
}> = [
  { value: 'blue-pill', label: 'כדור כחול', symbol: '🔵', color: '#2563EB' },
  { value: 'white-pill', label: 'כדור לבן', symbol: '⚪', color: '#CBD5E1' },
  { value: 'pink-pill', label: 'כדור ורוד', symbol: '🩷', color: '#EC4899' },
  { value: 'insulin-pen', label: 'עט אינסולין', symbol: '💉', color: '#14B8A6' },
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
  const [emergencyMessage, setEmergencyMessage] = useState('אני צריך עזרה דחופה. זה המיקום שלי:');

  const totalSteps = 5;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 35 }, (_, index) => String(currentYear - index));
  }, []);

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
    setMedications((prev) => {
      if (prev.length === 1) {
        return [createMedicationDraft()];
      }

      return prev.filter((medication) => medication.id !== medicationId);
    });
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
      message: emergencyMessage.trim() || 'אני צריך עזרה דחופה. זה המיקום שלי:',
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

  const goNext = () => {
    if (step < totalSteps - 1) {
      setStep((current) => current + 1);
      return;
    }

    finish();
  };

  const canNext =
    step === 0
      ? name.trim().length > 0 && gender !== ''
      : step === 1
        ? age.trim().length > 0 &&
          Number(age) > 0 &&
          Number(age) < 120 &&
          diabetesType !== '' &&
          treatmentType !== ''
        : step === 2
          ? Number(targetLow) > 0 &&
            Number(targetHigh) > Number(targetLow) &&
            wakeTime.trim().length > 0 &&
            sleepTime.trim().length > 0
          : step === 3
            ? medications.every((medication) =>
                !medication.name.trim() || (medication.name.trim() && medication.time.trim())
              )
            : true;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #F7FBFD 0%, #EEF7F8 55%, #F7FBFA 100%)' }}
    >
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <OnboardingLogo />
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === step ? 34 : 10,
                height: 10,
                backgroundColor: index === step ? BRAND.teal : index < step ? '#8ED1C8' : '#D8E7EB',
              }}
            />
          ))}
        </div>

        <div
          className="rounded-[32px] p-6"
          style={{
            backgroundColor: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <IntroHeader
                eyebrow="שלב ראשון"
                title="נכיר אותך בקצרה"
                subtitle="נבנה עבורך אפליקציה ברורה, רגועה וקלה לשימוש שמותאמת לחיים עם סוכרת."
              />

              <FieldLabel text="איך קוראים לך?" />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="למשל: רות, דוד, מרים"
                autoFocus
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none transition-all"
                style={inputStyle(Boolean(name.trim()))}
              />

              <FieldLabel text="מגדר" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'female' as Gender, label: 'אישה', emoji: '👩' },
                  { value: 'male' as Gender, label: 'גבר', emoji: '👨' },
                ].map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setGender(value)}
                    className="rounded-2xl p-4 text-center transition-all duration-200 active:scale-[0.98]"
                    style={{
                      border: `2px solid ${gender === value ? BRAND.teal : '#E5EEF1'}`,
                      backgroundColor: gender === value ? BRAND.soft : '#FAFCFD',
                      boxShadow: gender === value ? '0 14px 28px rgba(15,118,110,0.12)' : 'none',
                    }}
                  >
                    <p className="text-3xl mb-2">{emoji}</p>
                    <p style={{ color: gender === value ? BRAND.teal : '#334155', fontWeight: 800 }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <IntroHeader
                eyebrow="שלב שני"
                title="הפרופיל הרפואי שלך"
                subtitle="רק מה שבאמת צריך כדי להתאים מסכים, תזכורות ועוזר חכם."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="גיל" />
                  <input
                    type="number"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    dir="rtl"
                    placeholder="62"
                    min="1"
                    max="120"
                    className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none transition-all"
                    style={inputStyle(Boolean(age))}
                  />
                </div>

                <div>
                  <FieldLabel text="שנת אבחון" />
                  <select
                    value={diagnosisYear}
                    onChange={(event) => setDiagnosisYear(event.target.value)}
                    className="w-full h-14 px-4 rounded-2xl text-right text-base outline-none transition-all"
                    style={inputStyle(Boolean(diagnosisYear))}
                  >
                    <option value="">לא חובה</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FieldLabel text="סוג סוכרת" />
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDiabetesType(type)}
                    className="rounded-2xl p-4 text-right transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${diabetesType === type ? BRAND.teal : '#E5EEF1'}`,
                      backgroundColor: diabetesType === type ? BRAND.soft : '#FAFCFD',
                    }}
                  >
                    <p style={{ color: diabetesType === type ? BRAND.teal : BRAND.text, fontWeight: 900, fontSize: 20 }}>
                      סוג {type}
                    </p>
                    <p style={{ color: BRAND.muted, fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                      {type === '1' ? 'לרוב תלוי באינסולין' : 'לרוב טיפול בכדורים או אורח חיים'}
                    </p>
                  </button>
                ))}
              </div>

              <FieldLabel text="סוג טיפול עיקרי" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'insulin' as TreatmentType, label: 'אינסולין' },
                  { value: 'pills' as TreatmentType, label: 'כדורים' },
                  { value: 'combined' as TreatmentType, label: 'שילוב' },
                  { value: 'lifestyle' as TreatmentType, label: 'אורח חיים' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTreatmentType(item.value)}
                    className="rounded-2xl p-3.5 text-center transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${treatmentType === item.value ? BRAND.teal : '#E5EEF1'}`,
                      backgroundColor: treatmentType === item.value ? BRAND.soft : '#FAFCFD',
                      color: treatmentType === item.value ? BRAND.teal : '#334155',
                      fontWeight: 800,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <IntroHeader
                eyebrow="שלב שלישי"
                title="יעדים ושגרת יום"
                subtitle="כך נציג לך נתונים אמיתיים ונשלח תזכורות בזמן שנכון לך."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="יעד נמוך" />
                  <input
                    type="number"
                    value={targetLow}
                    onChange={(event) => setTargetLow(event.target.value)}
                    dir="rtl"
                    className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                    style={inputStyle(Boolean(targetLow))}
                  />
                </div>

                <div>
                  <FieldLabel text="יעד גבוה" />
                  <input
                    type="number"
                    value={targetHigh}
                    onChange={(event) => setTargetHigh(event.target.value)}
                    dir="rtl"
                    className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                    style={inputStyle(Boolean(targetHigh))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="שעת קימה" />
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(event) => setWakeTime(event.target.value)}
                    className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                    style={inputStyle(Boolean(wakeTime))}
                  />
                </div>

                <div>
                  <FieldLabel text="שעת שינה" />
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(event) => setSleepTime(event.target.value)}
                    className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                    style={inputStyle(Boolean(sleepTime))}
                  />
                </div>
              </div>

              <div
                className="rounded-3xl p-4"
                style={{ backgroundColor: BRAND.soft, border: `1px solid ${BRAND.border}` }}
              >
                <p style={{ color: BRAND.tealDark, fontWeight: 800 }}>טיפ קטן</p>
                <p style={{ color: BRAND.muted, lineHeight: 1.7, marginTop: 6 }}>
                  תמיד אפשר לשנות את היעדים או את שעות היום גם אחר כך מתוך ההגדרות.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <IntroHeader
                eyebrow="שלב רביעי"
                title="התרופות שלך"
                subtitle="נסדר את זה פשוט: שם, שעה, סוג, ומראה התרופה כדי שיהיה קל לזהות."
              />

              <div
                className="rounded-3xl p-4"
                style={{ backgroundColor: BRAND.soft, border: `1px solid ${BRAND.border}` }}
              >
                <p style={{ color: BRAND.tealDark, fontWeight: 800 }}>
                  אפשר למלא עכשיו רק את מה שחשוב
                </p>
                <p style={{ color: BRAND.muted, lineHeight: 1.7, marginTop: 6 }}>
                  מספיק למלא שם תרופה ושעה. אחר כך אפשר להיכנס לעומק ולערוך הכול.
                </p>
              </div>

              <div className="space-y-3">
                {medications.map((medication, index) => (
                  <div
                    key={medication.id}
                    className="rounded-[28px] p-4"
                    style={{ backgroundColor: '#FBFDFE', border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => removeMedication(medication.id)}
                        disabled={medications.length === 1}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: medications.length === 1 ? '#F8FAFC' : '#FFFFFF',
                          color: medications.length === 1 ? '#CBD5E1' : BRAND.alert,
                          border: `1px solid ${medications.length === 1 ? '#E2E8F0' : '#FECACA'}`,
                        }}
                        aria-label="מחק תרופה"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="text-right">
                        <p style={{ color: BRAND.text, fontWeight: 900 }}>תרופה {index + 1}</p>
                        <p style={{ color: BRAND.muted, fontSize: 13 }}>{medication.period}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(event) => updateMedication(medication.id, { name: event.target.value })}
                        placeholder="שם התרופה"
                        dir="rtl"
                        className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                        style={compactInputStyle(Boolean(medication.name))}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Clock3
                            size={16}
                            strokeWidth={1.8}
                            style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: BRAND.muted,
                            }}
                          />
                          <input
                            type="time"
                            value={medication.time}
                            onChange={(event) => updateMedication(medication.id, { time: event.target.value })}
                            className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                            style={compactInputStyle(Boolean(medication.time))}
                          />
                        </div>

                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(event) => updateMedication(medication.id, { dosage: event.target.value })}
                          placeholder="מינון"
                          dir="rtl"
                          className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                          style={compactInputStyle(Boolean(medication.dosage))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'pill' as const, label: 'כדור', icon: <Pill size={16} /> },
                          { value: 'injection' as const, label: 'זריקה', icon: <Shield size={16} /> },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateMedication(medication.id, {
                                type: option.value,
                                image: option.value === 'injection' ? '💉' : medication.image,
                                appearanceLabel:
                                  option.value === 'injection' ? 'עט אינסולין' : medication.appearanceLabel,
                              })
                            }
                            className="rounded-2xl py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            style={{
                              border: `2px solid ${medication.type === option.value ? BRAND.teal : '#E5EEF1'}`,
                              backgroundColor: medication.type === option.value ? BRAND.soft : '#FFFFFF',
                              color: medication.type === option.value ? BRAND.teal : '#475569',
                              fontWeight: 800,
                            }}
                          >
                            {option.icon}
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <FieldLabel text="מראה התרופה" />
                        <div className="grid grid-cols-2 gap-2">
                          {MED_VISUALS.map((visual) => {
                            const active = medication.appearanceLabel === visual.label;
                            return (
                              <button
                                key={visual.value}
                                onClick={() =>
                                  updateMedication(medication.id, {
                                    image: visual.symbol,
                                    appearanceLabel: visual.label,
                                  })
                                }
                                className="rounded-2xl p-3 text-right transition-all active:scale-[0.98]"
                                style={{
                                  border: `2px solid ${active ? BRAND.teal : '#E5EEF1'}`,
                                  backgroundColor: active ? BRAND.soft : '#FFFFFF',
                                  boxShadow: active ? '0 10px 18px rgba(15,118,110,0.08)' : 'none',
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: `${visual.color}18`, color: visual.color }}
                                  >
                                    <span style={{ fontSize: 20 }}>{visual.symbol}</span>
                                  </div>
                                  <div className="text-right">
                                    <p style={{ fontWeight: 800, color: BRAND.text }}>{visual.label}</p>
                                    <p style={{ color: BRAND.muted, fontSize: 12, marginTop: 3 }}>
                                      לבחירה מהירה ונוחה
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        value={medication.notes || ''}
                        onChange={(event) => updateMedication(medication.id, { notes: event.target.value })}
                        placeholder="הערה קצרה, למשל: לקחת עם אוכל"
                        dir="rtl"
                        className="w-full px-4 py-3 rounded-2xl text-right outline-none"
                        style={{
                          ...compactInputStyle(Boolean(medication.notes)),
                          minHeight: 88,
                          resize: 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMedication}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
                style={{
                  backgroundColor: BRAND.soft,
                  color: BRAND.teal,
                  border: `1px solid ${BRAND.border}`,
                  fontWeight: 800,
                }}
              >
                <Plus size={18} />
                הוספת תרופה נוספת
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <IntroHeader
                eyebrow="שלב חמישי"
                title="איש קשר לחירום"
                subtitle="אם צריך עזרה או אם תרופה לא סומנה בזמן, נוכל להכין הודעה מהירה למשפחה."
              />

              <FieldLabel text="שם איש קשר" />
              <input
                type="text"
                value={emergencyName}
                onChange={(event) => setEmergencyName(event.target.value)}
                placeholder="אמא, בן זוג, נכד/ה..."
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                style={inputStyle(Boolean(emergencyName))}
              />

              <FieldLabel text="טלפון איש קשר" />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(event) => setEmergencyPhone(event.target.value)}
                placeholder="0501234567"
                dir="rtl"
                className="w-full h-14 px-4 rounded-2xl text-right text-lg outline-none"
                style={inputStyle(Boolean(emergencyPhone))}
              />

              <FieldLabel text="הודעת בסיס לחירום" />
              <textarea
                value={emergencyMessage}
                onChange={(event) => setEmergencyMessage(event.target.value)}
                dir="rtl"
                className="w-full px-4 py-3 rounded-2xl text-right text-base outline-none"
                style={{ ...inputStyle(Boolean(emergencyMessage)), minHeight: 100, resize: 'none' }}
              />

              <div
                className="rounded-3xl p-4"
                style={{ background: 'linear-gradient(135deg, #F3FBFA, #EEF5FB)', border: `1px solid ${BRAND.border}` }}
              >
                <p style={{ color: BRAND.tealDark, fontWeight: 900 }}>מה תקבל כבר עכשיו</p>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: BRAND.muted, lineHeight: 1.7 }}>
                  <li>מסך בית עם נתונים אמיתיים מהיומן שלך</li>
                  <li>רישום ארוחה עם צילום ומאגר מזון</li>
                  <li>עוזר בריאות AI עם גיבוי גם בזמן תקלה</li>
                  <li>תזכורות תרופות ו־SOS חכם עם WhatsApp</li>
                </ul>

                <div
                  className="rounded-2xl p-4 mt-4"
                  style={{ backgroundColor: '#FFFFFF', border: `1px solid ${BRAND.border}` }}
                >
                  <p style={{ color: BRAND.text, fontWeight: 900 }}>תוכנית הטיפול שלך</p>
                  <p style={{ color: BRAND.muted, marginTop: 6, lineHeight: 1.7 }}>
                    {diabetesType ? `סוכרת סוג ${diabetesType}` : 'סוכרת'} · {getTreatmentLabel(treatmentType)} · יעד {targetLow}-{targetHigh}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={goNext}
            disabled={!canNext}
            className="w-full h-14 rounded-2xl mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            style={{
              background: canNext
                ? 'linear-gradient(135deg, #123B5D 0%, #0F766E 100%)'
                : '#E5E7EB',
              color: canNext ? '#FFFFFF' : '#94A3B8',
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: canNext ? '0 18px 34px rgba(15,118,110,0.2)' : 'none',
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
              style={{ color: BRAND.muted, fontWeight: 800 }}
            >
              חזרה לשלב הקודם
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <label className="block text-sm text-right mb-2" style={{ color: BRAND.muted, fontWeight: 800 }}>
      {text}
    </label>
  );
}

function IntroHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <p style={{ color: BRAND.teal, fontWeight: 900, fontSize: 13, letterSpacing: '0.08em' }}>
        {eyebrow}
      </p>
      <h2
        className="text-[30px] leading-tight mt-2"
        style={{ color: BRAND.text, fontWeight: 900, letterSpacing: '-0.03em' }}
      >
        {title}
      </h2>
      <p className="text-sm mt-2" style={{ color: BRAND.muted, lineHeight: 1.8 }}>
        {subtitle}
      </p>
    </div>
  );
}

function OnboardingLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-20 h-20 rounded-[28px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #123B5D 0%, #0F766E 100%)',
          boxShadow: '0 18px 36px rgba(18,59,93,0.16)',
        }}
      >
        <Shield size={34} strokeWidth={1.9} color="#FFFFFF" />
      </div>

      <div className="text-center">
        <h1 className="text-[30px]" style={{ color: BRAND.text, fontWeight: 900, letterSpacing: '-0.03em' }}>
          Sukeret360
        </h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted, fontWeight: 700 }}>
          אפליקציה חכמה, רגועה וברורה לניהול החיים עם סוכרת
        </p>
      </div>
    </div>
  );
}

function inputStyle(active: boolean) {
  return {
    border: `2px solid ${active ? '#BFE1DB' : '#E5EEF1'}`,
    backgroundColor: active ? '#F3FBFA' : '#FAFCFD',
    color: BRAND.text,
    fontWeight: 700,
  };
}

function compactInputStyle(active: boolean) {
  return {
    border: `2px solid ${active ? '#BFE1DB' : '#E5EEF1'}`,
    backgroundColor: '#FFFFFF',
    color: BRAND.text,
    fontWeight: 700,
  };
}
