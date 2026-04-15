import { ShieldAlert } from 'lucide-react';

type SOSButtonProps = {
  onClick: () => void;
};

const SOSButton = ({ onClick }: SOSButtonProps) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '12px',
        width: '56px',
        height: '56px',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
        color: 'white',
        border: '2px solid rgba(255,255,255,0.92)',
        fontSize: '11px',
        fontWeight: 900,
        letterSpacing: '0.2px',
        boxShadow: '0 12px 24px rgba(127, 29, 29, 0.28)',
        cursor: 'pointer',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1px',
      }}
      aria-label="SOS"
    >
      <ShieldAlert size={18} strokeWidth={2.4} />
      <span>SOS</span>
    </button>
  );
};

export default SOSButton;
