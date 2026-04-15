import { Heart, MessageSquare, Trophy, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface CommunitySectionProps {
  onCommunityClick?: () => void;
  onItemClick?: (id: string, label: string) => void;
}

const COMMUNITY_ITEMS = [
  {
    id: 'community',
    icon: <Users size={22} strokeWidth={1.7} />,
    label: 'קהילה',
    hint: 'אנשים כמוך',
  },
  {
    id: 'forum',
    icon: <MessageSquare size={22} strokeWidth={1.7} />,
    label: 'שאלות',
    hint: 'פורום פתוח',
  },
  {
    id: 'support',
    icon: <Heart size={22} strokeWidth={1.7} />,
    label: 'תמיכה',
    hint: 'קבוצות רגועות',
  },
  {
    id: 'challenges',
    icon: <Trophy size={22} strokeWidth={1.7} />,
    label: 'אתגרים',
    hint: 'מטרות קטנות',
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
    <section className="px-4 mt-6 pb-8" dir="rtl">
      <div className="flex flex-row-reverse items-center justify-start mb-3 gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
        >
          <Users size={18} strokeWidth={1.9} />
        </div>

        <div className="text-right">
          <h3 style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>תמיכה וקהילה</h3>
          <p style={{ color: '#64748B', fontSize: 13 }}>מקום לשאול, לשתף ולהתחזק.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {COMMUNITY_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id, item.label)}
            className="rounded-[24px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 112,
              backgroundColor: '#FFFFFF',
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div className="flex flex-col items-end h-full text-right">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center self-end"
                style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
              >
                {item.icon}
              </div>

              <div className="mt-auto w-full text-right">
                <p style={{ color: '#0F172A', fontWeight: 900 }}>{item.label}</p>
                <p style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                  {item.hint}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
