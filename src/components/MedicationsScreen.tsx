import { X, Pill, Syringe, Clock, CheckCircle2, AlertCircle, Bell, CalendarPlus, Plus, Trash2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  MedicationScheduleItem,
  getPeriodFromTime,
  useAppContext,
} from '../context/AppContext';

interface MedicationsScreenProps {
  onClose: () => void;
}

function isPast(timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes);
}

function getMinutesLate(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours || 0, minutes || 0, 0, 0);
  return Math.floor((now.getTime() - target.getTime()) / 60000);
}

function createMedicationDraft(): MedicationScheduleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: '08:00',
    period: 'בוקר',
    name: '',
    dosage: '',
    type: 'pill',
    notes: '',
    image: '💊',
    appearanceLabel: 'כדור לבן',
    notifyEmergencyAfterMinutes: 45,
  };
}

function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

function buildMedicationAlertMessage(
  patientName: string,
  medication: MedicationScheduleItem
) {
  const displayName = patientName.trim() || 'המשתמש/ת';
  const appearance = medication.appearanceLabel ? ` (${medication.appearanceLabel})` : '';

  return `${displayName} עדיין לא סימנ/ה שלקח/ה את ${medication.name}${appearance} של ${medication.period}, שנקבעה לשעה ${medication.time}.`;
}

