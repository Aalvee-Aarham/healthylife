import React, { useState } from 'react';
import { UserRole, UserProfile, NavigationTab } from '../types';
import { signInWithGoogle, signInWithEmail } from '../services/firebase';
import { api, setAuthToken } from '../services/api';
import { Sparkles, ShieldCheck, User, Briefcase, Lock, Mail, ArrowRight, X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile, targetTab?: NavigationTab) => void;
  onSelectTab?: (tab: NavigationTab) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSelectTab,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const fbUser = await signInWithGoogle();
      const payload: Record<string, unknown> = {
        name: fbUser.displayName || 'HealthyLife Member',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || undefined,
        role: selectedRole,
      };

      const res = await api.firebaseAuth(payload);
      setAuthToken(res.token);
      const targetTab: NavigationTab = res.user.role === 'coach' ? 'chat' : 'dashboard';
      onLoginSuccess(res.user, targetTab);
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      try {
        await signInWithEmail(cleanEmail, cleanPassword);
      } catch (fbErr: any) {
        console.warn('Firebase email auth notice:', fbErr?.message);
      }

      const { user, token } = await api.login(cleanEmail, cleanPassword);
      setAuthToken(token);
      const targetTab: NavigationTab = user.role === 'coach' ? 'chat' : 'dashboard';
      onLoginSuccess(user, targetTab);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to HealthyLife</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {activeTab === 'login' ? 'Sign In to Your Account' : 'Create HealthyLife Account'}
          </h2>
          <p className="text-xs text-slate-500">
            Sign in with your credentials to access your personalized workspace.
          </p>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in with Google...
            </span>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            Or Firebase Email Login
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              if (onSelectTab) {
                onSelectTab('signup');
                onClose();
              } else {
                setActiveTab('register');
              }
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register (Onboarding)
          </button>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Role Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['member', 'coach'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    selectedRole === r
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
