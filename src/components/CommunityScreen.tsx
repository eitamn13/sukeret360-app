import { X, Send, Users, ThumbsUp, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

interface Post {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  tag?: string;
}

const DUMMY_POSTS: Post[] = [
  {
    id: 1,
    name: 'מרים כהן',
    initials: 'מכ',
    avatarColor: '#E11D48',
    time: 'לפני 12 דקות',
    text: 'שלום לכולם! גיליתי שסלט ירקות עם חומוס ביתי שומר לי על הסוכר יציב לאורך שלוש שעות. הרופאה שלי ממש שמחה מהתוצאות. מישהי אחרת ניסתה?',
    likes: 14,
    replies: 3,
    tag: 'תזונה',
  },
  {
    id: 2,
    name: 'אברהם לוי',
    initials: 'אל',
    avatarColor: '#0F766E',
    time: 'לפני 38 דקות',
    text: 'שאלה לקהילה: האם מישהי חוותה סחרחורת אחרי נטילת מטפורמין בבוקר? אני מתחילה את הטיפול השבוע ואשמח לשמוע ניסיון אישי לפני שפונה לרופאה.',
    likes: 7,
    replies: 9,
    tag: 'תרופות',
  },
  {
    id: 3,
    name: 'רחל שפירא',
    initials: 'רש',
    avatarColor: '#BE123C',
    time: 'לפני שעה',
    text: 'עדכון שמחה! אחרי שלושה חודשים של הליכה יומית של 30 דקות, ה-HbA1c שלי ירד מ-7.8 ל-6.9. ממליצה בחום לכולן — קצת תנועה עושה הבדל עצום!',
    likes: 31,
    replies: 12,
    tag: 'פעילות גופנית',
  },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  תזונה: { bg: '#ECFDF5', color: '#059669' },
  תרופות: { bg: '#FFF7ED', color: '#EA580C' },
  'פעילות גופנית': { bg: '#FFF1F2', color: '#E11D48' },
};

interface CommunityScreenProps {
  onClose: () => void;
}

function CommunityScreen({ onClose }: CommunityScreenProps) {
  const { theme } = useAppContext();
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    let aiReply = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        console.error('Server error:', response.status);
        aiReply = 'השרת לא זמין כרגע 😔';
      } else {
        const data = await response.json();
        aiReply = data.reply || 'לא הצלחתי לענות 😔';
      }
    } catch (error) {
      console.error('Fetch error:', error);
      aiReply = 'שגיאת חיבור 😢';
    }

    const newPost: Post = {
      id: Date.now(),
      name: 'אתה',
      initials: 'את',
      avatarColor: '#6366F1',
      time: 'עכשיו',
      text: userMessage,
      likes: 0,
      replies: 0,
    };

    const aiPost: Post = {
      id: Date.now() + 1,
      name: 'עוזרת חכמה',
      initials: 'AI',
      avatarColor: '#E11D48',
      time: 'עכשיו',
      text: aiReply,
      likes: 0,
      replies: 0,
    };

    setPosts((prev) => [newPost, aiPost, ...prev]);
    setMessage('');
  };

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
        setPosts((p) =>
          p.map((post) =>
            post.id === id ? { ...post, likes: post.likes - 1 } : post
          )
        );
      } else {
        next.add(id);
        setPosts((p) =>
          p.map((post) =>
            post.id === id ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }

      return next;
    });
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-in-right"
      style={{ background: theme.gradientFull }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 pt-12 pb-4"
        style={{
          backgroundColor: theme.headerBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${theme.primaryBorder}`,
        }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            border: `1.5px solid ${theme.primaryBorder}`,
            backgroundColor: 'white',
          }}
          aria-label="סגור"
        >
          <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
        </button>

        <div className="flex items-center gap-2">
          <Users size={18} strokeWidth={1.75} style={{ color: theme.primary }} />
          <h1
            className="text-lg"
            style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            הקהילה החמה
          </h1>
        </div>

        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: theme.primaryBg,
            color: theme.primary,
            fontWeight: 700,
            border: `1px solid ${theme.primaryBorder}`,
          }}
        >
          2,340 חברות
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {posts.map((post) => {
          const tagStyle = post.tag ? TAG_COLORS[post.tag] : null;
          const isLiked = likedIds.has(post.id);

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-4"
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
                    <span
                      className="text-xs"
                      style={{ color: '#9CA3AF', fontWeight: 400 }}
                    >
                      {post.time}
                    </span>
                    <p
                      className="text-sm leading-tight"
                      style={{ color: '#1F2937', fontWeight: 700 }}
                    >
                      {post.name}
                    </p>
                  </div>

                  {tagStyle && post.tag && (
                    <span
                      className="inline-block mt-1 text-xs px-2 py-0.5 rounded-lg"
                      style={{
                        backgroundColor: tagStyle.bg,
                        color: tagStyle.color,
                        fontWeight: 600,
                      }}
                    >
                      {post.tag}
                    </span>
                  )}
                </div>
              </div>

              <p
                className="text-sm leading-relaxed text-right mb-3"
                style={{ color: '#374151', lineHeight: '1.65' }}
              >
                {post.text}
              </p>

              <div
                className="flex items-center justify-end gap-4 pt-2.5"
                style={{ borderTop: '1px solid #FFF1F2' }}
              >
                <button
                  className="flex items-center gap-1.5 transition-colors"
                  style={{ color: '#9CA3AF' }}
                >
                  <MessageCircle size={15} strokeWidth={1.75} />
                  <span className="text-xs" style={{ fontWeight: 600 }}>
                    {post.replies}
                  </span>
                </button>

                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 transition-all active:scale-90"
                  style={{ color: isLiked ? theme.primary : '#9CA3AF' }}
                >
                  <ThumbsUp
                    size={15}
                    strokeWidth={1.75}
                    fill={isLiked ? theme.primary : 'none'}
                  />
                  <span
                    className="text-xs"
                    style={{
                      fontWeight: 600,
                      color: isLiked ? theme.primary : '#9CA3AF',
                    }}
                  >
                    {post.likes}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="שאלי את הקהילה..."
            dir="rtl"
            className="flex-1 h-12 px-4 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: theme.primaryBg,
              border: `1.5px solid ${theme.primaryBorder}`,
              color: '#1F2937',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CommunityScreen;
