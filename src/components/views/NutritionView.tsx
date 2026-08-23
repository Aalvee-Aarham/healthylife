import React, { useState, useEffect, useCallback } from 'react';
import { MealItem, MealPlan, DailyMacros, WaterLogEntry } from '../../types';
import { api } from '../../services/api';
import { askGroqAI } from '../../services/groqApi';
import { fetchPexelsImage } from '../../services/pexelsApi';
import {
  Utensils, Sparkles, Plus, Pencil, Trash2, X, Check,
  ChevronDown, ChevronUp, Send, Loader2, AlertCircle,
  Calendar, Clock, Camera, BookOpen, Flame, Zap, Droplet, Droplets, Bookmark,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface NutritionViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  meals: MealItem[];
  macros: DailyMacros;
  onToggleMeal: (mealId: string) => void;
  onAddMeal: (
    name: string, cal: number, protein: number,
    customCarbs?: number, customFat?: number, customImage?: string,
    category?: MealCategory, aiTag?: string
  ) => void;
  onLogWater: (totalMl: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_META: Record<MealCategory, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  breakfast: { label: 'Breakfast',          emoji: '🌅', color: 'var(--hl-amber)',   bg: 'var(--hl-amber-light)',   border: 'var(--hl-amber-border)' },
  lunch:     { label: 'Lunch',              emoji: '☀️', color: 'var(--hl-teal)',    bg: 'var(--hl-teal-light)',    border: 'var(--hl-teal-border)'  },
  dinner:    { label: 'Dinner',             emoji: '🌙', color: 'var(--hl-green)',   bg: 'var(--hl-green-light)',   border: 'var(--hl-green-border)' },
  snack:     { label: 'Spontaneous Bites',  emoji: '⚡', color: 'var(--hl-peach)',   bg: 'var(--hl-peach-light)',   border: 'var(--hl-peach-border)' },
};

const FOOD_KEYWORDS = [
  'egg','eggs','chicken','salmon','beef','steak','salad','smoothie','oat','oats','oatmeal',
  'toast','bread','rice','protein','shake','apple','banana','milk','coffee','tea','pizza',
  'burger','pasta','soup','meal','ate','had','drink','drinking','snack','breakfast','lunch',
  'dinner','kcal','cal','calories','gram','grams','food','recipe','sandwich','bowl','taco',
  'sushi','wrap','yogurt','avocado','cookie','cake','juice','fish','tuna','turkey','pork',
  'tofu','quinoa','veggie','fruit','nuts','almonds','peanut','butter','cheese','pie',
  'pancake','waffle','berry','blueberries','strawberries','watermelon','chia','whey','casein',
];

function isFoodQuery(q: string) {
  const lower = q.toLowerCase();
  return FOOD_KEYWORDS.some(kw => lower.includes(kw)) || /\b(\d+)\s*(kcal|cal|calories|g|grams)\b/i.test(q);
}

function estimateNutrition(q: string) {
  const lower = q.toLowerCase();
  const calMatch = lower.match(/(\d+)\s*(kcal|cal|calories)/);
  const protMatch = lower.match(/(\d+)\s*(g|grams)?\s*protein/);
  const carbMatch = lower.match(/(\d+)\s*(g|grams)?\s*(carb|carbs)/);
  const fatMatch  = lower.match(/(\d+)\s*(g|grams)?\s*fat/);
  let cal     = calMatch  ? parseInt(calMatch[1])  : 0;
  let protein = protMatch ? parseInt(protMatch[1]) : 0;
  let carbs   = carbMatch ? parseInt(carbMatch[1]) : 0;
  let fat     = fatMatch  ? parseInt(fatMatch[1])  : 0;
  if (!cal) {
    if (lower.includes('steak') || lower.includes('beef'))        { cal = 550; protein = protein||48; carbs = carbs||0;  fat = fat||28; }
    else if (lower.includes('salmon') || lower.includes('fish'))  { cal = 460; protein = protein||38; carbs = carbs||5;  fat = fat||22; }
    else if (lower.includes('chicken') || lower.includes('turkey')){ cal = 380; protein = protein||42; carbs = carbs||8;  fat = fat||10; }
    else if (lower.includes('egg'))                                { cal = 220; protein = protein||14; carbs = carbs||2;  fat = fat||15; }
    else if (lower.includes('salad'))                              { cal = 290; protein = protein||12; carbs = carbs||22; fat = fat||14; }
    else if (lower.includes('smoothie')||lower.includes('shake'))  { cal = 310; protein = protein||28; carbs = carbs||32; fat = fat||5;  }
    else if (lower.includes('pizza')||lower.includes('burger'))    { cal = 680; protein = protein||28; carbs = carbs||70; fat = fat||30; }
    else if (lower.includes('oat'))                                { cal = 260; protein = protein||10; carbs = carbs||42; fat = fat||5;  }
    else                                                           { cal = 380; protein = protein||22; carbs = carbs||35; fat = fat||12; }
  }
  if (!protein) protein = Math.round((cal * 0.25) / 4);
  if (!carbs)   carbs   = Math.round((cal * 0.45) / 4);
  if (!fat)     fat     = Math.round((cal * 0.30) / 9);
  return { calories: cal, protein, carbs, fat };
}

// ─── Donut Pie Chart ─────────────────────────────────────────────────────────

function MacroPieChart({ macros }: { macros: DailyMacros }) {
  const proteinCal = macros.proteinConsumedG * 4;
  const carbsCal   = macros.carbsConsumedG * 4;
  const fatsCal    = macros.fatsConsumedG * 9;
  const total      = proteinCal + carbsCal + fatsCal;
  const goalPct    = Math.min(100, macros.caloriesGoal > 0 ? Math.round((macros.caloriesConsumed / macros.caloriesGoal) * 100) : 0);

  const segments = [
    { value: proteinCal, color: '#3D7A5A', label: 'Protein' },
    { value: carbsCal,   color: '#4A9B8E', label: 'Carbs'   },
    { value: fatsCal,    color: '#D48B4F', label: 'Fats'    },
  ];

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 68;
  const innerR = 44;
  const gap = 0.03;

  let cumulAngle = -Math.PI / 2;

  function arcPath(startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) {
    if (endAngle - startAngle > 2 * Math.PI - 0.001) endAngle = startAngle + 2 * Math.PI - 0.001;
    const cos1o = Math.cos(startAngle), sin1o = Math.sin(startAngle);
    const cos2o = Math.cos(endAngle),   sin2o = Math.sin(endAngle);
    const cos1i = Math.cos(endAngle),   sin1i = Math.sin(endAngle);
    const cos2i = Math.cos(startAngle), sin2i = Math.sin(startAngle);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M ${cx + outerRadius * cos1o} ${cy + outerRadius * sin1o}`,
      `A ${outerRadius} ${outerRadius} 0 ${large} 1 ${cx + outerRadius * cos2o} ${cy + outerRadius * sin2o}`,
      `L ${cx + innerRadius * cos1i} ${cy + innerRadius * sin1i}`,
      `A ${innerRadius} ${innerRadius} 0 ${large} 0 ${cx + innerRadius * cos2i} ${cy + innerRadius * sin2i}`,
      'Z',
    ].join(' ');
  }

  const paths = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 1 / 3;
    const span     = fraction * (2 * Math.PI) - gap;
    const start    = cumulAngle + gap / 2;
    const end      = start + Math.max(span, 0);
    cumulAngle += fraction * 2 * Math.PI;
    return { ...seg, path: arcPath(start, end, outerR, innerR), fraction };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--hl-border)" strokeWidth={outerR - innerR} />
          ) : (
            paths.map((p, i) => (
              <path key={i} d={p.path} fill={p.color} style={{ transition: 'all 0.5s ease' }} />
            ))
          )}
          {/* Background ring when empty */}
          {total === 0 && <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="var(--hl-surface-alt)" strokeWidth={outerR - innerR} />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black" style={{ color: 'var(--hl-text-primary)', lineHeight: 1 }}>
            {macros.caloriesConsumed}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--hl-text-tertiary)' }}>kcal eaten</span>
          <div className="mt-0.5 text-[10px] font-bold" style={{ color: goalPct >= 100 ? 'var(--hl-green)' : 'var(--hl-text-secondary)' }}>
            {goalPct}% of goal
          </div>
        </div>
      </div>

      {/* Legend + bars */}
      <div className="flex-1 space-y-3 w-full">
        {/* Calorie goal bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1" style={{ color: 'var(--hl-text-primary)' }}>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" style={{ color: 'var(--hl-peach)' }} /> Calories</span>
            <span style={{ color: 'var(--hl-text-secondary)' }}>{macros.caloriesConsumed} / {macros.caloriesGoal} kcal</span>
          </div>
          <div className="hl-progress-track">
            <div className="hl-progress-fill" style={{ width: `${Math.min(100, (macros.caloriesConsumed / (macros.caloriesGoal || 1)) * 100)}%`, background: 'var(--hl-peach)' }} />
          </div>
        </div>

        {[
          { label: 'Protein', consumed: macros.proteinConsumedG, goal: macros.proteinGoalG,  unit: 'g', color: '#3D7A5A' },
          { label: 'Carbs',   consumed: macros.carbsConsumedG,   goal: macros.carbsGoalG,    unit: 'g', color: '#4A9B8E' },
          { label: 'Fats',    consumed: macros.fatsConsumedG,    goal: macros.fatsGoalG,     unit: 'g', color: '#D48B4F' },
        ].map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                <span style={{ color: 'var(--hl-text-primary)' }}>{m.label}</span>
              </span>
              <span style={{ color: 'var(--hl-text-secondary)' }}>{m.consumed}{m.unit} / {m.goal}{m.unit}</span>
            </div>
            <div className="hl-progress-track">
              <div className="hl-progress-fill" style={{ width: `${Math.min(100, (m.consumed / (m.goal || 1)) * 100)}%`, background: m.color }} />
            </div>
          </div>
        ))}

        {/* Macro color legend dots */}
        <div className="flex gap-4 pt-1">
          {[
            { label: 'Protein', color: '#3D7A5A', g: macros.proteinConsumedG },
            { label: 'Carbs',   color: '#4A9B8E', g: macros.carbsConsumedG   },
            { label: 'Fats',    color: '#D48B4F', g: macros.fatsConsumedG    },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-[10px] font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>{s.label} {s.g}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hydration Card ─────────────────────────────────────────────────────────

interface HydrationCardProps {
  selectedDate: string;
  macros: DailyMacros;
  onLogWater: (totalMl: number) => void;
}

function HydrationCard({ selectedDate, macros, onLogWater }: HydrationCardProps) {
  const [logs, setLogs] = useState<WaterLogEntry[]>([]);
  const [totalMl, setTotalMl] = useState<number>(macros.waterConsumedMl);
  const [goalMl, setGoalMl] = useState<number>(macros.waterGoalMl || 2500);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  // Track whether server data has been loaded at least once.
  // Before first load, we accept parent macros values; after that, HydrationCard owns its state.
  const [serverLoaded, setServerLoaded] = useState<boolean>(false);

  // Only sync from parent macros before we've loaded real server data
  useEffect(() => {
    if (!serverLoaded) {
      setTotalMl(macros.waterConsumedMl);
      if (macros.waterGoalMl) setGoalMl(macros.waterGoalMl);
    }
  }, [macros.waterConsumedMl, macros.waterGoalMl, serverLoaded]);

  const fetchWaterLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getWaterLogs(selectedDate);
      if (data) {
        setLogs(data.logs || []);
        if (data.totalMl !== undefined) setTotalMl(data.totalMl);
        if (data.goalMl) setGoalMl(data.goalMl);
        setServerLoaded(true);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setServerLoaded(false); // Reset on date change so parent macros re-sync until server responds
    fetchWaterLogs();
  }, [fetchWaterLogs]);

  const handleAdd = async (amount: number) => {
    if (!amount || amount <= 0 || isAdding) return;
    setIsAdding(true);
    try {
      // HydrationCard owns the single API call — parent receives real totalMl, not a delta
      const res = await api.logWater(amount);
      if (res && res.log) {
        setLogs((prev) => [res.log, ...prev]);
        setTotalMl(res.totalMl);
        onLogWater(res.totalMl); // Sync parent state (no second API call)
      } else {
        // Fallback: optimistic update
        const fallbackLog: WaterLogEntry = {
          id: `w_${Date.now()}`,
          amountMl: amount,
          loggedAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setLogs((prev) => [fallbackLog, ...prev]);
        setTotalMl((prev) => {
          const newTotal = prev + amount;
          onLogWater(newTotal);
          return newTotal;
        });
      }
    } catch {
      // API failed — optimistic local-only update, don't sync parent
      const fallbackLog: WaterLogEntry = {
        id: `w_${Date.now()}`,
        amountMl: amount,
        loggedAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setLogs((prev) => [fallbackLog, ...prev]);
      setTotalMl((prev) => prev + amount);
    } finally {
      setIsAdding(false);
      setCustomAmount('');
    }
  };

  const handleDelete = async (id: string, amount: number) => {
    // Optimistic UI — remove from list and subtract immediately
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setTotalMl((prev) => Math.max(0, prev - amount));
    try {
      await api.deleteWaterLog(id);
      // Re-fetch from server to get the authoritative total
      fetchWaterLogs();
    } catch {
      // Revert on failure
      fetchWaterLogs();
    }
  };

  const pct = Math.min(100, goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0);
  const QUICK_PRESETS = [
    { label: '+250ml', ml: 250, desc: 'Glass' },
    { label: '+500ml', ml: 500, desc: 'Bottle' },
    { label: '+750ml', ml: 750, desc: 'Large' },
    { label: '+1L', ml: 1000, desc: '1,000ml' },
  ];

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--hl-teal-light)' }}>
            <Droplet className="w-4 h-4" style={{ color: 'var(--hl-teal)' }} />
          </div>
          <div>
            <h2 className="text-base font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>Daily Hydration</h2>
          </div>
        </div>
        <span className="hl-badge hl-badge-teal text-[11px] font-bold">
          {pct}% of goal
        </span>
      </div>

      {/* Hero Stats */}
      <div className="p-4 rounded-2xl space-y-2.5" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-teal-border)' }}>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--hl-teal)' }}>
              {(totalMl / 1000).toFixed(2)}
            </span>
            <span className="text-sm font-semibold ml-1" style={{ color: 'var(--hl-text-secondary)' }}>L consumed</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold" style={{ color: 'var(--hl-text-tertiary)' }}>
              Goal: {(goalMl / 1000).toFixed(1)}L ({goalMl}ml)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hl-progress-track" style={{ background: 'rgba(74,155,142,0.15)', height: '7px' }}>
          <div
            className="hl-progress-fill"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--hl-teal) 0%, #3DAEA3 100%)',
            }}
          />
        </div>

        <p className="text-[11px] font-medium" style={{ color: totalMl >= goalMl ? 'var(--hl-green)' : 'var(--hl-text-secondary)' }}>
          {totalMl >= goalMl ? '🎉 Daily hydration goal achieved! Keep it up.' : `${((goalMl - totalMl) / 1000).toFixed(2)}L (${Math.max(0, goalMl - totalMl)}ml) remaining today`}
        </p>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--hl-text-tertiary)' }}>
          Quick Add Water
        </label>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.ml}
              type="button"
              onClick={() => handleAdd(preset.ml)}
              disabled={isAdding}
              className="flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'var(--hl-surface-alt)',
                border: '1px solid var(--hl-teal-border)',
                color: 'var(--hl-teal)',
              }}
            >
              <span className="text-xs font-black">{preset.label}</span>
              <span className="text-[10px] font-semibold" style={{ opacity: 0.75 }}>{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Log Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Droplets className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hl-text-tertiary)' }} />
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom ml (e.g. 300)"
            min="10"
            max="5000"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{
              background: 'var(--hl-surface-alt)',
              border: '1px solid var(--hl-border)',
              color: 'var(--hl-text-primary)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customAmount) {
                e.preventDefault();
                handleAdd(parseInt(customAmount, 10));
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => handleAdd(parseInt(customAmount, 10))}
          disabled={!customAmount || isAdding}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
          style={{ background: 'var(--hl-teal)' }}
        >
          {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Log
        </button>
      </div>

      {/* Simple Hydration Log */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-tertiary)' }}>
            Today's Water Log ({logs.length})
          </label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" style={{ color: 'var(--hl-teal)' }} />
            Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="p-3 rounded-2xl text-center" style={{ background: 'var(--hl-surface-alt)', border: '1px dashed var(--hl-border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>
              No water logged yet. Tap a quick add button to start! 💧
            </p>
          </div>
        ) : (
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl transition-all group"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">💧</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>+{log.amountMl}ml</span>
                  <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                    {log.time || new Date(log.loggedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id, log.amountMl)}
                  className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                  style={{ color: 'var(--hl-text-tertiary)' }}
                  title="Delete entry"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Log Meal Modal ───────────────────────────────────────────────────────────

interface LogMealModalProps {
  category: MealCategory;
  onClose: () => void;
  onSaved: (meal: { name: string; calories: number; protein: number; carbs: number; fat: number; image?: string; category: MealCategory; aiTag?: string }) => Promise<void>;
}

function LogMealModal({ category, onClose, onSaved }: LogMealModalProps) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Manual form
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const meta = CATEGORY_META[category];

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiPrompt.trim();
    if (!trimmed || isLoading) return;
    if (!isFoodQuery(trimmed)) {
      setFeedback('⚠️ Please describe a food item or meal to log.');
      return;
    }
    setIsLoading(true);
    setFeedback('AI is calculating nutrition & fetching photo…');
    try {
      const instructions = `You are a nutrition assistant. Respond ONLY with JSON: {"isFood": true, "name": "Clean Title", "calories": 480, "protein": 36, "carbs": 42, "fat": 14, "summary": "brief"}. If not food: {"isFood": false, "message": "reason"}.`;
      const aiResponse = await askGroqAI(trimmed, 'member', instructions);
      let parsed = { name: trimmed.slice(0, 40), ...estimateNutrition(trimmed) };
      try {
        const m = aiResponse.match(/\{[\s\S]*\}/);
        if (m) {
          const j = JSON.parse(m[0]);
          if (j.isFood === false) { setFeedback(`⚠️ ${j.message || 'Not a food item.'}`); setIsLoading(false); return; }
          if (j.name)     parsed.name     = j.name;
          if (j.calories) parsed.calories = +j.calories;
          if (j.protein)  parsed.protein  = +j.protein;
          if (j.carbs)    parsed.carbs    = +j.carbs;
          if (j.fat)      parsed.fat      = +j.fat;
        }
      } catch {}
      const photo = await fetchPexelsImage(parsed.name).catch(() => undefined);
      await onSaved({ ...parsed, image: photo, category, aiTag: 'AI Logged' });
      setFeedback(`✨ Logged "${parsed.name}" (${parsed.calories} kcal)`);
      setTimeout(onClose, 1400);
    } catch {
      const legit = estimateNutrition(trimmed);
      const photo = await fetchPexelsImage(trimmed).catch(() => undefined);
      await onSaved({ name: trimmed, ...legit, image: photo, category, aiTag: 'AI Estimate' });
      setFeedback(`✨ Logged "${trimmed}"`);
      setTimeout(onClose, 1400);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.calories || isLoading) return;
    setIsLoading(true);
    setFeedback('Fetching photo…');
    try {
      const photo = await fetchPexelsImage(form.name).catch(() => undefined);
      await onSaved({
        name: form.name,
        calories: parseInt(form.calories) || 0,
        protein:  parseInt(form.protein)  || 0,
        carbs:    parseInt(form.carbs)    || 0,
        fat:      parseInt(form.fat)      || 0,
        image: photo,
        category,
        aiTag: 'Manual',
      });
      setTimeout(onClose, 900);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-slide-up">
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4" style={{ background: 'var(--hl-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: meta.bg }}>
              {meta.emoji}
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>Log {meta.label}</h3>
              <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>Choose how to log this meal</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--hl-surface-alt)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'var(--hl-surface-alt)' }}>
          {(['ai', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={mode === m
                ? { background: 'var(--hl-surface)', color: 'var(--hl-text-primary)', boxShadow: 'var(--hl-shadow-sm)' }
                : { color: 'var(--hl-text-tertiary)' }}
            >
              {m === 'ai' ? <><Sparkles className="w-3 h-3" />Log with AI</> : <><Pencil className="w-3 h-3" />Manual Entry</>}
            </button>
          ))}
        </div>

        {/* AI Mode */}
        {mode === 'ai' && (
          <form onSubmit={handleAiSubmit} className="space-y-3">
            <div className="relative">
              <Utensils className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: 'var(--hl-text-tertiary)' }} />
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. 'Grilled salmon with rice and salad'"
                className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !aiPrompt.trim()}
              className="hl-btn-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : <><Sparkles className="w-4 h-4" />Analyze & Log</>}
            </button>
            {/* Quick AI presets */}
            <div className="space-y-1.5 pt-1">
              <p className="hl-section-label">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🥚 2 Scrambled Eggs & Toast', q: '2 scrambled eggs with sourdough toast' },
                  { label: '🥗 Chicken Caesar Salad', q: 'Grilled chicken caesar salad' },
                  { label: '🍣 Salmon Sushi Bowl', q: 'Salmon avocado sushi bowl 480 kcal 38g protein' },
                  { label: '🥤 Whey Protein Shake', q: 'Whey protein shake with banana' },
                ].map(p => (
                  <button
                    key={p.q}
                    type="button"
                    onClick={() => { setAiPrompt(p.q); }}
                    className="hl-btn-ghost px-3 py-1.5 text-[11px]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="hl-section-label block mb-1">Meal Name *</label>
              <input
                type="text"
                placeholder="e.g. Avocado Toast"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories (kcal) *', key: 'calories', placeholder: '420' },
                { label: 'Protein (g) *',     key: 'protein',  placeholder: '22'  },
                { label: 'Carbs (g)',          key: 'carbs',    placeholder: '38'  },
                { label: 'Fat (g)',            key: 'fat',      placeholder: '20'  },
              ].map(f => (
                <div key={f.key}>
                  <label className="hl-section-label block mb-1">{f.label}</label>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                    min={0}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--hl-text-tertiary)' }}>
              <Camera className="w-3 h-3" />A Pexels photo will be auto-fetched for your meal
            </p>
            <button
              type="submit"
              disabled={isLoading || !form.name || !form.calories}
              className="hl-btn-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Check className="w-4 h-4" />Save Meal</>}
            </button>
          </form>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-slide-up ${feedback.startsWith('⚠️') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            {feedback.startsWith('⚠️') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Meal Modal ──────────────────────────────────────────────────────────

interface EditMealModalProps {
  meal: MealItem;
  onClose: () => void;
  onSaved: (id: string, data: Partial<MealItem>) => Promise<void>;
}

function EditMealModal({ meal, onClose, onSaved }: EditMealModalProps) {
  const [form, setForm] = useState({
    name: meal.name,
    calories: String(meal.calories),
    protein: String(meal.protein),
    carbs: String(meal.carbs),
    fat: String(meal.fat),
    category: meal.category,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSaved(meal.id, {
        name: form.name,
        calories: parseInt(form.calories) || 0,
        protein:  parseInt(form.protein)  || 0,
        carbs:    parseInt(form.carbs)    || 0,
        fat:      parseInt(form.fat)      || 0,
        category: form.category,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-slide-up">
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4" style={{ background: 'var(--hl-surface)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
            <Pencil className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />Edit Meal
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--hl-surface-alt)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', key: 'calories' },
              { label: 'Protein (g)', key: 'protein' },
              { label: 'Carbs (g)', key: 'carbs' },
              { label: 'Fat (g)', key: 'fat' },
            ].map(f => (
              <div key={f.key}>
                <label className="hl-section-label block mb-1">{f.label}</label>
                <input
                  type="number" min={0}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="hl-section-label block mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as MealCategory }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Spontaneous Bites</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="hl-btn-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Check className="w-4 h-4" />Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

interface MealCardProps {
  meal: MealItem;
  onEdit: (m: MealItem) => void;
  onDelete: (id: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onEdit, onDelete }) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl group transition-all hl-card-hover"
         style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-xs)' }}>
      {meal.image ? (
        <img src={meal.image} alt={meal.name} className="w-14 h-14 rounded-xl object-cover shrink-0" style={{ border: '1px solid var(--hl-border-light)' }} />
      ) : (
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--hl-surface-alt)' }}>🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="text-sm font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{meal.name}</h4>
          {meal.aiTag && <span className="hl-badge hl-badge-green text-[9px] shrink-0">{meal.aiTag}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
          <span className="font-bold" style={{ color: 'var(--hl-text-primary)' }}>{meal.calories} kcal</span>
          <span style={{ color: 'var(--hl-border)' }}>•</span>
          <span className="font-semibold" style={{ color: '#3D7A5A' }}>{meal.protein}g P</span>
          <span style={{ color: 'var(--hl-border)' }}>•</span>
          <span className="font-semibold" style={{ color: '#4A9B8E' }}>{meal.carbs}g C</span>
          <span style={{ color: 'var(--hl-border)' }}>•</span>
          <span className="font-semibold" style={{ color: '#D48B4F' }}>{meal.fat}g F</span>
        </div>
        {meal.time && <p className="text-[10px] mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}><Clock className="w-2.5 h-2.5 inline mr-0.5" />{meal.time}</p>}
      </div>
      <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(meal)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(meal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--hl-peach-light)', color: 'var(--hl-peach)' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Meal Category Section ────────────────────────────────────────────────────

interface MealCategorySectionProps {
  category: MealCategory;
  meals: MealItem[];
  onAdd: (cat: MealCategory) => void;
  onEdit: (m: MealItem) => void;
  onDelete: (id: string) => void;
}

const MealCategorySection: React.FC<MealCategorySectionProps> = ({
  category, meals, onAdd, onEdit, onDelete
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const meta = CATEGORY_META[category];
  const catMeals = meals.filter(m => m.category === category);
  const totalCal = catMeals.reduce((s, m) => s + m.calories, 0);

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${meta.border}`, background: 'var(--hl-surface)', boxShadow: 'var(--hl-shadow-xs)' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between p-5 transition-colors hover:opacity-90"
        style={{ background: meta.bg }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.emoji}</span>
          <div className="text-left">
            <h3 className="text-sm font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>{meta.label}</h3>
            <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
              {catMeals.length} meal{catMeals.length !== 1 ? 's' : ''} · {totalCal} kcal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(category); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: meta.color, color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          >
            <Plus className="w-3.5 h-3.5" />Add
          </button>
          {collapsed ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} /> : <ChevronUp className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {catMeals.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-3xl">{meta.emoji}</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>Nothing logged yet</p>
              <button
                onClick={() => onAdd(category)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
              >
                <Plus className="w-3.5 h-3.5" />Log your first {meta.label.toLowerCase()} meal
              </button>
            </div>
          ) : (
            catMeals.map(m => (
              <MealCard key={m.id} meal={m} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Meal Plan Section ────────────────────────────────────────────────────────

interface EditPlanModalProps {
  plan: MealPlan | null;
  defaultDay: number;
  onClose: () => void;
  onSaved: (data: any) => Promise<void>;
}

function EditPlanModal({ plan, defaultDay, onClose, onSaved }: EditPlanModalProps) {
  const [form, setForm] = useState({
    name: plan?.name || '',
    calories: String(plan?.calories || ''),
    protein: String(plan?.protein || ''),
    carbs: String(plan?.carbs || ''),
    fat: String(plan?.fat || ''),
    meal_time: plan?.mealTime || 'breakfast',
    day_of_week: String(plan?.dayOfWeek ?? defaultDay),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSaved({
        name: form.name,
        calories: parseInt(form.calories) || 0,
        protein:  parseInt(form.protein)  || 0,
        carbs:    parseInt(form.carbs)    || 0,
        fat:      parseInt(form.fat)      || 0,
        meal_time:    form.meal_time,
        day_of_week:  parseInt(form.day_of_week),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-slide-up">
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4" style={{ background: 'var(--hl-surface)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
            <BookOpen className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
            {plan ? 'Edit Meal Plan' : 'Add to Meal Plan'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--hl-surface-alt)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="hl-section-label block mb-1">Day</label>
              <select
                value={form.day_of_week}
                onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="hl-section-label block mb-1">Meal Time</label>
              <select
                value={form.meal_time}
                onChange={e => setForm(f => ({ ...f, meal_time: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Spontaneous Bites</option>
              </select>
            </div>
          </div>
          <input
            type="text" required
            placeholder="Meal name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', key: 'calories' },
              { label: 'Protein (g)', key: 'protein' },
              { label: 'Carbs (g)', key: 'carbs' },
              { label: 'Fat (g)', key: 'fat' },
            ].map(f => (
              <div key={f.key}>
                <label className="hl-section-label block mb-1">{f.label}</label>
                <input
                  type="number" min={0}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || !form.name}
            className="hl-btn-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Check className="w-4 h-4" />{plan ? 'Save Changes' : 'Add to Plan'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

interface MealPlanSectionProps {
  onAddMeal: (
    name: string, cal: number, protein: number,
    customCarbs?: number, customFat?: number, customImage?: string,
    category?: MealCategory, aiTag?: string
  ) => void;
  selectedDate: string;
}

function MealPlanSection({ onAddMeal, selectedDate }: MealPlanSectionProps) {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null | 'new'>(null);

  const [loggedMealIds, setLoggedMealIds] = useState<Record<string, boolean>>({});
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getMealPlans();
      setPlans(data);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const dayPlans = plans.filter(p => p.dayOfWeek === selectedDay);
  const grouped = (['breakfast', 'lunch', 'dinner', 'snack'] as MealCategory[]).map(mt => ({
    mealTime: mt,
    items: dayPlans.filter(p => p.mealTime === mt),
  }));

  const dayTotalCal = dayPlans.reduce((s, p) => s + p.calories, 0);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMealPlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const handleSave = async (data: any) => {
    try {
      if (editingPlan && editingPlan !== 'new') {
        const updated = await api.updateMealPlan(editingPlan.id, data);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? updated : p));
      } else {
        const created = await api.createMealPlan(data);
        setPlans(prev => [...prev, created]);
      }
    } catch {}
  };



  const handleQuickLogToToday = (plan: MealPlan) => {
    onAddMeal(
      plan.name,
      plan.calories,
      plan.protein,
      plan.carbs,
      plan.fat,
      plan.image,
      plan.mealTime,
      'From Weekly Plan'
    );
    setLoggedMealIds(prev => ({ ...prev, [plan.id]: true }));
    setBannerNotice(`Logged "${plan.name}" to today's food diary! 🥗`);
    setTimeout(() => {
      setBannerNotice(null);
      setLoggedMealIds(prev => ({ ...prev, [plan.id]: false }));
    }, 3000);
  };

  const handleLogAllToday = () => {
    if (dayPlans.length === 0) return;
    dayPlans.forEach(plan => {
      onAddMeal(
        plan.name,
        plan.calories,
        plan.protein,
        plan.carbs,
        plan.fat,
        plan.image,
        plan.mealTime,
        'From Weekly Plan'
      );
    });
    setBannerNotice(`🎉 Logged all ${dayPlans.length} planned meals for ${DAYS[selectedDay]} to today's diary!`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  return (
    <div className="rounded-3xl hl-card overflow-hidden">
      {/* Header */}
      <div className="p-6" style={{ background: 'linear-gradient(135deg, #3D7A5A 0%, #4A9B8E 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Weekly Meal Plan</h2>
              <p className="text-xs text-white/80">{dayTotalCal} kcal planned for {DAYS[selectedDay]}</p>
            </div>
          </div>

          <button
            onClick={() => setEditingPlan('new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/30"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Plus className="w-3.5 h-3.5" />Add Meal
          </button>
        </div>

        {/* Day pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {DAY_SHORT.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className="flex-1 min-w-[44px] py-2 px-2 rounded-2xl text-[11px] font-bold transition-all text-center whitespace-nowrap"
              style={selectedDay === i
                ? { background: 'var(--hl-surface)', color: 'var(--hl-green)', boxShadow: 'var(--hl-shadow-sm)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {d}
              {i === today && <span className="block text-[8px] font-black" style={{ opacity: 0.7 }}>Today</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Banner Notice Alert */}
      {bannerNotice && (
        <div
          className="mx-6 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fade-slide-up bg-green-50 border border-green-200 text-green-800"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            {bannerNotice}
          </span>
          <button onClick={() => setBannerNotice(null)} className="text-green-600 hover:text-green-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plan content */}
      <div className="p-5 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--hl-green)' }} />
          </div>
        ) : dayPlans.length === 0 ? (
          <div className="text-center py-10 space-y-3 max-w-md mx-auto">
            <div
              className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center"
              style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)' }}
            >
              <Calendar className="w-7 h-7" style={{ color: 'var(--hl-text-tertiary)' }} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
                No meals planned for {DAYS[selectedDay]}
              </p>
              <p className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                Start planning your meals for the week by adding custom meals.
              </p>
            </div>
            <button
              onClick={() => setEditingPlan('new')}
              className="hl-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Meal
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.filter(g => g.items.length > 0).map(({ mealTime, items }) => {
              const meta = CATEGORY_META[mealTime];
              return (
                <div key={mealTime}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-base">{meta.emoji}</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                    <div className="flex-1 h-px" style={{ background: meta.border }} />
                  </div>
                  <div className="space-y-2.5">
                    {items.map(plan => {
                      const isLogged = loggedMealIds[plan.id];
                      return (
                        <div
                          key={plan.id}
                          className="flex items-center gap-3 p-3 rounded-2xl group transition-all"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                        >
                          {plan.image ? (
                            <img src={plan.image} alt={plan.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--hl-surface)' }}>{meta.emoji}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{plan.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
                              {plan.calories} kcal · {plan.protein}g P · {plan.carbs}g C · {plan.fat}g F
                            </p>
                            {plan.notes && (
                              <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                                💡 {plan.notes}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons on Planned Meal */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQuickLogToToday(plan)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              style={{
                                background: isLogged ? 'var(--hl-green)' : 'var(--hl-surface)',
                                color: isLogged ? '#fff' : 'var(--hl-green)',
                                border: '1px solid var(--hl-green-border)',
                                boxShadow: 'var(--hl-shadow-xs)',
                              }}
                              title="Quick-log this planned meal directly into today's diary"
                            >
                              {isLogged ? (
                                <><Check className="w-3.5 h-3.5" /> Logged</>
                              ) : (
                                <><Plus className="w-3.5 h-3.5" /> Log Today</>
                              )}
                            </button>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingPlan(plan)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--hl-surface)', color: 'var(--hl-green)' }} title="Edit planned meal">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(plan.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--hl-surface)', color: 'var(--hl-peach)' }} title="Delete planned meal">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bottom Quick Action: Log Entire Day */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border" style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)' }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
                <span>{dayPlans.length} planned meals · </span>
                <span className="font-bold" style={{ color: 'var(--hl-text-primary)' }}>{dayTotalCal} kcal</span>
              </div>
              <div className="flex items-center gap-2">

                <button
                  onClick={handleLogAllToday}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm"
                  style={{ background: 'var(--hl-teal)' }}
                  title="Log all meals planned for this day into your daily diary"
                >
                  <Utensils className="w-3 h-3" /> Log All Day to Diary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Edit/Create plan modal */}
      {editingPlan !== null && (
        <EditPlanModal
          plan={editingPlan === 'new' ? null : editingPlan}
          defaultDay={selectedDay}
          onClose={() => setEditingPlan(null)}
          onSaved={handleSave}
        />
      )}
    </div>
  );
}

// ─── Main NutritionView ───────────────────────────────────────────────────────

export const NutritionView: React.FC<NutritionViewProps> = ({
  selectedDate,
  setSelectedDate,
  meals: propMeals,
  macros,
  onToggleMeal,
  onAddMeal,
  onLogWater,
}) => {
  const [meals, setMeals] = useState<MealItem[]>(propMeals);
  const [logModalCat, setLogModalCat] = useState<MealCategory | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync parent meals
  useEffect(() => { setMeals(propMeals); }, [propMeals]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleAddSaved = async (data: {
    name: string; calories: number; protein: number; carbs: number; fat: number;
    image?: string; category: MealCategory; aiTag?: string;
  }) => {
    await onAddMeal(data.name, data.calories, data.protein, data.carbs, data.fat, data.image, data.category, data.aiTag);
  };

  const handleEditSaved = async (id: string, data: Partial<MealItem>) => {
    try {
      const updated = await api.updateMeal(id, {
        name: data.name, calories: data.calories, protein: data.protein,
        carbs: data.carbs, fat: data.fat, category: data.category,
      });
      setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    } catch (err) {
      console.error('Update meal failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteMeal(id);
      setMeals(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete meal failed', err);
    } finally {
      setDeletingId(null);
    }
  };

  const CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Format selectedDate for display, but use the raw YYYY-MM-DD for the input
  const dateObj = new Date(selectedDate);
  // adjust for timezone offset so it displays the correct local day
  const localDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
  const displayDate = localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
            Nutrition & Macros
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
              style={{ color: 'var(--hl-text-secondary)' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hl-badge hl-badge-green">
            <Zap className="w-3 h-3" />
            {meals.length} meals logged on {displayDate}
          </span>
        </div>
      </div>

      {/* ── Top Overview Grid: Nutrition & Hydration ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Macro Summary Card (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl hl-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--hl-green-light)' }}>
                  <Flame className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
                </div>
                <h2 className="text-base font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>Nutrition & Macros</h2>
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>
                {macros.caloriesConsumed} / {macros.caloriesGoal} kcal
              </span>
            </div>
            <MacroPieChart macros={macros} />
          </div>
        </div>

        {/* Hydration Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl hl-card">
          <HydrationCard
            selectedDate={selectedDate}
            macros={macros}
            onLogWater={onLogWater}
          />
        </div>
      </div>

      {/* ── Meal Categories ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
          <Utensils className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
          Meals for {displayDate}
        </h2>
        <div className="space-y-4">
          {CATEGORIES.map(cat => (
            <MealCategorySection
              key={cat}
              category={cat}
              meals={meals}
              onAdd={setLogModalCat}
              onEdit={setEditingMeal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* ── Weekly Meal Plan ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
          <BookOpen className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
          Weekly Meal Plan
        </h2>
        <MealPlanSection onAddMeal={onAddMeal} selectedDate={selectedDate} />
      </div>

      {/* ── Log Meal Modal ───────────────────────────────────────────────── */}
      {logModalCat && (
        <LogMealModal
          category={logModalCat}
          onClose={() => setLogModalCat(null)}
          onSaved={handleAddSaved}
        />
      )}

      {/* ── Edit Meal Modal ──────────────────────────────────────────────── */}
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};
