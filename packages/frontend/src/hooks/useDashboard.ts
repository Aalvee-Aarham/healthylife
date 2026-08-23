import { useState, useEffect, useCallback } from 'react';
import { DailyMacros, MealItem, WaterLogEntry } from '../types';
import { api } from '../services/api';
import { initialMacros, mockMeals } from '../data/mockData';

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
  const [macros, setMacros] = useState<DailyMacros>(initialMacros);
  const [meals, setMeals] = useState<MealItem[]>(mockMeals);
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
    setMeals((prev) => [newMeal, ...prev]);
    setMacros((prev) => ({
      ...prev,
      caloriesConsumed: prev.caloriesConsumed + newMeal.calories,
      proteinConsumedG: prev.proteinConsumedG + newMeal.protein,
      carbsConsumedG: prev.carbsConsumedG + newMeal.carbs,
      fatsConsumedG: prev.fatsConsumedG + newMeal.fat,
    }));
  }, []);

  const toggleMeal = useCallback(async (id: string) => {
    const updated = await api.toggleMeal(id);
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }, []);

  return { macros, meals, waterLogs, isLoading, error, logWater, setWaterTotal, addMeal, toggleMeal, refetch };
}
