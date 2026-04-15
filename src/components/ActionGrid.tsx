import {
  BookOpen,
  ChevronLeft,
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
    icon: <Search size={26} strokeWidth={1.6} />,
    label: 'רישום ארוחה',
    sublabel: 'צילום, זיהוי מזון, מאגר ערכים וחישוב פחמימות',
    accent: true,
    id: 'meal-logger',
  },
  {
    icon: <Droplets size={26} strokeWidth={1.6} />,
    label: 'רישום סוכר',
    sublabel: 'יומן מדידות ברור לפי זמן ופעילות',
    id: 'sugar',
  },
  {
    icon: <Pill size={26} strokeWidth={1.6} />,
    label: 'תרופות',
    sublabel: 'לוח יומי, סימון לקיחה והתרעות',
    id: 'medications',
  },
  {
    icon: <UtensilsCrossed size={26} strokeWidth={1.6} />,
    label: 'הצעות ארוחה',
    sublabel: 'רעיונות מותאמים למצב הסוכר ולהמשך היום',
    id: 'meals',
  },
  {
    icon: <Stethoscope size={26} strokeWidth={1.6} />,
    label: 'טיפ יומי מרופא',
    sublabel: 'תוכן מקצועי, קצר ומותאם יותר',
    id: 'tip',
  },
  {
    icon: <BookOpen size={26} strokeWidth={1.6} />,
    label: 'היסטוריה ודוחות',
    sublabel: 'מדידות, ארוחות, תרופות ומגמות אמיתיות',
    id: 'history',
  },
  {
    icon: <Video size={26} strokeWidth={1.6} />,
    labelFn: (gender) => genderedText(gender, 'עוזרת בריאות AI', 'עוזר בריאות AI'),
    sublabel: 'שיחה חכמה על סוכר, אוכל, תרופות והרגלים',
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
    <div className="px-4 mt-6">
      <div
        className="rounded-[28px] p-4 mb-4"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
          border: `1px solid ${theme.primaryBorder}`,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: theme.gradientCard, color: '#FFFFFF' }}
          >
            <Sparkles size={18} strokeWidth={1.9} />
          </div>

          <div className="text-right flex-1">
            <h3 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>הפעולות החשובות להיום</h3>
            <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>
              תפריט מהיר ונעים יותר לשימוש עם קיצורים לכל הדברים שבאמת חשובים במהלך היום.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {primaryActions.map((action) => {
          const label = getLabel(action);

          return (
            <button
              key={action.id}
              onClick={() => handleClick(action.id, label)}
              className="w-full flex items-center gap-4 rounded-[24px] transition-all duration-200 group active:scale-[0.985]"
              style={{
                padding: '17px 18px',
                background: action.accent ? theme.gradientCard : '#FFFFFF',
                border: action.accent ? 'none' : `1.5px solid ${theme.primaryBorder}`,
                boxShadow: action.accent
                  ? `0 18px 34px ${theme.primaryShadow}`
                  : '0 10px 26px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                className="w-14 h-14 rounded-[22px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: action.accent ? 'rgba(255,255,255,0.16)' : theme.primaryBg,
                  color: action.accent ? '#FFFFFF' : theme.primary,
                }}
              >
                {action.icon}
              </div>

              <div className="flex-1 text-right min-w-0">
                <p
                  className="text-[15px] leading-tight"
                  style={{ color: action.accent ? '#FFFFFF' : '#0F172A', fontWeight: 900 }}
                >
                  {label}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: action.accent ? 'rgba(255,255,255,0.78)' : '#64748B', lineHeight: 1.7 }}
                >
                  {action.sublabel}
                </p>
              </div>

              <ChevronLeft
                size={18}
                strokeWidth={2.1}
                className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                style={{ color: action.accent ? 'rgba(255,255,255,0.72)' : theme.primaryMuted }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
