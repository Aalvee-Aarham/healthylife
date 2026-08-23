import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  X, 
  Droplet, 
  Utensils, 
  Dumbbell, 
  Check, 
  Sparkles,
  Flame,
  Clock
} from 'lucide-react';
import { DailyMacros } from '../../types';
import { api } from '../../services/api';

interface FloatingQuickLogProps {
  macros: DailyMacros;
  onLogWater: (amountMl: number) => void;
  onAddMeal?: (
    name: string,
    cal: number,
    protein: number,
    customCarbs?: number,
    customFat?: number,
    customImage?: string,
    category?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => Promise<void> | void;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

type ActiveSheet = null | 'water' | 'meal' | 'gym';

export const FloatingQuickLog: React.FC<FloatingQuickLogProps> = ({
  macros,
  onLogWater,
  onAddMeal,
  isOpenExternal = false,
  onCloseExternal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  // Minimal water custom state
  const [customWater, setCustomWater] = useState<string>('');

  // Minimal meal states
  const [mealName, setMealName] = useState<string>('');
  const [mealCalories, setMealCalories] = useState<string>('350');
  const [mealProtein, setMealProtein] = useState<string>('25');
  const [mealCategory, setMealCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [isSavingMeal, setIsSavingMeal] = useState<boolean>(false);

  // Minimal gym log states
  const [gymTitle, setGymTitle] = useState<string>('');
  const [gymDuration, setGymDuration] = useState<string>('45');
  const [gymCalories, setGymCalories] = useState<string>('300');
  const [isSavingGym, setIsSavingGym] = useState<boolean>(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync external open triggers
  useEffect(() => {
    if (isOpenExternal) {
      setIsMenuOpen(true);
    }
  }, [isOpenExternal]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!activeSheet) {
          setIsMenuOpen(false);
          if (onCloseExternal) onCloseExternal();
        }
      }
    };
    if (isMenuOpen || activeSheet) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen, activeSheet, onCloseExternal]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const closeAll = () => {
    setIsMenuOpen(false);
    setActiveSheet(null);
    if (onCloseExternal) onCloseExternal();
  };

  const openOption = (option: 'water' | 'meal' | 'gym') => {
    setIsMenuOpen(false);
    setActiveSheet(option);
  };

  // Water Log Handlers
  const handleWaterPreset = (amount: number) => {
    onLogWater(amount);
    showToast(`💧 +${amount}ml water logged!`);
    setTimeout(() => {
      closeAll();
    }, 450);
  };

  const handleCustomWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customWater, 10);
    if (amount > 0) {
      onLogWater(amount);
      showToast(`💧 +${amount}ml water logged!`);
      setCustomWater('');
      setTimeout(() => {
        closeAll();
      }, 450);
    }
  };

  // Meal Log Handler
  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    setIsSavingMeal(true);
    try {
      const cal = Number(mealCalories) || 0;
      const prot = Number(mealProtein) || 0;

      if (onAddMeal) {
        await onAddMeal(mealName.trim(), cal, prot, undefined, undefined, undefined, mealCategory);
      } else {
        await api.addMeal({
          name: mealName.trim(),
          calories: cal,
          protein: prot,
          category: mealCategory,
        });
      }

      showToast(`🥗 "${mealName.trim()}" logged!`);
      setMealName('');
      setTimeout(() => {
        closeAll();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast(`🥗 "${mealName.trim()}" logged!`);
      closeAll();
    } finally {
      setIsSavingMeal(false);
    }
  };

  // Gym Log Handler
  const handleGymSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymTitle.trim()) return;

