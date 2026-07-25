import React, { useState } from 'react';
import { WorkoutRoutine, Exercise, ExerciseSet } from '../../types';
import { 
  Dumbbell, 
  Flame, 
  Heart, 
  Play, 
  Check, 
  Trophy, 
  Clock, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  Volume2
} from 'lucide-react';

interface WorkoutsViewProps {
  workouts: WorkoutRoutine[];
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({ workouts }) => {
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine>(workouts[0]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'warmup' | 'main' | 'cooldown'>('main');
  const [moodFilter, setMoodFilter] = useState<'All' | 'Energized' | 'Tired' | 'Stressed' | 'Calm'>('All');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  // Filtered workouts
  const filteredWorkouts = moodFilter === 'All' 
    ? workouts 
    : workouts.filter(w => w.moodFocus === moodFilter);

  // PRs list
  const personalRecords = [
    { exercise: 'Dumbbell Romanian Deadlift', weight: '75.0 kg', reps: '8 reps', date: '3 days ago', badge: '🥇 Ovulation Peak' },
    { exercise: 'Barbell Back Squat', weight: '70.0 kg', reps: '10 reps', date: '1 week ago', badge: '🥈 Personal Best' },
    { exercise: 'Dumbbell Overhead Press', weight: '32.5 kg', reps: '12 reps', date: '2 weeks ago', badge: '🥉 Form Master' }
  ];

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    // Clone routine and toggle
    const updated = { ...selectedRoutine };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (ex && ex.sets[setIndex]) {
      ex.sets[setIndex].completed = !ex.sets[setIndex].completed;
      setSelectedRoutine(updated);
      
      // Start 45s rest timer if completed
      if (ex.sets[setIndex].completed) {
        setTimerSeconds(45);
        const interval = setInterval(() => {
          setTimerSeconds(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const filteredExercises = selectedRoutine.exercises.filter(
    e => e.category === activeCategoryTab
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Heart Rate Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-800/40 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 text-purple-300 text-xs font-bold border border-purple-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sculpt & Flow Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Interactive Workout Logger & PR Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Engineered with adaptive rest timers and real-time set logging.
            </p>
          </div>

          {/* Live BPM Heart Monitor */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <div>
              <p className="text-xs font-bold text-slate-100">128 BPM <span className="text-[10px] text-slate-400 font-normal">Live</span></p>
              <p className="text-[10px] text-purple-300 font-semibold">Zone 3 • Aerobic Burn</p>
            </div>
          </div>
        </div>

        {/* Mood Matcher Filters */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-300">Match Routine to How You Feel Right Now:</p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(['All', 'Energized', 'Tired', 'Stressed', 'Calm'] as const).map((mood) => (
              <button
                key={mood}
                onClick={() => setMoodFilter(mood)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  moodFilter === mood
                    ? 'bg-purple-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mood === 'Energized' && '⚡ '}
                {mood === 'Tired' && '😴 '}
                {mood === 'Stressed' && '🧘 '}
                {mood === 'Calm' && '✨ '}
                <span>{mood} Focus</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Selected Routine vs Routine Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Selected Routine Active Logger (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Routine Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800">
                  {selectedRoutine.level} • {selectedRoutine.moodFocus} Mood
                </span>
                <h2 className="text-xl font-bold text-slate-100">{selectedRoutine.title}</h2>
                <p className="text-xs text-slate-400">
                  {selectedRoutine.durationMinutes} Mins • {selectedRoutine.caloriesBurned} kcal Estimated Burn
                </p>
              </div>

              {/* Rest Timer Widget if active */}
              {timerSeconds !== null && (
                <div className="flex items-center gap-2 bg-amber-950/80 text-amber-300 px-4 py-2 rounded-2xl border border-amber-800/80 animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Rest Timer: {timerSeconds}s</span>
                </div>
              )}
            </div>

            {/* Exercise Category Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveCategoryTab('warmup')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  activeCategoryTab === 'warmup' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Warm-Up (5m)
              </button>
              <button
                onClick={() => setActiveCategoryTab('main')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  activeCategoryTab === 'main' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Main Circuit (25m)
              </button>
              <button
                onClick={() => setActiveCategoryTab('cooldown')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  activeCategoryTab === 'cooldown' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cool-Down (5m)
              </button>
            </div>
          </div>

          {/* Exercise Sets List */}
          <div className="space-y-4">
            {filteredExercises.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No exercises in this phase section.</p>
            ) : (
              filteredExercises.map((ex) => (
                <div key={ex.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={ex.thumbnail}
                      alt={ex.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-800"
                    />
                    <div>
                      <span className="text-[10px] text-purple-400 uppercase font-bold">{ex.targetMuscle}</span>
                      <h3 className="text-base font-bold text-slate-100">{ex.name}</h3>
                      <p className="text-xs text-slate-400">💡 {ex.tips}</p>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-2">
                    {ex.sets.map((set, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          set.completed
                            ? 'bg-purple-950/40 border-purple-800/60'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-300">Set {set.setNumber}</span>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-200">
                          <span>{set.weightKg > 0 ? `${set.weightKg} kg` : 'Bodyweight'}</span>
                          <span>{set.reps} Reps</span>
                        </div>
                        <button
                          onClick={() => handleToggleSet(ex.id, idx)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all ${
                            set.completed
                              ? 'bg-purple-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Sidebar: PRs Hall of Fame & Other Routines */}
        <div className="space-y-6">
          
          {/* PRs Hall of Fame */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Hall of Fame PRs</span>
              </h3>
              <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full font-bold">3 Records</span>
            </div>

            <div className="space-y-3">
              {personalRecords.map((pr, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400">{pr.badge}</span>
                    <span className="text-[10px] text-slate-500">{pr.date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-100">{pr.exercise}</p>
                  <p className="text-xs font-black text-emerald-400">{pr.weight} <span className="font-normal text-slate-400">({pr.reps})</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Routine Switcher Cards */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Explore Routines</h3>
            <div className="space-y-3">
              {filteredWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedRoutine(w)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    selectedRoutine.id === w.id
                      ? 'bg-purple-950/60 border-purple-500/80 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={w.image}
                    alt={w.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-100">{w.title}</p>
                    <p className="text-[10px] text-slate-400">{w.durationMinutes}m • {w.caloriesBurned} kcal</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
