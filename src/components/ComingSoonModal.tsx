import { X, Wrench } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  featureName: string;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, featureName, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-white rounded-2xl overflow-hidden animate-scale-in"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
              style={{ color: '#6B7280' }}
            >
              <X size={16} strokeWidth={2.5} />
              <span className="text-sm font-700" style={{ fontWeight: 700 }}>סגור</span>
            </button>
            <div className="w-8" />
          </div>

          <div className="text-center pb-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#EFF6FF' }}
            >
              <Wrench size={28} strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
            </div>

            <h3
              className="text-2xl font-800 mb-1"
              style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              בקרוב
            </h3>
            <p
              className="text-sm font-500 leading-relaxed"
              style={{ color: '#6B7280', fontWeight: 500 }}
            >
              הפיצ'ר{' '}
              <span style={{ color: '#1D4ED8', fontWeight: 700 }}>"{featureName}"</span>
              {' '}בפיתוח ויהיה זמין בקרוב.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 h-12 rounded-xl font-700 text-base transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: '#1D4ED8',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(29, 78, 216, 0.3)',
            }}
          >
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );
}
