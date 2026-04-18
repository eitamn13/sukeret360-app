import type { ReactNode } from 'react';
import { BookOpen, Sparkles, Stethoscope, UtensilsCrossed } from 'lucide-react';
import { isLifestyleFocusedProfile, useAppContext } from '../context/AppContext';

interface ActionItem {
  icon: ReactNode;
  label: string;
  hint: string;
  accent?: boolean;
  id: string;
}

interface ActionGridProps {
  onActionClick?: (id: string, label: string) => void;
}

export function ActionGrid({ onActionClick }: ActionGridProps) {
  const { theme, userProfile } = useAppContext();
  const lifestyleFocused = isLifestyleFocusedProfile(
    userProfile.diabetesType,
    userProfile.treatmentType
  );

  const actions: ActionItem[] = [
    {
      icon: <UtensilsCrossed size={24} strokeWidth={1.7} />,
      label: '\u05d4\u05e6\u05e2\u05d5\u05ea \u05d0\u05e8\u05d5\u05d7\u05d4',
      hint: lifestyleFocused
        ? '\u05d1\u05d7\u05d9\u05e8\u05d5\u05ea \u05e7\u05dc\u05d5\u05ea \u05dc\u05d9\u05d5\u05dd \u05e8\u05d2\u05d5\u05e2'
        : '\u05e8\u05e2\u05d9\u05d5\u05e0\u05d5\u05ea \u05e4\u05e9\u05d5\u05d8\u05d9\u05dd \u05dc\u05d0\u05d9\u05d6\u05d5\u05df',
      accent: true,
      id: 'meals',
    },
    {
      icon: <Stethoscope size={24} strokeWidth={1.7} />,
      label: '\u05d8\u05d9\u05e4 \u05d9\u05d5\u05de\u05d9',
      hint: '\u05e7\u05e6\u05e8, \u05d1\u05e8\u05d5\u05e8 \u05d5\u05e7\u05d5\u05dc\u05d9',
      id: 'tip',
    },
    {
      icon: <BookOpen size={24} strokeWidth={1.7} />,
      label: '\u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4',
      hint: '\u05de\u05d4 \u05e7\u05e8\u05d4 \u05d4\u05e9\u05d1\u05d5\u05e2',
      id: 'history',
    },
  ];

  return (
    <section className="mt-5 px-4" dir="rtl">
      <div className="mb-3 flex items-center justify-start gap-2">
        <h3 style={{ color: '#5A4740', fontWeight: 900, fontSize: 18 }}>
          {'\u05db\u05dc\u05d9\u05dd \u05e0\u05d5\u05e1\u05e4\u05d9\u05dd'}
        </h3>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: theme.primaryBg, color: theme.primaryDark }}
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id, action.label)}
            className="rounded-[26px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 118,
              background: action.accent ? theme.gradientCard : '#FFFFFF',
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex h-full flex-col items-start text-right">
              <div
                className="flex h-11 w-11 items-center justify-center self-start rounded-2xl"
                style={{
                  background: theme.primaryBg,
                  color: theme.primaryDark,
                }}
              >
                {action.icon}
              </div>

              <div className="mt-auto w-full text-right">
                <p className="text-[15px] leading-tight" style={{ color: '#5A4740', fontWeight: 900 }}>
                  {action.label}
                </p>
                <p className="mt-1 text-xs" style={{ color: '#94817A', fontWeight: 700 }}>
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
