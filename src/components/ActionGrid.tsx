import {
  Search,
  Stethoscope,
  BookOpen,
  Pill,
  ChevronLeft,
  Droplets,
  UtensilsCrossed,
  Video,
} from 'lucide-react';
import { useAppContext, genderedText } from '../context/AppContext';

interface ActionItem {
  icon: React.ReactNode;
  labelFn?: (gender: string) => string;
  label?: string;
  sublabel: string;
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
    icon: <Search size={26} strokeWidth={1.5} />,
    label: 'רישום ארוחה',
    sublabel: 'חיפוש חכם וניתוח פחמימות',
    accent: true,
    id: 'meal-logger',
  },
  {
    icon: <Droplets size={26} strokeWidth={1.5} />,
    label: 'רישום סוכר',
    sublabel: 'יומן מדידות יומי',
    id: 'sugar',
  },
  {
    icon: <Pill size={26} strokeWidth={1.5} />,
    label: 'תרופות',
    sublabel: 'מינונים ותזמונים',
    id: 'medications',
  },
  {
    icon: <UtensilsCrossed size={26} strokeWidth={1.5} />,
    label: 'הצעות ארוחה',
    sublabel: 'תפריט יומי + הרגלים',
    id: 'meals',
  },
  {
    icon: <Stethoscope size={26} strokeWidth={1.5} />,
    label: 'טיפ יומי מהרופא',
    sublabel: 'המלצה מקצועית',
    id: 'tip',
  },
  {
    icon: <BookOpen size={26} strokeWidth={1.5} />,
    label: 'היסטוריה',
    sublabel: 'דוחות ומגמות',
    id: 'history',
  },
  {
    icon: <Video size={26} strokeWidth={1.5} />,
    labelFn: (g) => genderedText(g as any, 'עוזרת בריאות AI', 'עוזר בריאות AI'),
    sublabel: 'שאל/י כל שאלה על הסוכרת',
    id: 'doctor',
  },
];

export function ActionGrid({ onMealLoggerClick, onSugarClick, onActionClick }: ActionGridProps) {
  const { theme, userProfile } = useAppContext();
  const gender = userProfile.gender;

  const getLabel = (action: ActionItem): string => {
    if (action.labelFn) return action.labelFn(gender);
    return action.label ?? '';
  };

  const handleClick = (id: string, label: string) => {
    if (id === 'meal-logger') { onMealLoggerClick?.(); return; }
    if (id === 'sugar') { onSugarClick?.(); return; }
    onActionClick?.(id, label);
  };

  return (
    <div className="px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs uppercase tracking-widest"
          style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          פעולות מהירות
        </h3>
      </div>

      <div className="space-y-3">
        {primaryActions.map((action) => {
          const label = getLabel(action);
          return (
            <button
              key={action.id}
              onClick={() => handleClick(action.id, label)}
              className="w-full flex items-center gap-4 rounded-2xl transition-all duration-200 group active:scale-[0.98]"
              style={{
                padding: '16px 18px',
                background: action.accent ? theme.gradientCard : '#FFFFFF',
                border: action.accent ? 'none' : `1.5px solid ${theme.primaryBorder}`,
                boxShadow: action.accent
                  ? `0 6px 24px ${theme.primaryShadow}`
                  : `0 2px 8px ${theme.primary}0F`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: action.accent ? 'rgba(255,255,255,0.2)' : theme.primaryBg,
                  color: action.accent ? '#ffffff' : theme.primary,
                }}
              >
                {action.icon}
              </div>

              <div className="flex-1 text-right min-w-0">
                <p
                  className="text-base leading-tight truncate"
                  style={{ color: action.accent ? '#FFFFFF' : '#1F2937', fontWeight: 700 }}
                >
                  {label}
                </p>
                <p
                  className="text-sm mt-0.5 truncate"
                  style={{ color: action.accent ? 'rgba(255,255,255,0.75)' : '#9CA3AF', fontWeight: 400 }}
                >
                  {action.sublabel}
                </p>
              </div>

              <ChevronLeft
                size={18}
                strokeWidth={2}
                className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                style={{ color: action.accent ? 'rgba(255,255,255,0.7)' : theme.primaryMuted, opacity: 0.7 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
