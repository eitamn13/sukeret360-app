import React from "react";

type SOSButtonProps = {
  onClick: () => void;
};

const SOSButton = ({ onClick }: SOSButtonProps) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "82px",
        height: "82px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #ef4444, #b91c1c)",
        color: "white",
        border: "3px solid rgba(255,255,255,0.9)",
        fontSize: "22px",
        fontWeight: 900,
        letterSpacing: "0.5px",
        boxShadow: "0 14px 28px rgba(127, 29, 29, 0.45)",
        cursor: "pointer",
        zIndex: 9999,
      }}
    >
      SOS
    </button>
  );
};

export default SOSButton;
