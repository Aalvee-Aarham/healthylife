import React, { useState, useMemo, useEffect, useId } from 'react';
import { UserProfile, NavigationTab, CoachListing, CoachSpecialty } from '../../types';
import { api, setAuthToken } from '../../services/api';
import { signInWithGoogle, registerWithEmail } from '../../services/firebase';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ChevronDown,
  Sparkles,
  Flame,
  Dumbbell,
  Heart,
  Moon,
  Trophy,
  Plus,
  Minus,
} from 'lucide-react';

interface SignUpViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab?: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

type GenderOption = 'female' | 'male' | 'other';
type GoalOption = 'fat_loss' | 'muscle_gain' | 'vitality' | 'cycle_sync' | 'longevity';
type ActivityOption = 'sedentary' | 'light' | 'moderate' | 'very_active';
type AccountRole = 'member' | 'coach';
type StepId = 'account' | 'body' | 'goal' | 'finish' | 'specialty';

const THEME = `
  .su-root { font-family: 'Inter', 'DM Sans', sans-serif; color: var(--hl-text-primary); }
  .su-display { font-family: 'DM Sans', 'Inter', sans-serif; letter-spacing: -0.02em; }

  @keyframes suInFwd  { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
  @keyframes suInBack { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
  @keyframes suFade   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes suShake  { 0%, 100% { transform: none; } 20% { transform: translateX(-5px); } 60% { transform: translateX(4px); } }

  .su-in-fwd  { animation: suInFwd .5s cubic-bezier(.22,1,.36,1) both; }
  .su-in-back { animation: suInBack .5s cubic-bezier(.22,1,.36,1) both; }
  .su-fade    { animation: suFade .7s cubic-bezier(.22,1,.36,1) both; }
  .su-shake   { animation: suShake .38s ease both; }

  .su-input {
    background: var(--hl-surface);
    border: 1px solid var(--hl-border);
    color: var(--hl-text-primary);
    transition: border-color .25s ease, box-shadow .25s ease;
  }
  .su-input::placeholder { color: var(--hl-text-tertiary); }
  .su-input:hover { border-color: var(--hl-green-border); }
  .su-input:focus { outline: none; border-color: var(--hl-green); box-shadow: 0 0 0 4px var(--hl-green-light); }
  .su-input:disabled { opacity: .6; cursor: not-allowed; }
  .su-input[type=number]::-webkit-inner-spin-button,
  .su-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .su-input[type=number] { -moz-appearance: textfield; }

  .su-btn { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, background .3s ease, opacity .2s ease; }
  .su-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .su-btn:active:not(:disabled) { transform: scale(.985); }
  .su-arrow { transition: transform .35s cubic-bezier(.22,1,.36,1); }
  .su-btn:hover .su-arrow { transform: translateX(3px); }

  .su-tile { transition: border-color .25s ease, background .25s ease, transform .35s cubic-bezier(.22,1,.36,1); }
  .su-tile:hover { transform: translateY(-1px); }
  .su-check { transition: transform .4s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; }

  .su-img { transition: opacity 1s ease, transform 1.8s cubic-bezier(.22,1,.36,1); }

  @media (prefers-reduced-motion: reduce) {
    .su-in-fwd, .su-in-back, .su-fade, .su-shake { animation: none !important; }
    .su-img, .su-btn, .su-tile, .su-check { transition: none !important; }
  }
`;

const U = (id: string) => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&q=80&w=1000';

const IMG = {
  account: U('1544367567-0f2fcb009e0b'),
  body: U('1571019613454-1cb2f99b2d8b'),
  run: U('1514489024785-d5ba8dfb2198'),
  strength: U('1517836357463-d25dfeac3438'),
  calm: U('1506126613408-eca07ce68773'),
  rhythm: U('1594381898411-846e7d193883'),
  food: U('1512621776951-a57141f2eefd'),
  coach: U('1552674605-db6ffd4facb5'),
};

const ALL_IMAGES = Array.from(new Set(Object.values(IMG)));

const GOAL_IMAGE: Record<GoalOption, string> = {
  fat_loss: IMG.run,
  muscle_gain: IMG.strength,
  vitality: IMG.calm,
  cycle_sync: IMG.rhythm,
  longevity: IMG.run,
};

