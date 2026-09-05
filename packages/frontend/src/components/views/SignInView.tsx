import React, { useState } from 'react';
import { UserProfile, NavigationTab } from '../../types';
import { api, setAuthToken } from '../../services/api';
import { signInWithGoogle, signInWithEmail } from '../../services/firebase';
import { Sparkles, ArrowLeft, ArrowRight, AlertCircle, Server, Eye, EyeOff, Lock } from 'lucide-react';

interface SignInViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
  /** Shown above the form when the visitor was redirected here from a protected tab. */
  notice?: string | null;
}

const THEME = `
  .si-root { font-family: 'Inter', 'DM Sans', sans-serif; color: var(--hl-text-primary); }
  .si-display { font-family: 'DM Sans', 'Inter', sans-serif; letter-spacing: -0.02em; }

  @keyframes siIn    { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes siZoom  { from { transform: scale(1.08); } to { transform: scale(1); } }
  @keyframes siShake { 0%, 100% { transform: none; } 20% { transform: translateX(-5px); } 60% { transform: translateX(4px); } }

  .si-in    { animation: siIn .6s cubic-bezier(.22,1,.36,1) both; }
  .si-zoom  { animation: siZoom 2.4s cubic-bezier(.22,1,.36,1) both; }
  .si-shake { animation: siShake .38s ease both; }

  .si-input {
    background: var(--hl-surface);
    border: 1px solid var(--hl-border);
    color: var(--hl-text-primary);
    transition: border-color .25s ease, box-shadow .25s ease;
  }
  .si-input::placeholder { color: var(--hl-text-tertiary); }
  .si-input:hover { border-color: var(--hl-green-border); }
  .si-input:focus { outline: none; border-color: var(--hl-green); box-shadow: 0 0 0 4px var(--hl-green-light); }

  .si-btn { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, opacity .2s ease; }
  .si-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .si-btn:active:not(:disabled) { transform: scale(.985); }
  .si-arrow { transition: transform .35s cubic-bezier(.22,1,.36,1); }
  .si-btn:hover .si-arrow { transform: translateX(3px); }

  @media (prefers-reduced-motion: reduce) {
    .si-in, .si-zoom, .si-shake { animation: none !important; }
    .si-btn, .si-arrow { transition: none !important; }
  }
`;

