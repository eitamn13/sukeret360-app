import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldPlus,
  Trophy,
  Users,
} from 'lucide-react';
import { OverlayHeader } from './OverlayHeader';
import { useAppContext } from '../context/AppContext';

export type CommunityTab = 'community' | 'forum' | 'support' | 'challenges';

interface FeedPost {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  tag: 'health' | 'meds' | 'questions' | 'meals';
}

interface SupportCircle {
  id: string;
  title: string;
  subtitle: string;
  members: string;
}

interface HealthChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  doneToday: boolean;
}

const COMMUNITY_POSTS: FeedPost[] = [
  {
    id: 1,
    name: 'מרים',
    initials: 'מ',
    avatarColor: '#E11D48',
    time: 'לפני 12 דקות',
    text: 'עברתי לארוחת בוקר עם יותר חלבון וירקות, וזה עזר לי להרגיש יציבה יותר.',
    likes: 18,
    replies: 4,
    tag: 'health',
  },
  {
    id: 2,
    name: 'אברהם',
    initials: 'א',
    avatarColor: '#0F766E',
    time: 'לפני 38 דקות',
    text: '10 דקות הליכה אחרי ארוחת ערב ממש עוזרות לי. מי עוד מנסה את זה?',
    likes: 9,
    replies: 5,
    tag: 'health',
  },
];

const FORUM_TOPICS: FeedPost[] = [
  {
    id: 101,
    name: 'שאלה חדשה',
    initials: 'ש',
    avatarColor: '#2563EB',
    time: 'היום',
    text: 'איך אתם רושמים ארוחה מעורבת כשלא ברור בדיוק מה הכמות?',
    likes: 12,
    replies: 7,
    tag: 'questions',
  },
  {
    id: 102,
    name: 'תזכורת תרופות',
    initials: 'ת',
    avatarColor: '#7C3AED',
    time: 'השבוע',
    text: 'מה הכי עוזר לכם לזכור תרופה קבועה בערב?',
    likes: 8,
    replies: 10,
    tag: 'meds',
  },
];

const SUPPORT_CIRCLES: SupportCircle[] = [
  {
    id: 'family',
    title: 'משפחה מלווה',
    subtitle: 'קבוצה לבני משפחה שרוצים לעזור בלי לחץ.',
    members: '842 חברים',
  },
  {
    id: 'seniors',
    title: 'מבוגרים עם סוכרת',
    subtitle: 'שיחות רגועות וטיפים פשוטים ליום יום.',
    members: '611 חברים',
  },
  {
    id: 'buddy-check',
    title: 'חבר בדיקה',
    subtitle: 'תזכורת הדדית לסוכר, תרופות וארוחות.',
    members: '274 חברים',
  },
];

const INITIAL_CHALLENGES: HealthChallenge[] = [
  {
    id: 'walk',
    title: '10 דקות הליכה',
    description: 'הליכה קצרה אחרי ארוחה.',
    reward: '50 נקודות',
    doneToday: false,
  },
  {
    id: 'water',
    title: '8 כוסות מים',
    description: 'לשתות מסודר לאורך היום.',
    reward: 'תג התמדה',
    doneToday: true,
  },
  {
    id: 'meal-log',
    title: 'רישום ארוחה אחת',
    description: 'צילום או רישום קצר ביומן.',
    reward: 'סיכום יומי',
    doneToday: false,
  },
];

const TAB_META: Record<CommunityTab, { label: string; icon: typeof Users; hint: string }> = {
  community: { label: 'קהילה', icon: Users, hint: 'אנשים כמוך' },
  forum: { label: 'שאלות', icon: MessageSquare, hint: 'פורום פתוח' },
  support: { label: 'תמיכה', icon: Heart, hint: 'קבוצות רגועות' },
  challenges: { label: 'אתגרים', icon: Trophy, hint: 'מטרות קטנות' },
};

const TAG_STYLES: Record<FeedPost['tag'], { bg: string; color: string; label: string }> = {
  health: { bg: '#ECFDF5', color: '#059669', label: 'איזון' },
  meds: { bg: '#FFF7ED', color: '#EA580C', label: 'תרופות' },
  questions: { bg: '#EFF6FF', color: '#1D4ED8', label: 'שאלה' },
  meals: { bg: '#F5F3FF', color: '#7C3AED', label: 'אוכל' },
};

interface CommunityScreenProps {
  onClose: () => void;
  initialTab?: CommunityTab;
}

