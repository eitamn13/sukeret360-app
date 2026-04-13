import { X, Pill, Syringe, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

interface Medication {
  id: string;
  time: string;
  period: string;
  name: string;
  dosage: string;
  type: 'pill' | 'injection';
  notes?: string;
}

const MEDICATIONS: Medication[] = [
  {
    id: 'morning',
    time: '08:00',
    period: 'בוקר',
    name: 'מטפורמין',
    dosage: '500 מ"ג',
    type: 'pill',
    notes: 'ליטול עם ארוחת הבוקר',
  },
  {
    id: 'noon',
    time: '13:00',
    period: 'צהריים',
    name: 'כדור לפני ארוחה',
    dosage: 'גלוקובאנס 2.5/500',
    type: 'pill',
    notes: '30 דקות לפני הארוחה',
  },
  {
    id: 'evening',
    time: '21:00',
    period: 'ערב',
    name: 'הזרקת אינסולין',
    dosage: '10 יחידות לנטוס',
    type: 'injection',
    notes: 'הזרקה בטן או ירך',
  },
];

function isPast(timeStr: string): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
}

interface MedicationsScreenProps {
  onClose: () => void;
}

export function MedicationsScreen({ onClose }: MedicationsScreenProps) {
  const { completedMedications, toggleMedication, theme } = useAppContext();
  const done = completedMedications;
  const [justMarked, setJustMarked] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggle = (id: string) => {
    toggleMedication(id);
    if (!done.has(id)) {
      setJustMarked(id);
      setTimeout(() => setJustMarked(null), 1000);
    }
  };

  const doneCount = done.size;
  const progress = Math.round((doneCount / MEDICATIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-in-right" style={{ background: theme.gradientFull }}>
      <div
        className="flex-shrink-0 px-5 pt-12 pb-4"
        style={{ backgroundColor: theme.headerBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${theme.primaryBorder}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ border: `1.5px solid ${theme.primaryBorder}`, backgroundColor: 'white' }}
            aria-label="סגור"
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h1
              className="text-lg leading-tight"
              style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              ניהול תרופות יומי
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: theme.primaryMuted, fontWeight: 500 }}
            >
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
          >
            <Pill size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
          </div>
        </div>

        <div
          className="rounded-xl p-3.5"
          style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-600"
              style={{ color: '#6B7280', fontWeight: 600 }}
            >
              {doneCount}/{MEDICATIONS.length} בוצעו
            </span>
            <span
              className="text-xs font-700"
              style={{ color: progress === 100 ? '#16A34A' : theme.primary, fontWeight: 700 }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: '#E5E7EB' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#16A34A' : theme.primary,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="relative">
          <div
            className="absolute right-[1.85rem] top-6 bottom-6 w-0.5"
            style={{ backgroundColor: '#E5E7EB' }}
          />

          <div className="space-y-4">
            {MEDICATIONS.map((med, idx) => {
              const isDone = done.has(med.id);
              const isJust = justMarked === med.id;
              const past = isPast(med.time);

              return (
                <div key={med.id} className="flex items-start gap-4">
                  <div className="relative z-10 flex-shrink-0 mt-5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-400"
                      style={{
                        backgroundColor: isDone ? '#16A34A' : past ? theme.primaryBg : '#F3F4F6',
                        border: `2px solid ${isDone ? '#16A34A' : past ? theme.primary : '#E5E7EB'}`,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={14} color="white" strokeWidth={2.5} />
                      ) : past ? (
                        <AlertCircle size={14} strokeWidth={2} style={{ color: '#E11D48' }} />
                      ) : (
                        <Clock size={13} strokeWidth={2} style={{ color: '#9CA3AF' }} />
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex-1 rounded-2xl p-5 transition-all duration-300 ${isJust ? 'scale-[1.01]' : ''}`}
                    style={{
                      backgroundColor: isDone ? '#F0FDF4' : '#FFFFFF',
                      border: `1.5px solid ${isDone ? '#BBF7D0' : '#F3F4F6'}`,
                      boxShadow: isDone
                        ? '0 2px 12px rgba(22, 163, 74, 0.08)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isDone ? '#DCFCE7' : theme.primaryBg,
                          color: isDone ? '#16A34A' : theme.primary,
                        }}
                      >
                        {med.type === 'injection' ? (
                          <Syringe size={20} strokeWidth={1.5} />
                        ) : (
                          <Pill size={20} strokeWidth={1.5} />
                        )}
                      </div>

                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2 mb-0.5">
                          <h3
                            className="text-base font-800 leading-tight"
                            style={{
                              color: isDone ? '#15803D' : '#1F2937',
                              fontWeight: 800,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {med.name}
                          </h3>
                          <span
                            className="text-xs font-700 px-2 py-0.5 rounded-lg"
                            style={{
                              backgroundColor: isDone ? '#DCFCE7' : theme.primaryBg,
                              color: isDone ? '#15803D' : theme.primary,
                              fontWeight: 700,
                            }}
                          >
                            {med.period}
                          </span>
                        </div>
                        <p
                          className="text-sm font-500"
                          style={{ color: isDone ? '#16A34A' : '#6B7280', fontWeight: 500 }}
                        >
                          {med.dosage}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between mb-4 pb-4"
                      style={{ borderBottom: `1px solid ${isDone ? '#BBF7D0' : '#F3F4F6'}` }}
                    >
                      <p
                        className="text-xs font-400"
                        style={{ color: '#9CA3AF', fontWeight: 400 }}
                      >
                        {med.notes}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} strokeWidth={2} style={{ color: '#9CA3AF' }} />
                        <span
                          className="text-sm font-700"
                          style={{ color: isDone ? '#15803D' : '#374151', fontWeight: 700 }}
                        >
                          {med.time}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggle(med.id)}
                      className="w-full h-12 rounded-xl font-700 text-base transition-all duration-300 active:scale-[0.97]"
                      style={{
                        backgroundColor: isDone ? '#16A34A' : theme.primary,
                        color: '#ffffff',
                        fontWeight: 700,
                        boxShadow: isDone
                          ? '0 4px 16px rgba(22, 163, 74, 0.3)'
                          : `0 4px 16px ${theme.primaryShadow}`,
                        letterSpacing: isDone ? '0' : '-0.01em',
                      }}
                    >
                      {isDone ? 'בוצע ✓' : 'סמני כבוצע'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {doneCount === MEDICATIONS.length && (
          <div
            className="mt-5 rounded-2xl p-5 text-center animate-fade-in"
            style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
          >
            <p
              className="text-lg font-800"
              style={{ color: '#15803D', fontWeight: 800 }}
            >
              כל התרופות נלקחו
            </p>
            <p
              className="text-sm font-500 mt-1"
              style={{ color: '#16A34A', fontWeight: 500 }}
            >
              עבודה מצוינת! המשיכי כך
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
