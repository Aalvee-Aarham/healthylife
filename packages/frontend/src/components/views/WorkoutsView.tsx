import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Flame, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileText,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { GymLog } from '../../types';
import { api } from '../../services/api';

interface ExerciseFormItem {
  name: string;
  sets: Array<{
    reps: number | string;
    weightKg: number | string;
    completed: boolean;
  }>;
}

const PRESET_WORKOUTS = [
  'Upper Body Push',
  'Upper Body Pull',
  'Leg Day & Glutes',
  'Full Body Strength',
  'Cardio & Core',
  'Arms & Shoulders',
];

export const WorkoutsView: React.FC = () => {
  const [logs, setLogs] = useState<GymLog[]>([]);
  const [gymStats, setGymStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    totalDurationMinutes: 0,
    totalCaloriesBurned: 0,
    avgSessionMinutes: 0,
    consistentDays: [] as string[],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('45');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('300');
  const [notes, setNotes] = useState<string>('');
  const [loggedDate, setLoggedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<ExerciseFormItem[]>([
    {
      name: 'Barbell Squat',
      sets: [
        { reps: 10, weightKg: 60, completed: true },
        { reps: 10, weightKg: 65, completed: true },
        { reps: 8, weightKg: 70, completed: false },
      ],
    },
  ]);

  // Load gym logs from backend API
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGymLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load gym logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Fetch aggregate stats from backend SQL (COUNT/SUM/AVG + INTERSECT).
   *  No JavaScript arithmetic — all numbers come from the database. */
  const fetchStats = async () => {
    try {
      const data = await api.gymStats();
      setGymStats(data);
    } catch (err) {
      console.error('Failed to load gym stats:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add a new exercise block to the form
  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        sets: [{ reps: 10, weightKg: 20, completed: true }],
      },
    ]);
  };

  // Remove an exercise block
  const handleRemoveExercise = (exIndex: number) => {
    setExercises(exercises.filter((_, idx) => idx !== exIndex));
  };

  // Update exercise name
  const handleExerciseNameChange = (exIndex: number, name: string) => {
    const updated = [...exercises];
    updated[exIndex].name = name;
    setExercises(updated);
  };

  // Add a set to an exercise
  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const prevSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      reps: prevSet ? prevSet.reps : 10,
      weightKg: prevSet ? prevSet.weightKg : 20,
      completed: true,
    });
    setExercises(updated);
  };

  // Remove a set from an exercise
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exIndex].sets.length <= 1) {
      handleRemoveExercise(exIndex);
      return;
    }
    updated[exIndex].sets = updated[exIndex].sets.filter((_, idx) => idx !== setIndex);
    setExercises(updated);
  };

  // Update set reps / weight
  const handleSetChange = (
    exIndex: number,
    setIndex: number,
    field: 'reps' | 'weightKg' | 'completed',
    value: any
  ) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIndex] = {
      ...updated[exIndex].sets[setIndex],
      [field]: value,
    };
    setExercises(updated);
  };

  // Submit new Gym Log
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a workout title');
      return;
    }

    // Flatten sets
    const flattenedSets: Array<{
      exerciseName: string;
      setNumber: number;
      reps: number;
      weightKg: number;
      completed: boolean;
    }> = [];

    exercises.forEach((ex) => {
      const exName = ex.name.trim() || 'General Exercise';
      ex.sets.forEach((s, sIdx) => {
        flattenedSets.push({
          exerciseName: exName,
          setNumber: sIdx + 1,
          reps: Number(s.reps) || 0,
          weightKg: Number(s.weightKg) || 0,
          completed: Boolean(s.completed),
        });
      });
    });

    try {
      setIsSubmitting(true);
      const newLog = await api.addGymLog({
        title: title.trim(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
        notes: notes.trim() || undefined,
        loggedAt: loggedDate ? `${loggedDate}T12:00:00Z` : undefined,
        sets: flattenedSets,
      });

      setLogs([newLog, ...logs]);
      fetchStats();
      showToast(`Workout "${title}" saved successfully!`);
      
      // Reset form
      setTitle('');
      setNotes('');
      setExercises([
        {
          name: '',
          sets: [{ reps: 10, weightKg: 20, completed: true }],
        },
      ]);
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save gym log:', err);
      showToast('Failed to save workout log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle set completion directly on a logged workout
  const handleToggleSet = async (logId: string, setId: string) => {
    try {
      const updatedLog = await api.toggleGymLogSet(logId, setId);
      setLogs(logs.map((l) => (l.id === logId ? updatedLog : l)));
    } catch (err) {
      console.error('Failed to toggle set:', err);
      // Optimistic fallback for demo or error
      setLogs(
        logs.map((l) => {
          if (l.id !== logId) return l;
          return {
            ...l,
            sets: l.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
          };
        })
      );
    }
  };

  // Delete a logged workout
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Are you sure you want to delete this workout log?')) return;
    try {
      await api.deleteGymLog(logId);
      setLogs(logs.filter((l) => l.id !== logId));
      // Refresh aggregate stats from backend after deletion
      fetchStats();
      showToast('Workout log deleted.');
    } catch (err) {
      console.error('Failed to delete gym log:', err);
      setLogs(logs.filter((l) => l.id !== logId));
      showToast('Workout log removed.');
    }
  };

  // Calculate live statistics from backend SQL aggregates (not JavaScript .reduce())
  // Stats are fetched from GET /gym-logs/stats (COUNT/SUM/AVG/INTERSECT in PostgreSQL)

  // Group sets by exercise name helper
  const groupSetsByExercise = (sets: GymLog['sets']) => {
    const map = new Map<string, typeof sets>();
    (sets || []).forEach((set) => {
      const list = map.get(set.exerciseName) || [];
      list.push(set);
      map.set(set.exerciseName, list);
    });
    return Array.from(map.entries());
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-xl backdrop-blur-md text-sm font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl relative overflow-hidden space-y-4 hl-card"
        style={{
          background: 'linear-gradient(135deg, var(--hl-peach) 0%, #EFA782 100%)',
          boxShadow: '0 8px 32px rgba(244,149,106,0.25)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Simple Gym Logger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Gym & Workout Log
            </h1>
            <p className="text-sm text-white/90">
              Track exercises, sets, weights, and review your workout history.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white text-orange-600 hover:bg-orange-50 shadow-md transition-all active:scale-95"
          >
            {isFormOpen ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Close Log Form</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>+ Log New Workout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="hl-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-500 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workouts</p>
            <h3 className="text-2xl font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
               {gymStats.totalWorkouts}
            </h3>
          </div>
        </div>

        <div className="hl-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sets Logged</p>
            <h3 className="text-2xl font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
               {gymStats.totalSets}
            </h3>
          </div>
        </div>

        <div className="hl-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Time</p>
            <h3 className="text-2xl font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
               {gymStats.totalDurationMinutes > 0 ? `${gymStats.totalDurationMinutes}m` : '—'}
            </h3>
          </div>
        </div>
      </div>

      {/* Log Workout Form (Collapsible / Active) */}
      {isFormOpen && (
        <form onSubmit={handleSubmitLog} className="hl-card p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 border-2 border-orange-200/40">
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--hl-border-light)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                Log Workout Session
              </h2>
              <p className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                Enter the session details and add your exercise sets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-secondary)' }}
            >
              Cancel
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-secondary)' }}>
              Quick Routine Suggestions:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_WORKOUTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    title === preset
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'hover:border-orange-300'
                  }`}
                  style={
                    title === preset
                      ? {}
                      : { background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                Workout Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Upper Body Strength"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--hl-text-primary)' }}>
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Duration (mins)</span>
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--hl-text-primary)' }}>
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
              />
            </div>
          </div>

          {/* Optional Calories & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--hl-text-primary)' }}>
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Calories Burned (kcal)</span>
              </label>
              <input
                type="number"
                min="0"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="300"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--hl-text-primary)' }}>
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span>Workout Notes / Focus (Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Focus on deep range of motion, felt great"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
              />
            </div>
          </div>

          {/* Exercises & Sets Builder */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-primary)' }}>
                Exercises & Sets
              </h3>
              <button
                type="button"
                onClick={handleAddExercise}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Exercise</span>
              </button>
            </div>

            <div className="space-y-4">
              {exercises.map((ex, exIdx) => (
                <div
                  key={exIdx}
                  className="p-4 sm:p-5 rounded-2xl space-y-3 hl-card-alt border"
                  style={{ borderColor: 'var(--hl-border-light)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {exIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => handleExerciseNameChange(exIdx, e.target.value)}
                        placeholder="Exercise Name (e.g. Romanian Deadlift, Bench Press)"
                        className="flex-1 px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                        style={{ background: 'var(--hl-surface)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sets list */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-4">Weight (kg)</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-2 text-right">Done</div>
                    </div>

                    {ex.sets.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl"
                        style={{ background: 'var(--hl-surface)' }}
                      >
                        <div className="col-span-2 text-xs font-bold text-slate-500 px-2">
                          #{sIdx + 1}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={s.weightKg}
                            onChange={(e) => handleSetChange(exIdx, sIdx, 'weightKg', e.target.value)}
                            placeholder="kg"
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none"
                            style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            value={s.reps}
                            onChange={(e) => handleSetChange(exIdx, sIdx, 'reps', e.target.value)}
                            placeholder="reps"
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none"
                            style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-primary)' }}
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetChange(exIdx, sIdx, 'completed', !s.completed)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              s.completed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exIdx, sIdx)}
                              className="p-1 text-slate-400 hover:text-red-500"
                              title="Delete set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 pt-1 px-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Set</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--hl-border-light)' }}>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Workout Log'}
            </button>
          </div>
        </form>
      )}

      {/* Workout History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>
            Workout History
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--hl-text-secondary)' }}>
            {logs.length} logged sessions
          </span>
        </div>

        {isLoading ? (
          <div className="hl-card p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-orange-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-400">Loading workout logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="hl-card p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                No workouts logged yet
              </h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--hl-text-secondary)' }}>
                Start tracking your gym routines, weights, and repetitions to see your progress here.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
            >
              + Log Your First Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const groupedExercises = groupSetsByExercise(log.sets);
              return (
                <div
                  key={log.id}
                  className="hl-card p-5 sm:p-6 space-y-4 transition-all hover:border-orange-200"
                >
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--hl-border-light)' }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <h3 className="text-base font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                          {log.title}
                        </h3>
                      </div>
                      <p className="text-xs font-medium" style={{ color: 'var(--hl-text-secondary)' }}>
                        {log.date || new Date(log.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {log.durationMinutes ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{log.durationMinutes} mins</span>
                        </span>
                      ) : null}

                      {log.caloriesBurned ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{log.caloriesBurned} kcal</span>
                        </span>
                      ) : null}

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {log.notes && (
                    <div className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border italic text-slate-500" style={{ borderColor: 'var(--hl-border-light)' }}>
                      💡 {log.notes}
                    </div>
                  )}

                  {/* Exercises & Sets Breakdown */}
                  {groupedExercises.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {groupedExercises.map(([exName, sets]) => (
                        <div
                          key={exName}
                          className="p-3.5 rounded-2xl hl-card-alt border space-y-2.5"
                          style={{ borderColor: 'var(--hl-border-light)' }}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                              {exName}
                            </h4>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {sets.map((s) => (
                              <div
                                key={s.id}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                                  s.completed
                                    ? 'bg-orange-500/5 text-slate-800 dark:text-slate-200'
                                    : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400'
                                }`}
                              >
                                <span className="font-semibold text-slate-400">
                                  Set {s.setNumber}
                                </span>
                                <span className="font-bold">
                                  {s.weightKg > 0 ? `${s.weightKg} kg` : 'Bodyweight'} × {s.reps} reps
                                </span>
                                <button
                                  onClick={() => handleToggleSet(log.id, s.id)}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    s.completed
                                      ? 'bg-orange-500 text-white shadow-sm'
                                      : 'border border-slate-300 dark:border-slate-700 text-transparent hover:text-slate-300'
                                  }`}
                                  title={s.completed ? 'Mark incomplete' : 'Mark completed'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific exercise sets recorded for this session.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
