import { useState, useEffect, useCallback } from 'react';
import { DailyMacros, MealItem, WaterLogEntry } from '../types';
import { api } from '../services/api';

const defaultMacros: DailyMacros = {
  caloriesConsumed: 0,
  caloriesGoal: 2000,
  proteinConsumedG: 0,
  proteinGoalG: 120,
  carbsConsumedG: 0,
  carbsGoalG: 220,
  fatsConsumedG: 0,
  fatsGoalG: 65,
  waterConsumedMl: 0,
  waterGoalMl: 2500,
};

export interface DashboardData {
  macros: DailyMacros;
  meals: MealItem[];
  waterLogs: WaterLogEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboard(isLoggedIn: boolean, dateStr?: string): DashboardData & {
  logWater: (amountMl: number) => Promise<void>;
  setWaterTotal: (totalMl: number) => void;
  addMeal: (data: Omit<MealItem, 'id' | 'time' | 'completed'> & { image?: string; logged_at?: string }) => Promise<void>;
  toggleMeal: (id: string) => Promise<void>;
  refetch: () => void;
} {
  const [macros, setMacros] = useState<DailyMacros>(defaultMacros);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      api.dashboard(dateStr),
      api.getMeals(dateStr),
      api.getWaterLogs(dateStr),
    ])
      .then(([dash, fetchedMeals, waterData]) => {
        setMacros(dash.macros);
        setMeals(fetchedMeals);
        setWaterLogs(waterData.logs);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load dashboard data.');
      })
      .finally(() => setIsLoading(false));
  }, [isLoggedIn, tick, dateStr]);

  const logWater = useCallback(async (amountMl: number) => {
    const { log, totalMl } = await api.logWater(amountMl);
    setWaterLogs((prev) => [log, ...prev]);
    setMacros((prev) => ({ ...prev, waterConsumedMl: totalMl }));
  }, []);

  // Update parent water total without triggering an API call.
  // Used when a child component (e.g. HydrationCard) already made the API call.
  const setWaterTotal = useCallback((totalMl: number) => {
    setMacros((prev) => ({ ...prev, waterConsumedMl: totalMl }));
  }, []);

  const addMeal = useCallback(async (data: any) => {
    const newMeal = await api.addMeal(data);
    // Optimistically prepend the new meal for instant UI feedback
    setMeals((prev) => [newMeal, ...prev]);
    // Re-fetch macro totals from backend SQL SUM aggregates — no JS arithmetic
    setTick((t) => t + 1);
  }, []);

  const toggleMeal = useCallback(async (id: string) => {
    const updated = await api.toggleMeal(id);
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }, []);

  return { macros, meals, waterLogs, isLoading, error, logWater, setWaterTotal, addMeal, toggleMeal, refetch };
}
