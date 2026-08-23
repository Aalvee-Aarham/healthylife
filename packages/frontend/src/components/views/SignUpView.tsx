import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, NavigationTab } from '../../types';
import { api, setAuthToken } from '../../services/api';
import { signInWithGoogle, registerWithEmail } from '../../services/firebase';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Flame,
  Droplets,
  Heart,
  Dumbbell,
  Trophy,
  Moon,
  Sofa,
  Footprints,
  Zap,
  Dumbbell as DumbbellIcon,
  Ruler,
  Scale,
  CalendarDays,
  Leaf,
  Sparkle,
} from 'lucide-react';

interface SignUpViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab?: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

type GenderOption = 'female' | 'male' | 'other';
type GoalOption = 'fat_loss' | 'muscle_gain' | 'vitality' | 'cycle_sync' | 'longevity';
type ActivityOption = 'sedentary' | 'light' | 'moderate' | 'very_active';

/* ------------------------------------------------------------------ *
 * Design system tokens — a "field journal" wellness aesthetic.
 * Deep botanical ink + warm parchment, gold & berry accents that
 * shift per phase so the journey visibly changes character.
 * ------------------------------------------------------------------ */
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');

  .su-root {
    --paper: #F6F3EC;
    --paper-2: #FFFFFF;
    --ink: #17261F;
    --ink-soft: #4B5A50;
    --line: #E4DECD;
    --account: #2F5D50;
    --account-soft: #E4EEE9;
    --body: #A3572F;
    --body-soft: #F3E4D7;
    --goals: #8B4A63;
    --goals-soft: #F1DEE4;
    --review: #2F5D50;
    --review-soft: #E4EEE9;
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: var(--paper);
  }
  .su-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
  .su-safe-b { padding-bottom: env(safe-area-inset-bottom, 0px); }
  .su-safe-t { padding-top: env(safe-area-inset-top, 0px); }

  @keyframes suIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes suBlob {
    0%, 100% { border-radius: 42% 58% 65% 35% / 45% 40% 60% 55%; }
    50% { border-radius: 60% 40% 42% 58% / 55% 65% 35% 45%; }
  }
  .su-anim { animation: suIn 0.36s cubic-bezier(.2,.8,.2,1) both; }
  .su-blob { animation: suBlob 9s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .su-anim, .su-blob { animation: none !important; }
  }
`;

/* ------------------------------------------------------------------ */

type Phase = 'account' | 'body' | 'goals' | 'review';
const PHASE_META: Record<Phase, { label: string; var: string; softVar: string }> = {
  account: { label: 'Account', var: 'var(--account)', softVar: 'var(--account-soft)' },
  body: { label: 'Biometrics', var: 'var(--body)', softVar: 'var(--body-soft)' },
  goals: { label: 'Goals', var: 'var(--goals)', softVar: 'var(--goals-soft)' },
  review: { label: 'Your Plan', var: 'var(--review)', softVar: 'var(--review-soft)' },
};

/* Curated, freely-licensed Unsplash photography — one relevant image per
   emotional beat of the journey (kept out of the dense data-entry screens
   so those stay quick and uncluttered). */
const PHOTO = {
  food: 'https://images.unsplash.com/photo-1543362905-bddfadc3d44f?w=900&q=80&fit=crop&auto=format',
  run: 'https://images.unsplash.com/photo-1514489024785-d5ba8dfb2198?w=900&q=80&fit=crop&auto=format',
  strength: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=900&q=80&fit=crop&auto=format',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=80&fit=crop&auto=format',
  moon: 'https://images.unsplash.com/photo-1637345540120-38bb0bbb7871?w=900&q=80&fit=crop&auto=format',
} as const;

/* Reusable screen shell: illustration header + content + fixed bottom CTA */
const Screen: React.FC<{
  phase: Phase;
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  image?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  error?: string | null;
}> = ({ phase, eyebrow, title, subtitle, icon, image, children, footer, error }) => {
  const meta = PHASE_META[phase];
  return (
    <div className="su-anim flex flex-col md:flex-row md:min-h-[calc(100vh-64px)]">
      {/* Illustration panel — top strip on mobile, sticky left rail on desktop */}
      <div
        className="relative overflow-hidden px-6 pt-8 pb-10 sm:pt-10 sm:pb-12 md:w-[42%] md:shrink-0 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:flex md:flex-col md:justify-center md:px-14 md:py-16"
        style={{ background: meta.softVar }}
      >
        {image && (
          <>
            <img
              src={image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${meta.var}CC 0%, ${meta.var}66 38%, ${meta.var}E6 100%)`,
              }}
            />
          </>
        )}
        {!image && (
          <>
            <div
              className="su-blob absolute -top-10 -right-14 w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 md:-right-20 md:-top-16 opacity-90"
              style={{ background: meta.var }}
            />
            <div
              className="su-blob absolute -bottom-16 -left-10 w-32 h-32 md:w-48 md:h-48 md:-bottom-20 md:-left-16 opacity-20"
              style={{ background: meta.var, animationDelay: '2s' }}
            />
          </>
        )}
        <div className="relative z-10 md:max-w-sm">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full mb-4 md:mb-6"
            style={{ background: image ? 'rgba(255,255,255,0.92)' : 'var(--paper-2)', color: meta.var }}
          >
            {eyebrow}
          </span>
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mb-5 md:mb-7 shadow-lg"
            style={{
              background: image ? 'rgba(255,255,255,0.95)' : meta.var,
              color: image ? meta.var : 'var(--paper-2)',
              backdropFilter: image ? 'blur(6px)' : undefined,
            }}
          >
            {icon}
          </div>
          <h1
            className="su-display text-[26px] sm:text-3xl md:text-[2.5rem] font-semibold leading-[1.15]"
            style={{ color: image ? '#fff' : 'var(--ink)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-sm md:text-base mt-2 md:mt-4 leading-relaxed max-w-sm"
              style={{ color: image ? 'rgba(255,255,255,0.88)' : 'var(--ink-soft)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 flex flex-col md:justify-center md:px-14 md:py-16">
        <div className="w-full md:max-w-lg px-6 py-6 md:px-0 md:py-0 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 su-anim">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
          )}
          {children}
        </div>

        <div className="su-safe-b px-6 pb-6 pt-2 md:px-0 md:pb-0 md:pt-8 md:max-w-lg md:w-full">{footer}</div>
      </div>
    </div>
  );
};

