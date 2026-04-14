import SOSButton from "./components/SOSButton";
import SOSModal from "./components/SOSModal";
import { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
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

function AppInner() {
  const { onboardingDone, theme, logSugar } = useAppContext();

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
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  const handleSugarSave = (value: number, contextLabel: string, context: 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'exercise' | 'custom') => {
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

  const handleCommunityItemClick = (label: string) => {
    setComingSoon(label);
  };

  return (
    <div
      className="min-h-screen transition-all duration-500"
      style={{ background: theme.gradientFull }}
    >
      <div className="max-w-md mx-auto">
        <Header onSettingsClick={() => setShowSettings(true)} />

        <main className="pb-8">
          <GreetingSection />

          <ActionGrid
            onMealLoggerClick={() => setShowMealLogger(true)}
            onSugarClick={() => setShowSugarModal(true)}
            onActionClick={handleActionClick}
          />

          <CommunitySection
            onCommunityClick={() => setShowCommunity(true)}
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
        <CommunityScreen onClose={() => setShowCommunity(false)} />
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
      />

      <ComingSoonModal
        isOpen={comingSoon !== null}
        featureName={comingSoon ?? ''}
        onClose={() => setComingSoon(null)}
      />

      <SOSButton onClick={() => setShowSOS(true)} />

      <SOSModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
