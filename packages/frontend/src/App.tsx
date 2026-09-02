import React, { useState, useEffect } from 'react';
import { NavigationTab, UserProfile } from './types';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuickLogModal } from './components/QuickLogModal';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';

import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { NutritionView } from './components/views/NutritionView';
import { WorkoutsView } from './components/views/WorkoutsView';
import { CycleTrackerView } from './components/views/CycleTrackerView';
import { ChatView } from './components/views/ChatView';
import { CoachView } from './components/views/CoachView';
import { CoachDashboardView } from './components/views/CoachDashboardView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { SignInView } from './components/views/SignInView';
import { SignUpView } from './components/views/SignUpView';
import { SignOutView } from './components/views/SignOutView';

import { useDashboard } from './hooks/useDashboard';
import { api, getAuthToken, setAuthToken } from './services/api';
import { DailyMacros, MealItem } from './types';

const defaultMacros: DailyMacros = {
  caloriesConsumed: 0,
  caloriesGoal: 2000,
  proteinConsumedG: 0,
  proteinGoalG: 120,
  carbsConsumedG: 0,
  carbsGoalG: 220,
  fatsConsumedG: 0,
  fatsGoalG: 65,
  waterConsumedMl: 0,
  waterGoalMl: 2500,
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Auto-restore session from stored token in localStorage
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.me()
        .then((profile) => {
          setUser(profile);
          setIsLoggedIn(true);
          setCurrentTab((prev) => {
            if (prev === 'home' || prev === 'signin' || prev === 'signup') return 'dashboard';
            if (prev === 'cycle' && profile.gender === 'male') return 'dashboard';
            return prev;
          });
        })
        .catch(() => {
          setAuthToken(null);
          setIsLoggedIn(false);
          setUser(null);
        });
    }
  }, []);

  // Redirect male user if currently on cycle tab
  useEffect(() => {
    if (user?.gender === 'male' && currentTab === 'cycle') {
      setCurrentTab('dashboard');
    }
  }, [user, currentTab]);

  // Local state for guest/offline fallback
  const [macros, setMacros] = useState<DailyMacros>(defaultMacros);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Dashboard hook (real API when logged in)
  const dashboard = useDashboard(isLoggedIn, selectedDate);

  // Auth success handler (called from SignInView, SignUpView or AuthModal)
  const handleLoginSuccess = (profile: UserProfile, targetTab?: NavigationTab) => {
    setUser(profile);
    setIsLoggedIn(true);
    if (targetTab) {
      setCurrentTab(targetTab);
    } else if (profile.role === 'coach') {
      setCurrentTab('chat');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    import('./services/firebase').then(({ logOutFirebase }) => {
      logOutFirebase().catch(console.error);
    });
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setCurrentTab('signout');
  };

  // --- Local handlers (used when API hook data isn't available yet) ---
  const handleLogWater = (amountMl: number) => {
    if (isLoggedIn) {
      dashboard.logWater(amountMl).catch(console.error);
    } else {
      setMacros((prev) => ({ ...prev, waterConsumedMl: prev.waterConsumedMl + amountMl }));
    }
  };

  // Used by NutritionView/HydrationCard which makes its own API call.
  // This callback only syncs the parent macros state (totalMl) without a second API call.
  const handleNutritionWaterSynced = (totalMl: number) => {
    if (isLoggedIn) {
      dashboard.setWaterTotal(totalMl);
    } else {
      setMacros((prev) => ({ ...prev, waterConsumedMl: totalMl }));
    }
  };

  const handleToggleMeal = (mealId: string) => {
    setMeals((prev) => prev.map((m) => {
      if (m.id !== mealId) return m;
      const next = !m.completed;
      setMacros((mac) => ({
        ...mac,
        caloriesConsumed: next ? mac.caloriesConsumed + m.calories : mac.caloriesConsumed - m.calories,
        proteinConsumedG: next ? mac.proteinConsumedG + m.protein : mac.proteinConsumedG - m.protein,
        carbsConsumedG: next ? mac.carbsConsumedG + m.carbs : mac.carbsConsumedG - m.carbs,
        fatsConsumedG: next ? mac.fatsConsumedG + m.fat : mac.fatsConsumedG - m.fat,
      }));
      return { ...m, completed: next };
    }));
  };

  const handleAddMeal = async (
    name: string,
    cal: number,
    protein: number,
    customCarbs?: number,
    customFat?: number,
    customImage?: string,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack',
  ) => {
    let finalImage = customImage;
    if (!finalImage) {
      const { fetchPexelsImage } = await import('./services/pexelsApi');
      finalImage = await fetchPexelsImage(name);
    }
    const calculatedCarbs = customCarbs ?? Math.round((cal * 0.4) / 4);
    const calculatedFat = customFat ?? Math.round((cal * 0.2) / 9);
    
    if (isLoggedIn) {
      await dashboard.addMeal({
        name,
        calories: cal,
        protein,
        carbs: calculatedCarbs,
        fat: calculatedFat,
        category,
        image: finalImage,
        logged_at: selectedDate,
      }).catch(console.error);
    } else {
      const newMeal: MealItem = {
        id: `m_${Date.now()}`,
        name,
        calories: cal,
        protein,
        carbs: calculatedCarbs,
        fat: calculatedFat,
        time: 'Just now',
        category,
        image: finalImage,
        completed: true,
      };
      setMeals((prev) => [newMeal, ...prev]);
      setMacros((prev) => ({
        ...prev,
        caloriesConsumed: prev.caloriesConsumed + cal,
        proteinConsumedG: prev.proteinConsumedG + protein,
        carbsConsumedG: prev.carbsConsumedG + calculatedCarbs,
        fatsConsumedG: prev.fatsConsumedG + calculatedFat,
      }));
    }
  };

  // Determine which macros/meals to use (API vs local)
  const activeMacros = isLoggedIn && !dashboard.error ? dashboard.macros : macros;
  const activeMeals = isLoggedIn && !dashboard.error ? dashboard.meals : meals;

  const isAppShell = isLoggedIn && user &&
    currentTab !== 'home' &&
    currentTab !== 'signin' &&
    currentTab !== 'signup' &&
    currentTab !== 'signout';

  if (isAppShell && user) {
    return (
      <div className="min-h-screen font-sans flex antialiased" style={{ background: 'var(--hl-bg)', color: 'var(--hl-text-primary)' }}>
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          user={user}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          onLogout={handleLogout}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all">
          <Header
            currentTab={currentTab}
            user={user}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onSelectTab={setCurrentTab}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">

            {/* === MEMBER VIEWS === */}
            {user.role === 'member' && (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    user={user}
                    macros={activeMacros}
                    meals={activeMeals}
                    isLoading={dashboard.isLoading}
                    error={dashboard.error}
                    onSelectTab={setCurrentTab}
                    onLogWater={handleLogWater}
                    onAddMeal={handleAddMeal}
                    isOpenExternalQuickLog={isQuickLogOpen}
                    onCloseExternalQuickLog={() => setIsQuickLogOpen(false)}
                  />
                )}
                {currentTab === 'nutrition' && (
                  <NutritionView
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    meals={activeMeals}
                    macros={activeMacros}
                    onToggleMeal={handleToggleMeal}
                    onAddMeal={handleAddMeal}
                    onLogWater={handleNutritionWaterSynced}
                  />
                )}
                {currentTab === 'workouts' && (
                  <WorkoutsView />
                )}
                {currentTab === 'water' && (
                  <NutritionView
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    meals={activeMeals}
                    macros={activeMacros}
                    onToggleMeal={handleToggleMeal}
                    onAddMeal={handleAddMeal}
                    onLogWater={handleNutritionWaterSynced}
                  />
                )}
                {currentTab === 'chat' && (
                  <ChatView user={user} />
                )}
                {currentTab === 'cycle' && user.gender !== 'male' && (
                  <CycleTrackerView user={user} />
                )}
              </>
            )}

            {/* === COACH VIEWS (Pure Minimalistic Chat) === */}
            {user.role === 'coach' && (
              <CoachDashboardView user={user} />
            )}

            {/* === SHARED VIEWS === */}
            {currentTab === 'ai-assistant' && (
              <AIAssistantView userRole={user.role} userName={user.name} />
            )}
          </main>
        </div>

        <QuickLogModal
          isOpen={isQuickLogOpen && currentTab !== 'dashboard'}
          onClose={() => setIsQuickLogOpen(false)}
          onLogWater={handleLogWater}
          onLogMeal={handleAddMeal}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onSelectTab={setCurrentTab}
        />
      </div>
    );
  }

  // Public / Unauthenticated layout
  return (
    <div className="min-h-screen font-sans flex flex-col antialiased" style={{ background: 'var(--hl-bg)', color: 'var(--hl-text-primary)' }}>
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'signin' && (
          <SignInView
            onLoginSuccess={handleLoginSuccess}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'signup' && (
          <SignUpView
            onLoginSuccess={handleLoginSuccess}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'signout' && (
          <SignOutView
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'home' && (
          <LandingView
            onSelectTab={setCurrentTab}
            onOpenAuthModal={() => setCurrentTab('signin')}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="bg-[#cce6d0] border border-[#0f5238]/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#0f5238] font-bold">
                <span>💡 Exploring as a Guest. Sign up as a member to save plans and log meals.</span>
                <button
                  onClick={() => setCurrentTab('signup')}
                  className="px-4 py-2 rounded-xl bg-[#0f5238] text-white hover:bg-[#0c432d] shadow-sm transition-colors shrink-0"
                >
                  Create Member Account
                </button>
              </div>
            )}
            <AIAssistantView userRole="member" userName="Guest Visitor" />
          </div>
        )}
      </main>

      <Footer onSelectTab={setCurrentTab} />

      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onLogWater={handleLogWater}
        onLogMeal={handleAddMeal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSelectTab={setCurrentTab}
      />
    </div>
  );
}
