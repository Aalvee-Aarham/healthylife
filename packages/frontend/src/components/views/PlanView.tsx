import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, Plan, PlanItem, PlanNutritionItem, PlanWorkoutItem } from '../../types';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton, SkeletonCard, SkeletonText } from '../ui/Skeleton';
import { CheckCircle2, Circle, Sparkles, Utensils, Dumbbell } from 'lucide-react';

interface PlanViewProps {
  user: UserProfile;
  /** Called after a check adds/removes a meal or gym log, so other tabs can refresh. */
  onLogsChanged?: () => void;
}

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** JS Date.getDay() is 0=Sunday..6=Saturday. Plan convention is 0=Monday..6=Sunday. */
function todayPlanDayIndex(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

function isNutritionItem(item: PlanItem): item is PlanNutritionItem {
  return (item as PlanNutritionItem).calories !== undefined;
}

// Local-only completion tracking: { [planId]: { "dayOfWeek-itemIndex": true } }
type CompletionMap = Record<string, Record<string, boolean>>;

const PlanSection: React.FC<{
  type: 'nutrition' | 'workout';
  plan: Plan | null;
  completions: CompletionMap;
  onToggle: (plan: Plan, dayOfWeek: number, itemIndex: number) => void;
  onGenerate: (type: 'nutrition' | 'workout') => void;
  generating: boolean;
}> = ({ type, plan, completions, onToggle, onGenerate, generating }) => {
  const today = todayPlanDayIndex();
  const Icon = type === 'nutrition' ? Utensils : Dumbbell;
  const label = type === 'nutrition' ? 'Nutrition Plan' : 'Workout Plan';

  if (!plan) {
    return (
      <Card padding="p-6" className="text-center space-y-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-tertiary)' }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
            No active {label.toLowerCase()} yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
            Let AI build a personalized weekly {type} plan for you.
          </p>
        </div>
        <Button variant={type === 'nutrition' ? 'primary' : 'peach'} onClick={() => onGenerate(type)} loading={generating}>
          <Sparkles className="w-3.5 h-3.5" /> Generate my AI plan
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>{plan.title}</h3>
        </div>
        <Badge variant={type === 'nutrition' ? 'green' : 'peach'}>
          {plan.createdBy === 'ai' ? 'AI-generated' : plan.createdBy === 'trainer' ? 'From your trainer' : 'From your nutritionist'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {DAY_LABELS.map((dayLabel, dayIdx) => {
          const dayKey = String(dayIdx);
          const day = plan.content.days?.[dayKey];
          const isToday = dayIdx === today;

          return (
            <Card
              key={dayKey}
              padding="p-4"
              className="space-y-2"
              style={isToday ? { border: '1.5px solid var(--hl-green)', background: 'var(--hl-green-light)' } : undefined}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                  {day?.label || dayLabel}
                </p>
                {isToday && <Badge variant="green">Today</Badge>}
              </div>

              {!day || day.items.length === 0 ? (
                <p className="text-[11px]" style={{ color: 'var(--hl-text-tertiary)' }}>Rest day / no items.</p>
              ) : (
                <ul className="space-y-1.5">
                  {day.items.map((item, itemIdx) => {
                    const key = `${dayIdx}-${itemIdx}`;
                    const completed = !!completions[plan.id]?.[key];
                    return (
                      <li key={itemIdx}>
                        <button
                          onClick={() => onToggle(plan, dayIdx, itemIdx)}
                          className="w-full flex items-start gap-2 text-left"
                        >
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--hl-green)' }} />
                          ) : (
                            <Circle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }} />
                          )}
                          <span className="flex-1">
                            <span
                              className="text-[11px] font-semibold block"
                              style={{
                                color: completed ? 'var(--hl-text-tertiary)' : 'var(--hl-text-primary)',
                                textDecoration: completed ? 'line-through' : 'none',
                              }}
                            >
                              {item.name}
                            </span>
                            {isNutritionItem(item) ? (
                              <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                                {item.category} · {item.calories} kcal · P{item.protein}/C{item.carbs}/F{item.fat}
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                                {(item as PlanWorkoutItem).sets} sets × {(item as PlanWorkoutItem).reps} reps
                                {(item as PlanWorkoutItem).notes ? ` · ${(item as PlanWorkoutItem).notes}` : ''}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const PlanView: React.FC<PlanViewProps> = ({ user, onLogsChanged }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState<'nutrition' | 'workout' | null>(null);
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [logNotice, setLogNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!logNotice) return;
    const timer = setTimeout(() => setLogNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [logNotice]);

  const load = () => {
    setIsLoading(true);
    api.getPlans()
      .then((fetched) => {
        setPlans(fetched);
        setCompletions((prev) => {
          const next = { ...prev };
          for (const plan of fetched) {
            const planMap: Record<string, boolean> = {};
            for (const c of plan.completions || []) {
              planMap[`${c.dayOfWeek}-${c.itemIndex}`] = true;
            }
            next[plan.id] = planMap;
          }
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const nutritionPlan = useMemo(
    () => plans.find((p) => p.type === 'nutrition' && p.status === 'active') || null,
    [plans]
  );
  const workoutPlan = useMemo(
    () => plans.find((p) => p.type === 'workout' && p.status === 'active') || null,
    [plans]
  );

  const handleGenerate = async (type: 'nutrition' | 'workout') => {
    setGenerating(type);
    setGenerateError(null);
    try {
      const newPlan = await api.generateAiPlan(type);
      setPlans((prev) => [...prev.filter((p) => !(p.type === type && p.status === 'active')), newPlan]);
    } catch (err) {
      console.error('Failed to generate plan:', err);
      setGenerateError(`Couldn't generate your ${type} plan. Please try again in a moment.`);
    } finally {
      setGenerating(null);
    }
  };

  const handleToggle = async (plan: Plan, dayOfWeek: number, itemIndex: number) => {
    const key = `${dayOfWeek}-${itemIndex}`;
    // Optimistic toggle
    setCompletions((prev) => {
      const planMap = { ...(prev[plan.id] || {}) };
      planMap[key] = !planMap[key];
      return { ...prev, [plan.id]: planMap };
    });
    try {
      const result = await api.completePlanItem(plan.id, dayOfWeek, itemIndex);
      const itemName = plan.content.days?.[String(dayOfWeek)]?.items?.[itemIndex]?.name ?? 'Item';
      const destination = plan.type === 'nutrition' ? 'Nutrition & Macros' : 'Gym Log';
      setLogNotice(result.completed ? `✓ "${itemName}" logged to ${destination}` : `"${itemName}" removed from ${destination}`);
      onLogsChanged?.();
    } catch (err) {
      console.error('Failed to persist completion:', err);
      // Revert on failure
      setCompletions((prev) => {
        const planMap = { ...(prev[plan.id] || {}) };
        planMap[key] = !planMap[key];
        return { ...prev, [plan.id]: planMap };
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <Skeleton width="240px" height="1.5rem" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8 animate-fade-slide-up">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
          My Plans
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
          Your weekly nutrition and workout plans, Monday through Sunday.
        </p>
      </div>

      {logNotice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg animate-fade-slide-up bg-green-50 border border-green-200 text-green-700"
        >
          {logNotice}
        </div>
      )}

      {generateError && (
        <div className="p-3 rounded-2xl text-xs font-bold bg-red-50 border border-red-200 text-red-700">
          {generateError}
        </div>
      )}

      <PlanSection
        type="nutrition"
        plan={nutritionPlan}
        completions={completions}
        onToggle={handleToggle}
        onGenerate={handleGenerate}
        generating={generating === 'nutrition'}
      />

      <PlanSection
        type="workout"
        plan={workoutPlan}
        completions={completions}
        onToggle={handleToggle}
        onGenerate={handleGenerate}
        generating={generating === 'workout'}
      />
    </div>
  );
};

export default PlanView;
