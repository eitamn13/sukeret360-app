import { X, CheckCircle2, Droplets } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SugarContext, useAppContext } from '../context/AppContext';

interface SugarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, contextLabel: string, context: SugarContext) => void;
}

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'del'],
];

const CONTEXT_OPTIONS: Array<{ value: SugarContext; label: string }> = [
  { value: 'fasting', label: 'בצום / על הבוקר' },
  { value: 'before_meal', label: 'לפני ארוחה' },
  { value: 'after_meal', label: 'אחרי ארוחה' },
  { value: 'bedtime', label: 'לפני שינה' },
  { value: 'exercise', label: 'אחרי פעילות' },
  { value: 'custom', label: 'מדידה כללית' },
];

function getGlucoseStatus(v: number): { label: string; color: string; bg: string } {
  if (v < 70) return { label: 'נמוך', color: '#DC2626', bg: '#FEF2F2' };
  if (v <= 99) return { label: 'תקין', color: '#059669', bg: '#F0FDF4' };
  if (v <= 125) return { label: 'גבולי', color: '#D97706', bg: '#FFFBEB' };
  if (v <= 180) return { label: 'גבוה', color: '#EA580C', bg: '#FFF7ED' };
  return { label: 'גבוה מאוד', color: '#DC2626', bg: '#FEF2F2' };
}

export function SugarModal({ isOpen, onClose, onSave }: SugarModalProps) {
  const { theme } = useAppContext();
  const [value, setValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedContext, setSelectedContext] = useState<SugarContext>('before_meal');

  const numValue = parseInt(value, 10);
  const status = value.length >= 2 ? getGlucoseStatus(numValue) : null;
  const selectedContextLabel = useMemo(
    () => CONTEXT_OPTIONS.find((item) => item.value === selectedContext)?.label ?? 'מדידה כללית',
    [selectedContext]
  );

  const handleKey = (key: string) => {
    if (key === 'del') {
      setValue((current) => current.slice(0, -1));
    } else if (key === 'clear') {
      setValue('');
    } else if (value.length < 3) {
      setValue((current) => current + key);
    }
  };

  const handleSave = () => {
    if (value && numValue > 0 && numValue <= 600) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    onSave(numValue, selectedContextLabel, selectedContext);
    setValue('');
    setSelectedContext('before_meal');
    setShowConfirm(false);
    onClose();
  };

  const handleClose = () => {
    setValue('');
    setSelectedContext('before_meal');
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden animate-scale-in"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid #F3F4F6' }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 active:scale-95"
            style={{ color: '#6B7280' }}
          >
            <X size={18} strokeWidth={2.5} />
            <span className="text-sm" style={{ fontWeight: 700 }}>סגור</span>
          </button>

          <div className="flex items-center gap-2">
            <Droplets size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
            <h2
              className="text-lg"
              style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              רישום סוכר
            </h2>
          </div>
        </div>

        {!showConfirm ? (
          <div className="px-6 pt-6 pb-6">
            <div className="space-y-3 mb-5">
              <p className="text-sm text-right" style={{ color: '#64748B', fontWeight: 700 }}>
                באיזה הקשר נמדד הסוכר?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CONTEXT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedContext(option.value)}
                    className="rounded-2xl px-3 py-3 text-sm transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: selectedContext === option.value ? theme.primaryBg : '#F8FAFC',
                      border: `1.5px solid ${selectedContext === option.value ? theme.primary : '#E2E8F0'}`,
                      color: selectedContext === option.value ? theme.primary : '#334155',
                      fontWeight: 700,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl mb-5 overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: status ? status.bg : '#F9FAFB',
                border: `2px solid ${status ? `${status.color}30` : '#E5E7EB'}`,
              }}
            >
              <div className="py-5 text-center">
                <p
                  className="text-7xl leading-none tracking-tighter transition-all duration-200"
                  style={{
                    color: status ? status.color : theme.primary,
                    fontWeight: 800,
                    fontFamily: 'Heebo, sans-serif',
                    minHeight: '1.15em',
                  }}
                >
                  {value || '---'}
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: status ? status.color : '#9CA3AF', fontWeight: 600 }}
                >
                  {status ? `${status.label} • mg/dL` : 'mg/dL'}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {KEYPAD.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-2">
                  {row.map((key) => {
                    const isAction = key === 'del' || key === 'clear';
                    return (
                      <button
                        key={key}
                        onClick={() => handleKey(key)}
                        className="h-14 rounded-xl transition-all duration-100 active:scale-95 select-none"
                        style={{
                          backgroundColor: isAction ? '#F3F4F6' : '#F9FAFB',
                          color: key === 'del' ? '#DC2626' : key === 'clear' ? '#6B7280' : '#1F2937',
                          border: `1px solid ${isAction ? '#E5E7EB' : '#EFEFEF'}`,
                          fontWeight: isAction ? 600 : 700,
                          fontSize: key === 'clear' ? '13px' : '20px',
                        }}
                      >
                        {key === 'del' ? '⌫' : key === 'clear' ? 'נקה' : key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={!value || numValue <= 0 || numValue > 600}
              className="w-full h-14 rounded-xl text-lg transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
              style={{
                backgroundColor: value && numValue > 0 && numValue <= 600 ? theme.primary : '#E5E7EB',
                color: value && numValue > 0 && numValue <= 600 ? '#ffffff' : '#9CA3AF',
                fontWeight: 700,
                boxShadow:
                  value && numValue > 0 && numValue <= 600
                    ? `0 4px 20px ${theme.primaryShadow}`
                    : 'none',
              }}
            >
              שמור מדידה
            </button>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-6">
            <div className="text-center mb-7">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.primaryBg }}
              >
                <CheckCircle2 size={32} strokeWidth={1.5} style={{ color: theme.primary }} />
              </div>
              <p className="text-sm mb-3" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                אישור רישום
              </p>
              <div
                className="inline-flex flex-col items-center px-8 py-4 rounded-2xl"
                style={{ backgroundColor: status?.bg || theme.primaryBg, border: `1.5px solid ${(status?.color || theme.primary)}22` }}
              >
                <p
                  className="text-6xl leading-none"
                  style={{ color: status?.color || theme.primary, fontWeight: 800, fontFamily: 'Heebo, sans-serif' }}
                >
                  {value}
                </p>
                <p className="text-sm mt-2" style={{ color: '#475569', fontWeight: 600 }}>
                  {selectedContextLabel}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-xl transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: '#F9FAFB',
                  color: '#1F2937',
                  border: '1.5px solid #E5E7EB',
                  fontWeight: 700,
                }}
              >
                עריכה
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  boxShadow: `0 4px 20px ${theme.primaryShadow}`,
                }}
              >
                אישור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
