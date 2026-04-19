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
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AuthScreen } from './components/AuthScreen';
import { AdminUsersScreen } from './components/AdminUsersScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';

function AppInner() {
  const { onboardingDone, theme, logSugar, remoteReady } = useAppContext();

  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [showDailyTip, setShowDailyTip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDoctorConsult, setShowDoctorConsult] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme.primary);
    }
  }, [theme.primary]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const open = params.get('open');
    const billing = params.get('billing');

    if (open === 'sugar') setShowSugarModal(true);
    if (open === 'meal') setShowMealLogger(true);
    if (open === 'subscription') setShowSubscription(true);
    if (billing) setShowSubscription(true);

    if (open) {
      params.delete('open');
    }

    const next = params.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
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
          <h2 className="text-2xl font-black text-[#4D5B73]">טוענים את החשבון שלך</h2>
          <p className="mt-3 text-sm leading-7 text-[#7F8CA0]">
            עוד רגע כל הנתונים האישיים שלך יסתנכרנו בצורה מאובטחת.
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
      className="app-shell min-h-[100svh] overflow-x-hidden transition-all duration-300"
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
            onSubscriptionClick={() => setShowSubscription(true)}
          />
        </main>
      </div>

      {showMealLogger ? <SmartMealLogger onClose={() => setShowMealLogger(false)} /> : null}
      <SugarModal isOpen={showSugarModal} onClose={() => setShowSugarModal(false)} onSave={handleSugarSave} />
      {showMedications ? <MedicationsScreen onClose={() => setShowMedications(false)} /> : null}
      {showHistory ? <HistoryScreen onClose={() => setShowHistory(false)} /> : null}
      {showDoctorConsult ? <DoctorConsultScreen onClose={() => setShowDoctorConsult(false)} /> : null}
      {showSubscription ? <SubscriptionScreen onClose={() => setShowSubscription(false)} /> : null}
      <DailyTipModal isOpen={showDailyTip} onClose={() => setShowDailyTip(false)} />

      <ProfileSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenAdminUsers={() => {
          setShowSettings(false);
          setShowAdminUsers(true);
        }}
        onOpenSubscription={() => {
          setShowSettings(false);
          setShowSubscription(true);
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
  const [guestMode, setGuestMode] = useState(false);

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
          <h2 className="text-2xl font-black text-[#4D5B73]">בודקים חיבור מאובטח</h2>
        </div>
      </div>
    );
  }

  if (authEnabled && !user && !guestMode) {
    return <AuthScreen showGuestOption onContinueGuest={() => setGuestMode(true)} />;
  }

  if (!authEnabled && !guestMode) {
    return <AuthScreen showGuestOption onContinueGuest={() => setGuestMode(true)} />;
  }

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
