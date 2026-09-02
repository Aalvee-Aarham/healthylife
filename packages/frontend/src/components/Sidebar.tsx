import React from 'react';
import { NavigationTab, UserProfile } from '../types';
import {
  Home,
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  Briefcase,
  Plus,
  User,
  LogOut,
  Zap,
  FileText,
  MessageSquare,
  Droplet,
  Video,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile;
  onOpenQuickLog: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  color?: string;
  bgLight?: string;
  borderLight?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenQuickLog,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const memberGroups: NavGroup[] = [
    {
      title: 'CORE WELLNESS',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, color: 'var(--hl-green)', bgLight: 'var(--hl-green-light)', borderLight: 'var(--hl-green-border)' },
        { id: 'nutrition', label: 'Nutrition & Macros', icon: UtensilsCrossed, color: 'var(--hl-teal)', bgLight: 'var(--hl-teal-light)', borderLight: 'var(--hl-teal-border)' },
        { id: 'workouts', label: 'Gym & Workouts', icon: Dumbbell, color: 'var(--hl-peach)', bgLight: 'var(--hl-peach-light)', borderLight: 'var(--hl-peach-border)' },
      ],
    },
    {
      title: 'CONNECT',
      items: [
        { id: 'chat', label: 'Chat with Coach', icon: MessageSquare, color: 'var(--hl-green)', bgLight: 'var(--hl-green-light)', borderLight: 'var(--hl-green-border)' },
        { id: 'ai-assistant', label: 'AI Health Advisor', icon: Zap, color: 'var(--hl-amber)', bgLight: 'var(--hl-amber-light)', borderLight: 'var(--hl-amber-border)' },
        ...(user.gender !== 'male'
          ? [
              {
                id: 'cycle' as NavigationTab,
                label: 'CycleSync™ Phase',
                icon: Sparkles,
                badge: user.cycleDay ? `Day ${user.cycleDay}` : undefined,
                color: 'var(--hl-lavender)',
                bgLight: 'var(--hl-lavender-light)',
                borderLight: 'var(--hl-lavender-border)',
              },
            ]
          : []),
      ],
    },
  ];

  const coachGroups: NavGroup[] = [
    {
      title: 'MESSAGING',
      items: [
        { id: 'chat', label: 'Client Chat', icon: MessageSquare, color: 'var(--hl-green)', bgLight: 'var(--hl-green-light)', borderLight: 'var(--hl-green-border)' },
      ],
    },
  ];

  const activeGroups = user.role === 'coach' ? coachGroups : memberGroups;

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          style={{ background: 'rgba(44,36,32,0.35)' }}
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--hl-surface)',
          borderRight: '1px solid var(--hl-border)',
        }}
      >
        {/* Brand Header */}
        <div
          className="p-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--hl-border-light)' }}
        >
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
              style={{ background: 'var(--hl-gradient-hero)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span
                className="text-lg font-extrabold tracking-tight"
                style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Healthy<span style={{ color: 'var(--hl-green)' }}>Life</span>
              </span>
              <span
                className="block text-[9px] uppercase font-bold tracking-widest"
                style={{ color: 'var(--hl-text-tertiary)' }}
              >
                WELLNESS PLATFORM
              </span>
            </div>
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--hl-text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="px-3 pt-3 shrink-0">
          <div
            className="p-3 rounded-2xl flex items-center gap-2.5"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              style={{ border: '2px solid var(--hl-green)' }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{user.name}</p>
              <span className="hl-badge hl-badge-green">{user.role}</span>
            </div>
            <button
              onClick={() => handleNav('home')}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--hl-text-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-border)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              title="View profile"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Log (member only) */}
        {user.role === 'member' && (
          <div className="px-3 pt-3 shrink-0">
            <button
              onClick={() => { onOpenQuickLog(); onCloseMobile(); }}
              className="w-full py-2.5 px-3 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              style={{
                background: 'var(--hl-gradient-hero)',
                boxShadow: '0 2px 10px rgba(61,122,90,0.25)',
              }}
            >
              <Plus className="w-4 h-4" />
              Quick Log Meal / Water
            </button>
          </div>
        )}

        {/* Nav Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {activeGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="hl-section-label px-3 mb-2">{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group`}
                    style={
                      isActive
                        ? {
                            background: item.bgLight || 'var(--hl-green-light)',
                            color: item.color || 'var(--hl-green)',
                            border: `1px solid ${item.borderLight || 'var(--hl-green-border)'}`,
                            fontWeight: 700,
                          }
                        : { color: 'var(--hl-text-secondary)', border: '1px solid transparent' }
                    }
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                        style={
                          isActive
                            ? { background: item.color || 'var(--hl-green)', }
                            : { background: 'var(--hl-surface-alt)' }
                        }
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: isActive ? '#fff' : (item.color ?? 'var(--hl-text-tertiary)') }}
                        />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="hl-badge"
                        style={
                          isActive
                            ? { background: 'var(--hl-green)', color: '#fff' }
                            : { background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)', border: '1px solid var(--hl-lavender-border)' }
                        }
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Public Home Link */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--hl-border-light)' }}>
            <button
              onClick={() => handleNav('home')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ color: 'var(--hl-text-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--hl-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--hl-text-tertiary)'; }}
            >
              <Home className="w-4 h-4" />
              <span>Public Landing Page</span>
            </button>
          </div>
        </div>

        {/* Footer — Sign Out */}
        <div
          className="p-3 shrink-0"
          style={{ borderTop: '1px solid var(--hl-border-light)', background: 'var(--hl-bg)' }}
        >
          <button
            onClick={() => { onLogout(); onCloseMobile(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors"
            style={{ color: 'var(--hl-peach)', background: 'var(--hl-surface)', border: '1px solid var(--hl-border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-peach-light)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--hl-peach-border)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--hl-border)'; }}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
