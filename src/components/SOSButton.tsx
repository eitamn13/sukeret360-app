import React, { useState } from "react";

const SOSButton = () => {
  const [confirming, setConfirming] = useState(false);

  const handleSOS = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    window.location.href = "tel:101";
  };

  return (
    <button
      onClick={handleSOS}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "70px",
        height: "70px",
        borderRadius: "50%",
        background: confirming
          ? "linear-gradient(135deg, #ff1744, #d50000)"
          : "linear-gradient(135deg, #ff5252, #ff1744)",
        color: "white",
        fontSize: "16px",
        fontWeight: "bold",
        border: "none",
        cursor: "pointer",
        zIndex: 9999,
        boxShadow: confirming
          ? "0 0 20px rgba(255,0,0,0.7)"
          : "0 4px 12px rgba(0,0,0,0.3)",
        animation: confirming ? "pulse 1s infinite" : "none",
        transition: "all 0.3s ease"
      }}
    >
      {confirming ? "לחץ שוב!" : "SOS"}

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </button>
  );
};

export default SOSButton;