const STEP_COPY: Record<StepId, { title: string; subtitle: string; caption: string }> = {
  account: { title: 'Create your account', subtitle: 'Start free — it takes about a minute.', caption: 'Small steps, kept daily.' },
  body: { title: 'A little about you', subtitle: 'We use this to set your daily targets.', caption: 'Your numbers, your baseline.' },
  goal: { title: 'What are you working toward?', subtitle: 'You can change this anytime.', caption: 'Train for what matters to you.' },
  finish: { title: 'Your daily targets', subtitle: 'Calculated from your details.', caption: 'Fuel that fits your day.' },
  specialty: { title: 'Your coaching profile', subtitle: 'Tell members what you specialise in.', caption: 'Guide people toward better days.' },
};

/* ------------------------------------------------------------------ */
/* Small form primitives                                               */
/* ------------------------------------------------------------------ */

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  suffix?: string;
  right?: React.ReactNode;
  autoFocus?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  label, value, onChange, type = 'text', placeholder, autoComplete, inputMode, suffix, right, autoFocus,
}) => {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={'su-input w-full rounded-xl px-4 py-3 text-sm font-medium' + (suffix || right ? ' pr-12' : '')}
        />
        {suffix && (
          <span
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
            style={{ color: 'var(--hl-text-tertiary)' }}
          >
            {suffix}
          </span>
        )}
        {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
    </div>
  );
};

