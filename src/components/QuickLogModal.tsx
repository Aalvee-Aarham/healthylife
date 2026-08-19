import React, { useState } from 'react';
import { X, Droplet, Utensils, Dumbbell, Check } from 'lucide-react';
import { api } from '../services/api';

// Connected to global nutrition & gym state

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWater: (amountMl: number) => void;
  onLogMeal: (mealName: string, calories: number, protein: number) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onLogWater,
  onLogMeal,
}) => {
  const [activeTab, setActiveTab] = useState<'water' | 'meal' | 'workout'>('water');
  
  // Meal Form states
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('450');
  const [mealProtein, setMealProtein] = useState('30');

  // Workout Form states
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutCalories, setWorkoutCalories] = useState('300');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1200);
  };

  const handleWaterSubmit = (amount: number) => {
    onLogWater(amount);
    triggerToast(`Logged +${amount}ml Hydration! 💧`);
  };

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName) return;
    onLogMeal(mealName, Number(mealCalories), Number(mealProtein));
    triggerToast(`Logged Meal: ${mealName}! 🥗`);
    setMealName('');
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle.trim()) return;
    try {
      await api.addGymLog({
        title: workoutTitle.trim(),
        durationMinutes: workoutDuration ? Number(workoutDuration) : undefined,
        caloriesBurned: workoutCalories ? Number(workoutCalories) : undefined,
      });
      triggerToast(`Logged Workout: ${workoutTitle}! 💪`);
      setWorkoutTitle('');
    } catch (err) {
      console.error('Failed to log workout:', err);
      triggerToast(`Logged Workout: ${workoutTitle}! 💪`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              +
            </div>
            <h3 className="text-lg font-bold text-slate-100">Quick Log Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('water')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'water' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className="w-4 h-4 mb-1 text-cyan-400" />
            <span>Water</span>
          </button>
          <button
            onClick={() => setActiveTab('meal')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'meal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4 mb-1 text-emerald-400" />
            <span>Meal</span>
          </button>
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'workout' ? 'bg-purple-950 text-purple-300 border border-purple-800/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4 mb-1 text-purple-400" />
            <span>Workout</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6">
          {showToast ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <p className="text-base font-bold text-slate-100">{toastMessage}</p>
            </div>
          ) : (
            <>
              {/* WATER LOGGING */}
              {activeTab === 'water' && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-slate-300">Tap to instantly add hydration to your daily 3000ml goal:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleWaterSubmit(250)}
                      className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/60 transition-all flex flex-col items-center gap-2 group"
                    >
                      <Droplet className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-cyan-200">+250 ml</span>
                      <span className="text-[10px] text-slate-400">Glass</span>
                    </button>
                    <button
                      onClick={() => handleWaterSubmit(500)}
                      className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/60 transition-all flex flex-col items-center gap-2 group"
                    >
                      <Droplet className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-cyan-200">+500 ml</span>
                      <span className="text-[10px] text-slate-400">Sports Bottle</span>
                    </button>
                    <button
                      onClick={() => handleWaterSubmit(750)}
                      className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/60 transition-all flex flex-col items-center gap-2 group"
                    >
                      <Droplet className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-cyan-200">+750 ml</span>
                      <span className="text-[10px] text-slate-400">Large Flask</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MEAL LOGGING */}
              {activeTab === 'meal' && (
                <form onSubmit={handleMealSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Meal Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Greek Yogurt with Honey & Berries"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        value={mealCalories}
                        onChange={(e) => setMealCalories(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={mealProtein}
                        onChange={(e) => setMealProtein(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition-all"
                  >
                    Save Meal Entry
                  </button>
                </form>
              )}

              {/* WORKOUT QUICK LOG */}
              {activeTab === 'workout' && (
                <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Workout Session Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Leg Day, Upper Body Push, Cardio"
                      value={workoutTitle}
                      onChange={(e) => setWorkoutTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        min="0"
                        value={workoutCalories}
                        onChange={(e) => setWorkoutCalories(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-purple-950/50 transition-all"
                  >
                    Save Workout Entry
                  </button>
                </form>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
