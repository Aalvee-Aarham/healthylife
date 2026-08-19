import {
  UserProfile,
  DailyMacros,
  MealItem,
  WorkoutRoutine,
  CyclePhaseInfo,
  SymptomLog,
  SocialPost,
  Challenge,
  ClientRecord,
  CoachSession,
  AdminSystemStats,
  SystemUser,
  AIApiLog
} from '../types';

export const demoProfiles: Record<'member' | 'coach' | 'admin', UserProfile> = {
  member: {
    id: 'u_member_01',
    name: 'Sarah Jenkins',
    email: 'sarah.j@healthylife.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'member',
    gender: 'female',
    goal: 'Cycle Alignment & Lean Tone',
    activityLevel: 'moderate',
    title: 'Vitality Pro Member',
    streakDays: 24,
    vitalityScore: 94,
    weightCurrentKg: 62.4,
    weightTargetKg: 60.0,
    heightCm: 168,
    age: 28,
    cyclePhase: 'ovulation',
    cycleDay: 14
  },
  coach: {
    id: 'u_coach_01',
    name: 'Dr. Alex Rivera',
    email: 'alex.rivera@healthylife.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'coach',
    gender: 'male',
    goal: 'Hypertrophy & Longevity',
    activityLevel: 'very_active',
    title: 'Master Bio-Fitness & Nutrition Coach',
    streakDays: 142,
    vitalityScore: 99,
    weightCurrentKg: 78.0,
    weightTargetKg: 78.0,
    heightCm: 182,
    age: 36
  },
  admin: {
    id: 'u_admin_01',
    name: 'Marcus Vance',
    email: 'admin.marcus@healthylife.app',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    role: 'admin',
    gender: 'male',
    goal: 'Metabolic Optimization',
    activityLevel: 'active',
    title: 'Platform System Lead & Admin',
    streakDays: 365,
    vitalityScore: 100,
    weightCurrentKg: 75.0,
    weightTargetKg: 75.0,
    heightCm: 178,
    age: 34
  }
};

export const initialProfile: UserProfile = demoProfiles.member;

export const mockAdminStats: AdminSystemStats = {
  totalUsers: 14280,
  activeMembers: 11450,
  certifiedCoaches: 184,
  mrrDollars: 84250,
  groqApiCallCount: 142980,
  avgAiLatencyMs: 145,
  serverHealth: '99.99% Operational'
};

