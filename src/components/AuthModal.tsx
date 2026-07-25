import React, { useState } from 'react';
import { UserRole, UserProfile, NavigationTab } from '../types';
import { demoProfiles } from '../data/mockData';
import { Sparkles, ShieldCheck, User, Briefcase, Lock, Mail, ArrowRight, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile, targetTab?: NavigationTab) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === 'admin@gmail.com' && cleanPassword === 'admin1234') {
      onLoginSuccess(demoProfiles.admin, 'admin-dashboard');
      onClose();
    } else if (cleanEmail === 'coach@gmail.com' && cleanPassword === 'coach1234') {
      onLoginSuccess(demoProfiles.coach, 'coach-dashboard');
      onClose();
    } else if (cleanEmail === 'member@gmail.com' && cleanPassword === 'member1234') {
      onLoginSuccess(demoProfiles.member, 'dashboard');
      onClose();
    } else {
      setErrorMessage(
        'Invalid credentials. Please enter admin@gmail.com (admin1234), coach@gmail.com (coach1234), or member@gmail.com (member1234).'
      );
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    const targetTab = role === 'admin' ? 'admin-dashboard' : role === 'coach' ? 'coach-dashboard' : 'dashboard';
    onLoginSuccess(demoProfiles[role], targetTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to HealthyLife</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {activeTab === 'login' ? 'Sign In to Your Account' : 'Create HealthyLife Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose your role or sign in with your credentials to access your personalized workspace.
          </p>
        </div>

        {/* 1-Click Quick Demo Login Profiles */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            ⚡ Instant 1-Click Role Login
          </p>

          <div className="grid grid-cols-3 gap-2">
            
            {/* Member */}
            <button
              onClick={() => handleDemoLogin('member')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 transition-all hover:scale-[1.02] text-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Member</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium leading-tight">Sarah J.</span>
            </button>

            {/* Coach */}
            <button
              onClick={() => handleDemoLogin('coach')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-slate-900 dark:text-slate-100 transition-all hover:scale-[1.02] text-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Coach</span>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium leading-tight">Dr. Alex</span>
            </button>

            {/* Admin */}
            <button
              onClick={() => handleDemoLogin('admin')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-slate-100 transition-all hover:scale-[1.02] text-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Admin</span>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium leading-tight">Marcus V.</span>
            </button>

          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            Or Standard Form
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Role Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['member', 'coach', 'admin'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    selectedRole === r
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@healthylife.app"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
          >
            <span>{activeTab === 'login' ? 'Sign In as ' + selectedRole.toUpperCase() : 'Create ' + selectedRole.toUpperCase() + ' Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
