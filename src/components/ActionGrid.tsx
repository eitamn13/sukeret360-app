import {
  BookOpen,
  Droplets,
  Pill,
  Search,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Video,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';

interface ActionItem {
  icon: ReactNode;
  label: string;
  hint: string;
  accent?: boolean;
  id: string;
}

interface ActionGridProps {
  onMealLoggerClick?: () => void;
  onSugarClick?: () => void;
  onActionClick?: (id: string, label: string) => void;
}

const PRIMARY_ACTIONS: ActionItem[] = [
  {
    icon: <Search size={24} strokeWidth={1.7} />,
    label: 'רישום ארוחה',
    hint: 'צילום או חיפוש',
    accent: true,
    id: 'meal-logger',
  },
  {
    icon: <Droplets size={24} strokeWidth={1.7} />,
    label: 'רישום סוכר',
    hint: 'מדידה חדשה',
    id: 'sugar',
  },
  {
    icon: <Pill size={24} strokeWidth={1.7} />,
    label: 'תרופות',
    hint: 'לוח ותזכורות',
    id: 'medications',
  },
  {
    icon: <UtensilsCrossed size={24} strokeWidth={1.7} />,
    label: 'ארוחות',
    hint: 'רעיונות מהירים',
    id: 'meals',
  },
  {
    icon: <Stethoscope size={24} strokeWidth={1.7} />,
    label: 'טיפ יומי',
    hint: 'קצר וברור',
    id: 'tip',
  },
  {
    icon: <BookOpen size={24} strokeWidth={1.7} />,
    label: 'היסטוריה',
    hint: 'מה קרה השבוע',
    id: 'history',
  },
  {
    icon: <Video size={24} strokeWidth={1.7} />,
    label: 'העוזר הרפואי שלי',
    hint: 'שאלה רפואית קצרה',
    accent: true,
    id: 'doctor',
  },
];

export function ActionGrid({ onMealLoggerClick, onSugarClick, onActionClick }: ActionGridProps) {
  const { theme } = useAppContext();

  const handleClick = (id: string, label: string) => {
    if (id === 'meal-logger') {
      onMealLoggerClick?.();
      return;
    }

    if (id === 'sugar') {
      onSugarClick?.();
      return;
    }

    onActionClick?.(id, label);
  };

  return (
    <section className="px-4 mt-6" dir="rtl">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-right">
          <h3 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>מה צריך עכשיו</h3>
          <p style={{ color: '#64748B', fontSize: 13 }}>קצר, ברור ומהיר.</p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id, action.label)}
            className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 118,
              background: action.accent ? theme.gradientCard : '#FFFFFF',
              border: action.accent ? 'none' : `1px solid ${theme.primaryBorder}`,
              boxShadow: action.accent
                ? `0 18px 34px ${theme.primaryShadow}`
                : '0 10px 26px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div className="flex flex-col items-end h-full">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: action.accent ? 'rgba(255,255,255,0.16)' : theme.primaryBg,
                  color: action.accent ? '#FFFFFF' : theme.primary,
                }}
              >
                {action.icon}
              </div>

              <div className="mt-auto">
                <p
                  className="text-[15px] leading-tight"
                  style={{ color: action.accent ? '#FFFFFF' : '#0F172A', fontWeight: 900 }}
                >
                  {action.label}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{
                    color: action.accent ? 'rgba(255,255,255,0.78)' : '#64748B',
                    fontWeight: 700,
                  }}
                >
                  {action.hint}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
