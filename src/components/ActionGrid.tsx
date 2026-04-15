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
import { type ReactNode } from 'react';
import { Gender, genderedText, useAppContext } from '../context/AppContext';

interface ActionItem {
  icon: ReactNode;
  labelFn?: (gender: Gender) => string;
  label?: string;
  hint: string;
  accent?: boolean;
  id: string;
}

interface ActionGridProps {
  onMealLoggerClick?: () => void;
  onSugarClick?: () => void;
  onActionClick?: (id: string, label: string) => void;
}

const primaryActions: ActionItem[] = [
  {
    icon: <Search size={24} strokeWidth={1.7} />,
    label: 'רישום ארוחה',
    hint: 'צילום',
    accent: true,
    id: 'meal-logger',
  },
  {
    icon: <Droplets size={24} strokeWidth={1.7} />,
    label: 'רישום סוכר',
    hint: 'מדידה',
    id: 'sugar',
  },
  {
    icon: <Pill size={24} strokeWidth={1.7} />,
    label: 'תרופות',
    hint: 'תזכורות',
    id: 'medications',
  },
  {
    icon: <UtensilsCrossed size={24} strokeWidth={1.7} />,
    label: 'הצעות ארוחה',
    hint: 'רעיונות',
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
    hint: 'נתונים',
    id: 'history',
  },
  {
    icon: <Video size={24} strokeWidth={1.7} />,
    labelFn: (gender) => genderedText(gender, 'עוזרת AI', 'עוזר AI'),
    hint: 'שאלה מהירה',
    accent: true,
    id: 'doctor',
  },
];

export function ActionGrid({ onMealLoggerClick, onSugarClick, onActionClick }: ActionGridProps) {
  const { theme, userProfile } = useAppContext();

  const getLabel = (action: ActionItem) => {
    if (action.labelFn) return action.labelFn(userProfile.gender);
    return action.label ?? '';
  };

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
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </div>
        <div className="text-right">
          <h3 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>פעולות נוספות</h3>
          <p style={{ color: '#64748B', fontSize: 13 }}>כל מה שצריך, בקיצור.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {primaryActions.map((action) => {
          const label = getLabel(action);

          return (
            <button
              key={action.id}
              onClick={() => handleClick(action.id, label)}
              className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
              style={{
                minHeight: 118,
                background: action.accent ? theme.gradientCard : '#FFFFFF',
                border: action.accent ? 'none' : `1.5px solid ${theme.primaryBorder}`,
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
                    {label}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: action.accent ? 'rgba(255,255,255,0.78)' : '#64748B', fontWeight: 700 }}
                  >
                    {action.hint}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
