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
      <div className="flex flex-row-reverse items-center justify-start mb-3 gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(246,223,217,0.95) 0%, rgba(250,239,231,0.95) 100%)',
            color: theme.primaryDark,
          }}
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </div>

        <div className="text-right">
          <h3 style={{ color: '#5A4740', fontWeight: 900, fontSize: 18 }}>מה צריך עכשיו</h3>
          <p style={{ color: '#95837A', fontSize: 13 }}>פעולות פשוטות וברורות, בלי עומס.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id, action.label)}
            className="rounded-[26px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 118,
              background: action.accent
                ? 'linear-gradient(145deg, #FFF8F3 0%, #FBEAEC 100%)'
                : 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F1 100%)',
              border: `1px solid ${action.accent ? '#EBD7D9' : theme.primaryBorder}`,
              boxShadow: action.accent
                ? '0 18px 34px rgba(211, 176, 177, 0.15)'
                : '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex flex-col items-end h-full text-right">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center self-end"
                style={{
                  background: action.accent
                    ? 'linear-gradient(135deg, #F6CFDA 0%, #EFC1CC 100%)'
                    : 'linear-gradient(135deg, #FFF4EE 0%, #FAF2E6 100%)',
                  color: action.accent ? '#8E4A61' : theme.primaryDark,
                }}
              >
                {action.icon}
              </div>

              <div className="mt-auto w-full text-right">
                <p
                  className="text-[15px] leading-tight"
                  style={{ color: '#5A4740', fontWeight: 900 }}
                >
                  {action.label}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{
                    color: '#94817A',
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
