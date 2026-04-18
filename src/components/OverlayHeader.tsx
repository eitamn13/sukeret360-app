import type { ReactNode } from 'react';
import { ChevronRight, X } from 'lucide-react';
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
  backLabel = '\u05d7\u05d6\u05e8\u05d4',
  rightSlot,
}: OverlayHeaderProps) {
  return (
    <div
      className="flex-shrink-0 px-5 pb-4 pt-12"
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
            className="flex h-11 min-w-[104px] items-center justify-center gap-1.5 rounded-2xl px-3 transition-all active:scale-95"
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
            style={{
              border: `1.5px solid ${theme.primaryBorder}`,
              backgroundColor: '#FFFFFF',
              color: theme.primary,
              boxShadow: `0 2px 10px ${theme.primary}12`,
            }}
            aria-label={'\u05e1\u05d2\u05d5\u05e8'}
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex min-h-[52px] flex-col justify-center px-[112px] text-center">
          <h1
            className="text-lg leading-tight"
            style={{ color: '#0F172A', fontWeight: 900, letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="mt-1 text-xs"
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
