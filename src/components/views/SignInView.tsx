import React, { useState } from 'react';
import { UserProfile, NavigationTab } from '../../types';
import { api, setAuthToken } from '../../services/api';
import { Sparkles, ArrowLeft, User, Briefcase, Server, AlertTriangle } from 'lucide-react';
import { UserSignIn } from './auth/UserSignIn';
import { CoachSignIn } from './auth/CoachSignIn';

interface SignInViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

type Panel = 'member' | 'coach';

export const SignInView: React.FC<SignInViewProps> = ({ onLoginSuccess, onSelectTab }) => {
  const [panel, setPanel] = useState<Panel>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverDown, setServerDown] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setServerDown(false);

    try {
      const { user, token } = await api.login(email, password);
      setAuthToken(token);

      const targetTab: NavigationTab = user.role === 'coach' ? 'coach-dashboard' : 'dashboard';
      onLoginSuccess(user, targetTab);
    } catch (err: any) {
      // Detect network/server errors vs credential errors
      const msg: string = err?.message ?? 'Unknown error';
      const isNetworkError =
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('err_connection');

      if (isNetworkError) {
        setServerDown(true);
        setError('Cannot reach the HealthyLife server. Please check if the backend is running.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseSocialLogin = async (profilePayload: Record<string, unknown>, role: 'member' | 'coach') => {
    setIsLoading(true);
    setError(null);
    setServerDown(false);

    try {
      const { user, token } = await api.firebaseAuth({ ...profilePayload, role });
      setAuthToken(token);

      const targetTab: NavigationTab = user.role === 'coach' ? 'coach-dashboard' : 'dashboard';
      onLoginSuccess(user, targetTab);
    } catch (err: any) {
      const msg: string = err?.message ?? 'Unknown error';
      const isNetworkError =
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('err_connection');

      if (isNetworkError) {
        setServerDown(true);
        setError('Cannot reach the HealthyLife server. Please check if the backend is running.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">

      {/* Back to Home */}
      <button
        onClick={() => onSelectTab('home')}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Server down alert */}
      {serverDown && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Backend Server Unreachable
            </p>
            <p className="text-[11px] leading-relaxed text-amber-700">
              The HealthyLife API at <code className="bg-amber-100 px-1 rounded font-mono">{import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}</code> is not responding. 
              Please start the Laravel backend with <code className="bg-amber-100 px-1 rounded font-mono">php artisan serve</code> and try again.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left: Brand Panel */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl space-y-5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">HealthyLife Portal</h1>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Your holistic health, fitness & coaching platform. Sign in to access your personalised workspace.
              </p>
            </div>

            <div className="pt-4 border-t border-white/20 space-y-3">
              <p className="text-[11px] font-extrabold text-white/80 uppercase tracking-wider">Choose your workspace:</p>

              <button
                onClick={() => { setPanel('member'); setError(null); }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  panel === 'member'
                    ? 'bg-white/20 border-white/40 shadow-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-100" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Member Dashboard</p>
                  <p className="text-[10px] text-white/70">Nutrition, workouts & wellness tracking</p>
                </div>
              </button>

              <button
                onClick={() => { setPanel('coach'); setError(null); }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  panel === 'coach'
                    ? 'bg-white/20 border-white/40 shadow-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-400/30 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-teal-100" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Coach Portal</p>
                  <p className="text-[10px] text-white/70">Client roster, sessions & AI plan builder</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sign-In Form */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">

          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => { setPanel('member'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                panel === 'member'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Member
            </button>
            <button
              onClick={() => { setPanel('coach'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                panel === 'coach'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Coach
            </button>
          </div>

          {panel === 'member' ? (
            <UserSignIn
              onSubmit={handleLogin}
              onSocialLoginSuccess={(profilePayload) => handleFirebaseSocialLogin(profilePayload, 'member')}
              isLoading={isLoading}
              error={!serverDown ? error : null}
              onSelectTab={onSelectTab}
            />
          ) : (
            <CoachSignIn
              onSubmit={handleLogin}
              onSocialLoginSuccess={(profilePayload) => handleFirebaseSocialLogin(profilePayload, 'coach')}
              isLoading={isLoading}
              error={!serverDown ? error : null}
            />
          )}
        </div>

      </div>
    </div>
  );
};
