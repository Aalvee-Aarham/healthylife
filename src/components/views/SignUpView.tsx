import React, { useState, useMemo } from 'react';
import { UserProfile, NavigationTab } from '../../types';
import { api, setAuthToken } from '../../services/api';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Scale,
  Calendar,
  Activity,
  Flame,
  Droplets,
  Heart,
  Dumbbell,
  Compass,
  Check,
  ChevronRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface SignUpViewProps {
  onLoginSuccess: (profile: UserProfile, targetTab?: NavigationTab) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

type GenderOption = 'female' | 'male' | 'other';
type GoalOption = 'fat_loss' | 'muscle_gain' | 'vitality' | 'cycle_sync' | 'longevity';
type ActivityOption = 'sedentary' | 'light' | 'moderate' | 'very_active';

export const SignUpView: React.FC<SignUpViewProps> = ({ onLoginSuccess, onSelectTab }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Biological & Body Profile
  const [gender, setGender] = useState<GenderOption>('female');
  const [age, setAge] = useState<string>('28');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [currentWeight, setCurrentWeight] = useState<string>('68');
  const [targetWeight, setTargetWeight] = useState<string>('64');

  // Step 3: Goals & Activity
  const [goal, setGoal] = useState<GoalOption>('vitality');
  const [activityLevel, setActivityLevel] = useState<ActivityOption>('moderate');
  const [avgCycleDays, setAvgCycleDays] = useState<string>('28');

  // Status & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset goal if male selected and goal was cycle_sync
  const handleGenderChange = (newGender: GenderOption) => {
    setGender(newGender);
    if (newGender === 'male' && goal === 'cycle_sync') {
      setGoal('muscle_gain');
    }
  };

  // Step 4: Calculated Nutrition Targets
  const calculatedMacros = useMemo(() => {
    const w = parseFloat(currentWeight) || 70;
    const h = parseFloat(heightCm) || 170;
    const a = parseInt(age, 10) || 28;

    // Mifflin-St Jeor Formula
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const activityMultipliers: Record<ActivityOption, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    let tdee = Math.round(bmr * activityMultipliers[activityLevel]);

    // Goal adjustment
    if (goal === 'fat_loss') tdee -= 400;
    else if (goal === 'muscle_gain') tdee += 350;

    const calories = Math.max(1300, Math.round(tdee));

    // Protein: 1.6 - 2.2g per kg depending on goal
    const proteinFactor = goal === 'muscle_gain' ? 2.0 : goal === 'fat_loss' ? 1.9 : 1.6;
    const protein = Math.round(w * proteinFactor);

    // Fat: ~25% of calories
    const fats = Math.round((calories * 0.25) / 9);

    // Carbs: remainder of calories
    const remainingCalories = calories - (protein * 4 + fats * 9);
    const carbs = Math.max(80, Math.round(remainingCalories / 4));

    // Water: 35ml per kg bodyweight + activity bonus
    const water = Math.round(w * 38 + (activityLevel === 'very_active' ? 750 : activityLevel === 'moderate' ? 500 : 250));

    return {
      calories,
      protein,
      carbs,
      fats,
      water: Math.min(4500, Math.max(2000, Math.round(water / 250) * 250)),
    };
  }, [currentWeight, heightCm, age, gender, goal, activityLevel]);

  // Validation before moving steps
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!currentWeight || parseFloat(currentWeight) <= 20) {
        setError('Please enter a realistic current weight in kg.');
        return;
      }
      if (!heightCm || parseInt(heightCm, 10) <= 80) {
        setError('Please enter your height in cm.');
        return;
      }
      if (!age || parseInt(age, 10) <= 10) {
        setError('Please enter your age.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        gender,
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

      const res = await api.register(payload);
      setAuthToken(res.token);

      // Successfully registered and onboarded!
      onLoginSuccess(res.user, 'dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-slide-up">
      {/* Top Header & Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (currentStep > 1 ? setCurrentStep((prev) => (prev - 1) as any) : onSelectTab('home'))}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep > 1 ? 'Previous Step' : 'Back to Home'}</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  currentStep === step
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                    : currentStep > step
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > step ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-4 sm:w-8 h-1 rounded-full transition-colors ${
                    currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Summary & Live Persona Guidance */}
        <div className="md:col-span-5 space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Step {currentStep} of 4
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight leading-snug">
                {currentStep === 1 && 'Welcome to HealthyLife'}
                {currentStep === 2 && 'Biological Calibration'}
                {currentStep === 3 && 'Goals & Activity Rhythm'}
                {currentStep === 4 && 'Your Tailored Plan Ready'}
              </h1>
              <p className="text-xs text-emerald-100 mt-1.5 leading-relaxed">
                {currentStep === 1 && 'Create your member credentials to initialize your holistic wellness portal.'}
                {currentStep === 2 && 'Personalized biometrics guarantee accurate metabolic calculations.'}
                {currentStep === 3 && 'Define your focus so our AI and coaching engines calibrate to your pace.'}
                {currentStep === 4 && 'Smart macro algorithms have designed your daily nutritional baseline.'}
              </p>
            </div>

            {/* Dynamic Features List tailored by step and gender */}
            <div className="pt-3 border-t border-white/20 space-y-3">
              <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-wider">Plan Highlights:</p>
              
              <div className="flex items-start gap-2.5 text-xs text-emerald-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Smart Macro & Calorie target calculation</span>
              </div>

              {gender === 'male' ? (
                <div className="flex items-start gap-2.5 text-xs text-emerald-50">
                  <Dumbbell className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Metabolic strength & recovery progression (Cycle tracking excluded)</span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 text-xs text-emerald-50">
                  <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>CycleSync™ hormonal alignment & phase-based wellness</span>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-xs text-emerald-50">
                <Droplets className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Dynamic cellular hydration tracking</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-emerald-50">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>24/7 AI Health Advisor & Coach communication</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step Wizard Content */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fade-slide-up">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          {/* ============================================================
              STEP 1: Account Essentials
          ============================================================ */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Step 1: Account Essentials</h2>
                  <p className="text-xs text-slate-500">Create your login credentials</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] mt-4"
              >
                <span>Continue to Biological Profile</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onSelectTab('signin')}
                    className="font-bold text-emerald-600 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================
              STEP 2: Biological & Body Profile (Gender, Age, Height, Weight)
          ============================================================ */}
          {currentStep === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Step 2: Biological & Body Profile</h2>
                  <p className="text-xs text-slate-500">Essential biometrics for metabolic calculations</p>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Biological Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGenderChange('female')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      gender === 'female'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">🌸</span>
                    <span className="text-xs font-bold">Female</span>
                    <span className="text-[10px] text-slate-500 font-medium">Includes CycleSync™</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderChange('male')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      gender === 'male'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">⚡</span>
                    <span className="text-xs font-bold">Male</span>
                    <span className="text-[10px] text-slate-500 font-medium">Strength & Vitality</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderChange('other')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      gender === 'other'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">🌿</span>
                    <span className="text-xs font-bold">Other / Neutral</span>
                    <span className="text-[10px] text-slate-500 font-medium">Standard Wellness</span>
                  </button>
                </div>
              </div>

              {/* Informational Callout Based on Gender */}
              {gender === 'male' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Male Profile Active</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Cycle tracking features and hormonal phase badges are automatically disabled. Your dashboard will focus on progressive strength, macro adherence, and metabolic recovery.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">CycleSync™ Integration Enabled</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Your dashboard will feature hormonal phase tracking (Follicular, Ovulation, Luteal, Menstrual) with phase-synced workouts and nutrition advice.
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics Grid: Age, Height, Weight */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    min="90"
                    max="240"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="170"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Current (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="30"
                    max="250"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="68"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="64"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                >
                  <span>Continue to Goals & Activity</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              STEP 3: Goals & Activity Level
          ============================================================ */}
          {currentStep === 3 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Step 3: Goals & Lifestyle</h2>
                  <p className="text-xs text-slate-500">Choose your health ambition & workout frequency</p>
                </div>
              </div>

              {/* Goal Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Primary Wellness Focus
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGoal('fat_loss')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      goal === 'fat_loss'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg p-2 rounded-xl bg-white shadow-xs">🔥</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fat Loss & Definition</p>
                      <p className="text-[10px] text-slate-500">Caloric deficit with high protein retention</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoal('muscle_gain')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      goal === 'muscle_gain'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg p-2 rounded-xl bg-white shadow-xs">⚡</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Muscle Hypertrophy & Strength</p>
                      <p className="text-[10px] text-slate-500">Optimized progressive overload & surplus</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoal('vitality')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      goal === 'vitality'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg p-2 rounded-xl bg-white shadow-xs">🌱</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Holistic Vitality & Energy</p>
                      <p className="text-[10px] text-slate-500">Balanced macros and cellular recovery</p>
                    </div>
                  </button>

                  {gender !== 'male' ? (
                    <button
                      type="button"
                      onClick={() => setGoal('cycle_sync')}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        goal === 'cycle_sync'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg p-2 rounded-xl bg-white shadow-xs">🌸</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Cycle-Synced Rhythm</p>
                        <p className="text-[10px] text-slate-500">Hormonal wave diet & workout pacing</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGoal('longevity')}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        goal === 'longevity'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg p-2 rounded-xl bg-white shadow-xs">🏆</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Longevity & Conditioning</p>
                        <p className="text-[10px] text-slate-500">Cardiovascular health & clean fuel</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Activity Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Daily Physical Activity Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, low steps', icon: '🛋️' },
                    { id: 'light', label: 'Light', sub: '1-2 workouts/week', icon: '🚶' },
                    { id: 'moderate', label: 'Moderate', sub: '3-5 workouts/week', icon: '🏃' },
                    { id: 'very_active', label: 'Very Active', sub: '6+ heavy training', icon: '🏋️' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityLevel(act.id as ActivityOption)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        activityLevel === act.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base block mb-1">{act.icon}</span>
                      <p className="text-xs font-bold">{act.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Female, optional cycle length */}
              {gender === 'female' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Average Menstrual Cycle Length (Days)</span>
                    </label>
                    <span className="text-xs font-black text-emerald-700">{avgCycleDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="21"
                    max="35"
                    value={avgCycleDays}
                    onChange={(e) => setAvgCycleDays(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>21 Days (Short)</span>
                    <span>28 Days (Standard)</span>
                    <span>35 Days (Longer)</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                >
                  <span>Review Personalized Plan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              STEP 4: Review Tailored Plan & Launch Dashboard
          ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Step 4: Your Personalized Plan Baseline</h2>
                  <p className="text-xs text-slate-500">Calculated specifically for your biometric profile</p>
                </div>
              </div>

              {/* Calculated Targets Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Calories</span>
                  <p className="text-2xl font-black text-emerald-900">{calculatedMacros.calories}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">kcal / day</span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Protein</span>
                  <p className="text-2xl font-black text-teal-900">{calculatedMacros.protein}g</p>
                  <span className="text-[10px] text-teal-600 font-semibold">Lean repair</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Carbs</span>
                  <p className="text-2xl font-black text-amber-900">{calculatedMacros.carbs}g</p>
                  <span className="text-[10px] text-amber-600 font-semibold">Energy fuel</span>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Water</span>
                  <p className="text-2xl font-black text-cyan-900">{(calculatedMacros.water / 1000).toFixed(1)}L</p>
                  <span className="text-[10px] text-cyan-600 font-semibold">{calculatedMacros.water} ml goal</span>
                </div>
              </div>

              {/* Profile Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Summary Profile Overview
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Name</span>
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Gender</span>
                    <span className="font-bold text-slate-900 capitalize">{gender}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Current Weight</span>
                    <span className="font-bold text-slate-900">{currentWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Target Weight</span>
                    <span className="font-bold text-slate-900">{targetWeight || currentWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Primary Focus</span>
                    <span className="font-bold text-slate-900 capitalize">{goal.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Cycle Tracking</span>
                    <span className={`font-bold ${gender === 'male' ? 'text-slate-500' : 'text-emerald-700'}`}>
                      {gender === 'male' ? '❌ Excluded' : '✨ Enabled (CycleSync)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleFinalSubmit}
                  className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Launching Your Dashboard...
                    </span>
                  ) : (
                    <>
                      <span>Complete Onboarding & Enter Hub</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

