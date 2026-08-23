import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Briefcase } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '../../../services/firebase';
import { UserProfile } from '../../../types';

interface CoachSignInProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSocialLoginSuccess?: (payload: Record<string, unknown>) => void;
  isLoading: boolean;
  error: string | null;
}

export const CoachSignIn: React.FC<CoachSignInProps> = ({ onSubmit, onSocialLoginSuccess, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      try {
        await signInWithEmail(email.trim().toLowerCase(), password.trim());
      } catch (fbErr: any) {
        console.warn('Firebase email auth notice:', fbErr?.message);
      }
      await onSubmit(email.trim().toLowerCase(), password.trim());
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      const fbUser = await signInWithGoogle();
      const payload: Record<string, unknown> = {
        name: fbUser.displayName || 'Coach ' + (fbUser.email?.split('@')[0] || 'Pro'),
        email: fbUser.email || '',
        avatar: fbUser.photoURL || undefined,
        role: 'coach',
      };

      if (onSocialLoginSuccess) {
        onSocialLoginSuccess(payload);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Google sign-in was unsuccessful.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const displayError = authError || error;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-md">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Coach Portal Sign In</h3>
          <p className="text-[11px] text-slate-500">Manage your clients and consultations</p>
        </div>
      </div>

      {displayError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p>{displayError}</p>
        </div>
      )}

      {/* Google Sign-in for Coach */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting to Google...
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
          Or coach email sign in
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Coach Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <span>Access Coach Portal</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

