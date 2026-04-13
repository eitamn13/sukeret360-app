import React, { useEffect, useMemo, useState } from "react";
import { useAppContext, genderedText } from "../context/AppContext";

type SOSModalProps = {
  isOpen: boolean;
  onClose: () => void;
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
  const [locationText, setLocationText] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [alarmAudio] = useState(
    () => new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
  );

  const hasContact = useMemo(
    () => Boolean(emergencyContact.phone?.trim()),
    [emergencyContact.phone]
  );

  useEffect(() => {
    if (savedLocation) {
      setLocationText(`https://maps.google.com/?q=${savedLocation.lat},${savedLocation.lng}`);
    }
  }, [savedLocation]);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsCounting(false);
      setStatusText("");
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
  }, [isOpen, alarmAudio]);

  useEffect(() => {
    if (isOpen && !locationText) {
      getLocation(true);
    }
  }, [isOpen]);

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
    setStatusText(
      genderedText(
        userProfile.gender,
        "החיוג למד״א מתחיל מיד. אפשר לבטל בתוך 3 שניות.",
        "החיוג למד״א מתחיל מיד. אפשר לבטל בתוך 3 שניות."
      )
    );

    if (navigator.vibrate) {
      navigator.vibrate([400, 120, 400, 120, 700]);
    }

    alarmAudio.loop = true;
    alarmAudio.play().catch(() => {});
  };

  const cancelEmergency = () => {
    setIsCounting(false);
    setCountdown(3);
    setStatusText(
      genderedText(userProfile.gender, "החיוג בוטל.", "החיוג בוטל.")
    );
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  };

  const getLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert("הדפדפן לא תומך במיקום");
      return;
    }

    setLoadingLocation(true);
    setStatusText(
      genderedText(userProfile.gender, "מאתרת מיקום...", "מאתר מיקום...")
    );

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
        setStatusText(
          genderedText(
            userProfile.gender,
            "המיקום נשמר ומוכן לשיתוף.",
            "המיקום נשמר ומוכן לשיתוף."
          )
        );
      },
      () => {
        setLoadingLocation(false);
        setLocationPermissionGranted(false);
        setStatusText(
          genderedText(
            userProfile.gender,
            "לא הצלחנו לקבל מיקום.",
            "לא הצלחנו לקבל מיקום."
          )
        );
        if (!silent) {
          alert("לא הצלחנו לקבל מיקום");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const shareLocation = async () => {
    const url = locationText || "";

    try {
      if (navigator.share && url) {
        await navigator.share({
          title: "מיקום חירום",
          text: "זה המיקום שלי כרגע:",
          url,
        });
        setStatusText(
          genderedText(
            userProfile.gender,
            "המיקום שותף בהצלחה.",
            "המיקום שותף בהצלחה."
          )
        );
        return;
      }

      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        setStatusText(
          genderedText(
            userProfile.gender,
            "קישור המיקום הועתק ללוח.",
            "קישור המיקום הועתק ללוח."
          )
        );
        return;
      }

      getLocation();
    } catch {
      setStatusText(
        genderedText(
          userProfile.gender,
          "לא הצלחנו לשתף עכשיו.",
          "לא הצלחנו לשתף עכשיו."
        )
      );
    }
  };

  const sendSmsToContact = () => {
    if (!hasContact) {
      alert("אין איש קשר לחירום שמור");
      return;
    }

    const body = `${emergencyContact.message} ${locationText || ""}`.trim();
    window.location.href = `sms:${emergencyContact.phone}?body=${encodeURIComponent(body)}`;
  };

  const sendWhatsAppToContact = () => {
    if (!hasContact) {
      alert("אין איש קשר לחירום שמור");
      return;
    }

    const text = `${emergencyContact.message} ${locationText || ""}`.trim();
    const phone = emergencyContact.phone.replace(/[^\d]/g, "");
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
          maxWidth: "430px",
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
            background: "linear-gradient(135deg, #dc2626, #991b1b)",
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
            {genderedText(
              userProfile.gender,
              "בחרי פעולה מהירה. לא צריך למלא שום דבר עכשיו.",
              "בחר פעולה מהירה. לא צריך למלא שום דבר עכשיו."
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
          <button
            onClick={startEmergencyCall}
            style={buttonStyle("#dc2626", "white")}
          >
            {isCounting
              ? `${genderedText(userProfile.gender, "מחייגת", "מחייג")} למד״א בעוד ${countdown}...`
              : genderedText(userProfile.gender, "התקשרי למד״א", "התקשר למד״א")}
          </button>

          <button
            onClick={() => getLocation()}
            style={buttonStyle("#2563eb", "white")}
          >
            {loadingLocation
              ? genderedText(userProfile.gender, "מאתרת מיקום...", "מאתר מיקום...")
              : genderedText(userProfile.gender, "עדכני מיקום", "עדכן מיקום")}
          </button>

          <button
            onClick={shareLocation}
            style={buttonStyle("#4f46e5", "white")}
          >
            {genderedText(userProfile.gender, "שתפי מיקום", "שתף מיקום")}
          </button>

          <button
            onClick={sendSmsToContact}
            style={buttonStyle("#0f766e", "white")}
          >
            {genderedText(
              userProfile.gender,
              "שלחי SMS לאיש קשר",
              "שלח SMS לאיש קשר"
            )}
          </button>

          <button
            onClick={sendWhatsAppToContact}
            style={buttonStyle("#16a34a", "white")}
          >
            {genderedText(
              userProfile.gender,
              "שלחי WhatsApp לאיש קשר",
              "שלח WhatsApp לאיש קשר"
            )}
          </button>

          {isCounting && (
            <button
              onClick={cancelEmergency}
              style={buttonStyle("#f3f4f6", "#111827")}
            >
              {genderedText(userProfile.gender, "בטלי", "בטל")}
            </button>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "14px",
            border: "1px solid #fecaca",
            marginBottom: "12px",
          }}
        >
          <div style={sectionTitle}>איש קשר לחירום</div>
          <div style={{ fontSize: "14px", color: "#111827", fontWeight: 700 }}>
            {emergencyContact.name || "לא נשמר עדיין"}
          </div>
          <div style={{ fontSize: "13px", color: "#6B7280", marginTop: 4 }}>
            {emergencyContact.phone || "אין טלפון שמור"}
          </div>
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
          {statusText && (
            <div style={{ marginTop: 10, fontSize: "12px", color: "#b91c1c", fontWeight: 700 }}>
              {statusText}
            </div>
          )}
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
          {genderedText(userProfile.gender, "סגרי", "סגור")}
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