export const mockSystemUsers: SystemUser[] = [
  { id: 'usr_101', name: 'Sarah Jenkins', email: 'sarah.j@healthylife.app', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', role: 'member', status: 'Active', joinedDate: '2025-01-12', plan: 'Vitality Plus' },
  { id: 'usr_102', name: 'Dr. Alex Rivera', email: 'alex.rivera@healthylife.app', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', role: 'coach', status: 'Active', joinedDate: '2024-11-04', plan: 'Pro Coach' },
  { id: 'usr_103', name: 'Marcus Vance', email: 'admin.marcus@healthylife.app', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', role: 'admin', status: 'Active', joinedDate: '2024-08-01', plan: 'Admin Suite' },
  { id: 'usr_104', name: 'Elena Rostova', email: 'elena.r@example.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', role: 'member', status: 'Active', joinedDate: '2025-02-14', plan: 'Vitality Plus' },
  { id: 'usr_105', name: 'Coach Jessica Taylor', email: 'jessica.t@example.com', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', role: 'coach', status: 'Pending Approval', joinedDate: '2025-03-01', plan: 'Pro Coach' },
  { id: 'usr_106', name: 'Liam Hemsworth', email: 'liam.h@example.com', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', role: 'member', status: 'Active', joinedDate: '2025-02-28', plan: 'Free' }
];

export const mockAILogs: AIApiLog[] = [
  { id: 'log_901', timestamp: '14:02:11', endpoint: '/chat/completions', model: 'llama-3.3-70b-versatile', tokensUsed: 420, latencyMs: 142, requestedByRole: 'member', status: '200 OK' },
  { id: 'log_902', timestamp: '14:00:45', endpoint: '/chat/completions', model: 'llama-3.3-70b-versatile', tokensUsed: 680, latencyMs: 185, requestedByRole: 'coach', status: '200 OK' },
  { id: 'log_903', timestamp: '13:58:12', endpoint: '/chat/completions', model: 'llama3-8b-8192', tokensUsed: 310, latencyMs: 98, requestedByRole: 'admin', status: '200 OK' },
  { id: 'log_904', timestamp: '13:52:00', endpoint: '/chat/completions', model: 'llama-3.3-70b-versatile', tokensUsed: 512, latencyMs: 160, requestedByRole: 'member', status: '200 OK' }
];

export const initialMacros: DailyMacros = {
  caloriesConsumed: 1420,
  caloriesGoal: 1950,
  proteinConsumedG: 98,
  proteinGoalG: 130,
  carbsConsumedG: 145,
  carbsGoalG: 210,
  fatsConsumedG: 48,
  fatsGoalG: 65,
  waterConsumedMl: 2250,
  waterGoalMl: 3000
};

export const mockMeals: MealItem[] = [
  {
    id: 'm1',
    name: 'Avocado & Soft-Boiled Egg Sourdough with Microgreens',
    calories: 420,
    protein: 22,
    carbs: 38,
    fat: 20,
    time: '08:30 AM',
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    aiTag: 'High Choline • Follicular Support',
    completed: true
  },
  {
    id: 'm2',
    name: 'Wild Salmon Bowl with Quinoa, Edamame & Sesame Ginger Dressing',
    calories: 580,
    protein: 44,
    carbs: 52,
    fat: 22,
    time: '01:15 PM',
    category: 'lunch',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    aiTag: 'Omega-3 Peak • Anti-Inflammatory',
    completed: true
  },
  {
    id: 'm3',
    name: 'Matcha Collagen Latte & Roasted Almonds',
    calories: 180,
    protein: 12,
    carbs: 14,
    fat: 10,
    time: '04:00 PM',
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    aiTag: 'Steady Energy • Skin Glow',
    completed: true
  },
  {
    id: 'm4',
    name: 'Herb-Roasted Chicken Breast with Sweet Potato Puree & Asparagus',
    calories: 520,
    protein: 48,
    carbs: 42,
    fat: 16,
    time: '07:30 PM',
    category: 'dinner',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
    aiTag: 'Glycogen Replenish • Muscle Repair',
    completed: false
  }
];

export const mockWorkouts: WorkoutRoutine[] = [
  {
    id: 'w1',
    title: 'Morning Sculpt & Core Flow',
    durationMinutes: 35,
    caloriesBurned: 310,
    level: 'Intermediate',
    moodFocus: 'Energized',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    exercises: [
      {
        id: 'ex1',
        name: 'Cat-Cow to Downward Dog Warmup',
        category: 'warmup',
        targetMuscle: 'Spine & Shoulders',
        sets: [{ setNumber: 1, reps: 10, weightKg: 0, completed: true }],
        durationMinutes: 5,
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80',
        tips: 'Keep core engaged and inhale slowly through nose.'
      },
      {
        id: 'ex2',
        name: 'Dumbbell Romanian Deadlift',
        category: 'main',
        targetMuscle: 'Glutes & Hamstrings',
        sets: [
          { setNumber: 1, reps: 12, weightKg: 12, completed: true },
          { setNumber: 2, reps: 10, weightKg: 14, completed: true },
          { setNumber: 3, reps: 10, weightKg: 14, completed: false }
        ],
        thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=300&q=80',
        tips: 'Hinge at the hips, keeping back neutral and flat.'
      },
      {
        id: 'ex3',
        name: 'Curtsy Lunge with Overhead Press',
        category: 'main',
        targetMuscle: 'Legs & Shoulders',
        sets: [
          { setNumber: 1, reps: 12, weightKg: 8, completed: true },
          { setNumber: 2, reps: 12, weightKg: 8, completed: false }
        ],
        thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=300&q=80',
        tips: 'Exhale as you drive through the front heel.'
      },
      {
        id: 'ex4',
        name: 'Plank Shoulder Taps to Knee-to-Elbow',
        category: 'main',
        targetMuscle: 'Deep Abdominals & Obliques',
        sets: [
          { setNumber: 1, reps: 16, weightKg: 0, completed: false },
          { setNumber: 2, reps: 16, weightKg: 0, completed: false }
        ],
        thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
        tips: 'Minimize hip swaying by squeezing glutes.'
      },
      {
        id: 'ex5',
        name: 'Child’s Pose & Pigeon Stretch',
        category: 'cooldown',
        targetMuscle: 'Hips & Lower Back',
        sets: [{ setNumber: 1, reps: 1, weightKg: 0, completed: false }],
        durationMinutes: 5,
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',
        tips: 'Breathe deeply for 5 counts in, 5 counts out.'
      }
    ]
  },
  {
    id: 'w2',
    title: 'Hormone-Balancing Restorative Pilates',
    durationMinutes: 25,
    caloriesBurned: 180,
    level: 'Beginner',
    moodFocus: 'Stressed',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    exercises: []
  },
  {
    id: 'w3',
    title: 'Ovulation Peak Strength & HIIT Boost',
    durationMinutes: 45,
    caloriesBurned: 480,
    level: 'Advanced',
    moodFocus: 'Energized',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    exercises: []
  }
];

export const cyclePhasesData: Record<string, CyclePhaseInfo> = {
  follicular: {
    phase: 'follicular',
    name: 'Follicular Phase',
    daysRange: 'Days 6 - 13',
    estrogenLevel: 'Rising Steady',
    energyLevel: 'High & Rising',
    nutritionAdvice: 'Focus on fermented foods, light complex carbs, sprouted grains, and leafy greens.',
    workoutAdvice: 'Great time for learning new athletic skills, endurance running, and resistance training.',
    mindsetAdvice: 'Brainstorming, starting new projects, social planning.',
    color: '#10B981' // emerald
  },
  ovulation: {
    phase: 'ovulation',
    name: 'Ovulatory Phase (Current)',
    daysRange: 'Days 14 - 17',
    estrogenLevel: 'Peak Peak',
    energyLevel: 'Maximum Vitality',
    nutritionAdvice: 'Incorporate fiber-rich cruciferous vegetables, raw salad greens, berries, and antioxidant boost.',
    workoutAdvice: 'Ideal for PR attempts, high intensity workouts, heavy lifts, and group fitness classes.',
    mindsetAdvice: 'High communication skill, public presentations, key negotiation.',
    color: '#8B5CF6' // violet
  },
  luteal: {
    phase: 'luteal',
    name: 'Luteal Phase',
    daysRange: 'Days 18 - 28',
    estrogenLevel: 'Progesterone High',
    energyLevel: 'Waning Strength',
    nutritionAdvice: 'Magnesium-rich foods (dark chocolate, pumpkin seeds), sweet potatoes, and roasted root vegetables.',
    workoutAdvice: 'Focus on moderate weightlifting, steady-state cardio, and reformer Pilates.',
    mindsetAdvice: 'Completing tasks, organizing, deep analytical focus.',
    color: '#F59E0B' // amber
  },
  menstrual: {
    phase: 'menstrual',
    name: 'Menstrual Phase',
    daysRange: 'Days 1 - 5',
    estrogenLevel: 'Lowest Baseline',
    energyLevel: 'Introspective',
    nutritionAdvice: 'Iron-rich broths, cooked warm stews, ginger tea, and healthy fats like avocado and ghee.',
    workoutAdvice: 'Gentle yin yoga, mobility walks, foam rolling, and complete rest days.',
    mindsetAdvice: 'Self-reflection, setting boundaries, deep rest.',
    color: '#EC4899' // pink
  }
};

export const initialSymptoms: SymptomLog[] = [
  { id: 's1', symptom: 'Energetic Peak', icon: '⚡', category: 'energy', logged: true },
  { id: 's2', symptom: 'High Focus', icon: '🎯', category: 'mood', logged: true },
  { id: 's3', symptom: 'Glowing Skin', icon: '✨', category: 'physical', logged: true },
  { id: 's4', symptom: 'Mild Bloating', icon: '🌊', category: 'physical', logged: false },
  { id: 's5', symptom: 'Cravings (Sweet)', icon: '🍫', category: 'physical', logged: false },
  { id: 's6', symptom: 'Calm & Grounded', icon: '🧘', category: 'mood', logged: false },
  { id: 's7', symptom: 'Sore Muscles', icon: '💪', category: 'physical', logged: false }
];

export const mockSocialPosts: SocialPost[] = [
  {
    id: 'p1',
    author: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    timeAgo: '2 hours ago',
    content: 'Hit a new PR on Romanian Deadlifts today (75kg x 8 reps) during my Ovulation Peak phase! Aligning my strength training with CycleSync has completely changed my recovery.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    likes: 42,
    comments: 8,
    isLiked: true,
    badge: '🏆 Ovulation PR'
  },
  {
    id: 'p2',
    author: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    timeAgo: '5 hours ago',
    content: '6-Month Consistency Transformation! From feeling drained every afternoon to having steady metabolic energy and fitting into my favorite jeans again. Bio-nutrition was the key.',
    beforeAfterImages: {
      before: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      after: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      timeSpan: '6 Months Difference'
    },
    likes: 128,
    comments: 24,
    isLiked: false,
    badge: '🔥 180-Day Streak'
  },
  {
    id: 'p3',
    author: 'Coach Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    timeAgo: '1 day ago',
    content: 'Pro Tip: Don’t treat every day the same in the gym. On high-stress days, lower the load by 20% and focus on breath control to keep cortisol low and preserve lean tissue.',
    likes: 89,
    comments: 14,
    isLiked: false,
    badge: '⭐ Pro Coach Insight'
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    title: '21-Day Summer Sculpt & Flow',
    description: 'Complete 4 sculpt workouts weekly and hit 8,000 steps daily to earn the Golden Vitality Badge.',
    participantsCount: 1420,
    daysRemaining: 12,
    progressPercent: 65,
    category: 'Workouts',
    reward: 'Exclusive Holographic Badge + 500 VitaPoints',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    isJoined: true
  },
  {
    id: 'c2',
    title: 'Hydration Hero 3L Daily Challenge',
    description: 'Reach 3000ml water intake every day for 14 consecutive days. Keep your cellular energy high.',
    participantsCount: 890,
    daysRemaining: 5,
    progressPercent: 80,
    category: 'Wellness',
    reward: 'Custom VitaFlow Water Bottle Drop',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=600&q=80',
    isJoined: true
  },
  {
    id: 'c3',
    title: 'Whole Foods Bio-Reset',
    description: 'Zero processed sugars for 10 days. Receive AI daily recipes aligned with your current cycle.',
    participantsCount: 2310,
    daysRemaining: 18,
    progressPercent: 20,
    category: 'Nutrition',
    reward: 'Pro Nutrition E-Book & Recipe Access',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    isJoined: false
  }
];

export const mockClients: ClientRecord[] = [
  {
    id: 'cl1',
    name: 'Chloe Zhang',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    planName: 'Hypertrophy & Cycle Alignment',
    status: 'On Track',
    adherencePercent: 94,
    lastActive: '10 mins ago',
    notes: 'Lifting heavy in Ovulation phase. Felt great on 70kg squats.',
    email: 'chloe.z@example.com'
  },
  {
    id: 'cl2',
    name: 'David Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    planName: 'Body Recomposition & High Protein',
    status: 'Needs Review',
    adherencePercent: 78,
    lastActive: '2 hours ago',
    notes: 'Missed yesterday’s dinner macro goal due to business travel. Needs travel meal ideas.',
    email: 'david.m@example.com'
  },
  {
    id: 'cl3',
    name: 'Aaliyah Patel',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    planName: 'Postpartum Pilates & Mobility',
    status: 'High Energy',
    adherencePercent: 98,
    lastActive: '1 hour ago',
    notes: 'Core strength recovered significantly. Ready to increase dumbbell weights.',
    email: 'aaliyah.p@example.com'
  }
];

export const mockSessions: CoachSession[] = [
  {
    id: 'cs1',
    clientName: 'Chloe Zhang',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    time: '10:00 AM Today',
    type: 'Video Consultation',
    status: 'In Progress'
  },
  {
    id: 'cs2',
    clientName: 'David Miller',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    time: '02:30 PM Today',
    type: 'Nutritional Audit',
    status: 'Upcoming'
  },
  {
    id: 'cs3',
    clientName: 'Aaliyah Patel',
    clientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    time: '11:15 AM Tomorrow',
    type: 'Form Check',
    status: 'Upcoming'
  }
];
