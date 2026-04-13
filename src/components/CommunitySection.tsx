import { Users, MessageSquare, Heart, ChevronLeft, Trophy } from 'lucide-react';

interface CommunitySectionProps {
  onCommunityClick?: () => void;
  onItemClick?: (label: string) => void;
}

const communityItems = [
  {
    id: 'community',
    icon: <Users size={24} strokeWidth={1.5} />,
    label: 'הקהילה החמה',
    sublabel: '2,340 חברות וחברים פעילים',
    badge: 'חדש',
  },
  {
    id: 'forum',
    icon: <MessageSquare size={24} strokeWidth={1.5} />,
    label: 'פורום שאלות',
    sublabel: 'שאלי רופאים ומטופלים',
  },
  {
    id: 'support',
    icon: <Heart size={24} strokeWidth={1.5} />,
    label: 'תמיכה רגשית',
    sublabel: 'כי הבריאות היא שלמה',
  },
  {
    id: 'challenges',
    icon: <Trophy size={24} strokeWidth={1.5} />,
    label: 'אתגרי בריאות',
    sublabel: 'הישגים ופרסים',
  },
];

export function CommunitySection({ onCommunityClick, onItemClick }: CommunitySectionProps) {
  const handleClick = (id: string, label: string) => {
    if (id === 'community') onCommunityClick?.();
    else onItemClick?.(label);
  };

  return (
    <div className="px-4 mt-6 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: '#FECDD3' }} />
        <span
          className="text-xs uppercase tracking-widest px-1"
          style={{ color: '#FDA4AF', fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}
        >
          קהילה ותמיכה
        </span>
        <div className="flex-1 h-px" style={{ background: '#FECDD3' }} />
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
              border: '1.5px solid #FECDD3',
              boxShadow: '0 2px 8px rgba(225,29,72,0.06)',
            }}
          >
            <div
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ width: '52px', height: '52px', background: '#FFF1F2', color: '#E11D48' }}
            >
              {item.icon}
            </div>

            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-base leading-tight truncate" style={{ color: '#1F2937', fontWeight: 600 }}>
                  {item.label}
                </p>
                {item.badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: '#FFE4E6', color: '#E11D48', fontWeight: 700 }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 truncate" style={{ color: '#9CA3AF', fontWeight: 400 }}>
                {item.sublabel}
              </p>
            </div>

            <ChevronLeft
              size={18}
              strokeWidth={2}
              className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
              style={{ color: '#FDA4AF', opacity: 0.6 }}
            />
          </button>
        ))}
      </div>

      <div
        className="mt-6 rounded-2xl p-5 text-center"
        style={{ background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', border: '1.5px solid #FECDD3' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#BE123C', fontWeight: 600 }}>
          "ניהול סוכרת אפקטיבי מפחית סיכון לסיבוכים ב-76%"
        </p>
        <p className="text-xs mt-1.5" style={{ color: '#FDA4AF', fontWeight: 400 }}>
          מחקר ADA, 2024
        </p>
      </div>
    </div>
  );
}
