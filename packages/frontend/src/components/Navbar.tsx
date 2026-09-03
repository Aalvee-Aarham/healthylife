import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowRight,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  // Protected route: guests are redirected to sign-in when they open it.
  requiresAuth?: boolean;
}

const NAV_CSS = `
@keyframes hlNavIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
@keyframes hlDrawerItem { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
@keyframes hlShine { 0% { transform: translateX(-140%) skewX(-18deg); } 60%, 100% { transform: translateX(240%) skewX(-18deg); } }
@keyframes hlOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.hl-nav-shell { animation: hlNavIn .5s cubic-bezier(.22,1,.36,1) both; }

.hl-nav-cta { position: relative; overflow: hidden; isolation: isolate; }
.hl-nav-cta::after {
  content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
  transform: translateX(-140%) skewX(-18deg);
}
.hl-nav-cta:hover::after { animation: hlShine .9s ease-out; }
.hl-cta-arrow { transition: transform .35s cubic-bezier(.22,1,.36,1); }
.hl-nav-cta:hover .hl-cta-arrow { transform: translateX(3px); }

.hl-nav-link > * { position: relative; z-index: 2; }

.hl-nav-ghost::before {
  content: ''; position: absolute; left: 14px; right: 14px; bottom: 6px; height: 1.5px;
  background: currentColor; border-radius: 2px;
  transform: scaleX(0); transform-origin: right center;
  transition: transform .38s cubic-bezier(.22,1,.36,1);
}
.hl-nav-ghost:hover::before { transform: scaleX(1); transform-origin: left center; }

.hl-brand-orb { transition: transform .5s cubic-bezier(.22,1,.36,1); }
.hl-brand:hover .hl-brand-orb { transform: translateY(-2px) rotate(-8deg) scale(1.06); }
.hl-brand:hover .hl-brand-spark { animation: hlOrbit 3.2s linear infinite; }

.hl-burger span {
  display: block; height: 1.8px; border-radius: 2px; background: currentColor;
  transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .2s ease, width .35s ease;
}

.hl-drawer { transition: max-height .45s cubic-bezier(.22,1,.36,1), opacity .3s ease; overflow: hidden; }
.hl-drawer-item { animation: hlDrawerItem .38s cubic-bezier(.22,1,.36,1) both; }

@media (prefers-reduced-motion: reduce) {
  .hl-nav-shell, .hl-drawer-item { animation: none !important; }
  .hl-nav-cta:hover::after { animation: none !important; }
  .hl-brand:hover .hl-brand-spark { animation: none !important; }
  .hl-brand:hover .hl-brand-orb { transform: none; }
}
`;

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  isLoggedIn,
  onLogout
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const navTrackRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  // Public center nav — auth buttons are in the RIGHT action bar only (no duplicates)
  const publicNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Zap, requiresAuth: true },
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

  /* Scroll elevation + reading progress ---------------------------------- */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Sliding active indicator --------------------------------------------- */
  const measurePill = useCallback(() => {
    const track = navTrackRef.current;
    const active = itemRefs.current[currentTab as string];
    if (!track || !active) {
      setPill(p => (p.ready ? { ...p, ready: false } : p));
      return;
    }
    const t = track.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setPill({ left: a.left - t.left, width: a.width, ready: true });
  }, [currentTab]);

  useEffect(() => {
    measurePill();
    const t = window.setTimeout(measurePill, 80); // after webfonts settle
    window.addEventListener('resize', measurePill);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measurePill);
    };
  }, [measurePill, isLoggedIn, navItems.length]);

  /* Dismiss profile menu on outside click / Escape ------------------------ */
  useEffect(() => {
    if (!showProfileMenu) return;
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowProfileMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showProfileMenu]);

  /* Close mobile drawer on Escape ----------------------------------------- */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const go = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
    setShowProfileMenu(false);
  };

  const avatarFallback = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  return (
    <header
      className="hl-nav-shell sticky top-0 z-40 backdrop-blur-xl"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.96)',
        borderBottom: '1px solid ' + (scrolled ? 'var(--hl-border)' : 'transparent'),
        boxShadow: scrolled ? 'var(--hl-shadow-md)' : 'none',
        transition: 'background .35s ease, box-shadow .35s ease, border-color .35s ease',
      }}
    >
      <style>{NAV_CSS}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem] gap-4">

          {/* Logo & Brand */}
          <button
            onClick={() => go(isLoggedIn && user ? (user.role === 'coach' ? 'chat' : 'dashboard') : 'home')}
            className="hl-brand flex items-center gap-2.5 focus:outline-none rounded-2xl"
            aria-label="HealthyLife home"
          >
            <div
              className="hl-brand-orb relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'var(--hl-gradient-hero)' }}
            >
              <Sparkles className="hl-brand-spark w-5 h-5 text-white" aria-hidden="true" />
              <span
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)' }}
                aria-hidden="true"
              />
            </div>
            <div className="text-left flex items-baseline">
              <span
                className="text-xl font-black tracking-tight"
                style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
              >
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

          {/* Desktop Navigation Pills with sliding indicator */}
          <nav
            ref={navTrackRef}
            className="hidden md:flex relative items-center gap-1 p-1.5 rounded-full"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)' }}
            aria-label="Primary"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none"
              style={{
                left: pill.left,
                width: pill.width,
                opacity: pill.ready ? 1 : 0,
                background: 'var(--hl-green)',
                boxShadow: '0 4px 14px rgba(61,122,90,.32)',
                transition: 'left .42s cubic-bezier(.22,1,.36,1), width .42s cubic-bezier(.22,1,.36,1), opacity .25s ease',
              }}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el: HTMLButtonElement | null) => { itemRefs.current[item.id as string] = el; }}
                  onClick={() => go(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="hl-nav-link relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    color: isActive ? '#fff' : 'var(--hl-text-secondary)',
                    transition: 'color .3s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--hl-text-primary)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--hl-text-secondary)'; }}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.requiresAuth && !isLoggedIn && (
                    <Lock className="w-3 h-3 opacity-60" aria-label="Sign in required" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => go('signin')}
                  className="hl-nav-ghost relative px-4 py-2 rounded-full text-xs font-bold"
                  style={{ color: 'var(--hl-text-secondary)', transition: 'color .3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--hl-green)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--hl-text-secondary)'; }}
                >
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign In
                  </span>
                </button>
                <button
                  onClick={() => go('signup')}
                  className="hl-nav-cta flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black text-white"
                  style={{
                    background: 'var(--hl-gradient-hero)',
                    boxShadow: '0 6px 18px rgba(61,122,90,.30)',
                    transition: 'transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease',
                  }}
                  onMouseEnter={e => {
                    const t = e.currentTarget as HTMLElement;
                    t.style.transform = 'translateY(-1.5px)';
                    t.style.boxShadow = '0 10px 26px rgba(61,122,90,.38)';
                  }}
                  onMouseLeave={e => {
                    const t = e.currentTarget as HTMLElement;
                    t.style.transform = 'none';
                    t.style.boxShadow = '0 6px 18px rgba(61,122,90,.30)';
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Get Started</span>
                  <ArrowRight className="hl-cta-arrow w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              /* Profile Dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  aria-expanded={showProfileMenu}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border"
                  style={{
                    background: 'var(--hl-surface-alt)',
                    borderColor: 'var(--hl-border)',
                    transition: 'background .3s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-border-light)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
                >
                  <img
                    src={user?.avatar || avatarFallback}
                    alt={user?.name || 'Profile'}
                    className="w-7 h-7 rounded-full object-cover ring-2"
                    style={{ ringColor: 'var(--hl-green)' } as React.CSSProperties}
                  />
                  <span className="hidden sm:inline text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>{user?.name}</span>
                  <ChevronDown
                    className="w-3.5 h-3.5"
                    style={{
                      color: 'var(--hl-text-tertiary)',
                      transform: showProfileMenu ? 'rotate(180deg)' : 'none',
                      transition: 'transform .3s cubic-bezier(.22,1,.36,1)',
                    }}
                    aria-hidden="true"
                  />
                </button>

                {showProfileMenu && user && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 rounded-2xl p-3 z-50 space-y-2 animate-fade-slide-up"
                    style={{
                      background: 'var(--hl-surface)',
                      border: '1px solid var(--hl-border)',
                      boxShadow: 'var(--hl-shadow-xl)',
                    }}
                  >
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
                      <img
                        src={user.avatar || avatarFallback}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2"
                        style={{ ringColor: 'var(--hl-green)' } as React.CSSProperties}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate" style={{ color: 'var(--hl-text-primary)' }}>{user.name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{user.email}</p>
                        <span className="hl-badge hl-badge-green mt-0.5">{user.role}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        role="menuitem"
                        onClick={() => go(user.role === 'coach' ? 'chat' : 'dashboard')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors"
                        style={{ color: 'var(--hl-text-secondary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-surface-alt)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {user.role === 'coach' ? (
                          <>
                            <MessageSquare className="w-4 h-4" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                            <span>Client Chat</span>
                          </>
                        ) : (
                          <>
                            <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                            <span>Dashboard</span>
                          </>
                        )}
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => { onLogout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors text-rose-500"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <LogOut className="w-4 h-4 text-rose-400" aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen}
              aria-controls="hl-mobile-drawer"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden hl-burger flex flex-col justify-center items-center gap-[5px] w-10 h-10 rounded-2xl border"
              style={{
                background: 'var(--hl-surface-alt)',
                borderColor: 'var(--hl-border)',
                color: 'var(--hl-text-primary)',
              }}
            >
              <span style={{ width: 16, transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ width: 16, opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ width: mobileOpen ? 16 : 11, transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          id="hl-mobile-drawer"
          className="hl-drawer md:hidden"
          style={{
            maxHeight: mobileOpen ? 420 : 0,
            opacity: mobileOpen ? 1 : 0,
            borderTop: '1px solid ' + (mobileOpen ? 'var(--hl-border-light)' : 'transparent'),
          }}
        >
          <div className="py-3 space-y-1.5">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className="hl-drawer-item w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm text-left"
                  style={{
                    animationDelay: mobileOpen ? (i * 55) + 'ms' : '0ms',
                    background: isActive ? 'var(--hl-green-light)' : 'transparent',
                    color: isActive ? 'var(--hl-green)' : 'var(--hl-text-secondary)',
                    fontWeight: isActive ? 800 : 600,
                    border: '1px solid ' + (isActive ? 'var(--hl-green-border)' : 'transparent'),
                  }}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.requiresAuth && !isLoggedIn && (
                    <Lock className="w-3 h-3 opacity-60" aria-label="Sign in required" />
                  )}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-40" aria-hidden="true" />
                </button>
              );
            })}

            {!isLoggedIn && (
              <div
                className="hl-drawer-item grid grid-cols-2 gap-2 pt-2"
                style={{ animationDelay: mobileOpen ? (navItems.length * 55) + 'ms' : '0ms' }}
              >
                <button
                  onClick={() => go('signin')}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold border"
                  style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border)', color: 'var(--hl-text-secondary)' }}
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => go('signup')}
                  className="hl-nav-cta flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-black text-white"
                  style={{ background: 'var(--hl-gradient-hero)', boxShadow: '0 6px 18px rgba(61,122,90,.28)' }}
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll progress */}
      <div
        aria-hidden="true"
        className="absolute left-0 bottom-0 h-[2px] w-full origin-left"
        style={{
          transform: 'scaleX(' + progress + ')',
          background: 'var(--hl-gradient-hero)',
          opacity: progress > 0.005 ? 1 : 0,
          transition: 'transform .12s linear, opacity .3s ease',
        }}
      />
    </header>
  );
};
