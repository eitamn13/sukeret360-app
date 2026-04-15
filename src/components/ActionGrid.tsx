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
  { icon: <Search size={24} strokeWidth={1.7} />, label: 'רישום ארוחה', hint: 'צילום או חיפוש', accent: true, id: 'meal-logger' },
  { icon: <Droplets size={24} strokeWidth={1.7} />, label: 'רישום סוכר', hint: 'מדידה חדשה', id: 'sugar' },
  { icon: <Pill size={24} strokeWidth={1.7} />, label: 'תרופות', hint: 'לוח ותזכורות', id: 'medications' },
  { icon: <UtensilsCrossed size={24} strokeWidth={1.7} />, label: 'ארוחות', hint: 'רעיונות מהירים', id: 'meals' },
  { icon: <Stethoscope size={24} strokeWidth={1.7} />, label: 'טיפ יומי', hint: 'קצר וברור', id: 'tip' },
  { icon: <BookOpen size={24} strokeWidth={1.7} />, label: 'היסטוריה', hint: 'מה קרה השבוע', id: 'history' },
  { icon: <Video size={24} strokeWidth={1.7} />, label: 'העוזר הרפואי שלי', hint: 'שאלה רפואית קצרה', accent: true, id: 'doctor' },
];

export function ActionGrid({ onMealLoggerClick, onSugarClick, onActionClick }: ActionGridProps) {
  const { theme, userProfile } = useAppContext();
  const isMale = userProfile.gender === 'male';

  const accentSurface = isMale
    ? {
        headerBadge: 'linear-gradient(135deg, rgba(224,236,252,0.96) 0%, rgba(244,248,255,0.98) 100%)',
        card: 'linear-gradient(145deg, #F9FBFF 0%, #EEF4FD 100%)',
        border: '#D9E5F4',
        shadow: '0 18px 34px rgba(138, 169, 214, 0.14)',
        iconBg: 'linear-gradient(135deg, #D6E6FB 0%, #C7DAF4 100%)',
        iconColor: '#4B6586',
        plainBg: 'linear-gradient(145deg, #FFFFFF 0%, #F7FAFE 100%)',
        plainIconBg: 'linear-gradient(135deg, #EFF5FD 0%, #E4EDF9 100%)',
      }
    : {
        headerBadge: 'linear-gradient(135deg, rgba(246,223,217,0.95) 0%, rgba(250,239,231,0.95) 100%)',
        card: 'linear-gradient(145deg, #FFF8F3 0%, #FBEAEC 100%)',
        border: '#EBD7D9',
        shadow: '0 18px 34px rgba(211, 176, 177, 0.15)',
        iconBg: 'linear-gradient(135deg, #F6CFDA 0%, #EFC1CC 100%)',
        iconColor: '#8E4A61',
        plainBg: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F1 100%)',
        plainIconBg: 'linear-gradient(135deg, #FFF4EE 0%, #FAF2E6 100%)',
      };

  const handleClick = (id: string, label: string) => {
    if (id === 'meal-logger') return onMealLoggerClick?.();
    if (id === 'sugar') return onSugarClick?.();
    onActionClick?.(id, label);
  };

  return (
    <section className="px-4 mt-6" dir="rtl">
      <div className="mb-3 flex flex-row-reverse items-center justify-start gap-2">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentSurface.headerBadge, color: theme.primaryDark }}
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </div>
        <div className="text-right">
          <h3 style={{ color: '#5A4740', fontWeight: 900, fontSize: 18 }}>מה צריך עכשיו</h3>
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
              background: action.accent ? accentSurface.card : accentSurface.plainBg,
              border: `1px solid ${action.accent ? accentSurface.border : theme.primaryBorder}`,
              boxShadow: action.accent ? accentSurface.shadow : '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex flex-col h-full text-right">
              <div className="w-full flex flex-row-reverse justify-start">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: action.accent ? accentSurface.iconBg : accentSurface.plainIconBg,
                    color: action.accent ? accentSurface.iconColor : theme.primaryDark,
                  }}
                >
                  {action.icon}
                </div>
              </div>

              <div className="mt-auto w-full text-right">
                <p className="text-[15px] leading-tight" style={{ color: '#5A4740', fontWeight: 900 }}>
                  {action.label}
                </p>
                <p className="text-xs mt-1" style={{ color: '#94817A', fontWeight: 700 }}>
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
