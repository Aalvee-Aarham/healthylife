import React, { useState, useEffect } from 'react';
import { NavigationTab, UserProfile, UserRole, DailyMacros, MealItem, WorkoutRoutine, SymptomLog, SocialPost, Challenge, ClientRecord, CoachSession } from './types';
import { 
  demoProfiles, 
  initialMacros, 
  mockMeals, 
  mockWorkouts, 
  cyclePhasesData, 
  initialSymptoms, 
  mockSocialPosts, 
  mockChallenges, 
  mockClients, 
  mockSessions 
} from './data/mockData';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuickLogModal } from './components/QuickLogModal';
import { AuthModal } from './components/AuthModal';

import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { NutritionView } from './components/views/NutritionView';
import { WorkoutsView } from './components/views/WorkoutsView';
import { CycleTrackerView } from './components/views/CycleTrackerView';
import { CommunityView } from './components/views/CommunityView';
import { CoachView } from './components/views/CoachView';
import { AdminView } from './components/views/AdminView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { SignInView } from './components/views/SignInView';
import { SignOutView } from './components/views/SignOutView';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(demoProfiles.member);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // App data state
  const [macros, setMacros] = useState<DailyMacros>(initialMacros);
  const [meals, setMeals] = useState<MealItem[]>(mockMeals);
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>(mockWorkouts);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>(initialSymptoms);
  const [posts, setPosts] = useState<SocialPost[]>(mockSocialPosts);
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [clients, setClients] = useState<ClientRecord[]>(mockClients);
  const [sessions, setSessions] = useState<CoachSession[]>(mockSessions);

  // Apply light/dark class on document root & body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  // Toggle light/dark mode
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Switch role handler
  const handleSelectRole = (newRole: UserRole) => {
    setUser(demoProfiles[newRole]);
    setIsLoggedIn(true);

    if (newRole === 'coach') {
      setCurrentTab('coach-dashboard');
    } else if (newRole === 'admin') {
      setCurrentTab('admin-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Login success from AuthModal or SignInView
  const handleLoginSuccess = (profile: UserProfile, targetTab?: NavigationTab) => {
    setUser(profile);
    setIsLoggedIn(true);
    if (targetTab) {
      setCurrentTab(targetTab);
    } else if (profile.role === 'admin') {
      setCurrentTab('admin-dashboard');
    } else if (profile.role === 'coach') {
      setCurrentTab('coach-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentTab('signout');
  };

  // Water log handler
  const handleLogWater = (amountMl: number) => {
    setMacros(prev => ({
      ...prev,
      waterConsumedMl: prev.waterConsumedMl + amountMl
    }));
  };

  // Toggle meal completion
  const handleToggleMeal = (mealId: string) => {
    setMeals(prev => prev.map(m => {
      if (m.id === mealId) {
        const nextCompleted = !m.completed;
        setMacros(mac => ({
          ...mac,
          caloriesConsumed: nextCompleted ? mac.caloriesConsumed + m.calories : mac.caloriesConsumed - m.calories,
          proteinConsumedG: nextCompleted ? mac.proteinConsumedG + m.protein : mac.proteinConsumedG - m.protein,
          carbsConsumedG: nextCompleted ? mac.carbsConsumedG + m.carbs : mac.carbsConsumedG - m.carbs,
          fatsConsumedG: nextCompleted ? mac.fatsConsumedG + m.fat : mac.fatsConsumedG - m.fat
        }));
        return { ...m, completed: nextCompleted };
      }
      return m;
    }));
  };

  // Add custom meal with optional full details & Pexels image support
  const handleAddMeal = async (
    name: string, 
    cal: number, 
    protein: number, 
    customCarbs?: number, 
    customFat?: number, 
    customImage?: string,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack',
    aiTag: string = 'AI Meal'
  ) => {
    let finalImage = customImage;
    if (!finalImage) {
      const { fetchPexelsImage } = await import('./services/pexelsApi');
      finalImage = await fetchPexelsImage(name);
    }

    const calculatedCarbs = customCarbs ?? Math.round((cal * 0.4) / 4);
    const calculatedFat = customFat ?? Math.round((cal * 0.2) / 9);

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
      aiTag,
      completed: true
    };

    setMeals(prev => [newMeal, ...prev]);
    setMacros(prev => ({
      ...prev,
      caloriesConsumed: prev.caloriesConsumed + cal,
      proteinConsumedG: prev.proteinConsumedG + protein,
      carbsConsumedG: prev.carbsConsumedG + calculatedCarbs,
      fatsConsumedG: prev.fatsConsumedG + calculatedFat
    }));
  };

  // Toggle symptom
  const handleToggleSymptom = (symptomId: string) => {
    setSymptoms(prev => prev.map(s => s.id === symptomId ? { ...s, logged: !s.logged } : s));
  };

  // Like post
  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  // Join Challenge
  const handleJoinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        const nextJoined = !c.isJoined;
        return {
          ...c,
          isJoined: nextJoined,
          participantsCount: nextJoined ? c.participantsCount + 1 : c.participantsCount - 1
        };
      }
      return c;
    }));
  };

  // Add new post
  const handleAddPost = (content: string) => {
    const newPost: SocialPost = {
      id: `p_${Date.now()}`,
      author: user.name,
      avatar: user.avatar,
      timeAgo: 'Just now',
      content,
      likes: 1,
      comments: 0,
      isLiked: true,
      badge: '⚡ Ovulation Peak'
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const isAppShell = isLoggedIn && currentTab !== 'home' && currentTab !== 'signin' && currentTab !== 'signout';

  if (isAppShell) {
    return (
      <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0f1715] text-[#191c1c] dark:text-[#eff1f0] font-sans flex antialiased transition-colors">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          user={user}
          isLoggedIn={isLoggedIn}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          onSelectRole={handleSelectRole}
          onLogout={handleLogout}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace Column */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all">
          {/* Header Topbar */}
          <Header
            currentTab={currentTab}
            user={user}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onSelectTab={setCurrentTab}
          />

          {/* Active View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* MEMBER VIEWS */}
            {user.role === 'member' && (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    user={user}
                    macros={macros}
                    meals={meals}
                    workouts={workouts}
                    onOpenQuickLog={() => setIsQuickLogOpen(true)}
                    onSelectTab={setCurrentTab}
                    onLogWater={handleLogWater}
                  />
                )}

                {currentTab === 'nutrition' && (
                  <NutritionView
                    meals={meals}
                    macros={macros}
                    onToggleMeal={handleToggleMeal}
                    onAddMeal={handleAddMeal}
                    onLogWater={handleLogWater}
                  />
                )}

                {currentTab === 'workouts' && (
                  <WorkoutsView workouts={workouts} />
                )}

                {currentTab === 'cycle' && (
                  <CycleTrackerView
                    symptoms={symptoms}
                    onToggleSymptom={handleToggleSymptom}
                    phasesData={cyclePhasesData}
                  />
                )}

                {currentTab === 'community' && (
                  <CommunityView
                    posts={posts}
                    challenges={challenges}
                    onToggleLike={handleToggleLike}
                    onJoinChallenge={handleJoinChallenge}
                    onAddPost={handleAddPost}
                  />
                )}
              </>
            )}

            {/* COACH VIEWS */}
            {user.role === 'coach' && currentTab !== 'ai-assistant' && (
              <CoachView clients={clients} sessions={sessions} activeTab={currentTab} />
            )}

            {/* ADMIN VIEWS */}
            {user.role === 'admin' && currentTab !== 'ai-assistant' && (
              <AdminView activeTab={currentTab} />
            )}

            {/* AI ASSISTANT VIEW */}
            {currentTab === 'ai-assistant' && (
              <AIAssistantView userRole={user.role} userName={user.name} />
            )}
          </main>
        </div>

        {/* Global Quick Log Modal */}
        <QuickLogModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          onLogWater={handleLogWater}
          onLogMeal={handleAddMeal}
          onLogSymptom={handleToggleSymptom}
          symptoms={symptoms}
        />

        {/* Auth & Role Login Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // Public / Unauthenticated / Landing Page Layout
  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0f1715] text-[#191c1c] dark:text-[#eff1f0] font-sans flex flex-col antialiased transition-colors">
      
      {/* Public Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        isLoggedIn={isLoggedIn}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onSelectRole={handleSelectRole}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* SIGN IN VIEW */}
        {currentTab === 'signin' && (
          <SignInView
            onLoginSuccess={handleLoginSuccess}
            onSelectTab={setCurrentTab}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* SIGN OUT VIEW */}
        {currentTab === 'signout' && (
          <SignOutView
            onSelectTab={setCurrentTab}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* LANDING / HOME VIEW */}
        {currentTab === 'home' && (
          <LandingView
            onSelectTab={setCurrentTab}
            onOpenAuthModal={() => setCurrentTab('signin')}
          />
        )}

        {/* PUBLIC AI HEALTH ADVISOR VIEW (ACCESSIBLE WHEN NOT LOGGED IN) */}
        {currentTab === 'ai-assistant' && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="bg-[#cce6d0] dark:bg-[#1f312c] border border-[#0f5238]/20 dark:border-[#95d4b3]/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#0f5238] dark:text-[#a8e7c5] font-bold">
                <span>💡 You are exploring HealthyLife AI Health Advisor as a Guest. Sign in to save custom bio-plans and log meals.</span>
                <button
                  onClick={() => setCurrentTab('signin')}
                  className="px-4 py-2 rounded-xl bg-[#0f5238] text-white hover:bg-[#0c432d] shadow-sm transition-colors shrink-0"
                >
                  Sign In / Register
                </button>
              </div>
            )}
            <AIAssistantView userRole={isLoggedIn ? user.role : 'member'} userName={isLoggedIn ? user.name : 'Guest Visitor'} />
          </div>
        )}

      </main>

      {/* Public Footer */}
      <Footer onSelectTab={setCurrentTab} />

      {/* Global Quick Log Modal */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onLogWater={handleLogWater}
        onLogMeal={handleAddMeal}
        onLogSymptom={handleToggleSymptom}
        symptoms={symptoms}
      />

      {/* Auth & Role Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
