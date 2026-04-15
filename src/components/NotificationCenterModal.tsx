import { AlertTriangle, Bell, CheckCircle2, Clock3, Pill, Smartphone, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMedications: () => void;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function formatTime(isoLike: string) {
  return new Date(isoLike).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationEnvironmentMessage() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (typeof Notification === 'undefined') {
    return 'הדפדפן במכשיר הזה לא תומך בהתראות.';
  }

  if (!window.isSecureContext) {
    return 'כדי לאפשר התראות, צריך לפתוח את האתר בחיבור מאובטח.';
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  const isIOS = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || nav.standalone === true;

  if (isIOS && !isStandalone) {
    return 'באייפון צריך להוסיף את האתר למסך הבית ורק אז לאשר התראות.';
  }

  return null;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  onOpenMedications,
}: NotificationCenterModalProps) {
  const {
    theme,
    medicationSchedule,
    medicationLogs,
    isMedicationTakenToday,
    notificationPermission,
    requestBrowserNotificationPermission,
  } = useAppContext();
  const [feedback, setFeedback] = useState('');
  const todayKey = getTodayKey();
  const environmentMessage = getNotificationEnvironmentMessage();

  const items = useMemo(() => {
    const now = new Date();

    return medicationSchedule
      .map((medication) => {
        const [hours, minutes] = medication.time.split(':').map(Number);
        const scheduledAt = new Date();
        scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);

        const takenEntry = medicationLogs.find(
          (log) => log.medicationId === medication.id && log.dateKey === todayKey
        );

        if (takenEntry) {
          return {
            id: medication.id,
            title: medication.name,
            subtitle: `סומן היום בשעה ${formatTime(takenEntry.takenAt)}`,
            tone: 'done' as const,
            order: 3,
          };
        }

        const minutesDiff = Math.floor((now.getTime() - scheduledAt.getTime()) / 60000);
        const overdueThreshold = medication.notifyEmergencyAfterMinutes ?? 45;

        if (minutesDiff >= overdueThreshold) {
          return {
            id: medication.id,
            title: medication.name,
            subtitle: `עברו ${minutesDiff} דקות ועדיין לא סומן`,
            tone: 'overdue' as const,
            order: 0,
          };
        }

        if (minutesDiff >= 0) {
          return {
            id: medication.id,
            title: medication.name,
            subtitle: `זמן לקחת עכשיו • נקבע ל-${medication.time}`,
            tone: 'due' as const,
            order: 1,
          };
        }

        if (minutesDiff >= -120) {
          return {
            id: medication.id,
            title: medication.name,
            subtitle: `תזכורת קרובה בשעה ${medication.time}`,
            tone: 'upcoming' as const,
            order: 2,
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.order - b.order);
  }, [medicationLogs, medicationSchedule, todayKey]);

  const dueCount = medicationSchedule.filter((medication) => {
    if (isMedicationTakenToday(medication.id)) return false;
    const [hours, minutes] = medication.time.split(':').map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
    return scheduledAt.getTime() <= Date.now();
  }).length;

  const handleEnableNotifications = async () => {
    if (environmentMessage) {
      setFeedback(environmentMessage);
      return;
    }

    const permission = await requestBrowserNotificationPermission();

    if (permission === 'granted' && typeof Notification !== 'undefined') {
      new Notification('התראות הופעלו', {
        body: 'מעולה. מעכשיו נקבל תזכורות ישירות מהמכשיר.',
      });
      setFeedback('מעולה. ההתראות הופעלו בהצלחה.');
      return;
    }

    if (permission === 'denied') {
      setFeedback('ההתראות חסומות כרגע. אפשר לפתוח אותן דרך הגדרות הדפדפן.');
      return;
    }

    setFeedback('לא התקבלה הרשאה להתראות כרגע. נסו שוב בעוד רגע.');
  };

  const handleSendTestNotification = () => {
    if (typeof Notification === 'undefined') return;
    new Notification('בדיקת התראה מסוכרת360', {
      body: 'אם ראית את ההודעה הזאת, ההתראות עובדות כמו שצריך.',
    });
    setFeedback('נשלחה התראת בדיקה למכשיר.');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(15,23,42,0.42)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[30px] bg-white px-5 pt-3 pb-8 animate-slide-up"
        style={{ boxShadow: `0 -14px 50px ${theme.primaryShadow}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: theme.primaryBorder }} />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
            aria-label="סגור"
          >
            <X size={19} />
          </button>

          <div className="text-center">
            <h2 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>מרכז ההתראות</h2>
            <p style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>
              {dueCount > 0 ? `${dueCount} תזכורות מחכות לך עכשיו` : 'אין כרגע תזכורות דחופות'}
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
          >
            <Bell size={18} />
          </div>
        </div>

        <div
          className="rounded-3xl p-4 mb-4"
          style={{
            background:
              notificationPermission === 'granted'
                ? 'linear-gradient(135deg,#16A34A,#15803D)'
                : theme.gradientCard,
            color: '#FFFFFF',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <Smartphone size={18} />
            </div>
            <div className="text-right flex-1">
              <p style={{ fontWeight: 900, fontSize: 18 }}>
                {notificationPermission === 'granted'
                  ? 'ההתראות שלך פעילות'
                  : 'אפשר התראות עכשיו'}
              </p>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.7 }}>
                {notificationPermission === 'granted'
                  ? 'נשלח תזכורות לתרופות ונוכל גם לשלוח בדיקת התראה מיידית.'
                  : 'כדי שלא תפספס תרופות, צריך לאשר התראות מהטלפון או מהדפדפן.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={notificationPermission === 'granted' ? handleSendTestNotification : handleEnableNotifications}
              className="h-11 rounded-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                color: notificationPermission === 'granted' ? '#15803D' : theme.primary,
                fontWeight: 800,
              }}
            >
              {notificationPermission === 'granted' ? 'שלח בדיקת התראה' : 'אפשר התראות עכשיו'}
            </button>
            <button
              onClick={onOpenMedications}
              className="h-11 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.28)',
                fontWeight: 800,
              }}
            >
              פתח מסך תרופות
            </button>
          </div>
        </div>

        {(feedback || environmentMessage) && notificationPermission !== 'granted' && (
          <div
            className="rounded-3xl p-4 mb-4"
            style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
          >
            <p style={{ color: '#1D4ED8', lineHeight: 1.7, fontWeight: 700 }}>
              {feedback || environmentMessage}
            </p>
          </div>
        )}

        {feedback && notificationPermission === 'granted' && (
          <div
            className="rounded-3xl p-4 mb-4"
            style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <p style={{ color: '#166534', lineHeight: 1.7, fontWeight: 700 }}>{feedback}</p>
          </div>
        )}

        <div className="space-y-3">
          {items.length === 0 && (
            <div
              className="rounded-3xl p-5 text-center"
              style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
            >
              <CheckCircle2 size={26} style={{ color: '#16A34A', margin: '0 auto 10px' }} />
              <p style={{ color: '#0F172A', fontWeight: 800, fontSize: 17 }}>
                הכול שקט ומסודר כרגע
              </p>
              <p style={{ color: '#64748B', marginTop: 8, lineHeight: 1.7 }}>
                אין כרגע תרופות דחופות, ובמסך התרופות אפשר לראות את כל הלוח היומי.
              </p>
            </div>
          )}

          {items.map((item) => {
            const palette =
              item.tone === 'overdue'
                ? { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', icon: <AlertTriangle size={18} /> }
                : item.tone === 'due'
                  ? { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', icon: <Bell size={18} /> }
                  : item.tone === 'upcoming'
                    ? { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: <Clock3 size={18} /> }
                    : { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', icon: <CheckCircle2 size={18} /> };

            return (
              <div
                key={item.id}
                className="rounded-3xl p-4 flex items-center gap-3"
                style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#FFFFFF', color: palette.color }}
                >
                  {palette.icon}
                </div>
                <div className="flex-1 text-right">
                  <p style={{ color: palette.color, fontWeight: 900 }}>{item.title}</p>
                  <p style={{ color: palette.color, opacity: 0.86, fontSize: 14, marginTop: 4 }}>
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onOpenMedications}
          className="w-full h-12 rounded-2xl mt-5 flex items-center justify-center gap-2"
          style={{
            backgroundColor: theme.primaryBg,
            color: theme.primary,
            fontWeight: 800,
            border: `1px solid ${theme.primaryBorder}`,
          }}
        >
          <Pill size={18} />
          עבור למסך התרופות
        </button>
      </div>
    </div>
  );
}