const HERO_IMAGE = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000';

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const GoogleMark = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const SignInView: React.FC<SignInViewProps> = ({ onLoginSuccess, onSelectTab, notice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [serverDown, setServerDown] = useState(false);

  const busy = isLoading || isGoogleLoading;

  const showError = (msg: string) => {
    setError(msg);
    setErrorKey((k) => k + 1);
  };

  const clearError = () => {
    if (error) setError(null);
    if (serverDown) setServerDown(false);
  };

  const routeToTargetTab = (user: any) => {
    const targetTab: NavigationTab = user.role === 'coach' ? 'chat' : 'dashboard';
    onLoginSuccess(user, targetTab);
  };

  const handleErr = (err: any) => {
    const msg: string = err?.message ?? 'Unknown error';
    const isNetworkError =
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('network') ||
      msg.toLowerCase().includes('err_connection');

    if (isNetworkError) {
      setServerDown(true);
      showError('Cannot reach the HealthyLife server. Please check if the backend is running.');
    } else {
      showError(msg);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setServerDown(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      showError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      // Optional Firebase email auth (non-blocking best-effort)
      try {
        await signInWithEmail(normalizedEmail, password.trim());
      } catch (fbErr: any) {
        console.warn('Firebase email auth notice:', fbErr?.message);
      }

      const { user, token } = await api.login(normalizedEmail, password.trim());
      setAuthToken(token);
      routeToTargetTab(user);
    } catch (err: any) {
      handleErr(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setIsGoogleLoading(true);
    setError(null);
    setServerDown(false);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser.email) {
        showError('Your Google account has no email address. Please sign in with email instead.');
        return;
      }
      const payload: Record<string, unknown> = {
        name: fbUser.displayName || 'HealthyLife Member',
        email: fbUser.email,
        avatar: fbUser.photoURL || undefined,
      };
      const { user, token } = await api.firebaseAuth(payload);
      setAuthToken(token);
      routeToTargetTab(user);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        handleErr(err);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="si-root flex items-center justify-center py-2 sm:py-6 min-h-[calc(100vh-9rem)]">
      <style>{THEME}</style>

      <div
        className="si-in w-full max-w-5xl grid lg:grid-cols-[1fr_1.05fr] rounded-[2rem] overflow-hidden"
        style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-lg)' }}
      >
        {/* ------------------------------ Form ------------------------------ */}
        <section className="flex flex-col px-6 py-7 sm:px-10 sm:py-9 lg:min-h-[600px]">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            aria-label="Back to home"
            className="si-btn self-start w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex flex-col justify-center py-8">
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              {notice && (
                <p
                  role="status"
                  className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)', border: '1px solid var(--hl-green-border)' }}
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  {notice}
                </p>
              )}
              <h1 className="si-display text-[1.75rem] sm:text-3xl font-bold leading-tight">Welcome back</h1>
              <p className="text-sm mt-1.5" style={{ color: 'var(--hl-text-secondary)' }}>
                Sign in to your HealthyLife workspace.
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="si-btn mt-7 w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              >
                {isGoogleLoading ? <Spinner /> : <GoogleMark />}
                <span>{isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-5" aria-hidden="true">
                <span className="h-px flex-1" style={{ background: 'var(--hl-border)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--hl-text-tertiary)' }}>or</span>
                <span className="h-px flex-1" style={{ background: 'var(--hl-border)' }} />
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="signin-email" className="block text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
                    Email
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    placeholder="you@example.com"
                    className="si-input w-full rounded-xl px-4 py-3 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signin-password" className="block text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError(); }}
                      placeholder="Your password"
                      className="si-input w-full rounded-xl pl-4 pr-12 py-3 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ color: 'var(--hl-text-tertiary)' }}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    key={errorKey}
                    role="alert"
                    className={
                      'si-shake flex items-start gap-2 p-3 rounded-xl text-xs font-medium border ' +
                      (serverDown
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-rose-50 border-rose-200 text-rose-700')
                    }
                  >
                    {serverDown
                      ? <Server className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                      : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />}
                    <div className="leading-relaxed space-y-1 min-w-0">
                      <p>{error}</p>
                      {serverDown && (
                        <p className="text-[11px] text-amber-700 break-words">
                          API: <code className="bg-amber-100 px-1 rounded font-mono">{import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}</code>
                          {' '}— start it with <code className="bg-amber-100 px-1 rounded font-mono">php artisan serve</code>.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="si-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--hl-green)', boxShadow: '0 8px 20px rgba(61,122,90,.25)' }}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="si-arrow w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: 'var(--hl-text-secondary)' }}>
                New to HealthyLife?{' '}
                <button type="button" onClick={() => onSelectTab('signup')} className="font-bold" style={{ color: 'var(--hl-green)' }}>
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------ Image ------------------------------ */}
        <aside className="hidden lg:block p-3" aria-hidden="true">
          <div className="relative h-full rounded-[1.5rem] overflow-hidden" style={{ background: 'var(--hl-gradient-hero)' }}>
            <img src={HERO_IMAGE} alt="" className="si-zoom absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(44,36,32,.28) 0%, rgba(44,36,32,0) 32%, rgba(44,36,32,0) 55%, rgba(44,36,32,.62) 100%)' }}
            />
            <div className="absolute left-6 top-6 flex items-center gap-2 text-white">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)' }}>
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="si-display text-sm font-bold">HealthyLife</span>
            </div>
            <p className="si-display absolute left-8 right-8 bottom-8 text-white text-[1.7rem] font-semibold leading-snug">
              Pick up right where you left off.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
