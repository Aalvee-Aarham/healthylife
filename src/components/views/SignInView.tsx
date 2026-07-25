import React, { useState } from 'react';
import { UserProfile, UserRole, NavigationTab } from '../../types';
import { demoProfiles } from '../../data/mockData';
import { 
  Sparkles, 
  ShieldCheck, 
  User, 
  Briefcase, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Zap,
  ArrowLeft
} from 'lucide-react';

interface SignInViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onLoginSuccess,
  onSelectTab,
  theme,
  onToggleTheme
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('member@gmail.com');
  const [password, setPassword] = useState('member1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFillCredentials = (demoRole: UserRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@gmail.com');
      setPassword('admin1234');
    } else if (demoRole === 'coach') {
      setEmail('coach@gmail.com');
      setPassword('coach1234');
    } else {
      setEmail('member@gmail.com');
      setPassword('member1234');
    }
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === 'admin@gmail.com' && cleanPassword === 'admin1234') {
      onLoginSuccess(demoProfiles.admin, 'admin-dashboard');
    } else if (cleanEmail === 'coach@gmail.com' && cleanPassword === 'coach1234') {
      onLoginSuccess(demoProfiles.coach, 'coach-dashboard');
    } else if (cleanEmail === 'member@gmail.com' && cleanPassword === 'member1234') {
      onLoginSuccess(demoProfiles.member, 'dashboard');
    } else {
      // Fallback for custom or registration demo
      if (mode === 'register') {
        const customMember: UserProfile = {
          ...demoProfiles.member,
          email: cleanEmail || 'member@gmail.com',
          name: cleanEmail.split('@')[0] || 'New Member'
        };
        onLoginSuccess(customMember, 'dashboard');
      } else {
        setErrorMessage(
          'Invalid credentials. Please use admin@gmail.com (admin1234), coach@gmail.com (coach1234), or member@gmail.com (member1234).'
        );
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Top Header Controls with Theme Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSelectTab('home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Dedicated Theme Toggle Bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Theme: <span className="text-emerald-600 dark:text-emerald-400 capitalize">{theme} Mode</span>
          </span>
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all"
            title="Toggle Light / Dark Theme"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Demo Credentials Helper & Role Jumping Info (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">HealthyLife Portal</h1>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Sign in with specific credentials to jump directly to Member, Coach, or Admin workspace.
              </p>
            </div>

            <div className="pt-2 border-t border-white/20 text-xs space-y-2">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                <span>Preset Role Credentials:</span>
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('admin')}
                  className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-purple-200 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Command Center</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/90">admin@gmail.com</p>
                    <p className="text-[10px] text-white/70">pass: admin1234</p>
                  </div>
                  <span className="text-[10px] bg-purple-500/80 text-white px-2 py-0.5 rounded-lg font-bold group-hover:scale-105 transition-transform">
                    Use
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('coach')}
                  className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-teal-200 text-xs">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Coach Portal</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/90">coach@gmail.com</p>
                    <p className="text-[10px] text-white/70">pass: coach1234</p>
                  </div>
                  <span className="text-[10px] bg-teal-500/80 text-white px-2 py-0.5 rounded-lg font-bold group-hover:scale-105 transition-transform">
                    Use
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('member')}
                  className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-200 text-xs">
                      <User className="w-3.5 h-3.5" />
                      <span>Member Overview</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/90">member@gmail.com</p>
                    <p className="text-[10px] text-white/70">pass: member1234</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-lg font-bold group-hover:scale-105 transition-transform">
                    Use
                  </span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Sign In Form (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Form Mode Selector */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {mode === 'login' ? 'Sign In to Workspace' : 'Create Member Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter your credentials to access your designated platform.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Authentication Error</p>
                <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="admin@gmail.com, coach@gmail.com, or member@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="admin1234, coach1234, or member1234"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
            >
              <span>{mode === 'login' ? 'Sign In & Jump to Page' : 'Create Member Account'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

          </form>

          {/* Quick Demo Fill Pills */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">Quick One-Click Credential Autofill:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleFillCredentials('admin')}
                className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:scale-105 transition-transform"
              >
                🛡️ Admin (admin@gmail.com)
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('coach')}
                className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-bold hover:scale-105 transition-transform"
              >
                🏋️ Coach (coach@gmail.com)
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('member')}
                className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:scale-105 transition-transform"
              >
                👤 Member (member@gmail.com)
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
