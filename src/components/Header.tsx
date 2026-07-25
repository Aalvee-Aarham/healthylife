import React from 'react';
import { NavigationTab, UserProfile } from '../types';
import { Menu, Bell, Zap, Sun, Moon, Sparkles, Plus, Search } from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  user: UserProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenQuickLog: () => void;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  user,
  theme,
  onToggleTheme,
  onOpenQuickLog,
  onOpenMobileSidebar,
  onSelectTab
}) => {
  const getTabTitle = (tab: NavigationTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Overview & Vitality Hub', subtitle: 'Real-time bio-metric metrics, macros, and workout schedules' };
      case 'nutrition':
        return { title: 'Nutrition & Macro Engine', subtitle: 'Cycle-synced meals, Pexels food logger, and hydration' };
      case 'workouts':
        return { title: 'Workouts & Sculpt', subtitle: 'Targeted strength microcycles and cardiovascular tracking' };
      case 'cycle':
        return { title: 'CycleSync™ Biological Phase', subtitle: 'Hormonal alignment, symptom tracking, and vitality tips' };
      case 'ai-assistant':
        return { title: 'HealthyLife AI Health Advisor', subtitle: 'Ultra-fast Llama-3.3-70b clinical intelligence and custom plans' };
      case 'community':
        return { title: 'Community & Challenges', subtitle: 'Connect with peers, complete streak goals, and share achievements' };
      case 'coach-dashboard':
        return { title: 'Coach Master Portal', subtitle: 'Client roster metrics, training compliance, and consultations' };
      case 'clients':
        return { title: 'Client Roster Management', subtitle: 'Individual client profiles, biometrics, and active programs' };
      case 'consultations':
        return { title: 'Live Video Consultations', subtitle: 'Scheduled 1-on-1 coaching sessions and video reviews' };
      case 'plan-builder':
        return { title: 'AI Training Plan Builder', subtitle: 'Automated workout and macro generation for client goals' };
      case 'admin-dashboard':
        return { title: 'System Command Center', subtitle: 'Platform KPIs, operational health, and user metrics' };
      case 'user-management':
        return { title: 'User & Role Management', subtitle: 'Role assignment, permissions, and active subscriptions' };
      case 'ai-logs':
        return { title: 'AI Telemetry & Logs', subtitle: 'Token usage metrics, latency charts, and rate limits' };
      case 'content-moderation':
        return { title: 'Community Moderation Queue', subtitle: 'Flagged posts, content safety audits, and automated filters' };
      default:
        return { title: 'HealthyLife Platform', subtitle: 'Organic Tech Wellness Ecosystem' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 bg-[#ffffff]/90 dark:bg-[#16221f]/90 backdrop-blur-md border-b border-[#e1e3e2] dark:border-[#263833] px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-[#f2f4f3] dark:bg-[#1f312c] text-slate-700 dark:text-slate-200 hover:bg-[#e6e9e8] transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-[#191c1c] dark:text-[#eff1f0] tracking-tight truncate">
              {title}
            </h1>
            <p className="hidden sm:block text-xs text-[#404943] dark:text-slate-400 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick AI Advisor Shortcut */}
          <button
            onClick={() => onSelectTab('ai-assistant')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentTab === 'ai-assistant'
                ? 'bg-[#0f5238] text-white shadow-md'
                : 'bg-[#f2f4f3] dark:bg-[#1f312c] text-[#0f5238] dark:text-[#95d4b3] hover:bg-[#e6e9e8]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-[#0f5238] dark:fill-[#95d4b3]" />
            <span className="hidden md:inline">AI Advisor</span>
          </button>

          {/* Member Quick Log Button */}
          {user.role === 'member' && (
            <button
              onClick={onOpenQuickLog}
              className="px-3.5 py-1.5 rounded-full bg-[#0f5238] hover:bg-[#0c432d] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#0f5238]/15 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Log</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-[#f2f4f3] dark:bg-[#1f312c] border border-[#e1e3e2] dark:border-[#2d453f] text-slate-700 dark:text-slate-200 hover:bg-[#e6e9e8] transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e1e3e2] dark:border-[#263833]">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#0f5238]"
            />
          </div>

        </div>

      </div>
    </header>
  );
};
