import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ambulance,
  Copy,
  MapPinned,
  MessageSquareHeart,
  PhoneCall,
  Siren,
  TimerReset,
  X,
} from 'lucide-react';
import { genderedText, useAppContext } from '../context/AppContext';

type SOSModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SosAction = {
  id: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  color: string;
  tint: string;
  icon: JSX.Element;
};

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const {
    userProfile,
    emergencyContact,
    savedLocation,
    saveLocation,
    setLocationPermissionGranted,
  } = useAppContext();

  const [countdown, setCountdown] = useState(3);
  const [isCounting, setIsCounting] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [alarmAudio] = useState(
    () => new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg')
  );

  const hasContact = useMemo(
    () => Boolean(emergencyContact.phone?.trim()),
    [emergencyContact.phone]
  );

  const normalizePhoneForWhatsApp = useCallback((phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.startsWith('972')) return digits;
    if (digits.startsWith('0')) return `972${digits.slice(1)}`;
    return digits;
  }, []);

  const emergencyText = useMemo(() => {
    const namePrefix = userProfile.name ? `${userProfile.name}: ` : '';
    return `${namePrefix}${emergencyContact.message} ${locationText || ''}`.trim();
  }, [emergencyContact.message, locationText, userProfile.name]);

  useEffect(() => {
    if (savedLocation) {
      setLocationText(`https://maps.google.com/?q=${savedLocation.lat},${savedLocation.lng}`);
    }
  }, [savedLocation]);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsCounting(false);
      setStatusText('');
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
  }, [alarmAudio, isOpen]);

  useEffect(() => {
    if (!isCounting) return undefined;

    if (countdown <= 0) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      window.location.href = 'tel:101';
      setIsCounting(false);
      onClose();
      return undefined;
    }

    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [alarmAudio, countdown, isCounting, onClose]);

  const getLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) {
        setStatusText('הדפדפן הזה לא תומך באיתור מיקום.');
      }
      return;
    }

    setLoadingLocation(true);
    setStatusText(genderedText(userProfile.gender, 'מאתרת מיקום...', 'מאתר מיקום...'));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

        saveLocation({
          lat,
          lng,
          updatedAt: new Date().toISOString(),
        });
        setLocationPermissionGranted(true);
        setLocationText(mapsUrl);
        setLoadingLocation(false);
        setStatusText('המיקום נשמר ומוכן לשיתוף.');
      },
      () => {
        setLoadingLocation(false);
        setLocationPermissionGranted(false);
        setStatusText('לא הצלחנו לקבל מיקום. אפשר לנסות שוב.');
        if (!silent) {
          alert('לא הצלחנו לקבל מיקום. אפשר לנסות שוב.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [saveLocation, setLocationPermissionGranted, userProfile.gender]);

  useEffect(() => {
    if (isOpen && !locationText) {
      getLocation(true);
    }
  }, [getLocation, isOpen, locationText]);

  const startEmergencyCall = () => {
    setCountdown(3);
    setIsCounting(true);
    setStatusText('מתחילים חיוג למד"א. אפשר לבטל בתוך 3 שניות.');

    if (navigator.vibrate) {
      navigator.vibrate([400, 140, 400, 140, 700]);
    }

    alarmAudio.loop = true;
    alarmAudio.play().catch(() => undefined);
  };

  const cancelEmergency = () => {
    setIsCounting(false);
    setCountdown(3);
    setStatusText('החיוג בוטל.');
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  };

  const copyLocation = async () => {
    if (!locationText) {
      getLocation();
      return;
    }

    try {
      await navigator.clipboard.writeText(locationText);
      setStatusText('קישור המיקום הועתק ללוח.');
    } catch {
      setStatusText('לא הצלחנו להעתיק את המיקום כרגע.');
    }
  };

  const shareLocation = async () => {
    if (!locationText) {
      getLocation();
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'מיקום חירום',
          text: 'זה המיקום שלי כרגע:',
          url: locationText,
        });
        setStatusText('המיקום שותף בהצלחה.');
        return;
      }

      await copyLocation();
    } catch {
      setStatusText('לא הצלחנו לשתף כרגע. אפשר לנסות שוב.');
    }
  };

  const sendSmsToContact = () => {
    if (!hasContact) {
      alert('אין איש קשר לחירום שמור עדיין.');
      return;
    }

    window.location.href = `sms:${emergencyContact.phone}?body=${encodeURIComponent(emergencyText)}`;
  };

  const sendWhatsAppToContact = () => {
    if (!hasContact) {
      alert('אין איש קשר לחירום שמור עדיין.');
      return;
    }

    const normalizedPhone = normalizePhoneForWhatsApp(emergencyContact.phone);
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(emergencyText)}`, '_blank');
  };

  const actions: SosAction[] = [
    {
      id: 'call',
      title: isCounting ? `מחייגים למד"א בעוד ${countdown}` : 'חייג למד"א',
      subtitle: isCounting ? 'אפשר לבטל.' : 'חיוג מהיר עם טיימר.',
      onClick: isCounting ? cancelEmergency : startEmergencyCall,
      color: isCounting ? '#991B1B' : '#B91C1C',
      tint: '#FEF2F2',
      icon: isCounting ? <TimerReset size={18} /> : <Ambulance size={18} />,
    },
    {
      id: 'location',
      title: loadingLocation ? 'מאתרים מיקום...' : 'שתף מיקום',
      subtitle: 'שיתוף או העתקה.',
      onClick: shareLocation,
      color: '#1D4ED8',
      tint: '#EFF6FF',
      icon: <MapPinned size={18} />,
    },
    {
      id: 'sms',
      title: 'SMS',
      subtitle: hasContact ? 'הודעה למספר השמור.' : 'צריך לשמור איש קשר.',
      onClick: sendSmsToContact,
      color: '#0F766E',
      tint: '#ECFDF5',
      icon: <PhoneCall size={18} />,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: hasContact ? 'הודעה מוכנה עם מיקום.' : 'צריך לשמור איש קשר.',
      onClick: sendWhatsAppToContact,
      color: '#15803D',
      tint: '#F0FDF4',
      icon: <MessageSquareHeart size={18} />,
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.42)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] bg-white animate-slide-up"
        style={{ boxShadow: '0 -20px 50px rgba(15, 23, 42, 0.26)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-slate-200" />

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
              aria-label="סגור"
            >
              <X size={19} strokeWidth={2.2} />
            </button>

            <div className="text-right flex-1">
              <h2 style={{ color: '#0F172A', fontWeight: 900, fontSize: 20 }}>חירום</h2>
              <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>
                חיוג, מיקום או הודעה.
              </p>
            </div>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F97316, #DC2626)', color: '#FFFFFF' }}
            >
              <Siren size={18} />
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4 max-h-[78vh] overflow-y-auto">
          <div
            className="rounded-[28px] p-4"
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              >
                <Siren size={20} />
              </div>

              <div className="text-right flex-1">
                <p style={{ fontWeight: 900, fontSize: 18 }}>
                  {userProfile.name ? `${userProfile.name}, בחר פעולה.` : 'בחר פעולה.'}
                </p>
                <p style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.7 }}>
                  כל הכפתורים כבר מוכנים לשימוש.
                </p>
              </div>
            </div>

            {statusText && (
              <div
                className="rounded-2xl px-3 py-2 mt-4 text-sm text-right"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontWeight: 700 }}
              >
                {statusText}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="rounded-[26px] p-4 text-right transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: action.tint,
                  border: `1px solid ${action.color}22`,
                  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: action.color, color: '#FFFFFF' }}
                  >
                    {action.icon}
                  </div>

                  <div className="text-right flex-1">
                    <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 17 }}>{action.title}</p>
                    <p style={{ color: '#64748B', marginTop: 4, lineHeight: 1.7, fontSize: 13 }}>
                      {action.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <InfoCard
              title="איש קשר"
              subtitle={emergencyContact.name || 'עדיין לא הוגדר איש קשר'}
              detail={emergencyContact.phone || 'אפשר להגדיר מתוך מסך ההגדרות'}
              actionLabel="העתק"
              onAction={copyLocation}
              actionIcon={<Copy size={15} />}
            />

            <InfoCard
              title="מיקום"
              subtitle={locationText || 'עדיין אין מיקום זמין'}
              detail={loadingLocation ? 'מאתרים עכשיו...' : 'אפשר לעדכן בלחיצה אחת'}
              actionLabel="רענן"
              onAction={() => getLocation()}
              actionIcon={<MapPinned size={15} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  detail,
  actionLabel,
  actionIcon,
  onAction,
}: {
  title: string;
  subtitle: string;
  detail: string;
  actionLabel: string;
  actionIcon: JSX.Element;
  onAction: () => void;
}) {
  return (
    <div
      className="rounded-[26px] p-4"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onAction}
          className="min-w-[110px] h-10 px-3 rounded-2xl flex items-center justify-center gap-1.5"
          style={{ backgroundColor: '#F8FAFC', color: '#155E75', fontWeight: 800 }}
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </button>

        <div className="text-right flex-1 min-w-0">
          <p style={{ color: '#0F172A', fontWeight: 900 }}>{title}</p>
          <p style={{ color: '#334155', marginTop: 8, lineHeight: 1.7, wordBreak: 'break-word' }}>{subtitle}</p>
          <p style={{ color: '#94A3B8', marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>{detail}</p>
        </div>
      </div>
    </div>
  );
}