const PrimaryButton: React.FC<{ onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; children: React.ReactNode; phase: Phase }> = ({
  onClick,
  disabled,
  type = 'button',
  children,
  phase,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{ background: PHASE_META[phase].var }}
    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
  >
    {children}
  </button>
);

const OptionCard: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  phase: Phase;
  compact?: boolean;
}> = ({ active, onClick, icon, title, sub, phase, compact }) => {
  const meta = PHASE_META[phase];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 transition-all flex items-center gap-3 ${compact ? 'p-3' : 'p-4'
        }`}
      style={{
        borderColor: active ? meta.var : 'var(--line)',
        background: active ? meta.softVar : 'var(--paper-2)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: active ? meta.var : 'var(--paper)', color: active ? '#fff' : 'var(--ink-soft)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[color:var(--ink)]">{title}</p>
        {sub && <p className="text-xs text-[color:var(--ink-soft)] mt-0.5">{sub}</p>}
      </div>
      {active && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: meta.var }}
        >
          <Check className="w-3 h-3 text-white stroke-[3]" />
        </div>
      )}
    </button>
  );
};

const FieldInput: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  rightSlot?: React.ReactNode;
  inputMode?: any;
}> = ({ icon, label, value, onChange, type = 'text', placeholder, autoFocus, rightSlot, inputMode }) => (
  <div>
    <label className="block text-xs font-bold text-[color:var(--ink-soft)] mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-soft)]">{icon}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-11 py-4 rounded-2xl border-2 text-base font-medium bg-[color:var(--paper-2)] focus:outline-none transition-colors"
        style={{ borderColor: 'var(--line)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--account)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
      />
      {rightSlot && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */

export const SignUpView: React.FC<SignUpViewProps> = ({ onLoginSuccess, onSelectTab }) => {
  // Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Body
  const [gender, setGender] = useState<GenderOption>('female');
  const [age, setAge] = useState<string>('28');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [currentWeight, setCurrentWeight] = useState<string>('68');
  const [targetWeight, setTargetWeight] = useState<string>('64');

  // Goals
  const [goal, setGoal] = useState<GoalOption>('vitality');
  const [activityLevel, setActivityLevel] = useState<ActivityOption>('moderate');
  const [avgCycleDays, setAvgCycleDays] = useState<string>('28');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flatIndex, setFlatIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);

  const handleGenderChange = (g: GenderOption) => {
    setGender(g);
    if (g === 'male' && goal === 'cycle_sync') setGoal('muscle_gain');
  };

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

  /* Dynamic list of micro-step ids — skip password if signing up with Google */
  const stepIds = useMemo(() => {
    const ids = ['welcome', 'name', 'email'];
    if (!isGoogleAccount) {
      ids.push('password');
    }
    ids.push('gender', 'age', 'height', 'weight', 'goal');
    if (gender === 'female') ids.push('cycle');
    ids.push('activity', 'review');
    return ids;
  }, [gender, isGoogleAccount]);

  const stepId = stepIds[flatIndex];
  const phaseOf = (id: string): Phase =>
    ['welcome', 'name', 'email', 'password'].includes(id)
      ? 'account'
      : ['gender', 'age', 'height', 'weight'].includes(id)
        ? 'body'
        : ['goal', 'cycle', 'activity'].includes(id)
          ? 'goals'
          : 'review';

  const phaseOrder: Phase[] = ['account', 'body', 'goals', 'review'];
  const currentPhase = phaseOf(stepId);
  const phaseSteps = stepIds.filter((id) => phaseOf(id) === currentPhase);
  const phaseStepPos = phaseSteps.indexOf(stepId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [flatIndex]);

  const goNext = () => {
    setDir(1);
    setFlatIndex((i) => Math.min(i + 1, stepIds.length - 1));
  };
  const goBack = () => {
    if (flatIndex === 0) {
      onSelectTab('home');
      return;
    }
    setDir(-1);
    setFlatIndex((i) => Math.max(i - 1, 0));
  };

  const validateAndAdvance = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    switch (stepId) {
      case 'name':
        if (!name.trim()) return setError('Please enter your full name.');
        break;
      case 'email':
        if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
        break;
      case 'password':
        if (password.length < 6) return setError('Password must be at least 6 characters.');
        if (password !== confirmPassword) return setError('Passwords do not match.');
        break;
      case 'age':
        if (!age || parseInt(age, 10) <= 10) return setError('Please enter your age.');
        break;
      case 'height':
        if (!heightCm || parseInt(heightCm, 10) <= 80) return setError('Please enter your height in cm.');
        break;
      case 'weight':
        if (!currentWeight || parseFloat(currentWeight) <= 20) return setError('Please enter a realistic current weight in kg.');
        break;
      default:
        break;
    }
    goNext();
  };

  const handleGooglePreFill = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser.displayName) setName(fbUser.displayName);
      if (fbUser.email) setEmail(fbUser.email);
      if (fbUser.photoURL) setGoogleAvatar(fbUser.photoURL);
      setIsGoogleAccount(true);

      // Advance directly into biometrics / onboarding steps
      // Move to 'gender' step (or name step if name was empty)
      if (fbUser.displayName) {
        setFlatIndex(3); // skips welcome, name, email directly to gender
      } else {
        setFlatIndex(1); // proceed to name step
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-up failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
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
      };

      if (isGoogleAccount) {
        // Sync full onboarding data to Laravel MySQL database via firebase endpoint
        const res = await api.firebaseAuth(payload);
        setAuthToken(res.token);
        onLoginSuccess(res.user, 'dashboard');
      } else {
        // Register with Firebase Email/Password
        try {
          await registerWithEmail(email.trim().toLowerCase(), password.trim(), name.trim());
        } catch (fbErr: any) {
          console.warn('Firebase registration notice:', fbErr?.message);
        }

        payload.password = password.trim();
        const res = await api.register(payload);
        setAuthToken(res.token);
        onLoginSuccess(res.user, 'dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const GOAL_PHOTO: Record<GoalOption, string> = {
    fat_loss: PHOTO.run,
    muscle_gain: PHOTO.strength,
    vitality: PHOTO.yoga,
    cycle_sync: PHOTO.moon,
    longevity: PHOTO.yoga,
  };

  const GOALS: { id: GoalOption; icon: React.ReactNode; title: string; sub: string; hideFor?: GenderOption }[] = [
    { id: 'fat_loss', icon: <Flame className="w-5 h-5" />, title: 'Fat Loss & Definition', sub: 'Deficit, high protein retention' },
    { id: 'muscle_gain', icon: <DumbbellIcon className="w-5 h-5" />, title: 'Muscle & Strength', sub: 'Progressive overload, surplus' },
    { id: 'vitality', icon: <Heart className="w-5 h-5" />, title: 'Holistic Vitality', sub: 'Balanced macros, recovery' },
    { id: 'cycle_sync', icon: <Moon className="w-5 h-5" />, title: 'Cycle-Synced Rhythm', sub: 'Hormonal-wave pacing' },
    { id: 'longevity', icon: <Trophy className="w-5 h-5" />, title: 'Longevity & Conditioning', sub: 'Cardio health, clean fuel' },
  ];
  const visibleGoals = GOALS.filter((g) => !(gender === 'male' && g.id === 'cycle_sync') && !(gender !== 'male' && g.id === 'longevity'));

  const ACTIVITIES: { id: ActivityOption; icon: React.ReactNode; label: string; sub: string }[] = [
    { id: 'sedentary', icon: <Sofa className="w-5 h-5" />, label: 'Sedentary', sub: 'Desk job, low daily steps' },
    { id: 'light', icon: <Footprints className="w-5 h-5" />, label: 'Light', sub: '1–2 workouts / week' },
    { id: 'moderate', icon: <Zap className="w-5 h-5" />, label: 'Moderate', sub: '3–5 workouts / week' },
    { id: 'very_active', icon: <DumbbellIcon className="w-5 h-5" />, label: 'Very Active', sub: '6+, heavy training' },
  ];

  const renderStep = () => {
    switch (stepId) {
      case 'welcome':
        return (
          <Screen
            phase="account"
            eyebrow="Welcome"
            title="Let's build a plan that fits your body."
            subtitle="Nine quick questions. About two minutes. No spreadsheets — just a clear daily target."
            icon={<Leaf className="w-7 h-7" />}
            image={PHOTO.food}
            error={error}
            footer={
              <div className="space-y-3">
                <PrimaryButton phase="account" onClick={goNext}>
                  Get started with email <ArrowRight className="w-4 h-4" />
                </PrimaryButton>

                <button
                  type="button"
                  onClick={handleGooglePreFill}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
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
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                { icon: <Flame className="w-4 h-4" />, label: 'Calorie target' },
                { icon: <Dumbbell className="w-4 h-4" />, label: 'Macro split' },
                { icon: <Droplets className="w-4 h-4" />, label: 'Hydration goal' },
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[color:var(--paper-2)] border border-[color:var(--line)] text-center">
                  <div className="mx-auto mb-1.5 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--account-soft)', color: 'var(--account)' }}>
                    {f.icon}
                  </div>
                  <p className="text-[10px] font-bold text-[color:var(--ink-soft)] leading-tight">{f.label}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-[color:var(--ink-soft)] pt-3">
              Already a member?{' '}
              <button onClick={() => onSelectTab('signin')} className="font-bold" style={{ color: 'var(--account)' }}>
                Sign in
              </button>
            </p>
          </Screen>
        );

      case 'name':
        return (
          <Screen phase="account" eyebrow="Account · 1 of 3" title="What should we call you?" icon={<User className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="account" type="submit" onClick={() => validateAndAdvance()}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance}>
              <FieldInput icon={<User className="w-4 h-4" />} label="Full name" value={name} onChange={setName} placeholder="Alex Morgan" autoFocus />
              <button type="submit" className="hidden" />
            </form>
          </Screen>
        );

      case 'email':
        return (
          <Screen phase="account" eyebrow="Account · 2 of 3" title={`Nice to meet you, ${name.split(' ')[0] || 'there'}.`} subtitle="What's your email?" icon={<Mail className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="account" onClick={() => validateAndAdvance()}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance}>
              <FieldInput icon={<Mail className="w-4 h-4" />} label="Email address" value={email} onChange={setEmail} type="email" placeholder="alex@example.com" autoFocus />
            </form>
          </Screen>
        );

      case 'password':
        return (
          <Screen phase="account" eyebrow="Account · 3 of 3" title="Secure your account." icon={<Lock className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="account" onClick={() => validateAndAdvance()}>Create account <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance} className="space-y-4">
              <FieldInput
                icon={<Lock className="w-4 h-4" />}
                label="Password"
                value={password}
                onChange={setPassword}
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                autoFocus
                rightSlot={
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="text-[color:var(--ink-soft)]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <FieldInput icon={<Lock className="w-4 h-4" />} label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type={showPw ? 'text' : 'password'} placeholder="Re-enter password" />
            </form>
          </Screen>
        );

      case 'gender':
        return (
          <Screen phase="body" eyebrow="Biometrics · 1 of 4" title="How do you identify biologically?" subtitle="This calibrates your metabolic formula and unlocks the right tracking features." icon={<User className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="body" onClick={goNext}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <div className="space-y-2.5">
              <OptionCard active={gender === 'female'} onClick={() => handleGenderChange('female')} icon={<Moon className="w-5 h-5" />} title="Female" sub="Includes CycleSync™ phase tracking" phase="body" />
              <OptionCard active={gender === 'male'} onClick={() => handleGenderChange('male')} icon={<Zap className="w-5 h-5" />} title="Male" sub="Strength & recovery focus" phase="body" />
              <OptionCard active={gender === 'other'} onClick={() => handleGenderChange('other')} icon={<Leaf className="w-5 h-5" />} title="Other / Neutral" sub="Standard wellness tracking" phase="body" />
            </div>
          </Screen>
        );

      case 'age':
        return (
          <Screen phase="body" eyebrow="Biometrics · 2 of 4" title="How old are you?" icon={<CalendarDays className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="body" onClick={() => validateAndAdvance()}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance}>
              <FieldInput icon={<CalendarDays className="w-4 h-4" />} label="Age (years)" value={age} onChange={setAge} type="number" inputMode="numeric" placeholder="28" autoFocus />
            </form>
          </Screen>
        );

      case 'height':
        return (
          <Screen phase="body" eyebrow="Biometrics · 3 of 4" title="How tall are you?" icon={<Ruler className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="body" onClick={() => validateAndAdvance()}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance}>
              <FieldInput icon={<Ruler className="w-4 h-4" />} label="Height (cm)" value={heightCm} onChange={setHeightCm} type="number" inputMode="numeric" placeholder="170" autoFocus />
            </form>
          </Screen>
        );

      case 'weight':
        return (
          <Screen phase="body" eyebrow="Biometrics · 4 of 4" title="Current & target weight." subtitle="Target is optional — leave it as your current weight if you're maintaining." icon={<Scale className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="body" onClick={() => validateAndAdvance()}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <form onSubmit={validateAndAdvance} className="grid grid-cols-2 gap-3">
              <FieldInput icon={<Scale className="w-4 h-4" />} label="Current (kg)" value={currentWeight} onChange={setCurrentWeight} type="number" inputMode="decimal" placeholder="68" autoFocus />
              <FieldInput icon={<Scale className="w-4 h-4" />} label="Target (kg)" value={targetWeight} onChange={setTargetWeight} type="number" inputMode="decimal" placeholder="64" />
            </form>
          </Screen>
        );

      case 'goal':
        return (
          <Screen phase="goals" eyebrow="Goals · 1 of 2" title="What's your primary focus?" icon={<Trophy className="w-7 h-7" />} image={GOAL_PHOTO[goal] || PHOTO.strength} error={error}
            footer={<PrimaryButton phase="goals" onClick={goNext}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <div className="space-y-2.5">
              {visibleGoals.map((g) => (
                <OptionCard key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)} icon={g.icon} title={g.title} sub={g.sub} phase="goals" />
              ))}
            </div>
          </Screen>
        );

      case 'cycle':
        return (
          <Screen phase="goals" eyebrow="Goals · extra" title="Average cycle length?" subtitle="Powers your CycleSync™ phase predictions. You can fine-tune this later." icon={<Moon className="w-7 h-7" />} image={PHOTO.moon} error={error}
            footer={<PrimaryButton phase="goals" onClick={goNext}>Continue <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <div className="p-5 rounded-2xl bg-[color:var(--paper-2)] border-2 border-[color:var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[color:var(--ink-soft)]">Cycle length</span>
                <span className="su-display text-2xl font-semibold" style={{ color: 'var(--goals)' }}>{avgCycleDays}<span className="text-xs font-sans font-bold text-[color:var(--ink-soft)]"> days</span></span>
              </div>
              <input type="range" min="21" max="35" value={avgCycleDays} onChange={(e) => setAvgCycleDays(e.target.value)} className="w-full" style={{ accentColor: 'var(--goals)' }} />
              <div className="flex justify-between text-[10px] text-[color:var(--ink-soft)] font-semibold">
                <span>21 · Short</span><span>28 · Standard</span><span>35 · Longer</span>
              </div>
            </div>
          </Screen>
        );

      case 'activity':
        return (
          <Screen phase="goals" eyebrow="Goals · 2 of 2" title="How active is your week?" icon={<Zap className="w-7 h-7" />} error={error}
            footer={<PrimaryButton phase="goals" onClick={goNext}>See my plan <ArrowRight className="w-4 h-4" /></PrimaryButton>}>
            <div className="space-y-2.5">
              {ACTIVITIES.map((a) => (
                <OptionCard key={a.id} active={activityLevel === a.id} onClick={() => setActivityLevel(a.id)} icon={a.icon} title={a.label} sub={a.sub} phase="goals" compact />
              ))}
            </div>
          </Screen>
        );

      case 'review':
        return (
          <Screen phase="review" eyebrow="Ready" title="Your plan is calibrated." subtitle="Built from your exact biometrics — you can always adjust it later." icon={<Sparkle className="w-7 h-7" />} image={PHOTO.food} error={error}
            footer={
              <PrimaryButton phase="review" onClick={handleFinalSubmit} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Launching your dashboard…
                  </span>
                ) : (
                  <>Enter your dashboard <ArrowRight className="w-4 h-4" /></>
                )}
              </PrimaryButton>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: calculatedMacros.calories, unit: 'kcal / day' },
                { label: 'Protein', value: `${calculatedMacros.protein}g`, unit: 'lean repair' },
                { label: 'Carbs', value: `${calculatedMacros.carbs}g`, unit: 'energy fuel' },
                { label: 'Water', value: `${(calculatedMacros.water / 1000).toFixed(1)}L`, unit: `${calculatedMacros.water} ml` },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-2xl bg-[color:var(--paper-2)] border border-[color:var(--line)] text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--review)' }}>{m.label}</span>
                  <p className="su-display text-2xl font-semibold mt-0.5">{m.value}</p>
                  <span className="text-[10px] text-[color:var(--ink-soft)] font-semibold">{m.unit}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[color:var(--paper-2)] border border-[color:var(--line)] space-y-2.5 mt-1">
              <p className="text-[11px] font-extrabold text-[color:var(--ink-soft)] uppercase tracking-wider">Profile</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-[10px] text-[color:var(--ink-soft)] block">Name</span><span className="font-bold">{name}</span></div>
                <div><span className="text-[10px] text-[color:var(--ink-soft)] block">Focus</span><span className="font-bold capitalize">{goal.replace('_', ' ')}</span></div>
                <div><span className="text-[10px] text-[color:var(--ink-soft)] block">Weight</span><span className="font-bold">{currentWeight} → {targetWeight || currentWeight} kg</span></div>
                <div><span className="text-[10px] text-[color:var(--ink-soft)] block">Cycle tracking</span><span className="font-bold" style={{ color: gender === 'male' ? 'var(--ink-soft)' : 'var(--review)' }}>{gender === 'male' ? 'Not applicable' : 'Enabled'}</span></div>
              </div>
            </div>
          </Screen>
        );

      default:
        return null;
    }
  };

  return (
    <div className="su-root min-h-screen">
      <style>{THEME}</style>

      {/* Top bar: back + segmented phase progress + (desktop) brand + phase labels */}
      <div className="su-safe-t sticky top-0 z-20 bg-[color:var(--paper)]/95 backdrop-blur border-b border-transparent md:border-[color:var(--line)]">
        <div className="max-w-5xl mx-auto px-5 md:px-8 pt-4 pb-3 md:h-16 md:flex md:items-center">
          <div className="flex items-center gap-3 md:gap-6 w-full">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[color:var(--paper-2)] border border-[color:var(--line)] shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="su-display hidden md:inline-block text-lg font-semibold shrink-0" style={{ color: 'var(--account)' }}>
              HealthyLife
            </span>

            <div className="flex-1 flex gap-1.5">
              {phaseOrder.map((p) => {
                const isPast = phaseOrder.indexOf(p) < phaseOrder.indexOf(currentPhase);
                const isCurrent = p === currentPhase;
                const fillPct = isCurrent ? ((phaseStepPos + 1) / phaseSteps.length) * 100 : isPast ? 100 : 0;
                return (
                  <div key={p} className="flex-1 flex flex-col gap-1">
                    <div className="h-1.5 rounded-full bg-[color:var(--line)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${fillPct}%`, background: PHASE_META[p].var }}
                      />
                    </div>
                    <span
                      className="hidden md:block text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isCurrent ? PHASE_META[p].var : 'var(--ink-soft)', opacity: isCurrent || isPast ? 1 : 0.5 }}
                    >
                      {PHASE_META[p].label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: phone-style single column. Desktop: full-width split layout. */}
      <div className="md:max-w-5xl md:mx-auto">
        <div
          ref={scrollRef}
          className="mx-auto max-w-md md:max-w-none bg-[color:var(--paper)] shadow-2xl md:shadow-none min-h-[calc(100vh-64px)]"
          key={stepId}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
};