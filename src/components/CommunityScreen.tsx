import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Heart,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldPlus,
  Trophy,
  Users,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';

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
  mood: string;
}

interface HealthChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  streakLabel: string;
  doneToday: boolean;
}

const COMMUNITY_POSTS: FeedPost[] = [
  {
    id: 1,
    name: 'מרים כהן',
    initials: 'MK',
    avatarColor: '#E11D48',
    time: 'לפני 12 דקות',
    text: 'הוספתי לארוחת הבוקר שלי יותר ירקות וחלבון, והשבוע הסוכר נשאר הרבה יותר יציב. שווה ממש לנסות.',
    likes: 18,
    replies: 4,
    tag: 'health',
  },
  {
    id: 2,
    name: 'אברהם לוי',
    initials: 'AL',
    avatarColor: '#0F766E',
    time: 'לפני 38 דקות',
    text: 'מישהו ניסה ללכת 10 דקות אחרי ארוחת ערב? זה ממש עזר לי לייצב את המדידות של הלילה.',
    likes: 9,
    replies: 5,
    tag: 'health',
  },
];

const FORUM_TOPICS: FeedPost[] = [
  {
    id: 101,
    name: 'שאלה רפואית',
    initials: 'Q',
    avatarColor: '#2563EB',
    time: 'היום',
    text: 'איך כדאי לרשום ארוחה אם הצלחת הייתה מעורבת אבל הכמות בערך ידועה?',
    likes: 12,
    replies: 7,
    tag: 'questions',
  },
  {
    id: 102,
    name: 'טיפ לתרופות',
    initials: 'T',
    avatarColor: '#7C3AED',
    time: 'השבוע',
    text: 'מה עוזר לכם לזכור תרופה קבועה בערב בלי לפספס?',
    likes: 8,
    replies: 10,
    tag: 'meds',
  },
];

const SUPPORT_CIRCLES: SupportCircle[] = [
  {
    id: 'caregivers',
    title: 'משפחות מלוות',
    subtitle: 'קבוצה לבני משפחה שרוצים לעזור בעדינות ובקביעות',
    members: '842 חברים',
    mood: 'מוכנות לתמיכה פרקטית',
  },
  {
    id: 'seniors',
    title: 'סוכרת בגיל מבוגר',
    subtitle: 'שיחות רגועות, תזכורות וטיפים יומיים פשוטים',
    members: '611 חברים',
    mood: 'תרגול בפשטות ובביטחון',
  },
  {
    id: 'newly-diagnosed',
    title: 'מתחילים מחדש',
    subtitle: 'מקום לשאול הכול ולקבל ליווי נעים בלי לחץ',
    members: '503 חברים',
    mood: 'הצעדים הראשונים ביחד',
  },
  {
    id: 'buddy-check',
    title: 'משמרת איזון חכמה',
    subtitle: 'אחריות עדינה למי שרוצה שיזכרו איתו תרופות, סוכר וארוחות',
    members: '274 חברים',
    mood: 'תמיכה יומית קצרה בלי לחץ',
  },
];

const INITIAL_CHALLENGES: HealthChallenge[] = [
  {
    id: 'walk',
    title: '10 דקות הליכה אחרי ארוחה',
    description: 'משימה יומית קטנה שעוזרת ליציבות ולהרגשה טובה יותר.',
    reward: '50 נקודות התקדמות',
    streakLabel: '3 ימים רצוף',
    doneToday: false,
  },
  {
    id: 'water',
    title: '8 כוסות מים',
    description: 'מיקוד בשתייה מסודרת לאורך היום בלי לשכוח.',
    reward: 'תג התמדה',
    streakLabel: '5 ימים רצוף',
    doneToday: true,
  },
  {
    id: 'log-meal',
    title: 'לרשום ארוחה מצולמת אחת',
    description: 'צלמו ארוחה ותנו ל-AI לנתח אותה כדי לקבל תמונת מצב טובה יותר.',
    reward: 'סיכום חכם ליומן',
    streakLabel: '2 ימים רצוף',
    doneToday: false,
  },
  {
    id: 'family-checkin',
    title: 'צ׳ק אין משפחתי רגוע',
    description: 'שלחו היום עדכון קטן לבן משפחה או לחבר כדי לבנות אחריות ושגרה יציבה.',
    reward: 'חיזוק יומי ומשוב אישי',
    streakLabel: '7 ימים של רצף עדין',
    doneToday: false,
  },
];

