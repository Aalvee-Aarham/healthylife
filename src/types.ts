export type UserRole = 'member' | 'coach' | 'admin';

export type NavigationTab = 
  | 'home' 
  | 'signin'
  | 'signout'
  | 'ai-assistant'
  | 'dashboard' 
  | 'nutrition' 
  | 'workouts' 
  | 'cycle' 
  | 'community' 
  | 'coach-dashboard'
  | 'clients'
  | 'consultations'
  | 'plan-builder'
  | 'admin-dashboard'
  | 'user-management'
  | 'ai-logs'
  | 'content-moderation';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  title?: string;
  streakDays: number;
  vitalityScore: number;
  weightCurrentKg: number;
  weightTargetKg: number;
  heightCm: number;
  age: number;
  cyclePhase?: 'follicular' | 'ovulation' | 'luteal' | 'menstrual';
  cycleDay?: number;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  unit: string;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

export interface DailyMacros {
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumedG: number;
  proteinGoalG: number;
  carbsConsumedG: number;
  carbsGoalG: number;
  fatsConsumedG: number;
  fatsGoalG: number;
  waterConsumedMl: number;
  waterGoalMl: number;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image: string;
  aiTag?: string;
  completed?: boolean;
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'cooldown';
  targetMuscle: string;
  sets: ExerciseSet[];
  durationMinutes?: number;
  videoUrl?: string;
  thumbnail: string;
  tips: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  moodFocus: 'Energized' | 'Tired' | 'Stressed' | 'Calm';
  image: string;
  exercises: Exercise[];
}

export interface CyclePhaseInfo {
  phase: 'follicular' | 'ovulation' | 'luteal' | 'menstrual';
  name: string;
  daysRange: string;
  estrogenLevel: string;
  energyLevel: string;
  nutritionAdvice: string;
  workoutAdvice: string;
  mindsetAdvice: string;
  color: string;
}

export interface SymptomLog {
  id: string;
  symptom: string;
  icon: string;
  category: 'mood' | 'physical' | 'energy';
  logged: boolean;
}

export interface SocialPost {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
  image?: string;
  beforeAfterImages?: { before: string; after: string; timeSpan: string };
  likes: number;
  comments: number;
  isLiked?: boolean;
  badge?: string;
  status?: 'approved' | 'flagged' | 'pending';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participantsCount: number;
  daysRemaining: number;
  progressPercent: number;
  category: string;
  reward: string;
  image: string;
  isJoined?: boolean;
}

export interface ClientRecord {
  id: string;
  name: string;
  avatar: string;
  planName: string;
  status: 'On Track' | 'Needs Review' | 'High Energy' | 'Pending';
  adherencePercent: number;
  lastActive: string;
  notes: string;
  email: string;
}

export interface CoachSession {
  id: string;
  clientName: string;
  clientAvatar: string;
  time: string;
  type: 'Video Consultation' | 'Form Check' | 'Nutritional Audit';
  status: 'Upcoming' | 'Completed' | 'In Progress';
}

// Admin Specific Types
export interface AdminSystemStats {
  totalUsers: number;
  activeMembers: number;
  certifiedCoaches: number;
  mrrDollars: number;
  groqApiCallCount: number;
  avgAiLatencyMs: number;
  serverHealth: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: 'Active' | 'Suspended' | 'Pending Approval';
  joinedDate: string;
  plan: 'Free' | 'Vitality Plus' | 'Pro Coach' | 'Admin Suite';
}

export interface AIApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  requestedByRole: UserRole;
  status: '200 OK' | '429 RateLimit' | '500 Error';
}