function Segmented<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid p-1 rounded-xl"
      style={{
        gridTemplateColumns: 'repeat(' + n + ', minmax(0, 1fr))',
        background: 'var(--hl-surface-alt)',
        border: '1px solid var(--hl-border)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 rounded-lg"
        style={{
          left: 'calc(' + idx + ' * (100% - 0.5rem) / ' + n + ' + 0.25rem)',
          width: 'calc((100% - 0.5rem) / ' + n + ')',
          background: 'var(--hl-surface)',
          boxShadow: 'var(--hl-shadow-sm)',
          transition: 'left .42s cubic-bezier(.22,1,.36,1)',
        }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="relative z-[1] py-2.5 px-1 text-xs font-bold rounded-lg truncate"
            style={{ color: active ? 'var(--hl-text-primary)' : 'var(--hl-text-tertiary)', transition: 'color .3s ease' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

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

/* ------------------------------------------------------------------ */

export const SignUpView: React.FC<SignUpViewProps> = ({ onLoginSuccess, onSelectTab }) => {
  // Role
  const [role, setRole] = useState<AccountRole>('member');

  // Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Coach-only
  const [coachSpecialty, setCoachSpecialty] = useState<CoachSpecialty>('trainer');
  const [coachTitle, setCoachTitle] = useState('');

  // Member-only: optional health note
  const [medicalConditions, setMedicalConditions] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [showHealthNote, setShowHealthNote] = useState(false);

  // Member-only: coach selection
  const [availableCoaches, setAvailableCoaches] = useState<CoachListing[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedNutritionistId, setSelectedNutritionistId] = useState<string | null>(null);

  // Body
  const [gender, setGender] = useState<GenderOption>('female');
  const [age, setAge] = useState<string>('28');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [currentWeight, setCurrentWeight] = useState<string>('68');
  const [targetWeight, setTargetWeight] = useState<string>('64');

  // Goals
  const [goal, setGoal] = useState<GoalOption>('vitality');
  const [activityLevel, setActivityLevel] = useState<ActivityOption>('moderate');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);

  const steps: StepId[] = role === 'coach' ? ['account', 'specialty'] : ['account', 'body', 'goal', 'finish'];
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const stepId = steps[safeIndex];
  const isLastStep = safeIndex === steps.length - 1;

  const calculatedMacros = useMemo(() => {
    const w = parseFloat(currentWeight) || 70;
    const h = parseFloat(heightCm) || 170;
    const a = parseInt(age, 10) || 28;
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += gender === 'male' ? 5 : -161;
    const activityMultipliers: Record<ActivityOption, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };
    let tdee = Math.round(bmr * activityMultipliers[activityLevel]);
    if (goal === 'fat_loss') tdee -= 400;
    else if (goal === 'muscle_gain') tdee += 350;
    const calories = Math.max(1300, Math.round(tdee));
    const proteinFactor = goal === 'muscle_gain' ? 2.0 : goal === 'fat_loss' ? 1.9 : 1.6;
    const protein = Math.round(w * proteinFactor);
    const fats = Math.round((calories * 0.25) / 9);
    const remainingCalories = calories - (protein * 4 + fats * 9);
    const carbs = Math.max(80, Math.round(remainingCalories / 4));
    const water = Math.round(w * 38 + (activityLevel === 'very_active' ? 750 : activityLevel === 'moderate' ? 500 : 250));
    return {
      calories,
      protein,
      carbs,
      fats,
      water: Math.min(4500, Math.max(2000, Math.round(water / 250) * 250)),
    };
  }, [currentWeight, heightCm, age, gender, goal, activityLevel]);

  // Fetch the coach directory once the member reaches the final step.
  useEffect(() => {
    if (role !== 'member' || stepId !== 'finish') return;
    if (availableCoaches.length > 0 || isLoadingCoaches) return;
    setIsLoadingCoaches(true);
    api.getCoaches()
      .then(setAvailableCoaches)
      .catch((e) => console.warn('Failed to load coach directory:', e))
      .finally(() => setIsLoadingCoaches(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, role]);

  const showError = (msg: string) => {
    setError(msg);
    setErrorKey((k) => k + 1);
  };

  const go = (next: number) => {
    setDir(next > safeIndex ? 1 : -1);
    setError(null);
    setStepIndex(next);
  };

  const goBack = () => {
    if (safeIndex === 0) {
      onSelectTab('home');
      return;
    }
    go(safeIndex - 1);
  };

  const handleGenderChange = (g: GenderOption) => {
    setGender(g);
    if (g === 'male' && goal === 'cycle_sync') setGoal('muscle_gain');
    if (g !== 'male' && goal === 'longevity') setGoal('vitality');
  };

  const validate = (id: StepId): string | null => {
    if (id === 'account') {
      if (!name.trim()) return 'Please enter your full name.';
      if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
      if (!isGoogleAccount && password.length < 6) return 'Password must be at least 6 characters.';
    }
    if (id === 'body') {
      if (!age || parseInt(age, 10) <= 10) return 'Please enter your age.';
      if (!heightCm || parseInt(heightCm, 10) <= 80) return 'Please enter your height in cm.';
      if (!currentWeight || parseFloat(currentWeight) <= 20) return 'Please enter a realistic current weight in kg.';
    }
    return null;
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser.displayName) setName(fbUser.displayName);
      if (fbUser.email) setEmail(fbUser.email);
      if (fbUser.photoURL) setGoogleAvatar(fbUser.photoURL);
      setIsGoogleAccount(true);
      if (fbUser.displayName && fbUser.email) go(1);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showError(err?.message || 'Google sign-up failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmail = () => {
    setIsGoogleAccount(false);
    setGoogleAvatar(null);
    setEmail('');
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (role === 'coach') {
        const payload: Record<string, unknown> = {
          name: name.trim() || (email.split('@')[0]),
          email: email.trim().toLowerCase(),
          avatar: googleAvatar || undefined,
          role: 'coach',
          coach_specialty: coachSpecialty,
          title: coachTitle.trim() || undefined,
        };

        if (isGoogleAccount) {
          const res = await api.firebaseAuth(payload);
          setAuthToken(res.token);
          onLoginSuccess(res.user, 'chat');
        } else {
          try {
            await registerWithEmail(email.trim().toLowerCase(), password.trim(), name.trim());
          } catch (fbErr: any) {
            console.warn('Firebase registration notice:', fbErr?.message);
          }
          payload.password = password.trim();
          const res = await api.register(payload);
          setAuthToken(res.token);
          onLoginSuccess(res.user, 'chat');
        }
        return;
      }

      const payload: Record<string, unknown> = {
        name: name.trim() || (email.split('@')[0]),
        email: email.trim().toLowerCase(),
        gender,
        avatar: googleAvatar || undefined,
        weight_current_kg: parseFloat(currentWeight) || undefined,
        weight_target_kg: parseFloat(targetWeight) || undefined,
        height_cm: parseInt(heightCm, 10) || undefined,
        age: parseInt(age, 10) || undefined,
        goal,
        activity_level: activityLevel,
        calories_goal: calculatedMacros.calories,
        protein_goal_g: calculatedMacros.protein,
        carbs_goal_g: calculatedMacros.carbs,
        fats_goal_g: calculatedMacros.fats,
        water_goal_ml: calculatedMacros.water,
        medical_conditions: medicalConditions.trim() || undefined,
        body_type: bodyType.trim() || undefined,
      };

      let user: UserProfile;
      let token: string;

      if (isGoogleAccount) {
        // Sync full onboarding data to Laravel MySQL database via firebase endpoint
        const res = await api.firebaseAuth(payload);
        user = res.user;
        token = res.token;
      } else {
        // Register with Firebase Email/Password
        try {
          await registerWithEmail(email.trim().toLowerCase(), password.trim(), name.trim());
        } catch (fbErr: any) {
          console.warn('Firebase registration notice:', fbErr?.message);
        }

        payload.password = password.trim();
        const res = await api.register(payload);
        user = res.user;
        token = res.token;
      }

      setAuthToken(token);

      // Best-effort coach self-assignment — never block a successful registration/login.
      const picks: Array<[CoachSpecialty, string | null]> = [
        ['trainer', selectedTrainerId],
        ['nutritionist', selectedNutritionistId],
      ];
      for (const [specialty, coachId] of picks) {
        if (!coachId) continue;
        try {
          await api.assignCoach(coachId, specialty);
        } catch (e) {
          console.warn(`Failed to assign ${specialty} coach:`, e);
        }
      }

      onLoginSuccess(user, 'dashboard');
    } catch (err: any) {
      showError(err?.message || 'Failed to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const msg = validate(stepId);
    if (msg) {
      showError(msg);
      return;
    }
    setError(null);
    if (isLastStep) handleFinalSubmit();
    else go(safeIndex + 1);
  };

  const GOALS: { id: GoalOption; icon: React.ElementType; title: string }[] = [
    { id: 'fat_loss', icon: Flame, title: 'Lose fat' },
    { id: 'muscle_gain', icon: Dumbbell, title: 'Build muscle' },
    { id: 'vitality', icon: Heart, title: 'Feel better' },
    { id: 'cycle_sync', icon: Moon, title: 'Sync my cycle' },
    { id: 'longevity', icon: Trophy, title: 'Longevity' },
  ];
  const visibleGoals = GOALS.filter(
    (g) => !(gender === 'male' && g.id === 'cycle_sync') && !(gender !== 'male' && g.id === 'longevity')
  );

  const ACTIVITY_HINT: Record<ActivityOption, string> = {
    sedentary: 'Desk job, few daily steps.',
    light: '1–2 workouts a week.',
    moderate: '3–5 workouts a week.',
    very_active: '6+ sessions or heavy training.',
  };

  const activeImage =
    stepId === 'account' ? IMG.account
      : stepId === 'body' ? IMG.body
        : stepId === 'goal' ? GOAL_IMAGE[goal]
          : stepId === 'finish' ? IMG.food
            : IMG.coach;

  const copy = STEP_COPY[stepId];

  const submitLabel = isLastStep
    ? (role === 'coach' ? 'Create coach account' : 'Create account')
    : 'Continue';

  /* ---------------------------------------------------------------- */

  const renderStep = () => {
    switch (stepId) {
      case 'account':
        return (
          <div className="space-y-5">
            <Segmented
              label="Account type"
              value={role}
              onChange={(r) => { setRole(r); setError(null); }}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'coach', label: 'Coach' },
              ]}
            />

            {isGoogleAccount ? (
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--hl-green-light)', border: '1px solid var(--hl-green-border)' }}
              >
                {googleAvatar ? (
                  <img src={googleAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--hl-surface)' }}>
                    <GoogleMark />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">Connected with Google</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--hl-text-secondary)' }}>{email || 'No email on this account'}</p>
                </div>
                <button
                  type="button"
                  onClick={switchToEmail}
                  className="text-[11px] font-bold shrink-0"
                  style={{ color: 'var(--hl-green)' }}
                >
                  Use email
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={isLoading}
                  className="su-btn w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                >
                  <GoogleMark />
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1" style={{ background: 'var(--hl-border)' }} />
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--hl-text-tertiary)' }}>or</span>
                  <span className="h-px flex-1" style={{ background: 'var(--hl-border)' }} />
                </div>
              </>
            )}

            <div className="space-y-4">
              <TextField label="Full name" value={name} onChange={setName} placeholder="Alex Morgan" autoComplete="name" autoFocus />
              {(!isGoogleAccount || !email) && (
                <TextField label="Email" value={email} onChange={setEmail} type="email" placeholder="alex@example.com" autoComplete="email" />
              )}
              {!isGoogleAccount && (
                <div className="space-y-1.5">
                  <TextField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--hl-text-tertiary)' }}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <p
                    className="flex items-center gap-1.5 text-[11px] font-medium"
                    style={{ color: password.length >= 6 ? 'var(--hl-green)' : 'var(--hl-text-tertiary)', transition: 'color .3s ease' }}
                  >
                    <Check
                      className="su-check w-3 h-3"
                      style={{ transform: password.length >= 6 ? 'scale(1)' : 'scale(0)', opacity: password.length >= 6 ? 1 : 0 }}
                      aria-hidden="true"
                    />
                    Minimum 6 characters
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'body':
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>Biological sex</p>
              <Segmented
                label="Biological sex"
                value={gender}
                onChange={handleGenderChange}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Age" value={age} onChange={setAge} type="number" inputMode="numeric" suffix="yrs" autoFocus />
              <TextField label="Height" value={heightCm} onChange={setHeightCm} type="number" inputMode="numeric" suffix="cm" />
              <TextField label="Weight" value={currentWeight} onChange={setCurrentWeight} type="number" inputMode="decimal" suffix="kg" />
              <TextField label="Target" value={targetWeight} onChange={setTargetWeight} type="number" inputMode="decimal" suffix="kg" />
            </div>
          </div>
        );

      case 'goal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Primary goal">
              {visibleGoals.map((g) => {
                const Icon = g.icon;
                const active = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setGoal(g.id)}
                    className="su-tile relative text-left p-4 rounded-xl"
                    style={{
                      background: active ? 'var(--hl-green-light)' : 'var(--hl-surface)',
                      border: '1px solid ' + (active ? 'var(--hl-green)' : 'var(--hl-border)'),
                    }}
                  >
                    <Icon
                      className="w-5 h-5 mb-3"
                      style={{ color: active ? 'var(--hl-green)' : 'var(--hl-text-tertiary)', transition: 'color .25s ease' }}
                      aria-hidden="true"
                    />
                    <span className="block text-sm font-bold">{g.title}</span>
                    <span
                      className="su-check absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--hl-green)',
                        transform: active ? 'scale(1)' : 'scale(0)',
                        opacity: active ? 1 : 0,
                      }}
                      aria-hidden="true"
                    >
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>Activity level</p>
              <Segmented
                label="Activity level"
                value={activityLevel}
                onChange={setActivityLevel}
                options={[
                  { value: 'sedentary', label: 'Low' },
                  { value: 'light', label: 'Light' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'very_active', label: 'High' },
                ]}
              />
              <p key={activityLevel} className="su-fade text-[11px] pt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                {ACTIVITY_HINT[activityLevel]}
              </p>
            </div>
          </div>
        );

      case 'finish':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--hl-border)' }}>
              {[
                { label: 'kcal', value: calculatedMacros.calories.toLocaleString('en-US') },
                { label: 'Protein', value: calculatedMacros.protein + 'g' },
                { label: 'Carbs', value: calculatedMacros.carbs + 'g' },
                { label: 'Water', value: (calculatedMacros.water / 1000).toFixed(1) + 'L' },
              ].map((m, i) => (
                <div
                  key={m.label}
                  className="py-4 text-center"
                  style={{ borderLeft: i ? '1px solid var(--hl-border)' : undefined, background: 'var(--hl-surface)' }}
                >
                  <p className="su-display text-base sm:text-lg font-bold tabular-nums">{m.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
                Coaches <span style={{ color: 'var(--hl-text-tertiary)' }}>· optional</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['trainer', 'nutritionist'] as CoachSpecialty[]).map((specialty) => {
                  const list = availableCoaches.filter((c) => c.coachSpecialty === specialty);
                  const selectedId = specialty === 'trainer' ? selectedTrainerId : selectedNutritionistId;
                  const setSelected = specialty === 'trainer' ? setSelectedTrainerId : setSelectedNutritionistId;
                  const placeholder = isLoadingCoaches
                    ? 'Loading…'
                    : list.length
                      ? (specialty === 'trainer' ? 'Any trainer' : 'Any nutritionist')
                      : 'None available';
                  return (
                    <div key={specialty} className="relative">
                      <label className="sr-only" htmlFor={'su-coach-' + specialty}>
                        {specialty === 'trainer' ? 'Trainer' : 'Nutritionist'}
                      </label>
                      <select
                        id={'su-coach-' + specialty}
                        value={selectedId ?? ''}
                        onChange={(e) => setSelected(e.target.value || null)}
                        disabled={isLoadingCoaches || list.length === 0}
                        className="su-input w-full appearance-none rounded-xl pl-4 pr-9 py-3 text-sm font-medium truncate"
                      >
                        <option value="">{placeholder}</option>
                        {list.map((coach) => (
                          <option key={coach.id} value={coach.id}>{coach.name}</option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--hl-text-tertiary)' }}
                        aria-hidden="true"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowHealthNote((v) => !v)}
                aria-expanded={showHealthNote}
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: 'var(--hl-green)' }}
              >
                {showHealthNote ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                Add a health note
              </button>
              {showHealthNote && (
                <div className="su-fade space-y-3">
                  <textarea
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="Injuries or conditions, e.g. knee injury, hypertension"
                    aria-label="Medical conditions"
                    rows={2}
                    className="su-input w-full rounded-xl px-4 py-3 text-sm font-medium resize-none"
                  />
                  <TextField label="Body type" value={bodyType} onChange={setBodyType} placeholder="e.g. mesomorph" />
                </div>
              )}
            </div>
          </div>
        );

      case 'specialty':
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>Specialty</p>
              <Segmented
                label="Specialty"
                value={coachSpecialty}
                onChange={setCoachSpecialty}
                options={[
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'nutritionist', label: 'Nutritionist' },
                ]}
              />
            </div>
            <TextField
              label="Headline (optional)"
              value={coachTitle}
              onChange={setCoachTitle}
              placeholder="e.g. Certified Strength Coach"
              autoFocus
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="su-root flex items-center justify-center py-2 sm:py-6 min-h-[calc(100vh-9rem)]">
      <style>{THEME}</style>

      <div
        className="w-full max-w-5xl grid lg:grid-cols-[1fr_1.05fr] rounded-[2rem] overflow-hidden"
        style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-lg)' }}
      >
        {/* ------------------------------ Form ------------------------------ */}
        <section className="flex flex-col px-6 py-7 sm:px-10 sm:py-9 lg:min-h-[640px]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              aria-label={safeIndex === 0 ? 'Back to home' : 'Previous step'}
              className="su-btn w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--hl-text-tertiary)' }}>
              Step {safeIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="flex gap-1.5 mt-5" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s} className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--hl-border-light)' }}>
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: i <= safeIndex ? '100%' : '0%',
                    background: 'var(--hl-green)',
                    transition: 'width .6s cubic-bezier(.22,1,.36,1)',
                  }}
                />
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col pt-8">
            <div key={stepId + role} className={dir === 1 ? 'su-in-fwd' : 'su-in-back'}>
              <h1 className="su-display text-[1.75rem] sm:text-3xl font-bold leading-tight">{copy.title}</h1>
              <p className="text-sm mt-1.5" style={{ color: 'var(--hl-text-secondary)' }}>{copy.subtitle}</p>
              <div className="mt-7">{renderStep()}</div>
            </div>

            <div className="mt-auto pt-7 space-y-4">
              {error && (
                <div
                  key={errorKey}
                  role="alert"
                  className="su-shake flex items-start gap-2 p-3 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="su-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: 'var(--hl-green)', boxShadow: '0 8px 20px rgba(61,122,90,.25)' }}
              >
                {isLoading && isLastStep ? (
                  <>
                    <Spinner />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>{submitLabel}</span>
                    <ArrowRight className="su-arrow w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              {safeIndex === 0 && (
                <p className="text-center text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => onSelectTab('signin')} className="font-bold" style={{ color: 'var(--hl-green)' }}>
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>
        </section>

        {/* ------------------------------ Image ------------------------------ */}
        <aside className="hidden lg:block p-3" aria-hidden="true">
          <div className="relative h-full rounded-[1.5rem] overflow-hidden" style={{ background: 'var(--hl-gradient-hero)' }}>
            {ALL_IMAGES.map((src) => {
              const active = src === activeImage;
              return (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="su-img absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(1.06)' }}
                />
              );
            })}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(44,36,32,.28) 0%, rgba(44,36,32,0) 32%, rgba(44,36,32,0) 55%, rgba(44,36,32,.62) 100%)' }}
            />
            <div className="absolute left-6 top-6 flex items-center gap-2 text-white">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)' }}>
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="su-display text-sm font-bold">HealthyLife</span>
            </div>
            <p
              key={copy.caption}
              className="su-fade su-display absolute left-8 right-8 bottom-8 text-white text-[1.7rem] font-semibold leading-snug"
            >
              {copy.caption}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