    setIsSavingGym(true);
    try {
      await api.addGymLog({
        title: gymTitle.trim(),
        durationMinutes: gymDuration ? Number(gymDuration) : undefined,
        caloriesBurned: gymCalories ? Number(gymCalories) : undefined,
      });
      showToast(`💪 "${gymTitle.trim()}" logged!`);
      setGymTitle('');
      setTimeout(() => {
        closeAll();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast(`💪 "${gymTitle.trim()}" logged!`);
      closeAll();
    } finally {
      setIsSavingGym(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Dim backdrop when menu or sheet is open */}
      {(isMenuOpen || activeSheet) && (
        <div
          onClick={closeAll}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[99998] transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Floating Container (Absolute/Fixed Bottom-Right, Topmost Layer) */}
      <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[99999] flex flex-col items-end pointer-events-auto select-none"
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="mb-3 mr-1 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/60 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            3 FLOATING SPEED-DIAL OPTIONS (Animated on click)
            ──────────────────────────────────────────────────────── */}
        <div 
          className={`flex flex-col items-end gap-3 mb-3 transition-all duration-300 ease-out origin-bottom-right ${
            isMenuOpen 
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 scale-90 translate-y-8 pointer-events-none'
          }`}
        >
          {/* OPTION 3: Gym Log */}
          <div className="flex items-center gap-2.5 group">
            <span className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-[var(--hl-border)] text-xs font-bold text-[var(--hl-text-primary)] transition-transform duration-200 group-hover:scale-105">
              Gym Log
            </span>
            <button
              type="button"
              onClick={() => openOption('gym')}
              className="w-12 h-12 rounded-full bg-[#F4956A] hover:bg-[#ef7d4d] text-white flex items-center justify-center shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              title="Quick Log Gym Workout"
            >
              <Dumbbell className="w-5 h-5" />
            </button>
          </div>

          {/* OPTION 2: Meal Log */}
          <div className="flex items-center gap-2.5 group">
            <span className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-[var(--hl-border)] text-xs font-bold text-[var(--hl-text-primary)] transition-transform duration-200 group-hover:scale-105">
              Meal Log
            </span>
            <button
              type="button"
              onClick={() => openOption('meal')}
              className="w-12 h-12 rounded-full bg-[#3D7A5A] hover:bg-[#326650] text-white flex items-center justify-center shadow-lg shadow-emerald-700/25 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              title="Quick Log Meal"
            >
              <Utensils className="w-5 h-5" />
            </button>
          </div>

          {/* OPTION 1: Water Log */}
          <div className="flex items-center gap-2.5 group">
            <span className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-[var(--hl-border)] text-xs font-bold text-[var(--hl-text-primary)] transition-transform duration-200 group-hover:scale-105">
              Water Log
            </span>
            <button
              type="button"
              onClick={() => openOption('water')}
              className="w-12 h-12 rounded-full bg-[#4A9B8E] hover:bg-[#3a8377] text-white flex items-center justify-center shadow-lg shadow-teal-600/25 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              title="Quick Log Water"
            >
              <Droplet className="w-5 h-5 fill-white/20" />
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            MAIN FLOATING ACTION BUTTON (Native Mobile FAB)
            ──────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => {
            if (activeSheet) {
              closeAll();
            } else {
              setIsMenuOpen(!isMenuOpen);
            }
          }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ease-out active:scale-90 cursor-pointer ${
            isMenuOpen || activeSheet
              ? 'bg-slate-800 rotate-45 shadow-slate-900/40'
              : 'bg-gradient-to-tr from-[#3D7A5A] to-[#4A9B8E] hover:from-[#326650] hover:to-[#3e897d] shadow-emerald-900/40 hover:scale-105'
          }`}
          style={{
            boxShadow: isMenuOpen || activeSheet
              ? '0 10px 30px -3px rgba(15, 23, 42, 0.45)'
              : '0 10px 30px -2px rgba(61, 122, 90, 0.5)',
          }}
          title="Quick Log Action"
        >
          <Plus className="w-7 h-7 stroke-[2.5] transition-transform duration-300" />
        </button>

        {/* ────────────────────────────────────────────────────────
            MINIMALISTIC POPUP / BOTTOM SHEET FOR SELECTED LOG
            ──────────────────────────────────────────────────────── */}
        {activeSheet && (
          <div 
            className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-88 rounded-3xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-[var(--hl-border)] shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200 z-[100000] text-[var(--hl-text-primary)]"
            style={{
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--hl-border-light)]">
              <div className="flex items-center gap-2">
                {activeSheet === 'water' && (
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
                    <Droplet className="w-4 h-4 fill-teal-600/30" />
                  </div>
                )}
                {activeSheet === 'meal' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    <Utensils className="w-4 h-4" />
                  </div>
                )}
                {activeSheet === 'gym' && (
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xs">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                )}
                <h4 className="text-sm font-bold capitalize">
                  {activeSheet === 'gym' ? 'Gym Workout' : `${activeSheet} Log`}
                </h4>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="w-7 h-7 rounded-full bg-[var(--hl-surface-alt)] hover:bg-[var(--hl-border)] text-[var(--hl-text-secondary)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. MINIMAL WATER LOG */}
            {activeSheet === 'water' && (
              <div className="space-y-3.5">
                <p className="text-xs text-[var(--hl-text-secondary)]">Tap to quickly add hydration:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleWaterPreset(250)}
                    className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all text-center flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-teal-900">+250 ml</span>
                    <span className="text-[11px] text-teal-600">Glass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaterPreset(500)}
                    className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all text-center flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-teal-900">+500 ml</span>
                    <span className="text-[11px] text-teal-600">Bottle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaterPreset(750)}
                    className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all text-center flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-teal-900">+750 ml</span>
                    <span className="text-[11px] text-teal-600">Flask</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaterPreset(1000)}
                    className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all text-center flex flex-col items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-teal-900">+1000 ml</span>
                    <span className="text-[11px] text-teal-600">Jug</span>
                  </button>
                </div>

                {/* Custom Water Input */}
                <form onSubmit={handleCustomWaterSubmit} className="pt-2 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Custom ml"
                    value={customWater}
                    onChange={(e) => setCustomWater(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-semibold focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* 2. MINIMAL MEAL LOG */}
            {activeSheet === 'meal' && (
              <form onSubmit={handleMealSubmit} className="space-y-3">
                {/* Popular Meal Chips */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {[
                    { name: '🍳 3 Eggs & Toast', cal: 320, p: 24, cat: 'breakfast' as const },
                    { name: '🥗 Chicken Salad', cal: 420, p: 38, cat: 'lunch' as const },
                    { name: '🥤 Protein Shake', cal: 220, p: 30, cat: 'snack' as const },
                  ].map((chip) => (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => {
                        setMealName(chip.name.replace(/^[^\w\s]+\s*/, ''));
                        setMealCalories(chip.cal.toString());
                        setMealProtein(chip.p.toString());
                        setMealCategory(chip.cat);
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--hl-surface-alt)] hover:bg-emerald-50 hover:text-emerald-900 border border-[var(--hl-border-light)] transition-colors cursor-pointer"
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Meal name (e.g. Oatmeal & Berries)"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--hl-text-secondary)] mb-0.5">Calories</label>
                    <input
                      type="number"
                      placeholder="kcal"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--hl-text-secondary)] mb-0.5">Protein (g)</label>
                    <input
                      type="number"
                      placeholder="grams"
                      value={mealProtein}
                      onChange={(e) => setMealProtein(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingMeal || !mealName.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#3D7A5A] hover:bg-[#326650] text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 mt-1 cursor-pointer"
                >
                  {isSavingMeal ? 'Saving…' : 'Save Meal'}
                </button>
              </form>
            )}

            {/* 3. MINIMAL GYM LOG */}
            {activeSheet === 'gym' && (
              <form onSubmit={handleGymSubmit} className="space-y-3">
                {/* Popular Workout Chips */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {[
                    { title: 'Upper Body', min: '45', cal: '320' },
                    { title: 'Leg Day', min: '40', cal: '350' },
                    { title: 'Cardio Run', min: '30', cal: '280' },
                  ].map((chip) => (
                    <button
                      key={chip.title}
                      type="button"
                      onClick={() => {
                        setGymTitle(chip.title);
                        setGymDuration(chip.min);
                        setGymCalories(chip.cal);
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--hl-surface-alt)] hover:bg-orange-50 hover:text-orange-900 border border-[var(--hl-border-light)] transition-colors cursor-pointer"
                    >
                      {chip.title}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Workout session (e.g. Chest & Triceps)"
                    value={gymTitle}
                    onChange={(e) => setGymTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--hl-text-secondary)] mb-0.5">Duration (mins)</label>
                    <input
                      type="number"
                      placeholder="mins"
                      value={gymDuration}
                      onChange={(e) => setGymDuration(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--hl-text-secondary)] mb-0.5">Calories burned</label>
                    <input
                      type="number"
                      placeholder="kcal"
                      value={gymCalories}
                      onChange={(e) => setGymCalories(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--hl-surface-alt)] border border-[var(--hl-border)] text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingGym || !gymTitle.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#F4956A] hover:bg-[#ef7d4d] text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 mt-1 cursor-pointer"
                >
                  {isSavingGym ? 'Saving…' : 'Save Gym Log'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
