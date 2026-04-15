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
      <div className="relative min-h-[52px]">
        <div className="absolute right-0 top-0">
          <button
            onClick={onBack}
            className="min-w-[104px] h-11 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
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

        <div className="absolute left-0 top-0 flex items-center gap-2">
          {rightSlot}
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
        </div>

        <div className="px-[112px] text-center min-h-[52px] flex flex-col justify-center">
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
      </div>
    </div>
  );
}
