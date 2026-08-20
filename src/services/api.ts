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

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ────────────────────────────────────────────────────────────────────

  login: (email: string, password: string) =>
    post<{ user: any; token: string }>('/auth/login', { email, password }),

  register: (payload: Record<string, unknown>) =>
    post<{ user: any; token: string }>('/auth/register', payload),

  me: () =>
    get<any>('/auth/me'),

  logout: () =>
    post<void>('/auth/logout'),

  // ── Dashboard ───────────────────────────────────────────────────────────────

  dashboard: (date?: string) =>
    get<any>(`/dashboard${date ? `?date=${date}` : ''}`),

  // ── Meals ───────────────────────────────────────────────────────────────────

  getMeals: (date?: string) =>
    get<any[]>(`/meals${date ? `?date=${date}` : ''}`),

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

  addGymLog: (data: Record<string, unknown>) =>
    post<any>('/gym-logs', data),

  deleteGymLog: (id: string) =>
    del<{ success: boolean }>(`/gym-logs/${id}`),

  toggleGymLogSet: (logId: string, setId: string) =>
    post<any>(`/gym-logs/${logId}/sets/${setId}/toggle`),

  // ── Cycle Tracker ───────────────────────────────────────────────────────────

  getCycleStatus: () =>
    get<any>('/cycle/status'),

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

  getClients: () =>
    get<any[]>('/coach/clients'),
};
