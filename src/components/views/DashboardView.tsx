import React from 'react';
import { 
  UserProfile, 
  DailyMacros, 
  MealItem, 
  WorkoutRoutine, 
  NavigationTab 
} from '../../types';
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Droplet, 
  Scale, 
  Moon, 
  Smile, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Calendar, 
  TrendingUp,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  macros: DailyMacros;
  meals: MealItem[];
  workouts: WorkoutRoutine[];
  onOpenQuickLog: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onLogWater: (amountMl: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  macros,
  meals,
  workouts,
  onOpenQuickLog,
  onSelectTab,
  onLogWater
}) => {
  const caloriesRemaining = macros.caloriesGoal - macros.caloriesConsumed;
  const caloriePercent = Math.min(100, Math.round((macros.caloriesConsumed / macros.caloriesGoal) * 100));

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome & Vitality Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ovulation Peak Phase (Day {user.cycleDay})</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-950/60 text-amber-300 text-xs font-bold border border-amber-800/60 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{user.streakDays} Day Streak</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Your metabolic energy is at <span className="text-emerald-400 font-bold">Peak Potential</span> today. Ideal for strength training and high-protein nutrition.
            </p>
          </div>

          {/* Score Canvas Badge */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray="163.3"
                  strokeDashoffset={163.3 - (163.3 * user.vitalityScore) / 100}
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-lg font-black text-slate-100">{user.vitalityScore}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Vitality Score</p>
              <p className="text-sm font-bold text-emerald-400">Optimal Sync</p>
              <p className="text-[10px] text-slate-500">Updated 10m ago</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Calories Ring & Today's Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calories & Macros Card (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Daily Caloric & Macro Balance</h2>
              <p className="text-xs text-slate-400">Target: {macros.caloriesGoal} kcal • Cycle Adjusted</p>
            </div>
            <button
              onClick={() => onSelectTab('nutrition')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>View Diet Plan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Donut Chart Visualizer */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * caloriePercent) / 100}
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-slate-100">{macros.caloriesConsumed}</span>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">of {macros.caloriesGoal} kcal</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-center font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80">
                {caloriesRemaining > 0 ? `${caloriesRemaining} kcal remaining` : 'Target reached!'}
              </p>
            </div>

            {/* Macro Bars */}
            <div className="space-y-4">
              
              {/* Protein */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">Protein</span>
                  <span className="text-emerald-400">{macros.proteinConsumedG}g / {macros.proteinGoalG}g</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (macros.proteinConsumedG / macros.proteinGoalG) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">Carbohydrates</span>
                  <span className="text-cyan-400">{macros.carbsConsumedG}g / {macros.carbsGoalG}g</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (macros.carbsConsumedG / macros.carbsGoalG) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">Healthy Fats</span>
                  <span className="text-amber-400">{macros.fatsConsumedG}g / {macros.fatsGoalG}g</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (macros.fatsConsumedG / macros.fatsGoalG) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Today's Focus Schedule */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Today's Focus</span>
            </h2>
            <span className="text-[10px] text-slate-400">Day 14</span>
          </div>

          <div className="space-y-3">
            
            {/* Meal item */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold">
                  🥗
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Wild Salmon Bowl</p>
                  <p className="text-[10px] text-slate-400">Lunch • 1:15 PM • 580 kcal</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                Done
              </span>
            </div>

            {/* Workout item */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold">
                  🏋️
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Morning Sculpt & Core</p>
                  <p className="text-[10px] text-slate-400">Workout • 35 mins • 310 kcal</p>
                </div>
              </div>
              <button
                onClick={() => onSelectTab('workouts')}
                className="px-2.5 py-1 rounded-full bg-purple-500 hover:bg-purple-400 text-slate-950 text-[10px] font-bold transition-colors"
              >
                Start
              </button>
            </div>

            {/* Hydration Checkpoint */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                  💧
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Hydration Target</p>
                  <p className="text-[10px] text-slate-400">{macros.waterConsumedMl} / {macros.waterGoalMl} ml</p>
                </div>
              </div>
              <button
                onClick={() => onLogWater(250)}
                className="px-2.5 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold transition-colors"
              >
                +250ml
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Weight */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Body Weight</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{user.weightCurrentKg} <span className="text-xs font-normal text-slate-400">kg</span></p>
          <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Target: {user.weightTargetKg} kg (-0.4kg this wk)</span>
          </p>
        </div>

        {/* Sleep Quality */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Sleep & Recovery</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">7.8 <span className="text-xs font-normal text-slate-400">hrs</span></p>
          <p className="text-[10px] text-indigo-300 font-semibold">
            88% Deep REM • Great recovery
          </p>
        </div>

        {/* Hydration */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Hydration</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{(macros.waterConsumedMl / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span></p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(100, (macros.waterConsumedMl / macros.waterGoalMl) * 100)}%` }} />
          </div>
        </div>

        {/* Mood/Stress */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Mood & Mind</span>
            <Smile className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">Calm ✨</p>
          <p className="text-[10px] text-amber-300 font-semibold">
            Cortisol balanced • High focus
          </p>
        </div>

      </div>

      {/* Coach Video Call banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-800/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
              alt="Coach Marcus"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-400"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">1-on-1 Session with Coach Marcus Vance</p>
            <p className="text-xs text-slate-300">Next available slot: Today at 04:00 PM • Form Audit & Macro Review</p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('coach')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-950/50 transition-colors whitespace-nowrap"
        >
          <Video className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

    </div>
  );
};
