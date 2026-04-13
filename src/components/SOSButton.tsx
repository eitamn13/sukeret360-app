import React from "react";

const SOSButton = () => {
  return (
    <button
      onClick={() => alert("SOS נלחץ!")}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "red",
        color: "white",
        padding: "20px",
        borderRadius: "50%",
        fontSize: "20px",
        zIndex: 9999
      }}
    >
      SOS
    </button>
  );
};

export default SOSButton;
