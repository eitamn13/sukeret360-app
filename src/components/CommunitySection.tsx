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
  { id: 'community', icon: <Users size={22} strokeWidth={1.7} />, label: 'קהילה', hint: 'אנשים כמוך' },
  { id: 'forum', icon: <MessageSquare size={22} strokeWidth={1.7} />, label: 'שאלות', hint: 'פורום פתוח', accent: true },
  { id: 'support', icon: <Heart size={22} strokeWidth={1.7} />, label: 'תמיכה', hint: 'קבוצות רגועות' },
  { id: 'challenges', icon: <Trophy size={22} strokeWidth={1.7} />, label: 'אתגרים', hint: 'מטרות קטנות', accent: true },
];

export function CommunitySection({ onCommunityClick, onItemClick }: CommunitySectionProps) {
  const { theme, userProfile } = useAppContext();
  const isMale = userProfile.gender === 'male';

  const accentSurface = isMale
    ? {
        headerBadge: 'linear-gradient(135deg, rgba(226,237,253,0.96) 0%, rgba(244,248,255,0.98) 100%)',
        card: 'linear-gradient(145deg, #F9FBFF 0%, #EEF4FD 100%)',
        border: '#DBE6F3',
        shadow: '0 18px 34px rgba(138, 169, 214, 0.13)',
        iconBg: 'linear-gradient(135deg, #D8E7FB 0%, #CBDCF5 100%)',
        iconColor: '#506A87',
        plainBg: 'linear-gradient(145deg, #FFFFFF 0%, #F7FAFE 100%)',
        plainIconBg: 'linear-gradient(135deg, #EFF5FD 0%, #E5EDF8 100%)',
      }
    : {
        headerBadge: 'linear-gradient(135deg, rgba(248,233,220,0.95) 0%, rgba(245,213,223,0.95) 100%)',
        card: 'linear-gradient(145deg, #FFF8F3 0%, #FBECEE 100%)',
        border: '#EAD6D8',
        shadow: '0 18px 34px rgba(211, 176, 177, 0.14)',
        iconBg: 'linear-gradient(135deg, #F7D4DE 0%, #F1C5D2 100%)',
        iconColor: '#8B5364',
        plainBg: 'linear-gradient(145deg, #FFFFFF 0%, #FFF8F1 100%)',
        plainIconBg: 'linear-gradient(135deg, #FFF4EE 0%, #FBF1E5 100%)',
      };

  const handleClick = (id: string, label: string) => {
    if (id === 'community') return onCommunityClick?.();
    onItemClick?.(id, label);
  };

  return (
    <section className="px-4 mt-6 pb-2" dir="rtl">
      <div className="mb-3 flex items-center justify-start gap-2">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentSurface.headerBadge, color: theme.primaryDark }}
        >
          <Users size={18} strokeWidth={1.9} />
        </div>
        <div className="text-right">
          <h3 style={{ color: '#5A4740', fontWeight: 900, fontSize: 18 }}>תמיכה וקהילה</h3>
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
              background: item.accent ? accentSurface.card : accentSurface.plainBg,
              border: `1px solid ${item.accent ? accentSurface.border : theme.primaryBorder}`,
              boxShadow: item.accent ? accentSurface.shadow : '0 12px 28px rgba(160, 134, 122, 0.08)',
            }}
          >
            <div className="flex flex-col items-start h-full text-right">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: item.accent ? accentSurface.iconBg : accentSurface.plainIconBg,
                  color: item.accent ? accentSurface.iconColor : theme.primaryDark,
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
