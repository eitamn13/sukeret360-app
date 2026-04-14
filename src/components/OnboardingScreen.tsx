import { useMemo, useState } from 'react';
import { ChevronLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  Gender,
  MedicationScheduleItem,
  MedicationVisual,
  TreatmentType,
  UserProfile,
  getPeriodFromTime,
  useAppContext,
} from '../context/AppContext';

const ROSE = '#E11D48';
const ROSE_LIGHT = '#FFF1F2';
const ROSE_BORDER = '#FECDD3';

const MED_VISUALS: Array<{ value: MedicationVisual; label: string; emoji: string }> = [
  { value: 'blue-pill', label: 'כדור כחול', emoji: '🔵' },
  { value: 'white-pill', label: 'כדור לבן', emoji: '⚪' },
  { value: 'pink-pill', label: 'כדור ורוד', emoji: '🩷' },
  { value: 'insulin-pen', label: 'עט אינסולין', emoji: '💉' },
];

function createMedicationDraft(): MedicationScheduleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    dosage: '',
    time: '08:00',
    period: 'בוקר',
    type: 'pill',
    image: '💊',
    appearanceLabel: 'כדור לבן',
    notifyEmergencyAfterMinutes: 45,
  };
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
  const [emergencyMessage, setEmergencyMessage] = useState(
    'אני צריכ/ה עזרה דחופה. זה המיקום שלי:'
  );

  const totalSteps = 5;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 31 }, (_, index) => String(currentYear - index));
  }, []);

  const goNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    finish();
  };

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
                  ? getPeriodFromTime(patch.time)
                  : medication.period,
            }
          : medication
      )
    );
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, createMedicationDraft()]);
  };

  const removeMedication = (medicationId: string) => {
    setMedications((prev) => prev.filter((medication) => medication.id !== medicationId));
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
      message: emergencyMessage.trim() || 'אני צריכ/ה עזרה דחופה. זה המיקום שלי:',
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5 overflow-y-auto py-8"
      style={{
        background: 'linear-gradient(160deg, #FFF1F2 0%, #FFE4E6 50%, #FDE2E8 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <OnboardingLogo />
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index === step ? '34px' : '10px',
                height: '10px',
                backgroundColor: index === step ? ROSE : index < step ? '#FDA4AF' : '#FECDD3',
              }}
            />
          ))}
        </div>

        <div
          className="bg-white rounded-[30px] p-6 shadow-xl"
          style={{ boxShadow: '0 24px 70px rgba(225,29,72,0.13)' }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <IntroHeader
                emoji="👋"
                title="בואו נכיר"
                subtitle="נבנה יחד אפליקציה שמבינה אותך, את הטיפול ואת שגרת היום."
              />

              <FieldLabel text="איך קוראים לך?" />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="לדוגמה: סבתא רותי, דוד, מרים"
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
                      border: `2px solid ${gender === value ? ROSE : '#F3F4F6'}`,
                      backgroundColor: gender === value ? ROSE_LIGHT : '#F9FAFB',
                      boxShadow: gender === value ? `0 10px 28px ${ROSE}18` : 'none',
                    }}
                  >
                    <p className="text-3xl mb-2">{emoji}</p>
                    <p style={{ color: gender === value ? ROSE : '#374151', fontWeight: 800 }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <IntroHeader
                emoji="🩺"
                title="פרטים רפואיים בסיסיים"
                subtitle="רק מה שצריך כדי להתאים תזכורות, טיפים ומסכים בצורה נכונה."
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
                    className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${diabetesType === type ? ROSE : '#F3F4F6'}`,
                      backgroundColor: diabetesType === type ? ROSE_LIGHT : '#F9FAFB',
                    }}
                  >
                    <p style={{ color: diabetesType === type ? ROSE : '#374151', fontWeight: 900, fontSize: 22 }}>
                      סוג {type}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                      {type === '1' ? 'תלות באינסולין' : 'לרוב טיפול בכדורים / אורח חיים'}
                    </p>
                  </button>
                ))}
              </div>

              <FieldLabel text="סוג טיפול עיקרי" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'insulin' as TreatmentType, label: 'אינסולין' },
                  { value: 'pills' as TreatmentType, label: 'כדורים' },
                  { value: 'combined' as TreatmentType, label: 'משולב' },
                  { value: 'lifestyle' as TreatmentType, label: 'תזונה ואורח חיים' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTreatmentType(item.value)}
                    className="rounded-2xl p-3.5 text-center transition-all active:scale-[0.98]"
                    style={{
                      border: `2px solid ${treatmentType === item.value ? ROSE : '#F3F4F6'}`,
                      backgroundColor: treatmentType === item.value ? ROSE_LIGHT : '#F9FAFB',
                      color: treatmentType === item.value ? ROSE : '#374151',
                      fontWeight: 700,
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
                emoji="🎯"
                title="טווחי יעד ושגרת יום"
                subtitle="כך נוכל להציג מדדים אמיתיים, היסטוריה נכונה ותזכורות בזמן המתאים."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="טווח סוכר נמוך" />
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
                  <FieldLabel text="טווח סוכר גבוה" />
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
                style={{ backgroundColor: ROSE_LIGHT, border: `1px solid ${ROSE_BORDER}` }}
              >
                <p style={{ color: '#9F1239', fontWeight: 700 }}>
                  הטווחים האלה הם ברירת המחדל של האפליקציה. אם הרופא נתן לך יעד אחר, אפשר לעדכן אותו גם אחר כך.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <IntroHeader
                emoji="💊"
                title="התרופות שלך"
                subtitle="אפשר להוסיף עכשיו תרופות כדי שנבנה תזכורות אמיתיות. אפשר גם להשאיר ריק ולעדכן אחר כך."
              />

              <div className="space-y-3">
                {medications.map((medication, index) => (
                  <div
                    key={medication.id}
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => removeMedication(medication.id)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <p style={{ color: '#0F172A', fontWeight: 800 }}>תרופה {index + 1}</p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(event) =>
                          updateMedication(medication.id, { name: event.target.value })
                        }
                        placeholder="שם התרופה"
                        dir="rtl"
                        className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                        style={compactInputStyle(Boolean(medication.name))}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(event) =>
                            updateMedication(medication.id, { dosage: event.target.value })
                          }
                          placeholder="מינון"
                          dir="rtl"
                          className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                          style={compactInputStyle(Boolean(medication.dosage))}
                        />
                        <input
                          type="time"
                          value={medication.time}
                          onChange={(event) =>
                            updateMedication(medication.id, { time: event.target.value })
                          }
                          className="w-full h-13 px-4 rounded-2xl text-right outline-none"
                          style={compactInputStyle(Boolean(medication.time))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'pill' as const, label: 'כדור' },
                          { value: 'injection' as const, label: 'זריקה' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateMedication(medication.id, {
                                type: option.value,
                                image: option.value === 'injection' ? '💉' : '💊',
                              })
                            }
                            className="rounded-2xl py-3 transition-all active:scale-[0.98]"
                            style={{
                              border: `2px solid ${medication.type === option.value ? ROSE : '#E2E8F0'}`,
                              backgroundColor: medication.type === option.value ? ROSE_LIGHT : '#FFFFFF',
                              color: medication.type === option.value ? ROSE : '#475569',
                              fontWeight: 700,
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {MED_VISUALS.map((visual) => (
                          <button
                            key={visual.value}
                            onClick={() =>
                              updateMedication(medication.id, {
                                image: visual.emoji,
                                appearanceLabel: visual.label,
                              })
                            }
                            className="rounded-2xl p-3 text-right transition-all active:scale-[0.98]"
                            style={{
                              border: `2px solid ${medication.appearanceLabel === visual.label ? ROSE : '#E2E8F0'}`,
                              backgroundColor:
                                medication.appearanceLabel === visual.label ? ROSE_LIGHT : '#FFFFFF',
                            }}
                          >
                            <div className="text-xl">{visual.emoji}</div>
                            <p style={{ fontWeight: 700, color: '#0F172A', marginTop: 4 }}>{visual.label}</p>
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={medication.notes || ''}
                        onChange={(event) =>
                          updateMedication(medication.id, { notes: event.target.value })
                        }
                        placeholder="הערה קצרה, לדוגמה: לקחת עם אוכל"
                        dir="rtl"
                        className="w-full px-4 py-3 rounded-2xl text-right outline-none"
                        style={{
                          ...compactInputStyle(Boolean(medication.notes)),
                          minHeight: 84,
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
                style={{ backgroundColor: ROSE_LIGHT, color: ROSE, border: `1px solid ${ROSE_BORDER}`, fontWeight: 800 }}
              >
                <Plus size={18} />
                הוספת תרופה נוספת
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <IntroHeader
                emoji="🚨"
                title="איש קשר לחירום"
                subtitle="במקרה חירום או אם תרופה לא סומנה בזמן, נוכל להכין הודעה מהירה למשפחה."
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
                style={{
                  ...inputStyle(Boolean(emergencyMessage)),
                  minHeight: 100,
                  resize: 'none',
                }}
              />

              <div
                className="rounded-3xl p-4"
                style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '1px solid #FED7AA' }}
              >
                <p style={{ color: '#9A3412', fontWeight: 800 }}>מה תקבלו כבר עכשיו</p>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: '#7C2D12', lineHeight: 1.7 }}>
                  <li>דף בית עם נתונים אמיתיים מהיומן שלך</li>
                  <li>תזכורות תרופות לפי השעות שקבעת</li>
                  <li>רישום ארוחה חכם עם צילום ומאגר מזון</li>
                  <li>צ׳אט AI משופר ו־SOS עם WhatsApp</li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={goNext}
            disabled={!canNext}
            className="w-full h-14 rounded-2xl mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            style={{
              backgroundColor: canNext ? ROSE : '#F3F4F6',
              color: canNext ? '#FFFFFF' : '#9CA3AF',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: canNext ? `0 10px 28px ${ROSE}45` : 'none',
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
              onClick={() => setStep((s) => s - 1)}
              className="w-full mt-3 h-10 text-sm transition-colors"
              style={{ color: '#9CA3AF', fontWeight: 700 }}
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
    <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 700 }}>
      {text}
    </label>
  );
}

function IntroHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-center mb-2">
        <span className="text-3xl">{emoji}</span>
      </div>
      <h2
        className="text-2xl text-center mb-1"
        style={{ color: '#1F2937', fontWeight: 900, letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      <p className="text-sm text-center mb-2" style={{ color: '#64748B', lineHeight: 1.7 }}>
        {subtitle}
      </p>
    </div>
  );
}

function OnboardingLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="https://i.postimg.cc/FrmVmf7S/16p-Kq.jpg"
        alt="לוגו"
        style={{
          width: 78,
          height: 78,
          borderRadius: '50%',
          objectFit: 'cover',
          boxShadow: '0 10px 30px rgba(225,29,72,0.22)',
        }}
      />
      <div className="text-center">
        <h1
          className="text-2xl"
          style={{ color: '#E11D48', fontWeight: 900, letterSpacing: '-0.03em' }}
        >
          הסוכרת שלי
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#FDA4AF', fontWeight: 600 }}>
          ניהול חכם, רגוע וברור של החיים עם סוכרת
        </p>
      </div>
    </div>
  );
}

function inputStyle(active: boolean) {
  return {
    border: `2px solid ${active ? ROSE_BORDER : '#F3F4F6'}`,
    backgroundColor: active ? ROSE_LIGHT : '#F9FAFB',
    color: '#1F2937',
    fontWeight: 600,
  };
}

function compactInputStyle(active: boolean) {
  return {
    border: `2px solid ${active ? ROSE_BORDER : '#E2E8F0'}`,
    backgroundColor: active ? ROSE_LIGHT : '#FFFFFF',
    color: '#1F2937',
    fontWeight: 600,
  };
}
