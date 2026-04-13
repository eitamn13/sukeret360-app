import React, { useEffect, useState } from "react";

type SOSModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EmergencyContact = {
  name: string;
  phone: string;
  message: string;
};

const DEFAULT_CONTACT: EmergencyContact = {
  name: "",
  phone: "",
  message: "אני צריך עזרה דחופה. זה המיקום שלי:",
};

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [isCounting, setIsCounting] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [contact, setContact] = useState<EmergencyContact>(DEFAULT_CONTACT);
  const [alarmAudio] = useState(
    () => new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
  );

  useEffect(() => {
    const saved = localStorage.getItem("emergency_contact");
    if (saved) {
      try {
        setContact(JSON.parse(saved));
      } catch {
        setContact(DEFAULT_CONTACT);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsCounting(false);
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
  }, [isOpen, alarmAudio]);

  useEffect(() => {
    if (!isCounting) return;

    if (countdown <= 0) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      window.location.href = "tel:101";
      setIsCounting(false);
      onClose();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isCounting, countdown, onClose, alarmAudio]);

  const startEmergencyCall = () => {
    setCountdown(3);
    setIsCounting(true);

    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }

    alarmAudio.loop = true;
    alarmAudio.play().catch(() => {});
  };

  const cancelEmergency = () => {
    setIsCounting(false);
    setCountdown(3);
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("הדפדפן לא תומך במיקום");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setLocationText(mapsUrl);
        setLoadingLocation(false);
      },
      () => {
        setLoadingLocation(false);
        alert("לא הצלחנו לקבל מיקום");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendSmsToContact = () => {
    if (!contact.phone.trim()) {
      alert("אין איש קשר לחירום שמור");
      return;
    }

    const body = `${contact.message} ${locationText || ""}`.trim();
    window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(body)}`;
  };

  const sendWhatsAppToContact = () => {
    if (!contact.phone.trim()) {
      alert("אין איש קשר לחירום שמור");
      return;
    }

    const text = `${contact.message} ${locationText || ""}`.trim();
    const phone = contact.phone.replace(/[^\d+]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(80, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(180deg, #fff5f5 0%, #ffe3e3 100%)",
          borderRadius: "24px",
          padding: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          direction: "rtl",
        }}
      >
        <div
          style={{
            background: "#b91c1c",
            color: "white",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>
            מצב חירום
          </div>
          <div style={{ fontSize: "14px", opacity: 0.95 }}>
            בחרי פעולה מהירה. לא צריך למלא שום דבר עכשיו.
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
          <button
            onClick={startEmergencyCall}
            style={buttonStyle("#dc2626", "white")}
          >
            {isCounting ? `מחייג למד״א בעוד ${countdown}...` : "התקשרי למד״א"}
          </button>

          <button
            onClick={getLocation}
            style={buttonStyle("#2563eb", "white")}
          >
            {loadingLocation ? "מאתר מיקום..." : "שלחי מיקום"}
          </button>

          <button
            onClick={sendSmsToContact}
            style={buttonStyle("#0f766e", "white")}
          >
            שלחי SMS לאיש קשר
          </button>

          <button
            onClick={sendWhatsAppToContact}
            style={buttonStyle("#16a34a", "white")}
          >
            שלחי WhatsApp לאיש קשר
          </button>

          {isCounting && (
            <button
              onClick={cancelEmergency}
              style={buttonStyle("#f3f4f6", "#111827")}
            >
              בטלי
            </button>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "14px",
            border: "1px solid #fecaca",
          }}
        >
          <div style={sectionTitle}>מיקום נוכחי</div>
          <div style={{ fontSize: "13px", wordBreak: "break-word", color: "#374151" }}>
            {locationText || "עדיין לא נאסף מיקום"}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "14px",
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#7f1d1d",
            fontWeight: 700,
            cursor: "pointer",
            padding: "10px",
          }}
        >
          סגרי
        </button>
      </div>
    </div>
  );
}

const buttonStyle = (background: string, color: string): React.CSSProperties => ({
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "16px",
  background,
  color,
  fontWeight: 800,
  fontSize: "18px",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
});

const sectionTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  marginBottom: "10px",
  color: "#111827",
};
