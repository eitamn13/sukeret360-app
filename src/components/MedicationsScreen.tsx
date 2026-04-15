import {
  AlertCircle,
  Bell,
  CalendarPlus,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MedicationScheduleItem, getPeriodFromTime, useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

interface MedicationsScreenProps {
  onClose: () => void;
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
    appearanceLabel: 'כדור',
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

function buildMedicationAlertMessage(patientName: string, medication: MedicationScheduleItem) {
  const displayName = patientName.trim() || 'המטופל/ת';
  const appearance = medication.appearanceLabel ? ` (${medication.appearanceLabel})` : '';
  return `${displayName} עדיין לא סימנ/ה שלקח/ה את ${medication.name}${appearance} של ${medication.period}, שנקבעה לשעה ${medication.time}.`;
}

function getNotificationEnvironmentMessage() {
  if (typeof window === 'undefined') return null;
  if (typeof Notification === 'undefined') return 'הדפדפן הזה לא תומך בהתראות.';
  if (!window.isSecureContext) return 'כדי לאפשר התראות, צריך לפתוח את האתר בחיבור מאובטח.';

  const nav = navigator as Navigator & { standalone?: boolean };
  const isIOS = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || nav.standalone === true;

  if (isIOS && !isStandalone) {
    return 'באייפון צריך להוסיף את האתר למסך הבית ורק אז לאשר התראות.';
  }

  return null;
}

function buildMedicationCalendarContent(schedule: MedicationScheduleItem[]) {
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
        `UID:${item.id}@my-diabetes.app`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(eventStart)}`,
        `DTEND:${formatDate(eventEnd)}`,
        `RRULE:FREQ=DAILY;UNTIL=${formatDate(endDate)}`,
        `SUMMARY:תזכורת תרופה - ${item.name}`,
        `DESCRIPTION:${item.dosage} | ${item.notes || 'תזכורת יומית מהאפליקציה'}`,
        'END:VEVENT',
      ].join('\n');
    });

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyDiabetes//Medication Calendar//HE', ...events, 'END:VCALENDAR'].join('\n');
}

function createMedicationCalendarArtifacts(schedule: MedicationScheduleItem[]) {
  const content = buildMedicationCalendarContent(schedule);
  const fileName = 'my-diabetes-medications.ics';
  const type = 'text/calendar;charset=utf-8';
  const blob = new Blob([content], { type });

  return {
    blob,
    fileName,
    file:
      typeof File !== 'undefined'
        ? new File([content], fileName, { type })
        : null,
  };
}

function downloadMedicationCalendarBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
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
  const [notificationFeedback, setNotificationFeedback] = useState('');
  const [calendarFeedback, setCalendarFeedback] = useState('');

  const notificationEnvironmentMessage = useMemo(() => getNotificationEnvironmentMessage(), []);

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
  const pendingCount = Math.max(medicationSchedule.length - doneCount, 0);
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
    if (!medication || !emergencyContact.phone.trim()) return;

    const text = buildMedicationAlertMessage(userProfile.name, medication);

    if (channel === 'whatsapp') {
      const normalizedPhone = normalizePhoneForWhatsApp(emergencyContact.phone);
      window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    window.location.href = `sms:${emergencyContact.phone}?body=${encodeURIComponent(text)}`;
  };

  const updateEditableMedication = (medicationId: string, patch: Partial<MedicationScheduleItem>) => {
    setEditableSchedule((prev) =>
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
    if (notificationEnvironmentMessage) {
      setNotificationFeedback(notificationEnvironmentMessage);
      return;
    }

    const permission = await requestBrowserNotificationPermission();

    if (permission === 'granted' && typeof Notification !== 'undefined') {
      new Notification('התראות פעילות', {
        body: 'מעולה. מעכשיו תקבלו תזכורות לתרופות.',
      });
      setNotificationFeedback('ההתראות הופעלו בהצלחה.');
      return;
    }

    if (permission === 'denied') {
      setNotificationFeedback('ההתראות חסומות כרגע. אפשר לפתוח אותן דרך הגדרות הדפדפן.');
      return;
    }

    setNotificationFeedback('לא התקבלה הרשאה כרגע. נסו שוב בעוד רגע.');
  };

  const sendTestNotification = () => {
    if (typeof Notification === 'undefined') return;
    new Notification('בדיקת התראה', {
      body: 'אם ראית את ההודעה הזאת, ההתראות עובדות כמו שצריך.',
    });
    setNotificationFeedback('נשלחה התראת בדיקה למכשיר.');
  };

  const handleCalendarExport = async () => {
    const scheduleWithNames = medicationSchedule.filter((item) => item.name.trim());

    if (scheduleWithNames.length === 0) {
      setCalendarFeedback('אין עדיין תרופות מוכנות לייצוא ליומן.');
      return;
    }

    const { blob, fileName, file } = createMedicationCalendarArtifacts(scheduleWithNames);
    const shareNavigator = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };

    if (file && typeof shareNavigator.share === 'function') {
      const shareData: ShareData = {
        files: [file],
        title: 'לוח התרופות שלי',
        text: 'אפשר להוסיף את לוח התרופות ליומן מהמכשיר.',
      };

      if (!shareNavigator.canShare || shareNavigator.canShare(shareData)) {
        try {
          await shareNavigator.share(shareData);
          setCalendarFeedback('חלון השיתוף נפתח. אפשר לבחור יומן או לשמור את הקובץ.');
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            setCalendarFeedback('השיתוף בוטל. אפשר לנסות שוב בכל רגע.');
            return;
          }

          console.warn('Medication calendar share failed, falling back to download.', error);
        }
      }
    }

    downloadMedicationCalendarBlob(blob, fileName);
    setCalendarFeedback('קובץ היומן ירד למכשיר. באייפון אפשר לפתוח אותו ולבחור יומן.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-in-right"
      dir="rtl"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="תרופות"
        subtitle="סימון, תזכורות ועריכה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <TopStat label="נלקחו" value={String(doneCount)} tone="success" />
          <TopStat label="ממתינות" value={String(pendingCount)} tone="primary" />
          <TopStat label="באיחור" value={String(overdueMedications.length)} tone="danger" />
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', border: `1px solid ${theme.primaryBorder}` }}
        >
          <div className="flex flex-row-reverse items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#6B7280', fontWeight: 700 }}>
              {doneCount}/{medicationSchedule.length} סומנו היום
            </span>
            <span
              className="text-xs"
              style={{
                color: progress === 100 ? '#16A34A' : theme.primary,
                fontWeight: 800,
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

        <div
          className="rounded-2xl p-4"
          style={{
            background:
              notificationPermission === 'granted'
                ? 'linear-gradient(135deg, #16A34A, #15803D)'
                : theme.gradientCard,
            color: '#FFFFFF',
          }}
        >
          <div className="flex flex-row-reverse items-center justify-between gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <Bell size={18} />
            </div>

            <div className="text-right flex-1">
              <p style={{ fontWeight: 900, fontSize: 18 }}>
                {notificationPermission === 'granted' ? 'התראות פעילות' : 'אפשר התראות'}
              </p>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.7 }}>
                {notificationPermission === 'granted'
                  ? 'אפשר לקבל תזכורות ישירות למכשיר.'
                  : 'כדי לא לפספס תרופות, צריך לאשר התראות.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={notificationPermission === 'granted' ? sendTestNotification : requestNotifications}
              className="h-11 rounded-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                color: notificationPermission === 'granted' ? '#15803D' : theme.primary,
                fontWeight: 800,
              }}
            >
              {notificationPermission === 'granted' ? 'בדיקת התראה' : 'אפשר עכשיו'}
            </button>
            <button
              onClick={() => setEditingEnabled((current) => !current)}
              className="h-11 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.28)',
                fontWeight: 800,
              }}
            >
              {editingEnabled ? 'סגור עריכה' : 'עריכת תרופות'}
            </button>
          </div>
        </div>

        {(notificationFeedback || notificationEnvironmentMessage) && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: notificationPermission === 'granted' ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${notificationPermission === 'granted' ? '#BBF7D0' : '#BFDBFE'}`,
            }}
          >
            <p
              style={{
                color: notificationPermission === 'granted' ? '#166534' : '#1D4ED8',
                lineHeight: 1.7,
                fontWeight: 700,
              }}
            >
              {notificationFeedback || notificationEnvironmentMessage}
            </p>
          </div>
        )}

        {overdueMedications.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}
          >
            <div className="flex flex-row-reverse items-center justify-end gap-2 mb-2">
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
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F766E',
                    border: '1.5px solid #99F6E4',
                    fontWeight: 800,
                  }}
                >
                  SMS
                </button>
                <button
                  onClick={() => sendAlertToEmergency('whatsapp')}
                  className="h-11 rounded-2xl"
                  style={{ backgroundColor: '#16A34A', color: '#FFFFFF', fontWeight: 800 }}
                >
                  WhatsApp
                </button>
              </div>
            ) : (
              <p style={{ color: '#991B1B', marginTop: 12, fontWeight: 700 }}>
                כדי לשלוח הודעה, צריך להוסיף איש קשר במסך ההגדרות.
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {medicationSchedule.length === 0 ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}` }}
            >
              <p style={{ color: '#1F2937', fontWeight: 800, fontSize: 18 }}>עדיין לא הוגדרו תרופות</p>
              <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7 }}>
                הוסיפו תרופה ראשונה כדי לקבל תזכורות ולסמן לקיחה.
              </p>
            </div>
          ) : null}

          {medicationSchedule.map((medication) => {
            const isDone = isMedicationTakenToday(medication.id);
            const isJust = justMarked === medication.id;
            const minutesLate = getMinutesLate(medication.time);
            const isOverdue = !isDone && minutesLate >= (medication.notifyEmergencyAfterMinutes ?? 45);

            return (
              <div
                key={medication.id}
                className={`rounded-2xl p-5 transition-all duration-300 ${isJust ? 'scale-[1.01]' : ''}`}
                style={{
                  backgroundColor: isDone ? '#F0FDF4' : '#FFFFFF',
                  border: `1.5px solid ${isDone ? '#BBF7D0' : isOverdue ? '#FECACA' : theme.primaryBorder}`,
                  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div className="flex flex-row-reverse items-start justify-between gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{
                      backgroundColor: isDone ? '#DCFCE7' : theme.primaryBg,
                    }}
                  >
                    {medication.image || (medication.type === 'injection' ? '💉' : '💊')}
                  </div>

                  <div className="text-right flex-1">
                    <div className="flex flex-row-reverse items-center justify-end gap-2">
                      <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 17 }}>{medication.name}</p>
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

                    <p style={{ color: '#64748B', marginTop: 6, fontWeight: 700 }}>
                      {medication.dosage || medication.appearanceLabel || 'ללא מינון'}
                    </p>
                    <p style={{ color: '#334155', marginTop: 4, fontWeight: 800 }}>{medication.time}</p>
                  </div>
                </div>

                {(medication.notes || medication.appearanceLabel) && (
                  <div
                    className="rounded-2xl px-3 py-2 mt-4 text-sm text-right"
                    style={{ backgroundColor: '#F8FAFC', color: '#475569', lineHeight: 1.6 }}
                  >
                    {medication.notes || medication.appearanceLabel}
                  </div>
                )}

                {isOverdue && (
                  <div
                    className="rounded-2xl px-3 py-2 mt-3 text-sm text-right"
                    style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}
                  >
                    עברו {minutesLate} דקות מאז התזכורת והתרופה עדיין לא סומנה.
                  </div>
                )}

                <button
                  onClick={() => toggle(medication.id)}
                  className="w-full h-12 rounded-2xl mt-4 transition-all duration-300 active:scale-[0.97]"
                  style={{
                    backgroundColor: isDone ? '#16A34A' : theme.primary,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    boxShadow: isDone
                      ? '0 4px 16px rgba(22, 163, 74, 0.3)'
                      : `0 4px 16px ${theme.primaryShadow}`,
                  }}
                >
                  {isDone ? 'סומן כנלקח' : 'סמן כנלקח'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => void handleCalendarExport()}
            className="h-12 rounded-2xl flex flex-row-reverse items-center justify-center gap-2"
            style={{
              backgroundColor: '#FFFFFF',
              border: `1.5px solid ${theme.primaryBorder}`,
              color: theme.primary,
              fontWeight: 800,
            }}
          >
            <CalendarPlus size={18} />
            ייצוא ליומן
          </button>

          <button
            onClick={() => setEditingEnabled((current) => !current)}
            className="h-12 rounded-2xl flex flex-row-reverse items-center justify-center gap-2"
            style={{
              backgroundColor: theme.primaryBg,
              border: `1.5px solid ${theme.primaryBorder}`,
              color: theme.primary,
              fontWeight: 800,
            }}
          >
            <Plus size={18} />
            {editingEnabled ? 'סגור עריכה' : 'עריכת לוח תרופות'}
          </button>
        </div>

        {calendarFeedback && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
            }}
          >
            <p className="text-right" style={{ color: '#C2410C', fontWeight: 700, lineHeight: 1.7 }}>
              {calendarFeedback}
            </p>
          </div>
        )}

        {editingEnabled && (
          <div
            className="rounded-3xl p-4"
            style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <div className="flex flex-row-reverse items-center justify-between mb-4">
              <button
                onClick={saveSchedule}
                className="h-10 px-4 rounded-2xl flex flex-row-reverse items-center justify-center gap-2"
                style={{
                  backgroundColor: savedSchedule ? '#16A34A' : theme.primary,
                  color: '#FFFFFF',
                  fontWeight: 800,
                }}
              >
                <Save size={16} />
                {savedSchedule ? 'נשמר' : 'שמור'}
              </button>
              <p style={{ color: '#1F2937', fontWeight: 800 }}>עריכת תרופות</p>
            </div>

            <div className="space-y-3">
              {editableSchedule.map((medication) => (
                <div
                  key={medication.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="flex flex-row-reverse items-center justify-between mb-3">
                    <button
                      onClick={() => removeEditableMedication(medication.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#EF4444',
                        border: '1px solid #FECACA',
                      }}
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
                      placeholder="הערה קצרה"
                      dir="rtl"
                      className="w-full rounded-2xl px-4 py-3 outline-none"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        resize: 'none',
                        minHeight: 82,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEditableSchedule((prev) => [...prev, createMedicationDraft()])}
              className="w-full h-11 rounded-2xl mt-3 flex flex-row-reverse items-center justify-center gap-2"
              style={{
                backgroundColor: theme.primaryBg,
                color: theme.primary,
                fontWeight: 800,
                border: `1px solid ${theme.primaryBorder}`,
              }}
            >
              <Plus size={18} />
              הוסף תרופה
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
              כל הכבוד. הלוח היומי הושלם.
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}

function TopStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'danger';
}) {
  const palette =
    tone === 'success'
      ? { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' }
      : tone === 'danger'
        ? { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' }
        : { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };

  return (
    <div
      className="rounded-2xl p-3 text-right"
      style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
    >
      <p style={{ color: '#64748B', fontWeight: 700, fontSize: 12 }}>{label}</p>
      <p style={{ color: palette.text, fontWeight: 900, fontSize: 24, marginTop: 6 }}>{value}</p>
    </div>
  );
}
