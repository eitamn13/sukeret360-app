import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAppContext, genderedText } from '../context/AppContext';

export function GreetingSection() {
  const { timeString, greeting, dateString } = useCurrentTime();
  const { userProfile, theme } = useAppContext();
  const displayName = userProfile.name || 'אורח';
  const gender = userProfile.gender;

  const feelingText = genderedText(gender, 'איך את מרגישה היום?', 'איך אתה מרגיש היום?');
  const connectedText = genderedText(gender, 'מחוברת', 'מחובר');

  return (
    <div
      className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-6"
      style={{
        background: theme.gradientCard,
        boxShadow: `0 12px 40px ${theme.primaryShadow}`,
        transition: 'background 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.8) 24px, rgba(255,255,255,0.8) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.8) 24px, rgba(255,255,255,0.8) 25px)',
        }}
      />
      <div className="absolute top-[-30px] left-[-30px] w-48 h-48 rounded-full opacity-[0.08]" style={{ background: 'rgba(255,255,255,0.5)' }} />
      <div className="absolute bottom-[-40px] right-[-20px] w-60 h-60 rounded-full opacity-[0.06]" style={{ background: 'rgba(255,255,255,0.6)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl text-white leading-none" style={{ fontWeight: 900 }}>
              {timeString}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
              {dateString}
            </p>
          </div>

          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
              {connectedText}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2
            className="text-3xl text-white leading-tight"
            style={{ fontWeight: 800, letterSpacing: '-0.01em' }}
          >
            {greeting}, {displayName}!
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.68)', fontWeight: 400 }}>
            {feelingText}
          </p>
        </div>

        <div
          className="mt-5 flex gap-3 rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex-1 text-center">
            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              סוכר אחרון
            </p>
            <p className="text-2xl text-white" style={{ fontWeight: 900 }}>142</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>mg/dL</p>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex-1 text-center">
            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              ממוצע שבועי
            </p>
            <p className="text-2xl text-white" style={{ fontWeight: 900 }}>128</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>mg/dL</p>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex-1 text-center">
            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              HbA1c
            </p>
            <p className="text-2xl text-white" style={{ fontWeight: 900 }}>6.8</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
