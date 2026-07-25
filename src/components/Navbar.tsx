import React, { useState } from 'react';
import { NavigationTab, UserProfile, UserRole } from '../types';
import { 
  Home, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Dumbbell, 
  Sparkles, 
  Users, 
  Briefcase, 
  Plus, 
  Bell, 
  ShieldCheck, 
  User, 
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Zap,
  Sliders,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenQuickLog: () => void;
  onSelectRole: (role: UserRole) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  isLoggedIn,
  theme,
  onToggleTheme,
  onOpenQuickLog,
  onSelectRole,
  onOpenAuthModal,
  onLogout
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: any;
    badge?: string;
  }

  // Public items when logged out
  const publicNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ai-assistant', label: 'AI Health Advisor', icon: Zap },
    { id: 'signin', label: 'Sign In', icon: LogIn }
  ];

  // Role-specific Navigation Bar configurations
  const memberNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'cycle', label: 'CycleSync™', icon: Sparkles, badge: 'Day 14' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Zap },
    { id: 'community', label: 'Community', icon: Users }
  ];

  const coachNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'coach-dashboard', label: 'Coach Portal', icon: Briefcase },
    { id: 'clients', label: 'Client Roster', icon: Users },
    { id: 'consultations', label: 'Consultations', icon: Bell },
    { id: 'plan-builder', label: 'AI Plan Builder', icon: Sparkles },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Zap }
  ];

  const adminNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'admin-dashboard', label: 'Command Center', icon: ShieldCheck },
    { id: 'user-management', label: 'Users & Roles', icon: Users },
    { id: 'ai-logs', label: 'AI Telemetry', icon: Zap },
    { id: 'content-moderation', label: 'Moderation', icon: Sliders }
  ];

  const navItems = !isLoggedIn 
    ? publicNav 
    : user.role === 'admin' 
    ? adminNav 
    : user.role === 'coach' 
    ? coachNav 
    : memberNav;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Healthy<span className="text-emerald-600 dark:text-emerald-400">Life</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-300 tracking-wider ml-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                  AI Wellness
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-slate-900/40 text-emerald-200' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  user.role === 'admin'
                    ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : user.role === 'coach'
                    ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="capitalize">{user.role} View</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 py-1 block">
                    Switch Workspace
                  </span>
                  {(['member', 'coach', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onSelectRole(r);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold capitalize text-left transition-colors ${
                        user.role === r
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{r === 'admin' ? '🛡️ Admin Center' : r === 'coach' ? '🏋️ Coach Portal' : '👤 Member App'}</span>
                      {user.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logged Out / Logged In State Controls */}
            {!isLoggedIn ? (
              <button
                onClick={() => onSelectTab('signin')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <>
                {/* Global Quick Log */}
                {user.role === 'member' && (
                  <button
                    onClick={onOpenQuickLog}
                    className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Log Vitals</span>
                  </button>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500"
                    />
                    <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{user.name}</p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                            {user.role} Profile
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            onSelectTab('ai-assistant');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <Zap className="w-4 h-4 text-emerald-500" />
                          <span>AI Health Advisor</span>
                        </button>

                        <button
                          onClick={() => {
                            onSelectTab('signin');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <LogIn className="w-4 h-4 text-teal-500" />
                          <span>Switch / Sign In Account</span>
                        </button>

                        <button
                          onClick={() => {
                            onLogout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>

        {/* Mobile Sub Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