function downloadMedicationCalendar(schedule: MedicationScheduleItem[]) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const formatDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

  const events = schedule
    .filter((item) => item.name.trim())
    .map((item) => {
      const [hours, minutes] = item.time.split(':').map(Number);
      const eventStart = new Date();
      eventStart.setHours(hours || 0, minutes || 0, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + 15);

      return [
        'BEGIN:VEVENT',
        `UID:${item.id}@sukeret360.app`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(eventStart)}`,
        `DTEND:${formatDate(eventEnd)}`,
        `RRULE:FREQ=DAILY;UNTIL=${formatDate(endDate)}`,
        `SUMMARY:תזכורת תרופה - ${item.name}`,
        `DESCRIPTION:${item.dosage} | ${item.notes || 'תזכורת יומית מהאפליקציה'}`,
        'END:VEVENT',
      ].join('\n');
    });

  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sukeret360//Medication Calendar//HE', ...events, 'END:VCALENDAR'].join('\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sukeret360-medications.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function MedicationsScreen({ onClose }: MedicationsScreenProps) {
  const {
    medicationSchedule,
    isMedicationTakenToday,
    markMedicationTaken,
    unmarkMedicationTaken,
    saveMedicationSchedule,
    theme,
    userProfile,
    emergencyContact,
    notificationPermission,
    requestBrowserNotificationPermission,
  } = useAppContext();

  const [justMarked, setJustMarked] = useState<string | null>(null);
  const [editableSchedule, setEditableSchedule] = useState<MedicationScheduleItem[]>(medicationSchedule);
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setEditableSchedule(medicationSchedule);
  }, [medicationSchedule]);

  const toggle = (id: string) => {
    const isDone = isMedicationTakenToday(id);

    if (isDone) {
      unmarkMedicationTaken(id);
      return;
    }

    markMedicationTaken(id);
    setJustMarked(id);
    setTimeout(() => setJustMarked(null), 1000);
  };

  const doneCount = medicationSchedule.filter((medication) => isMedicationTakenToday(medication.id)).length;
  const progress = medicationSchedule.length > 0
    ? Math.round((doneCount / medicationSchedule.length) * 100)
    : 0;

  const overdueMedications = useMemo(
    () =>
      medicationSchedule.filter((medication) => {
        if (isMedicationTakenToday(medication.id)) return false;
        const minutesLate = getMinutesLate(medication.time);
        return minutesLate >= (medication.notifyEmergencyAfterMinutes ?? 45);
      }),
    [isMedicationTakenToday, medicationSchedule]
  );

  const sendAlertToEmergency = (channel: 'whatsapp' | 'sms') => {
    const medication = overdueMedications[0];
    if (!medication || !emergencyContact.phone.trim()) {
      return;
    }

    const text = buildMedicationAlertMessage(userProfile.name, medication);

    if (channel === 'whatsapp') {
      const normalizedPhone = normalizePhoneForWhatsApp(emergencyContact.phone);
      window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    window.location.href = `sms:${emergencyContact.phone}?body=${encodeURIComponent(text)}`;
  };

  const updateEditableMedication = (
    medicationId: string,
    patch: Partial<MedicationScheduleItem>
  ) => {
    setEditableSchedule((prev) =>
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

  const removeEditableMedication = (medicationId: string) => {
    setEditableSchedule((prev) => prev.filter((medication) => medication.id !== medicationId));
  };

  const saveSchedule = () => {
    saveMedicationSchedule(editableSchedule);
    setEditingEnabled(false);
    setSavedSchedule(true);
    setTimeout(() => setSavedSchedule(false), 1200);
  };

  const requestNotifications = async () => {
    await requestBrowserNotificationPermission();
  };

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
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              border: `1.5px solid ${theme.primaryBorder}`,
              backgroundColor: 'white',
            }}
            aria-label="סגור"
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h1
              className="text-lg leading-tight"
              style={{
                color: '#1F2937',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              תרופות ותזכורות
            </h1>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              לפי לוח הזמנים שהוגדר לך
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: theme.primaryBg,
              border: `1.5px solid ${theme.primaryBorder}`,
            }}
          >
            <Pill size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
          </div>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#6B7280', fontWeight: 600 }}>
              {doneCount}/{medicationSchedule.length} סומנו היום
            </span>
            <span
              className="text-xs"
              style={{
                color: progress === 100 ? '#16A34A' : theme.primary,
                fontWeight: 700,
              }}
            >
              {progress}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#16A34A' : theme.primary,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {notificationPermission !== 'granted' && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE' }}
          >
            <div className="flex items-center justify-end gap-2 mb-2">
              <p style={{ color: '#1E40AF', fontWeight: 800 }}>הפעלת התראות בטלפון</p>
              <Bell size={18} strokeWidth={1.8} style={{ color: '#1E40AF' }} />
            </div>
            <p style={{ color: '#1D4ED8', lineHeight: 1.7 }}>
              כדי לקבל תזכורות בזמן אמת מהאפליקציה, צריך לאשר התראות בדפדפן של הטלפון.
            </p>
            <button
              onClick={requestNotifications}
              className="mt-3 h-11 px-4 rounded-2xl"
              style={{ backgroundColor: '#1D4ED8', color: 'white', fontWeight: 700 }}
            >
              אפשר התראות עכשיו
            </button>
          </div>
        )}

        {overdueMedications.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}
          >
            <div className="flex items-center justify-end gap-2 mb-2">
              <p style={{ color: '#B91C1C', fontWeight: 900 }}>יש תרופה שלא סומנה בזמן</p>
              <AlertCircle size={18} strokeWidth={1.8} style={{ color: '#B91C1C' }} />
            </div>
            <p style={{ color: '#991B1B', lineHeight: 1.7 }}>
              {buildMedicationAlertMessage(userProfile.name, overdueMedications[0])}
            </p>

            {emergencyContact.phone.trim() ? (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => sendAlertToEmergency('sms')}
                  className="h-11 rounded-2xl"
                  style={{ backgroundColor: '#FFFFFF', color: '#0F766E', border: '1.5px solid #99F6E4', fontWeight: 800 }}
                >
                  SMS למשפחה
                </button>
                <button
                  onClick={() => sendAlertToEmergency('whatsapp')}
                  className="h-11 rounded-2xl"
                  style={{ backgroundColor: '#16A34A', color: '#FFFFFF', fontWeight: 800 }}
                >
                  WhatsApp למשפחה
                </button>
              </div>
            ) : (
              <p style={{ color: '#991B1B', marginTop: 12, fontWeight: 700 }}>
                כדי לשלוח הודעה, צריך להוסיף איש קשר לחירום במסך ההגדרות.
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {medicationSchedule.length === 0 && (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}` }}
            >
              <p style={{ color: '#1F2937', fontWeight: 800, fontSize: 18 }}>עדיין לא הוגדרו תרופות</p>
              <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7 }}>
                הוסיפו תרופה ראשונה כדי לקבל תזכורות, יומן סימון וייצוא ליומן הטלפון.
              </p>
            </div>
          )}

          {medicationSchedule.map((medication) => {
            const isDone = isMedicationTakenToday(medication.id);
            const isJust = justMarked === medication.id;
            const past = isPast(medication.time);
            const minutesLate = getMinutesLate(medication.time);
            const isOverdue = !isDone && minutesLate >= (medication.notifyEmergencyAfterMinutes ?? 45);

            return (
              <div key={medication.id} className="flex items-start gap-4">
                <div className="relative z-10 flex-shrink-0 mt-5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-400"
                    style={{
                      backgroundColor: isDone ? '#16A34A' : past ? theme.primaryBg : '#F3F4F6',
                      border: `2px solid ${isDone ? '#16A34A' : past ? theme.primary : '#E5E7EB'}`,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} color="white" strokeWidth={2.5} />
                    ) : past ? (
                      <AlertCircle size={14} strokeWidth={2} style={{ color: isOverdue ? '#DC2626' : '#E11D48' }} />
                    ) : (
                      <Clock size={13} strokeWidth={2} style={{ color: '#9CA3AF' }} />
                    )}
                  </div>
                </div>

                <div
                  className={`flex-1 rounded-2xl p-5 transition-all duration-300 ${isJust ? 'scale-[1.01]' : ''}`}
                  style={{
                    backgroundColor: isDone ? '#F0FDF4' : '#FFFFFF',
                    border: `1.5px solid ${isDone ? '#BBF7D0' : isOverdue ? '#FECACA' : '#F3F4F6'}`,
                    boxShadow: isDone
                      ? '0 2px 12px rgba(22, 163, 74, 0.08)'
                      : isOverdue
                      ? '0 2px 12px rgba(220, 38, 38, 0.1)'
                      : '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{
                        backgroundColor: isDone ? '#DCFCE7' : theme.primaryBg,
                        color: isDone ? '#16A34A' : theme.primary,
                      }}
                    >
                      {medication.image || (medication.type === 'injection' ? '💉' : '💊')}
                    </div>

                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 mb-0.5">
                        <h3
                          className="text-base leading-tight"
                          style={{
                            color: isDone ? '#15803D' : '#1F2937',
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {medication.name}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-lg"
                          style={{
                            backgroundColor: isDone ? '#DCFCE7' : theme.primaryBg,
                            color: isDone ? '#15803D' : theme.primary,
                            fontWeight: 700,
                          }}
                        >
                          {medication.period}
                        </span>
                      </div>

                      <p
                        className="text-sm"
                        style={{
                          color: isDone ? '#16A34A' : '#6B7280',
                          fontWeight: 600,
                        }}
                      >
                        {medication.dosage || medication.appearanceLabel}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between mb-4 pb-4"
                    style={{
                      borderBottom: `1px solid ${isDone ? '#BBF7D0' : '#F3F4F6'}`,
                    }}
                  >
                    <p className="text-xs" style={{ color: '#64748B', fontWeight: 500 }}>
                      {medication.notes || medication.appearanceLabel || 'ללא הערה'}
                    </p>

                    <div className="flex items-center gap-1.5">
                      {medication.type === 'injection' ? (
                        <Syringe size={13} strokeWidth={2} style={{ color: '#9CA3AF' }} />
                      ) : (
                        <Pill size={13} strokeWidth={2} style={{ color: '#9CA3AF' }} />
                      )}
                      <span className="text-sm" style={{ color: '#374151', fontWeight: 700 }}>
                        {medication.time}
                      </span>
                    </div>
                  </div>

                  {isOverdue && (
                    <div
                      className="rounded-2xl px-3 py-2 mb-3 text-sm"
                      style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}
                    >
                      עברו {minutesLate} דקות מאז שעת התזכורת והתרופה עדיין לא סומנה.
                    </div>
                  )}

                  <button
                    onClick={() => toggle(medication.id)}
                    className="w-full h-12 rounded-xl text-base transition-all duration-300 active:scale-[0.97]"
                    style={{
                      backgroundColor: isDone ? '#16A34A' : theme.primary,
                      color: '#ffffff',
                      fontWeight: 700,
                      boxShadow: isDone
                        ? '0 4px 16px rgba(22, 163, 74, 0.3)'
                        : `0 4px 16px ${theme.primaryShadow}`,
                    }}
                  >
                    {isDone ? 'סומן כלקוח' : 'סמן/י כלקוח/ה'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => downloadMedicationCalendar(medicationSchedule)}
            className="h-12 rounded-2xl flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}`, color: theme.primary, fontWeight: 800 }}
          >
            <CalendarPlus size={18} />
            ייצוא ליומן הטלפון
          </button>

          <button
            onClick={() => setEditingEnabled((current) => !current)}
            className="h-12 rounded-2xl flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}`, color: theme.primary, fontWeight: 800 }}
          >
            <Plus size={18} />
            {editingEnabled ? 'סגור ניהול תרופות' : 'ניהול והוספת תרופות'}
          </button>
        </div>

        {editingEnabled && (
          <div
            className="rounded-3xl p-4"
            style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={saveSchedule}
                className="h-10 px-4 rounded-2xl flex items-center justify-center gap-2"
                style={{ backgroundColor: savedSchedule ? '#16A34A' : theme.primary, color: '#FFFFFF', fontWeight: 800 }}
              >
                <Save size={16} />
                {savedSchedule ? 'נשמר' : 'שמור לוח תרופות'}
              </button>
              <p style={{ color: '#1F2937', fontWeight: 800 }}>ניהול תזכורות ותרופות</p>
            </div>

            <div className="space-y-3">
              {editableSchedule.map((medication) => (
                <div
                  key={medication.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => removeEditableMedication(medication.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #FECACA' }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <p style={{ color: '#334155', fontWeight: 800 }}>{medication.period}</p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(event) => updateEditableMedication(medication.id, { name: event.target.value })}
                      placeholder="שם התרופה"
                      dir="rtl"
                      className="w-full h-11 rounded-2xl px-4 outline-none"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(event) => updateEditableMedication(medication.id, { dosage: event.target.value })}
                        placeholder="מינון"
                        dir="rtl"
                        className="w-full h-11 rounded-2xl px-4 outline-none"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                      />
                      <input
                        type="time"
                        value={medication.time}
                        onChange={(event) => updateEditableMedication(medication.id, { time: event.target.value })}
                        className="w-full h-11 rounded-2xl px-4 outline-none"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                      />
                    </div>

                    <textarea
                      value={medication.notes || ''}
                      onChange={(event) => updateEditableMedication(medication.id, { notes: event.target.value })}
                      placeholder="הערה או הנחיה"
                      dir="rtl"
                      className="w-full rounded-2xl px-4 py-3 outline-none"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', resize: 'none', minHeight: 82 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEditableSchedule((prev) => [...prev, createMedicationDraft()])}
              className="w-full h-11 rounded-2xl mt-3 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 800, border: `1px solid ${theme.primaryBorder}` }}
            >
              <Plus size={18} />
              הוסף תרופה חדשה
            </button>
          </div>
        )}

        {doneCount === medicationSchedule.length && medicationSchedule.length > 0 && (
          <div
            className="rounded-2xl p-5 text-center animate-fade-in"
            style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
          >
            <p className="text-lg" style={{ color: '#15803D', fontWeight: 800 }}>
              כל התרופות סומנו היום
            </p>
            <p className="text-sm mt-1" style={{ color: '#16A34A', fontWeight: 500 }}>
              עבודה מצוינת. ההיצמדות לטיפול נראית מעולה היום.
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
