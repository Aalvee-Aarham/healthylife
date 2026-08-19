export type UserRole = 'member' | 'coach' | 'admin';

export type CoachSpecialty = 'nutritionist' | 'trainer';

export type NavigationTab =
  | 'home'
  | 'signin'
  | 'signup'
  | 'signout'
  | 'ai-assistant'
  | 'dashboard'
  | 'nutrition'
  | 'workouts'
  | 'water'
  | 'chat'
  | 'cycle'
  | 'coach-dashboard'
  | 'admin-dashboard'
  | 'clients'
  | 'consultations'
  | 'plan-builder';

export type ApiStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  gender?: 'female' | 'male' | 'other';
  goal?: string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | string;
  coachSpecialty?: CoachSpecialty;
  title?: string;
  streakDays?: number;
  vitalityScore?: number;
  cyclePhase?: 'follicular' | 'ovulation' | 'luteal' | 'menstrual';
  cycleDay?: number;
  weightCurrentKg?: number;
  weightTargetKg?: number;
  heightCm?: number;
  age?: number;
  caloriesGoal?: number;
  proteinGoalG?: number;
  carbsGoalG?: number;
  fatsGoalG?: number;
  waterGoalMl?: number;
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
  loggedAt?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image?: string;
  aiTag?: string;
  completed?: boolean;
}

export interface MealPlan {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  notes?: string;
}

export interface WaterLogEntry {
  id: string;
  amountMl: number;
  loggedAt: string;
  time: string;
}

export interface GymLogSet {
  id: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface GymLog {
  id: string;
  title: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  notes?: string;
  loggedAt: string;
  date: string;
  sets: GymLogSet[];
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
  thumbnail: string;
  tips: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  image: string;
  moodFocus?: string;
  exercises: Exercise[];
}

export interface CoachPartner {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  coachSpecialty?: CoachSpecialty;
  title?: string;
  specialty?: CoachSpecialty;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  time: string;
  isMine: boolean;
}

export interface Conversation {
  id: string;
  partner: CoachPartner;
  lastMessage?: ChatMessage;
}

export interface ClientRecord {
  id: string;
  name: string;
  avatar: string;
  email: string;
  planName: string;
  status: string;
  adherencePercent: number;
  lastActive: string;
  notes: string;
}

export interface CoachSession {
  id: string;
  clientName: string;
  clientAvatar?: string;
  date?: string;
  time: string;
  type: string;
  status?: string;
}

export interface CyclePeriod {
  id: string;
  started_on: string;       // YYYY-MM-DD
  ended_on: string | null;  // null = still on period
  flow: 'spotting' | 'light' | 'medium' | 'heavy';
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

export interface CycleStatus {
  hasData: boolean;
  cycleDay: number | null;
  avgCycleLength: number;
  phase: CyclePhase;
  phaseDay: number | null;
  periodStartedOn: string | null;
  periodEndedOn: string | null;
  isOnPeriod: boolean;
  nextPeriodOn: string | null;
  ovulationOn: string | null;
  fertileDays: string[];       // YYYY-MM-DD dates
  todaysSymptoms: string[];    // symptom_key strings logged today
}

export interface CycleSymptomDef {
  key: string;
  label: string;
  icon: string;
  category: 'physical' | 'mood' | 'energy' | 'digestive';
}

export interface CyclePhaseInfo {
  phase?: string;
  name?: string;
  color?: string;
  dayRange?: string;
  daysRange?: string;
  estrogen?: string;
  estrogenLevel?: string;
  progesterone?: string;
  energyLevel?: string;
  nutritionAdvice?: string[] | string;
  trainingAdvice?: string[] | string;
  workoutAdvice?: string[] | string;
  mindsetAdvice?: string[] | string;
  vitalityTip?: string;
}

export interface SymptomLog {
  id?: string;
  symptom?: string;
  name?: string;
  icon?: string;
  severity?: 'mild' | 'moderate' | 'severe' | string;
  category?: string;
  loggedAt?: string;
  logged?: boolean | string;
  time?: string;
}

export interface SocialPost {
  id: string;
  author?: string | { name: string; avatar: string; role: string };
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  avatar?: string;
  badge?: string;
  content: string;
  image?: string;
  beforeAfterImages?: { before: string; after: string; timeSpan?: string } | Array<string | { before: string; after: string }>;
  likes: number;
  comments: number;
  isLiked?: boolean;
  timeAgo: string;
  tags?: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participantsCount: number;
  durationDays?: number;
  daysRemaining?: number;
  category: string;
  reward?: string;
  rewardBadge?: string;
  image?: string;
  progressPercent?: number;
  isJoined?: boolean;
}

export interface AdminSystemStats {
  totalUsers: number;
  activeMembers: number;
  activeCoaches?: number;
  certifiedCoaches?: number;
  mrrDollars?: number;
  dailyActiveUsers?: number;
  groqApiLatencyMs?: number;
  avgAiLatencyMs?: number;
  groqApiRequestsToday?: number;
  groqApiCallCount?: number;
  errorRate?: number;
  serverHealth?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending' | string;
  joinedDate: string;
  lastActive?: string;
}

export interface AIApiLog {
  id: string;
  endpoint?: string;
  timestamp: string;
  userId?: string;
  userRole?: UserRole;
  requestedByRole?: UserRole | string;
  model: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  tokensUsed?: number;
  latencyMs: number;
  status: 'success' | 'rate_limited' | 'error' | string;
  category?: string;
}
