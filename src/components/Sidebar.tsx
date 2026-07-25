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
  Zap,
  Sliders,
  CheckCircle2,
  X,
  Menu,
  Activity,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenQuickLog: () => void;
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  isLoggedIn,
  theme,
  onToggleTheme,
  onOpenQuickLog,
  onSelectRole,
  onLogout,
  isOpenMobile,
  onCloseMobile
}) => {
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  interface NavGroup {
    title: string;
    items: {
      id: NavigationTab;
      label: string;
      icon: any;
      badge?: string;
    }[];
  }

  // Member Groups
  const memberGroups: NavGroup[] = [
    {
      title: 'CORE WELLNESS',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'nutrition', label: 'Nutrition & Macros', icon: UtensilsCrossed },
        { id: 'workouts', label: 'Workouts & Sculpt', icon: Dumbbell },
        { id: 'cycle', label: 'CycleSync™ Phase', icon: Sparkles, badge: 'Day 14' }
      ]
    },
    {
      title: 'INTELLIGENCE & COMMUNITY',
      items: [
        { id: 'ai-assistant', label: 'AI Health Advisor', icon: Zap },
        { id: 'community', label: 'Community Feed', icon: Users }
      ]
    }
  ];

  // Coach Groups
  const coachGroups: NavGroup[] = [
    {
      title: 'COACHING MANAGEMENT',
      items: [
        { id: 'coach-dashboard', label: 'Coach Portal', icon: Briefcase },
        { id: 'clients', label: 'Client Roster', icon: Users },
        { id: 'consultations', label: 'Live Consultations', icon: Bell }
      ]
    },
    {
      title: 'AI TOOLS',
      items: [
        { id: 'plan-builder', label: 'AI Plan Builder', icon: FileText },
        { id: 'ai-assistant', label: 'AI Health Advisor', icon: Zap }
      ]
    }
  ];

  // Admin Groups
  const adminGroups: NavGroup[] = [
    {
      title: 'PLATFORM OPERATIONS',
      items: [
        { id: 'admin-dashboard', label: 'Command Center', icon: ShieldCheck },
        { id: 'user-management', label: 'Users & Permissions', icon: Users },
        { id: 'ai-logs', label: 'AI Telemetry Logs', icon: Zap },
        { id: 'content-moderation', label: 'Content Moderation', icon: Sliders }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'ai-assistant', label: 'AI Health Advisor', icon: Zap }
      ]
    }
  ];

  const activeGroups = user.role === 'admin' 
    ? adminGroups 
    : user.role === 'coach' 
    ? coachGroups 
    : memberGroups;

  const roles: { role: UserRole; name: string; label: string }[] = [
    { role: 'member', name: 'Sarah Jenkins', label: 'Member' },
    { role: 'coach', name: 'Alex Rivera, CSCS', label: 'Head Coach' },
    { role: 'admin', name: 'Admin Operations', label: 'System Admin' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#ffffff] dark:bg-[#16221f] border-r border-[#e1e3e2] dark:border-[#263833] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-[#e1e3e2] dark:border-[#263833] flex items-center justify-between">
          <button 
            onClick={() => { onSelectTab('home'); onCloseMobile(); }}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0f5238] flex items-center justify-center text-white font-black shadow-md shadow-[#0f5238]/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#a8e7c5]" />
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold tracking-tight text-[#191c1c] dark:text-[#eff1f0]">
                Healthy<span className="text-[#0f5238] dark:text-[#95d4b3]">Life</span>
              </span>
              <span className="block text-[9px] uppercase font-bold text-[#2d6a4f] dark:text-[#95d4b3] tracking-widest">
                ORGANIC TECH AI
              </span>
            </div>
          </button>

          {/* Close button for mobile */}
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile & Role Switcher Banner */}
        <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-[#f2f4f3] dark:bg-[#1c2e2a] border border-[#e1e3e2] dark:border-[#2a403a] relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover border border-[#0f5238]"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#191c1c] dark:text-[#eff1f0] truncate">{user.name}</p>
                <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-[#cce6d0] text-[#0f5238] dark:bg-[#2d6a4f] dark:text-[#a8e7c5]">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="p-1 rounded-lg hover:bg-[#e6e9e8] dark:hover:bg-[#283e38] text-slate-600 dark:text-slate-300 transition-colors"
              title="Switch Role"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Role Switcher Dropdown */}
          {showRoleSelector && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#16221f] rounded-2xl border border-[#e1e3e2] dark:border-[#263833] shadow-xl p-2 z-20 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">Switch Persona Role</p>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    onSelectRole(r.role);
                    setShowRoleSelector(false);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    user.role === r.role 
                      ? 'bg-[#0f5238] text-white' 
                      : 'text-slate-700 dark:text-slate-200 hover:bg-[#f2f4f3] dark:hover:bg-[#20332d]'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{r.label}</p>
                    <p className="text-[10px] opacity-80">{r.name}</p>
                  </div>
                  {user.role === r.role && <CheckCircle2 className="w-4 h-4 text-[#a8e7c5]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Log Action Button */}
        {user.role === 'member' && (
          <div className="px-3 mt-3">
            <button
              onClick={() => {
                onOpenQuickLog();
                onCloseMobile();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#0f5238] hover:bg-[#0c432d] text-white font-extrabold text-xs shadow-md shadow-[#0f5238]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Log Meal / Water</span>
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {activeGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0f5238] text-white shadow-md shadow-[#0f5238]/20'
                        : 'text-[#404943] dark:text-slate-300 hover:text-[#191c1c] dark:hover:text-white hover:bg-[#f2f4f3] dark:hover:bg-[#1f312c]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#a8e7c5]' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#cce6d0] text-[#0f5238] dark:bg-[#2d6a4f] dark:text-[#a8e7c5]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Public Home Link */}
          <div className="pt-2 border-t border-[#e1e3e2] dark:border-[#263833]">
            <button
              onClick={() => {
                onSelectTab('home');
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Public Landing Page</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3 border-t border-[#e1e3e2] dark:border-[#263833] space-y-2 bg-[#f8faf9] dark:bg-[#121c19]">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onToggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-[#1f312c] border border-[#e1e3e2] dark:border-[#2d453f] text-xs font-bold text-[#191c1c] dark:text-[#eff1f0] hover:bg-[#f2f4f3] transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#1f312c] border border-[#e1e3e2] dark:border-[#2d453f] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
