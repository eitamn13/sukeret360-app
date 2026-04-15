import { Heart, MessageSquare, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';

interface CommunitySectionProps {
  onCommunityClick?: () => void;
  onItemClick?: (id: string, label: string) => void;
}

interface CommunityItem {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
}

const COMMUNITY_ITEMS: CommunityItem[] = [
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
    accent: true,
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
    accent: true,
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
          style={{
            background: 'linear-gradient(135deg, rgba(248, 233, 220, 0.95) 0%, rgba(245, 213, 223, 0.95) 100%)',
            color: theme.primaryDark,
          }}
        >
          <Users size={18} strokeWidth={1.9} />
        </div>

        <div className="text-right">
          <h3 style={{ color: '#5A4740', fontWeight: 900, fontSize: 18 }}>תמיכה וקהילה</h3>
          <p style={{ color: '#95837A', fontSize: 13 }}>לשאול, לשתף ולהתחזק בקצב נעים וברור.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {COMMUNITY_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id, item.label)}
            className="rounded-[26px] p-4 text-right transition-all active:scale-[0.98]"
            style={{
              minHeight: 116,
              background: item.accent
                ? 'linear-gradient(145deg, #FFF8F3 0%, #FBECEE 100%)'
                : 'linear-gradient(145deg, #FFFFFF 0%, #FFF9F2 100%)',
              border: `1px solid ${item.accent ? '#EAD6D8' : theme.primaryBorder}`,
              boxShadow: item.accent
                ? '0 18px 34px rgba(211, 176, 177, 0.14)'
                : '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex flex-col items-end h-full text-right">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center self-end"
                style={{
                  background: item.accent
                    ? 'linear-gradient(135deg, #F7D4DE 0%, #F1C5D2 100%)'
                    : 'linear-gradient(135deg, #FFF4EE 0%, #FBF1E5 100%)',
                  color: item.accent ? '#8B5364' : theme.primaryDark,
                }}
              >
                {item.icon}
              </div>

              <div className="mt-auto w-full text-right">
                <p className="text-[15px] leading-tight" style={{ color: '#5A4740', fontWeight: 900 }}>
                  {item.label}
                </p>
                <p className="text-xs mt-1" style={{ color: '#94817A', fontWeight: 700 }}>
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
