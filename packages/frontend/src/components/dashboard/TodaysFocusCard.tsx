import React, { useEffect, useState } from 'react';
import { MealItem, DailyMacros, NavigationTab, Plan } from '../../types';
import { CheckCircle2, Utensils, Dumbbell, Droplets, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';

interface TodaysFocusCardProps {
  meals: MealItem[];
  macros: DailyMacros;
  onSelectTab: (tab: NavigationTab) => void;
  onLogWater: (amountMl: number) => void;
}

/** JS Date.getDay() is 0=Sunday..6=Saturday. Plan convention is 0=Monday..6=Sunday. */
function todayPlanDayIndex(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({ meals, macros, onSelectTab, onLogWater }) => {
  const recentMeals = meals.slice(0, 2);
  const waterPct = Math.min(100, macros.waterGoalMl > 0
    ? Math.round((macros.waterConsumedMl / macros.waterGoalMl) * 100)
    : 0);

  const [workoutPlan, setWorkoutPlan] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  const todayIdx = todayPlanDayIndex();

  useEffect(() => {
    api.getPlans()
      .then((plans) => {
        const active = plans.find((p) => p.type === 'workout' && p.status === 'active') || null;
        setWorkoutPlan(active);
        const done = new Set(
          (active?.completions || [])
            .filter((c) => c.dayOfWeek === todayIdx)
            .map((c) => c.itemIndex)
        );
        setCompletedItems(done);
      })
      .catch(console.error)
      .finally(() => setIsLoadingPlan(false));
  }, [todayIdx]);
  const todaysWorkoutItems = workoutPlan?.content.days?.[String(todayIdx)]?.items || [];
  const workoutDoneCount = todaysWorkoutItems.filter((_, i) => completedItems.has(i)).length;

  const toggleWorkoutItem = async (itemIndex: number) => {
    if (!workoutPlan) return;
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemIndex)) next.delete(itemIndex); else next.add(itemIndex);
      return next;
    });
    try {
      await api.completePlanItem(workoutPlan.id, todayIdx, itemIndex);
    } catch (err) {
      console.error('Failed to persist workout completion:', err);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 space-y-4"
      style={{
        background: 'var(--hl-surface)',
        border: '1px solid var(--hl-border)',
        boxShadow: 'var(--hl-shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
        <h2
          className="text-base font-bold flex items-center gap-2"
          style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
        >
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'var(--hl-green-light)' }}
          >📋</span>
          Today's Focus
        </h2>
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-tertiary)' }}
        >
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-3">

        {/* ─── Recent Meals ─── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="hl-section-label">Recent Meals</p>
            <button
              onClick={() => onSelectTab('nutrition')}
              className="text-[10px] font-bold flex items-center gap-0.5 transition-colors"
              style={{ color: 'var(--hl-green)' }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {recentMeals.length > 0 ? (
            <div className="space-y-2">
              {recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-3 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
                >
                  <div className="flex items-center gap-3">
                    {meal.image ? (
                      <img src={meal.image} alt={meal.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'var(--hl-green-light)' }}
                      >
                        <Utensils className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold truncate max-w-[130px]" style={{ color: 'var(--hl-text-primary)' }}>{meal.name}</p>
                      <p className="text-[10px] capitalize" style={{ color: 'var(--hl-text-tertiary)' }}>{meal.category} · {meal.calories} kcal</p>
                    </div>
                  </div>
                  {meal.completed ? (
                    <span className="hl-badge hl-badge-green">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectTab('nutrition')}
                      className="hl-btn-primary"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.6rem' }}
                    >
                      Log
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-4 rounded-2xl text-center"
              style={{ background: 'var(--hl-surface-alt)', border: '1px dashed var(--hl-border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>No meals logged yet today.</p>
              <button
                onClick={() => onSelectTab('nutrition')}
                className="mt-2 text-xs font-bold transition-colors"
                style={{ color: 'var(--hl-green)' }}
              >
                + Add your first meal →
              </button>
            </div>
          )}
        </div>

        {/* ─── Workout ─── */}
        <div
          className="p-3 rounded-2xl space-y-2 transition-all"
          style={{ background: 'var(--hl-peach-light)', border: '1px solid var(--hl-peach-border)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--hl-peach)', boxShadow: '0 2px 8px rgba(244,149,106,0.3)' }}
              >
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>Workout Plan</p>
                {isLoadingPlan ? (
                  <Skeleton width="120px" height="0.6rem" />
                ) : workoutPlan ? (
                  <p className="text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>
                    {todaysWorkoutItems.length > 0
                      ? `${workoutDoneCount}/${todaysWorkoutItems.length} exercises done today`
                      : "Rest day — no exercises today"}
                  </p>
                ) : (
                  <p className="text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>No active workout plan</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectTab('plan-builder')}
              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white transition-all hover:scale-105 shrink-0 flex items-center gap-1"
              style={{ background: 'var(--hl-peach)', boxShadow: '0 2px 6px rgba(244,149,106,0.35)' }}
            >
              {workoutPlan ? <>View <ChevronRight className="w-3 h-3" /></> : <><Sparkles className="w-3 h-3" /> Get a plan</>}
            </button>
          </div>

          {!isLoadingPlan && workoutPlan && todaysWorkoutItems.length > 0 && (
            <ul className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--hl-peach-border)' }}>
              {todaysWorkoutItems.slice(0, 3).map((item, i) => {
                const done = completedItems.has(i);
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleWorkoutItem(i)}
                      className="w-full flex items-center gap-2 text-left"
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: done ? 'var(--hl-peach)' : 'var(--hl-border)' }}
                      />
                      <span
                        className="text-[11px]"
                        style={{
                          color: done ? 'var(--hl-text-tertiary)' : 'var(--hl-text-primary)',
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {item.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ─── Hydration ─── */}
        <div
          className="p-3 rounded-2xl"
          style={{ background: 'var(--hl-teal-light)', border: '1px solid var(--hl-teal-border)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--hl-teal)', boxShadow: '0 2px 8px rgba(74,155,142,0.3)' }}
              >
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>Hydration</p>
                <p className="text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>
                  {(macros.waterConsumedMl / 1000).toFixed(1)}L / {(macros.waterGoalMl / 1000).toFixed(1)}L · {waterPct}%
                </p>
              </div>
            </div>
            <button
              onClick={() => onLogWater(250)}
              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white transition-all hover:scale-105"
              style={{ background: 'var(--hl-teal)', boxShadow: '0 2px 6px rgba(74,155,142,0.35)' }}
            >
              +250ml
            </button>
          </div>
          {/* Water progress bar */}
          <div className="hl-progress-track" style={{ background: 'rgba(74,155,142,0.18)', height: '6px' }}>
            <div
              className="hl-progress-fill"
              style={{ width: `${waterPct}%`, background: 'var(--hl-teal)' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
