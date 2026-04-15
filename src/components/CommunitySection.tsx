import { Users, MessageSquare, Heart, ChevronLeft, Trophy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface CommunitySectionProps {
  onCommunityClick?: () => void;
  onItemClick?: (id: string, label: string) => void;
}

const communityItems = [
  {
    id: 'community',
    icon: <Users size={24} strokeWidth={1.5} />,
    label: 'קהילה חכמה ותומכת',
    sublabel: '2,340 חברים ומשפחות שכבר בפנים',
    badge: 'פעיל',
  },
  {
    id: 'forum',
    icon: <MessageSquare size={24} strokeWidth={1.5} />,
    label: 'פורום שאלות',
    sublabel: 'מקום לשאול, ללמוד ולקבל עזרה מהר',
  },
  {
    id: 'support',
    icon: <Heart size={24} strokeWidth={1.5} />,
    label: 'מעגלי תמיכה',
    sublabel: 'קבוצות עדינות למטופלים, משפחות ומבוגרים',
  },
  {
    id: 'challenges',
    icon: <Trophy size={24} strokeWidth={1.5} />,
    label: 'אתגרי בריאות',
    sublabel: 'משימות קצרות שבונות שגרה ויציבות',
  },
];

export function CommunitySection({ onCommunityClick, onItemClick }: CommunitySectionProps) {
  const { theme } = useAppContext();

  const handleClick = (id: string, label: string) => {
    if (id === 'community') {
      onCommunityClick?.();
      return;
    }

    onItemClick?.(id, label);
  };

  return (
    <div className="px-4 mt-6 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: theme.primaryBorder }} />
        <span
          className="text-xs uppercase tracking-widest px-1"
          style={{
            color: theme.primaryMuted,
            fontWeight: 700,
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
          }}
        >
          קהילה מתקדמת
        </span>
        <div className="flex-1 h-px" style={{ background: theme.primaryBorder }} />
      </div>

      <div className="space-y-3">
        {communityItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id, item.label)}
            className="w-full flex items-center gap-4 rounded-2xl transition-all duration-200 group active:scale-[0.98]"
            style={{
              padding: '16px 18px',
              background: '#FFFFFF',
              border: `1.5px solid ${theme.primaryBorder}`,
              boxShadow: `0 2px 8px ${theme.primary}14`,
            }}
          >
            <div
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ width: '52px', height: '52px', background: theme.primaryBg, color: theme.primary }}
            >
              {item.icon}
            </div>

            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-base leading-tight truncate" style={{ color: '#1F2937', fontWeight: 700 }}>
                  {item.label}
                </p>
                {item.badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: theme.primaryBg, color: theme.primary, fontWeight: 700 }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 truncate" style={{ color: '#64748B', fontWeight: 500 }}>
                {item.sublabel}
              </p>
            </div>

            <ChevronLeft
              size={18}
              strokeWidth={2}
              className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
              style={{ color: theme.primaryMuted, opacity: 0.7 }}
            />
          </button>
        ))}
      </div>

      <div
        className="mt-6 rounded-2xl p-5 text-center"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
          border: `1.5px solid ${theme.primaryBorder}`,
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: theme.primaryDark, fontWeight: 700 }}>
          הקהילה שלנו נבנתה כדי לתת תמיכה, רעיונות ושגרה חכמה למי שחי עם סוכרת בכל יום מחדש.
        </p>
        <p className="text-xs mt-1.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
          שיתוף, שאלות, אתגרים והתקדמות במקום אחד
        </p>
      </div>
    </div>
  );
}
