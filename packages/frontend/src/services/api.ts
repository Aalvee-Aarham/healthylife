// HealthyLife API Service — connects frontend to Laravel backend (http://localhost:8000)
const BASE_URL = '/api';

// ─── Auth token helpers ───────────────────────────────────────────────────────

const TOKEN_KEY = 'hl_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── Base request helper ──────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const err = await res.json();
      message = err?.message || err?.error || message;
    } catch {}
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

const get  = <T>(path: string)                 => request<T>('GET',    path);
const post = <T>(path: string, body?: unknown) => request<T>('POST',   path, body);
const patch= <T>(path: string, body?: unknown) => request<T>('PATCH',  path, body);
const del  = <T>(path: string)                 => request<T>('DELETE', path);

/** Multipart POST — used for image uploads (e.g. /meals/scan). */
async function postForm<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: form });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const err = await res.json();
      message = err?.message || err?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ────────────────────────────────────────────────────────────────────

  login: (email: string, password: string) =>
    post<{ user: any; token: string }>('/auth/login', { email, password }),

  register: (payload: Record<string, unknown>) =>
    post<{ user: any; token: string }>('/auth/register', payload),

  firebaseAuth: (payload: Record<string, unknown>) =>
    post<{ user: any; token: string }>('/auth/firebase', payload),

  me: () =>
    get<any>('/auth/me'),

  logout: () =>
    post<void>('/auth/logout'),

  // ── Dashboard ───────────────────────────────────────────────────────────────

  dashboard: (date?: string) =>
    get<any>(`/dashboard${date ? `?date=${date}` : ''}`),

  // ── Meals ───────────────────────────────────────────────────────────────────

  getMeals: (date?: string, category?: string) =>
    get<any[]>(
      `/meals${date || category ? '?' : ''}${date ? `date=${date}` : ''}${
        date && category ? '&' : ''
      }${category ? `category=${encodeURIComponent(category)}` : ''}`
    ),

  /** Per-category SQL aggregate: mealCount, totalCalories, totalProtein, totalCarbs, totalFat.
   *  Computed with GROUP BY + SUM in SQL — no JS reduce needed on the frontend. */
  getMealsByCategory: (date?: string) =>
    get<Array<{
      category: string;
      mealCount: number;
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
    }>>(`/meals/by-category${date ? `?date=${date}` : ''}`),

  addMeal: (data: Record<string, unknown>) =>
    post<any>('/meals', data),

  updateMeal: (id: string, data: Record<string, unknown>) =>
    patch<any>(`/meals/${id}`, data),

  deleteMeal: (id: string) =>
    del<{ success: boolean }>(`/meals/${id}`),

  toggleMeal: (id: string) =>
    post<any>(`/meals/${id}/toggle`),

  // ── Meal Plans ──────────────────────────────────────────────────────────────

  getMealPlans: () =>
    get<any[]>('/meal-plans'),

  createMealPlan: (data: Record<string, unknown>) =>
    post<any>('/meal-plans', data),

  updateMealPlan: (id: string, data: Record<string, unknown>) =>
    patch<any>(`/meal-plans/${id}`, data),

  deleteMealPlan: (id: string) =>
    del<{ success: boolean }>(`/meal-plans/${id}`),

  // ── Water Logs ──────────────────────────────────────────────────────────────

  getWaterLogs: (date?: string) =>
    get<{ logs: any[]; totalMl: number; goalMl: number }>(
      `/water-logs${date ? `?date=${date}` : ''}`
    ),

  logWater: (amountMl: number) =>
    post<{ log: any; totalMl: number; goalMl: number }>('/water-logs', { amountMl }),

  deleteWaterLog: (id: string) =>
    del<{ totalMl: number; goalMl: number }>(`/water-logs/${id}`),

  // ── Gym Logs ────────────────────────────────────────────────────────────────

  getGymLogs: () =>
    get<any[]>('/gym-logs'),

  /** Aggregate stats from the backend: totalWorkouts, totalSets, totalDuration, etc.
   *  Computed in SQL (COUNT/SUM/AVG + INTERSECT) — no JS arithmetic needed. */
  gymStats: () =>
    get<{
      totalWorkouts: number;
      totalSets: number;
      totalDurationMinutes: number;
      totalCaloriesBurned: number;
      avgSessionMinutes: number;
      consistentDays: string[];
    }>('/gym-logs/stats'),

  addGymLog: (data: Record<string, unknown>) =>
    post<any>('/gym-logs', data),

  deleteGymLog: (id: string) =>
    del<{ success: boolean }>(`/gym-logs/${id}`),

  toggleGymLogSet: (logId: string, setId: string) =>
    post<any>(`/gym-logs/${logId}/sets/${setId}/toggle`),

  // ── Cycle Tracker ───────────────────────────────────────────────────────────

  getCycleStatus: () =>
    get<any>('/cycle/status'),

  /** SQL Aggregators + LEFT JOIN analytics: totalPeriodsLogged, avgPeriodDurationDays, topSymptoms */
  getCycleAnalytics: () =>
    get<{
      totalPeriodsLogged: number;
      avgPeriodDurationDays: number;
      firstPeriodDate: string | null;
      latestPeriodDate: string | null;
      totalSymptomsDuringMenstruation: number;
      topSymptoms: Array<{ symptomKey: string; occurrences: number; lastLoggedOn: string }>;
      flowDistribution: Array<{ flow: string; count: number }>;
    }>('/cycle/analytics'),

  /** SQL UNION ALL chronological cycle events timeline */
  getCycleTimeline: () =>
    get<Array<{
      eventDate: string;
      eventType: string;
      title: string;
      phaseTag: string;
      refId: string | null;
    }>>('/cycle/timeline'),

  getCyclePeriods: () =>
    get<any[]>('/cycle/periods'),

  logPeriod: (data: { started_on: string; flow?: string }) =>
    post<any>('/cycle/periods', data),

  updatePeriod: (id: string, data: Record<string, unknown>) =>
    patch<any>(`/cycle/periods/${id}`, data),

  deletePeriod: (id: string) =>
    del<{ success: boolean }>(`/cycle/periods/${id}`),

  getCycleSymptoms: (from: string, to: string) =>
    get<any>(`/cycle/symptoms?from=${from}&to=${to}`),

  toggleCycleSymptom: (symptom_key: string, date: string) =>
    post<any>('/cycle/symptoms/toggle', { symptom_key, date }),

  // ── Chat ────────────────────────────────────────────────────────────────────

  getConversations: () =>
    get<any[]>('/chat/conversations'),

  getMessages: (conversationId: string) =>
    get<any[]>(`/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string) =>
    post<any>(`/chat/conversations/${conversationId}/messages`, { body: text }),

  startConversationWithCoach: (coachId: string) =>
    post<any>('/chat/start', { coachId }),

  // ── Coach Dashboard ─────────────────────────────────────────────────────────

  /** Server-side filtered list of clients (UNION SQL query).
   *  Pass `search` to filter by name in SQL (ILIKE) — no JS .filter() needed. */
  getClients: (search?: string) =>
    get<{ clients: any[]; totalClients: number; avgAdherencePct: number }>(
      `/coach/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),

  getMyCoaches: (search?: string) =>
    get<any[]>(`/chat/my-coaches${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // ── Coaches directory & self-assignment ─────────────────────────────────────

  getCoaches: (specialty?: string) =>
    get<import('../types').CoachListing[]>(`/coaches${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ''}`),

  assignCoach: (coachId: string, specialty: string) =>
    post<import('../types').CoachAssignment>('/coach-assignments', { coach_id: coachId, specialty }),

  removeCoachAssignment: (assignmentId: string) =>
    del<{ success: boolean }>(`/coach-assignments/${assignmentId}`),

  // ── Meal Presets ─────────────────────────────────────────────────────────────

  getMealPresets: () =>
    get<import('../types').MealPreset[]>('/meal-presets'),

  createMealPreset: (data: Record<string, unknown>) =>
    post<import('../types').MealPreset>('/meal-presets', data),

  deleteMealPreset: (id: string) =>
    del<{ success: boolean }>(`/meal-presets/${id}`),

  // ── AI-backed parsing / chat (replaces client-side Groq calls) ───────────────

  aiChat: (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, persona?: 'member' | 'coach') =>
    post<{ reply: string }>('/ai/chat', { messages, persona }),

  parseMealText: (text: string) =>
    post<import('../types').MealParseResult>('/meals/parse', { text }),

  scanMealImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return postForm<import('../types').MealParseResult>('/meals/scan', form);
  },

  parseGymLog: (text: string) =>
    post<import('../types').GymLogParseResult>('/gym-logs/parse', { text }),

  // ── Plans ──────────────────────────────────────────────────────────────────

  getPlans: (memberId?: string) =>
    get<import('../types').Plan[]>(`/plans${memberId ? `?member_id=${memberId}` : ''}`),

  createPlan: (data: Record<string, unknown>) =>
    post<import('../types').Plan>('/plans', data),

  generateAiPlan: (type: 'nutrition' | 'workout') =>
    post<import('../types').Plan>('/plans/generate-ai', { type }),

  completePlanItem: (planId: string, dayOfWeek: number, itemIndex: number) =>
    patch<import('../types').PlanCompletionResult>(`/plans/${planId}/complete`, { day_of_week: dayOfWeek, item_index: itemIndex }),
};