function CommunityScreen({ onClose, initialTab = 'community' }: CommunityScreenProps) {
  const { theme } = useAppContext();
  const [activeTab, setActiveTab] = useState<CommunityTab>(initialTab);
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>(COMMUNITY_POSTS);
  const [forumTopics, setForumTopics] = useState<FeedPost[]>(FORUM_TOPICS);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [joinedSupportIds, setJoinedSupportIds] = useState<Set<string>>(new Set(['seniors']));
  const [challenges, setChallenges] = useState<HealthChallenge[]>(INITIAL_CHALLENGES);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const feed = activeTab === 'forum' ? forumTopics : posts;
  const completedChallenges = challenges.filter((challenge) => challenge.doneToday).length;

  const heroText = useMemo(() => {
    switch (activeTab) {
      case 'forum':
        return 'שואלים קצר ומקבלים תשובות מהקהילה.';
      case 'support':
        return 'קבוצות שקטות למי שצריך חיזוק עדין.';
      case 'challenges':
        return 'צעדים קטנים שבונים שגרה טובה.';
      default:
        return 'מקום לשתף, לעזור ולקבל רעיונות מהירים.';
    }
  }, [activeTab]);

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const setter = activeTab === 'forum' ? setForumTopics : setPosts;

      if (next.has(id)) {
        next.delete(id);
        setter((current) =>
          current.map((post) => (post.id === id ? { ...post, likes: post.likes - 1 } : post))
        );
      } else {
        next.add(id);
        setter((current) =>
          current.map((post) => (post.id === id ? { ...post, likes: post.likes + 1 } : post))
        );
      }

      return next;
    });
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newEntry: FeedPost = {
      id: Date.now(),
      name: activeTab === 'forum' ? 'שאלה חדשה' : 'פוסט חדש',
      initials: activeTab === 'forum' ? 'ש' : 'אני',
      avatarColor: activeTab === 'forum' ? '#2563EB' : theme.primary,
      time: 'עכשיו',
      text: trimmed,
      likes: 0,
      replies: 0,
      tag: activeTab === 'forum' ? 'questions' : 'health',
    };

    if (activeTab === 'forum') {
      setForumTopics((current) => [newEntry, ...current]);
    } else {
      setPosts((current) => [newEntry, ...current]);
    }

    setMessage('');
  };

  const toggleSupportCircle = (circleId: string) => {
    setJoinedSupportIds((prev) => {
      const next = new Set(prev);
      if (next.has(circleId)) next.delete(circleId);
      else next.add(circleId);
      return next;
    });
  };

  const toggleChallenge = (challengeId: string) => {
    setChallenges((current) =>
      current.map((challenge) =>
        challenge.id === challengeId
          ? { ...challenge, doneToday: !challenge.doneToday }
          : challenge
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <OverlayHeader
        title="קהילה"
        subtitle="פחות מילים, יותר תמיכה"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          className="rounded-3xl p-4"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
            border: `1px solid ${theme.primaryBorder}`,
          }}
        >
          <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>{TAB_META[activeTab].label}</p>
          <p style={{ color: '#64748B', marginTop: 6, lineHeight: 1.7 }}>{heroText}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(TAB_META) as CommunityTab[]).map((tab) => {
            const Icon = TAB_META[tab].icon;
            const active = tab === activeTab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="rounded-2xl px-2 py-3 text-center transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: active ? theme.primary : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#334155',
                  border: `1px solid ${active ? theme.primary : theme.primaryBorder}`,
                  boxShadow: active ? `0 10px 24px ${theme.primaryShadow}` : 'none',
                }}
              >
                <Icon size={17} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 12, fontWeight: 800 }}>{TAB_META[tab].label}</div>
              </button>
            );
          })}
        </div>

        {(activeTab === 'community' || activeTab === 'forum') && (
          <div
            className="rounded-3xl p-4 bg-white"
            style={{
              border: `1px solid ${theme.primaryBorder}`,
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            }}
          >
            <p style={{ color: '#0F172A', fontWeight: 900 }}>
              {activeTab === 'forum' ? 'שאלה קצרה לפורום' : 'שיתוף קצר לקהילה'}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: message.trim() ? theme.gradientCard : '#E2E8F0',
                  boxShadow: message.trim() ? `0 12px 24px ${theme.primaryShadow}` : 'none',
                }}
              >
                <Send size={18} strokeWidth={1.8} color="#FFFFFF" />
              </button>

              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                placeholder={activeTab === 'forum' ? 'כתבו שאלה...' : 'כתבו שיתוף...'}
                dir="rtl"
                className="flex-1 h-12 px-4 rounded-2xl text-sm outline-none"
                style={{
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${theme.primaryBorder}`,
                  color: '#0F172A',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
        )}

        {(activeTab === 'community' || activeTab === 'forum') && (
          <div className="space-y-3">
            {feed.map((post) => {
              const tagStyle = TAG_STYLES[post.tag];
              const isLiked = likedIds.has(post.id);

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl p-4"
                  style={{
                    border: `1px solid ${theme.primaryBorder}`,
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: post.avatarColor, fontWeight: 800 }}
                    >
                      {post.initials}
                    </div>

                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700 }}>{post.time}</span>
                        <p style={{ color: '#0F172A', fontWeight: 900 }}>{post.name}</p>
                      </div>

                      <span
                        className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs"
                        style={{ backgroundColor: tagStyle.bg, color: tagStyle.color, fontWeight: 800 }}
                      >
                        {tagStyle.label}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#334155', lineHeight: 1.75 }}>{post.text}</p>

                  <div
                    className="flex items-center justify-end gap-4 pt-3 mt-3"
                    style={{ borderTop: `1px solid ${theme.primaryBorder}` }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                      <MessageCircle size={15} strokeWidth={1.75} />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{post.replies}</span>
                    </div>

                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 transition-all active:scale-90"
                      style={{ color: isLiked ? theme.primary : '#94A3B8' }}
                    >
                      <Heart size={15} strokeWidth={1.75} fill={isLiked ? theme.primary : 'none'} />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{post.likes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-3">
            {SUPPORT_CIRCLES.map((circle) => {
              const joined = joinedSupportIds.has(circle.id);

              return (
                <div
                  key={circle.id}
                  className="rounded-3xl p-4 bg-white"
                  style={{
                    border: `1px solid ${theme.primaryBorder}`,
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.primaryBg, color: theme.primary }}
                    >
                      {circle.id === 'buddy-check' ? <ShieldPlus size={20} /> : <Heart size={20} />}
                    </div>

                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => toggleSupportCircle(circle.id)}
                          className="px-4 h-10 rounded-2xl text-sm transition-all active:scale-[0.98]"
                          style={{
                            backgroundColor: joined ? '#F0FDF4' : theme.primary,
                            color: joined ? '#15803D' : '#FFFFFF',
                            border: joined ? '1px solid #BBF7D0' : 'none',
                            fontWeight: 800,
                          }}
                        >
                          {joined ? 'מחובר' : 'הצטרפות'}
                        </button>

                        <div>
                          <p style={{ color: '#0F172A', fontWeight: 900 }}>{circle.title}</p>
                          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>{circle.subtitle}</p>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl px-3 py-2 mt-3 text-right"
                        style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                      >
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>חברים</p>
                        <p style={{ color: '#0F172A', fontWeight: 900, marginTop: 4 }}>{circle.members}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-3">
            <div
              className="rounded-3xl p-4"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
                border: `1px solid ${theme.primaryBorder}`,
              }}
            >
              <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>היום הושלמו {completedChallenges} מתוך {challenges.length}</p>
              <p style={{ color: '#64748B', marginTop: 6 }}>מתקדמים בצעדים קטנים.</p>
            </div>

            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-3xl p-4 bg-white"
                style={{
                  border: `1px solid ${theme.primaryBorder}`,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: challenge.doneToday ? '#F0FDF4' : theme.primaryBg,
                      color: challenge.doneToday ? '#16A34A' : theme.primary,
                    }}
                  >
                    {challenge.doneToday ? <CheckCircle2 size={20} /> : <Trophy size={20} />}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => toggleChallenge(challenge.id)}
                        className="px-4 h-10 rounded-2xl text-sm transition-all active:scale-[0.98]"
                        style={{
                          backgroundColor: challenge.doneToday ? '#16A34A' : theme.primary,
                          color: '#FFFFFF',
                          fontWeight: 800,
                        }}
                      >
                        {challenge.doneToday ? 'הושלם' : 'סמן'}
                      </button>

                      <div>
                        <p style={{ color: '#0F172A', fontWeight: 900 }}>{challenge.title}</p>
                        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>{challenge.description}</p>
                      </div>
                    </div>

                    <div
                      className="rounded-2xl px-3 py-2 mt-3 text-right"
                      style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                    >
                      <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>פרס</p>
                      <p style={{ color: '#0F172A', fontWeight: 900, marginTop: 4 }}>{challenge.reward}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pb-4" />
      </div>
    </div>
  );
}

export default CommunityScreen;
