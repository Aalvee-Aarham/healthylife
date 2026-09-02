import React, { useState } from 'react';
import { NavigationTab, UserProfile } from '../types';
import { 
  Sparkles, 
  Home, 
  Zap, 
  LogIn, 
  UserPlus, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  isLoggedIn,
  onLogout
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
  }

  // Public center nav — auth buttons are in the RIGHT action bar only (no duplicates)
  const publicNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Zap },
  ];

  // Logged-in nav
  const loggedInNav: NavItem[] = [
    { 
      id: user?.role === 'coach' ? 'chat' : 'dashboard', 
      label: user?.role === 'coach' ? 'Client Chat' : 'Dashboard', 
      icon: user?.role === 'coach' ? MessageSquare : LayoutDashboard 
    }
  ];

  const navItems = isLoggedIn && user ? loggedInNav : publicNav;

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b"
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderColor: 'var(--hl-border)',
        boxShadow: 'var(--hl-shadow-xs)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(isLoggedIn ? (user.role === 'coach' ? 'chat' : 'dashboard') : 'home')}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                style={{ background: 'var(--hl-gradient-hero)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                  Healthy<span style={{ color: 'var(--hl-green)' }}>Life</span>
                </span>
                <span
                  className="hidden sm:inline-block text-[10px] uppercase font-black tracking-wider ml-2 px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)', border: '1px solid var(--hl-green-border)' }}
                >
                  Wellness
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Pills */}
          <nav
            className="hidden md:flex items-center space-x-1 p-1.5 rounded-full"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)' }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive ? 'text-white scale-[1.02] shadow-md' : ''
                  }`}
                  style={
                    isActive
                      ? { background: 'var(--hl-green)', color: '#fff' }
                      : { color: 'var(--hl-text-secondary)' }
                  }
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hl-border)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('signin')}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                  style={{ color: 'var(--hl-text-secondary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </span>
                </button>
                <button
                  onClick={() => onSelectTab('signup')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: 'var(--hl-green)',
                    boxShadow: '0 2px 8px rgba(61,122,90,0.30)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-green-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-green)'; }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            ) : (
              /* Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all"
                  style={{
                    background: 'var(--hl-surface-alt)',
                    borderColor: 'var(--hl-border)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-border-light)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2"
                    style={{ ringColor: 'var(--hl-green)' }}
                  />
                  <span className="hidden sm:inline text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--hl-text-tertiary)' }} />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl p-3 z-50 space-y-2 animate-fade-slide-up"
                    style={{
                      background: 'var(--hl-surface)',
                      border: '1px solid var(--hl-border)',
                      boxShadow: 'var(--hl-shadow-xl)',
                    }}
                  >
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2"
                        style={{ ringColor: 'var(--hl-green)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate" style={{ color: 'var(--hl-text-primary)' }}>{user.name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{user.email}</p>
                        <span className="hl-badge hl-badge-green mt-0.5">{user.role}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          onSelectTab(user.role === 'coach' ? 'chat' : 'dashboard');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors"
                        style={{ color: 'var(--hl-text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {user.role === 'coach' ? (
                          <>
                            <MessageSquare className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
                            <span>Client Chat</span>
                          </>
                        ) : (
                          <>
                            <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
                            <span>Dashboard</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors text-rose-500"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div
          className="md:hidden flex items-center justify-around py-2 overflow-x-auto gap-1"
          style={{ borderTop: '1px solid var(--hl-border-light)' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all`}
                style={
                  isActive
                    ? { color: 'var(--hl-green)', background: 'var(--hl-green-light)', fontWeight: 700 }
                    : { color: 'var(--hl-text-tertiary)' }
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          {/* Mobile auth row */}
          {!isLoggedIn && (
            <>
              <button
                onClick={() => onSelectTab('signin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ color: 'var(--hl-text-tertiary)' }}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onSelectTab('signup')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'var(--hl-green)' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
