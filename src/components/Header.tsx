import React from 'react';
import { NavigationTab, UserProfile } from '../types';
import { Menu, Zap, Bell } from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  user: UserProfile;
  onOpenQuickLog?: () => void;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  user,
  onOpenQuickLog,
  onOpenMobileSidebar,
  onSelectTab
}) => {
  const getTabTitle = (tab: NavigationTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return { title: 'My Wellness Hub', subtitle: 'Your daily overview — macros, vitality & focus' };
      case 'nutrition':
        return { title: 'Nutrition & Macros', subtitle: 'Cycle-synced meals, food logger & hydration' };
      case 'workouts':
        return { title: 'Gym & Workouts Log', subtitle: 'Track exercises, sets, weights & session history' };
      case 'cycle':
        return { title: 'CycleSync™ Phase', subtitle: 'Hormonal alignment, symptoms & vitality tips' };
      case 'ai-assistant':
        return { title: 'AI Health Advisor', subtitle: 'Clinical AI intelligence & custom wellness plans' };
      case 'coach-dashboard':
        return { title: 'Coach Portal', subtitle: 'Client roster, compliance metrics & consultations' };
      case 'clients':
        return { title: 'Client Roster', subtitle: 'Individual profiles, biometrics & active programs' };
      case 'consultations':
        return { title: 'Live Consultations', subtitle: 'Scheduled 1-on-1 coaching sessions' };
      case 'plan-builder':
        return { title: 'AI Plan Builder', subtitle: 'Automated workout & macro generation for clients' };
      case 'water':
        return { title: 'Nutrition & Hydration', subtitle: 'Daily water intake, meals & macros' };
      case 'chat':
        return { title: 'Messaging', subtitle: 'Connect with your coach or clients' };
      default:
        return { title: 'HealthyLife', subtitle: 'Holistic Health & Wellness Platform' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header
      className="sticky top-0 z-30 px-4 sm:px-6 py-3"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--hl-border-light)',
        boxShadow: 'var(--hl-shadow-xs)',
      }}
    >
      <div className="flex items-center justify-between gap-4">

        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-border)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1
              className="text-base sm:text-lg font-extrabold tracking-tight truncate"
              style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
            >
              {title}
            </h1>
            <p className="hidden sm:block text-xs truncate" style={{ color: 'var(--hl-text-tertiary)' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* AI Advisor shortcut */}
          <button
            onClick={() => onSelectTab('ai-assistant')}
            className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
            style={
              currentTab === 'ai-assistant'
                ? { background: 'var(--hl-green)', color: '#fff' }
                : { background: 'var(--hl-green-light)', color: 'var(--hl-green)', border: '1px solid var(--hl-green-border)' }
            }
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Advisor</span>
          </button>

          {/* Notification bell placeholder */}
          <button
            className="p-2 rounded-xl transition-colors relative"
            style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-border)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--hl-peach)' }}
            />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--hl-border-light)' }}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              style={{ border: '2px solid var(--hl-green-border)' }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
