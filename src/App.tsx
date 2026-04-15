import { useEffect, useState } from 'react';
import SOSModal from './components/SOSModal';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Header } from './components/Header';
import { GreetingSection } from './components/GreetingSection';
import { ActionGrid } from './components/ActionGrid';
import { CommunitySection } from './components/CommunitySection';
import { SmartMealLogger } from './components/SmartMealLogger';
import { SugarModal } from './components/SugarModal';
import CommunityScreen from './components/CommunityScreen';
import { ComingSoonModal } from './components/ComingSoonModal';
import { MedicationsScreen } from './components/MedicationsScreen';
import { DailyTipModal } from './components/DailyTipModal';
import { HistoryScreen } from './components/HistoryScreen';
import { DoctorConsultScreen } from './components/DoctorConsultScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { MealSuggestionsScreen } from './components/MealSuggestionsScreen';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { WelcomeIntroScreen } from './components/WelcomeIntroScreen';
import { AuthScreen } from './components/AuthScreen';
import { AdminUsersScreen } from './components/AdminUsersScreen';

type CommunityView = 'community' | 'forum' | 'support' | 'challenges';

function AppInner() {
  const { onboardingDone, theme, logSugar, remoteReady } = useAppContext();
  const [showWelcomeIntro, setShowWelcomeIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('welcomeIntroSeen') !== 'true';
  });

  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDoctorConsult, setShowDoctorConsult] = useState(false);
  const [showMeals, setShowMeals] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const [communityTab, setCommunityTab] = useState<CommunityView>('community');
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme.primary);
    }
  }, [theme.primary]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const open = params.get('open');

    if (open === 'sugar') {
      setShowSugarModal(true);
    }

    if (open === 'meal') {
      setShowMealLogger(true);
    }

    if (open) {
      params.delete('open');
      const next = params.toString();
      const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, []);

  if (!remoteReady) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center px-6"
        dir="rtl"
        style={{ background: theme.gradientFull }}
      >
        <div className="max-w-sm w-full text-center">
          <div
            className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-[#DCE7F8] border-t-[#6B97D6] animate-spin"
          />
          <h2 className="text-2xl font-black text-[#4D5B73]">טוענים את החשבון שלך</h2>
          <p className="mt-3 text-sm leading-7 text-[#7F8CA0]">
            עוד רגע כל הנתונים האישיים שלך יסתנכרנו בצורה מאובטחת.
          </p>
        </div>
      </div>
    );
  }

  if (!onboardingDone) {
    if (showWelcomeIntro) {
      return (
        <WelcomeIntroScreen
          onContinue={() => {
            window.localStorage.setItem('welcomeIntroSeen', 'true');
            setShowWelcomeIntro(false);
          }}
        />
      );
    }

    return <OnboardingScreen />;
  }

  const handleSugarSave = (
    value: number,
    contextLabel: string,
    context: 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'exercise' | 'custom'
  ) => {
    logSugar({
      level: value,
      context,
      contextLabel,
    });
    setShowSugarModal(false);
  };

  const handleActionClick = (id: string, label: string) => {
    if (id === 'medications') {
      setShowMedications(true);
      return;
    }

    if (id === 'tip') {
      setShowDailyTip(true);
      return;
    }

    if (id === 'meals') {
      setShowMeals(true);
      return;
    }

    if (id === 'history') {
      setShowHistory(true);
      return;
    }

    if (id === 'doctor') {
      setShowDoctorConsult(true);
      return;
    }

    setComingSoon(label);
  };

  const handleCommunityItemClick = (id: string, label: string) => {
    if (id === 'forum' || id === 'support' || id === 'challenges') {
      setCommunityTab(id);
      setShowCommunity(true);
      return;
    }

    setComingSoon(label);
  };

  return (
    <div
      className="min-h-[100svh] transition-all duration-500 overflow-x-hidden app-shell"
      style={{ background: theme.gradientFull }}
    >
      <div className="max-w-md mx-auto" dir="rtl">
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onNotificationsClick={() => setShowNotifications(true)}
        />

        <main
          className="pb-10"
          style={{
            paddingBottom: 'max(1.75rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
          }}
        >
          <GreetingSection
            onSOSClick={() => setShowSOS(true)}
            onSugarClick={() => setShowSugarModal(true)}
            onMealClick={() => setShowMealLogger(true)}
            onMedicationsClick={() => setShowMedications(true)}
            onDoctorClick={() => setShowDoctorConsult(true)}
          />

          <ActionGrid
            onMealLoggerClick={() => setShowMealLogger(true)}
            onSugarClick={() => setShowSugarModal(true)}
            onActionClick={handleActionClick}
          />

          <CommunitySection
            onCommunityClick={() => {
              setCommunityTab('community');
              setShowCommunity(true);
            }}
            onItemClick={handleCommunityItemClick}
          />
        </main>
      </div>

      {showMealLogger && (
        <SmartMealLogger onClose={() => setShowMealLogger(false)} />
      )}

      <SugarModal
        isOpen={showSugarModal}
        onClose={() => setShowSugarModal(false)}
        onSave={handleSugarSave}
      />

      {showCommunity && (
        <CommunityScreen
          initialTab={communityTab}
          onClose={() => setShowCommunity(false)}
        />
      )}

      {showMedications && (
        <MedicationsScreen onClose={() => setShowMedications(false)} />
      )}

      {showMeals && (
        <MealSuggestionsScreen onClose={() => setShowMeals(false)} />
      )}

      {showHistory && (
        <HistoryScreen onClose={() => setShowHistory(false)} />
      )}

      {showDoctorConsult && (
        <DoctorConsultScreen onClose={() => setShowDoctorConsult(false)} />
      )}

      <DailyTipModal
        isOpen={showDailyTip}
        onClose={() => setShowDailyTip(false)}
      />

      <ProfileSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenAdminUsers={() => {
          setShowSettings(false);
          setShowAdminUsers(true);
        }}
      />

      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpenMedications={() => {
          setShowNotifications(false);
          setShowMedications(true);
        }}
      />

      <ComingSoonModal
        isOpen={comingSoon !== null}
        featureName={comingSoon ?? ''}
        onClose={() => setComingSoon(null)}
      />

      <SOSModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
      />

      <AdminUsersScreen
        isOpen={showAdminUsers}
        onClose={() => setShowAdminUsers(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { authEnabled, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center px-6"
        dir="rtl"
        style={{
          background: 'linear-gradient(180deg, #FFFDF8 0%, #F6FAFF 45%, #FFF8F4 100%)',
        }}
      >
        <div className="max-w-sm w-full text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-[#E5EAF5] border-t-[#8EADE4] animate-spin" />
          <h2 className="text-2xl font-black text-[#4D5B73]">בודקים התחברות מאובטחת</h2>
        </div>
      </div>
    );
  }

  if (authEnabled && !user) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