const TAB_META: Record<CommunityTab, { label: string; icon: typeof Users }> = {
  community: { label: 'קהילה', icon: Users },
  forum: { label: 'פורום', icon: MessageSquare },
  support: { label: 'תמיכה', icon: Heart },
  challenges: { label: 'אתגרים', icon: Trophy },
};

const TAG_COLORS: Record<FeedPost['tag'], { bg: string; color: string; label: string }> = {
  health: { bg: '#ECFDF5', color: '#059669', label: 'בריאות' },
  meds: { bg: '#FFF7ED', color: '#EA580C', label: 'תרופות' },
  questions: { bg: '#EFF6FF', color: '#1D4ED8', label: 'שאלות' },
  meals: { bg: '#F5F3FF', color: '#7C3AED', label: 'ארוחות' },
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
    if (activeTab === 'community') {
      return 'מקום לשתף הצלחות קטנות, לקבל רעיונות מעשיים ולהרגיש שלא מתמודדים לבד.';
    }

    if (activeTab === 'forum') {
      return 'שאלו שאלות, פתחו נושא חדש וקבלו תשובות בגובה העיניים מהקהילה.';
    }

    if (activeTab === 'support') {
      return 'קבוצות תמיכה שמבינות את היום־יום ונותנות חיזוק עדין במקום לחץ.';
    }

    return 'אתגרים קטנים שיוצרים שגרה יציבה והתקדמות אמיתית בצעדים פשוטים.';
  }, [activeTab]);

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const listSetter = activeTab === 'forum' ? setForumTopics : setPosts;

      if (next.has(id)) {
        next.delete(id);
        listSetter((current) =>
          current.map((post) => (post.id === id ? { ...post, likes: post.likes - 1 } : post))
        );
      } else {
        next.add(id);
        listSetter((current) =>
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
      initials: activeTab === 'forum' ? 'Q' : 'ME',
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
        title="קהילה, תמיכה ואתגרים"
        subtitle="שיתוף, עזרה והתקדמות במקום אחד"
        theme={theme}
        onBack={onClose}
        onClose={onClose}
        rightSlot={
          <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 800 }}
          >
            2,340+
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          className="rounded-3xl p-4"
          style={{ background: theme.gradientCard, color: '#FFFFFF' }}
        >
          <p style={{ fontWeight: 900, fontSize: 18 }}>{TAB_META[activeTab].label}</p>
          <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.7 }}>{heroText}</p>
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
          <div className="space-y-3">
            {feed.map((post) => {
              const tagStyle = TAG_COLORS[post.tag];
              const isLiked = likedIds.has(post.id);

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl p-4"
                  style={{
                    border: `1.5px solid ${theme.primaryBorder}`,
                    boxShadow: `0 1px 4px ${theme.primary}10`,
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: post.avatarColor, fontWeight: 800 }}
                    >
                      {post.initials}
                    </div>

                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                          {post.time}
                        </span>
                        <p className="text-sm leading-tight" style={{ color: '#1F2937', fontWeight: 800 }}>
                          {post.name}
                        </p>
                      </div>

                      <span
                        className="inline-block mt-1 text-xs px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: tagStyle.bg, color: tagStyle.color, fontWeight: 700 }}
                      >
                        {tagStyle.label}
                      </span>
                    </div>
                  </div>

                  <p
                    className="text-sm leading-relaxed text-right mb-3"
                    style={{ color: '#374151', lineHeight: '1.75', fontWeight: 500 }}
                  >
                    {post.text}
                  </p>

                  <div
                    className="flex items-center justify-end gap-4 pt-2.5"
                    style={{ borderTop: `1px solid ${theme.primaryBorder}` }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
                      <MessageCircle size={15} strokeWidth={1.75} />
                      <span className="text-xs" style={{ fontWeight: 700 }}>
                        {post.replies}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 transition-all active:scale-90"
                      style={{ color: isLiked ? theme.primary : '#9CA3AF' }}
                    >
                      <Heart size={15} strokeWidth={1.75} fill={isLiked ? theme.primary : 'none'} />
                      <span className="text-xs" style={{ fontWeight: 700 }}>
                        {post.likes}
                      </span>
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
                    border: `1.5px solid ${theme.primaryBorder}`,
                    boxShadow: `0 1px 4px ${theme.primary}10`,
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
                          {joined ? 'מחוברת' : 'הצטרפו'}
                        </button>

                        <div>
                          <p style={{ color: '#0F172A', fontWeight: 900 }}>{circle.title}</p>
                          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>{circle.subtitle}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div
                          className="rounded-2xl p-3 text-center"
                          style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                        >
                          <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>חברים</p>
                          <p style={{ color: '#0F172A', fontWeight: 900, marginTop: 4 }}>{circle.members}</p>
                        </div>
                        <div
                          className="rounded-2xl p-3 text-center"
                          style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                        >
                          <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>אווירה</p>
                          <p style={{ color: '#0F172A', fontWeight: 900, marginTop: 4 }}>{circle.mood}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-4"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryBg} 0%, #FFFFFF 100%)`,
                border: `1.5px solid ${theme.primaryBorder}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: theme.gradientCard, color: '#FFFFFF' }}
                >
                  <Flame size={20} />
                </div>
                <div className="text-right">
                  <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>סטריק בריאות</p>
                  <p style={{ color: '#64748B', marginTop: 4 }}>
                    {completedChallenges} מתוך {challenges.length} אתגרים הושלמו היום
                  </p>
                </div>
              </div>
            </div>

            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-3xl p-4 bg-white"
                style={{
                  border: `1.5px solid ${theme.primaryBorder}`,
                  boxShadow: `0 1px 4px ${theme.primary}10`,
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
                    {challenge.doneToday ? <CheckCircle2 size={22} /> : <Trophy size={20} />}
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
                        {challenge.doneToday ? 'הושלם' : 'סמנו כביצוע'}
                      </button>

                      <div>
                        <p style={{ color: '#0F172A', fontWeight: 900 }}>{challenge.title}</p>
                        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
                          {challenge.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div
                        className="rounded-2xl p-3 text-center"
                        style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                      >
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>פרס</p>
                        <p style={{ color: '#0F172A', fontWeight: 800, marginTop: 4 }}>{challenge.reward}</p>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-center"
                        style={{ backgroundColor: '#F8FAFC', border: `1px solid ${theme.primaryBorder}` }}
                      >
                        <p style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>רצף</p>
                        <p style={{ color: '#0F172A', fontWeight: 800, marginTop: 4 }}>{challenge.streakLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>

      {(activeTab === 'community' || activeTab === 'forum') && (
        <div
          className="flex-shrink-0 px-4 py-4"
          style={{
            backgroundColor: 'white',
            borderTop: `1.5px solid ${theme.primaryBorder}`,
            boxShadow: `0 -4px 20px ${theme.primary}10`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95 disabled:opacity-40"
              style={{
                background: message.trim() ? theme.gradientCard : '#E5E7EB',
                boxShadow: message.trim() ? `0 4px 14px ${theme.primaryShadow}` : 'none',
              }}
            >
              <Send size={18} strokeWidth={2} color="white" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSend()}
              placeholder={
                activeTab === 'forum' ? 'כתבו שאלה לפורום...' : 'שתפו את הקהילה...'
              }
              dir="rtl"
              className="flex-1 h-12 px-4 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: theme.primaryBg,
                border: `1.5px solid ${theme.primaryBorder}`,
                color: '#1F2937',
                fontWeight: 500,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityScreen;
