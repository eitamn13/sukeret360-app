import React from "react";

const SOSButton = () => {
  const handleSOS = () => {
    alert("🚨 SOS נשלח! מתקשר לשירותי חירום...");

    // בעתיד: כאן אפשר לשלוח מיקום / קריאה אמיתית
    window.open("tel:101"); // בישראל: מד\"א
  };

  return (
    <button
      onClick={handleSOS}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "red",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "70px",
        height: "70px",
        fontSize: "20px",
        fontWeight: "bold",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        cursor: "pointer"
      }}
    >
      SOS
    </button>
  );
};

export default SOSButton;
