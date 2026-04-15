import { ChevronRight, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Theme } from '../context/AppContext';

interface OverlayHeaderProps {
  title: string;
  subtitle?: string;
  theme: Theme;
  onBack: () => void;
  onClose: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
}

export function OverlayHeader({
  title,
  subtitle,
  theme,
  onBack,
  onClose,
  backLabel = 'חזרה',
  rightSlot,
}: OverlayHeaderProps) {
  return (
    <div
      className="flex-shrink-0 px-5 pt-12 pb-4"
      dir="rtl"
      style={{
        backgroundColor: theme.headerBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${theme.primaryBorder}`,
      }}
    >
      <div className="grid grid-cols-[108px_1fr_108px] items-center gap-2">
        <div className="flex items-center gap-2 justify-self-start">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{
              border: `1.5px solid ${theme.primaryBorder}`,
              backgroundColor: '#FFFFFF',
              color: theme.primary,
              boxShadow: `0 2px 10px ${theme.primary}12`,
            }}
            aria-label="סגור"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
          {rightSlot}
        </div>

        <div className="text-center min-w-0">
          <h1
            className="text-lg leading-tight"
            style={{ color: '#0F172A', fontWeight: 900, letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="text-xs mt-1"
              style={{ color: theme.primaryMuted, fontWeight: 600, lineHeight: 1.6 }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <button
          onClick={onBack}
          className="min-w-[104px] h-11 px-3 rounded-2xl flex flex-row-reverse items-center justify-center gap-1.5 justify-self-end transition-all active:scale-95"
          style={{
            border: `1.5px solid ${theme.primaryBorder}`,
            backgroundColor: '#FFFFFF',
            color: theme.primary,
            boxShadow: `0 2px 10px ${theme.primary}12`,
            fontWeight: 800,
            fontSize: 14,
          }}
          aria-label={backLabel}
        >
          <ChevronRight size={17} strokeWidth={2.3} />
          <span>{backLabel}</span>
        </button>
      </div>
    </div>
  );
}
