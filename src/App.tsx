import { useEffect, useState } from 'react';
import SOSModal from './components/SOSModal';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Header } from './components/Header';
import { GreetingSection } from './components/GreetingSection';
import { SmartMealLogger } from './components/SmartMealLogger';
import { SugarModal } from './components/SugarModal';
import { MedicationsScreen } from './components/MedicationsScreen';
import { DailyTipModal } from './components/DailyTipModal';
import { HistoryScreen } from './components/HistoryScreen';
import { DoctorConsultScreen } from './components/DoctorConsultScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { MealSuggestionsScreen } from './components/MealSuggestionsScreen';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AuthScreen } from './components/AuthScreen';
import { AdminUsersScreen } from './components/AdminUsersScreen';

function AppInner() {
  const { onboardingDone, theme, logSugar, remoteReady } = useAppContext();

  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDoctorConsult, setShowDoctorConsult] = useState(false);
  const [showMeals, setShowMeals] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);

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
        className="flex min-h-[100dvh] items-center justify-center px-6"
        dir="rtl"
        style={{ background: theme.gradientFull }}
      >
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#DCE7F8] border-t-[#6B97D6]" />
          <h2 className="text-2xl font-black text-[#4D5B73]">
            {'\u05d8\u05d5\u05e2\u05e0\u05d9\u05dd \u05d0\u05ea \u05d4\u05d7\u05e9\u05d1\u05d5\u05df \u05e9\u05dc\u05da'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#7F8CA0]">
            {
              '\u05e2\u05d5\u05d3 \u05e8\u05d2\u05e2 \u05db\u05dc \u05d4\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05d4\u05d0\u05d9\u05e9\u05d9\u05d9\u05dd \u05e9\u05dc\u05da \u05d9\u05e1\u05ea\u05e0\u05db\u05e8\u05e0\u05d5 \u05d1\u05e6\u05d5\u05e8\u05d4 \u05de\u05d0\u05d5\u05d1\u05d8\u05d7\u05ea.'
            }
          </p>
        </div>
      </div>
    );
  }

  if (!onboardingDone) {
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

  return (
    <div
      className="app-shell min-h-[100svh] overflow-x-hidden transition-all duration-500"
      style={{ background: theme.gradientFull }}
    >
      <div className="mx-auto max-w-md" dir="rtl">
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
            onTipClick={() => setShowDailyTip(true)}
            onHistoryClick={() => setShowHistory(true)}
          />
        </main>
      </div>

      {showMealLogger ? <SmartMealLogger onClose={() => setShowMealLogger(false)} /> : null}

      <SugarModal isOpen={showSugarModal} onClose={() => setShowSugarModal(false)} onSave={handleSugarSave} />

      {showMedications ? <MedicationsScreen onClose={() => setShowMedications(false)} /> : null}
      {showMeals ? <MealSuggestionsScreen onClose={() => setShowMeals(false)} /> : null}
      {showHistory ? <HistoryScreen onClose={() => setShowHistory(false)} /> : null}
      {showDoctorConsult ? <DoctorConsultScreen onClose={() => setShowDoctorConsult(false)} /> : null}

      <DailyTipModal isOpen={showDailyTip} onClose={() => setShowDailyTip(false)} />

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

      <SOSModal isOpen={showSOS} onClose={() => setShowSOS(false)} />
      <AdminUsersScreen isOpen={showAdminUsers} onClose={() => setShowAdminUsers(false)} />
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
        className="flex min-h-[100dvh] items-center justify-center px-6"
        dir="rtl"
        style={{
          background: 'linear-gradient(180deg, #FFFDF8 0%, #F6FAFF 45%, #FFF8F4 100%)',
        }}
      >
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#E5EAF5] border-t-[#8EADE4]" />
          <h2 className="text-2xl font-black text-[#4D5B73]">
            {'\u05d1\u05d5\u05d3\u05e7\u05d9\u05dd \u05d7\u05d9\u05d1\u05d5\u05e8 \u05de\u05d0\u05d5\u05d1\u05d8\u05d7'}
          </h2>
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
