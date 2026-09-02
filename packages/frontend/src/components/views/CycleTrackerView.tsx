import React, { useState, useEffect, useCallback } from 'react';
import { CycleStatus, CyclePeriod, CycleSymptomDef, UserProfile } from '../../types';
import { api } from '../../services/api';
import {
  Calendar,
  Droplets,
  Heart,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flower2,
  Sun,
  Moon,
  Wind,
  Loader2,
} from 'lucide-react';

// ─── Symptom definitions ──────────────────────────────────────────────────────

const SYMPTOMS: CycleSymptomDef[] = [
  { key: 'cramps',         label: 'Cramps',         icon: '🔥', category: 'physical'  },
  { key: 'bloating',       label: 'Bloating',        icon: '💨', category: 'digestive' },
  { key: 'headache',       label: 'Headache',        icon: '🤕', category: 'physical'  },
  { key: 'back_pain',      label: 'Back pain',       icon: '🪨', category: 'physical'  },
  { key: 'breast_tender',  label: 'Breast tenderness', icon: '💗', category: 'physical' },
  { key: 'acne',           label: 'Acne',            icon: '🔴', category: 'physical'  },
  { key: 'fatigue',        label: 'Fatigue',         icon: '😴', category: 'energy'   },
  { key: 'high_energy',    label: 'High energy',     icon: '⚡', category: 'energy'   },
  { key: 'mood_happy',     label: 'Happy',           icon: '😊', category: 'mood'     },
  { key: 'mood_irritable', label: 'Irritable',       icon: '😤', category: 'mood'     },
  { key: 'mood_anxious',   label: 'Anxious',         icon: '😰', category: 'mood'     },
  { key: 'mood_low',       label: 'Low mood',        icon: '😞', category: 'mood'     },
  { key: 'nausea',         label: 'Nausea',          icon: '🤢', category: 'digestive' },
  { key: 'appetite_up',    label: 'Appetite ↑',      icon: '🍽️', category: 'digestive' },
  { key: 'insomnia',       label: 'Insomnia',        icon: '🌙', category: 'energy'   },
  { key: 'spotting',       label: 'Spotting',        icon: '🩸', category: 'physical'  },
];

// ─── Phase metadata ────────────────────────────────────────────────────────────

const PHASE_META: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  tip: string;
}> = {
  menstrual: {
    label: 'Menstrual',
    color: '#E8445A',
    bg: 'rgba(232,68,90,0.08)',
    border: 'rgba(232,68,90,0.25)',
    icon: <Droplets className="w-5 h-5" />,
    tip: 'Rest, warmth, and iron-rich foods. Your energy is naturally lower — honour it.',
  },
  follicular: {
    label: 'Follicular',
    color: '#2DAE7C',
    bg: 'rgba(45,174,124,0.08)',
    border: 'rgba(45,174,124,0.25)',
    icon: <Flower2 className="w-5 h-5" />,
    tip: 'Estrogen is rising. You\'ll feel more energetic — great time for new goals and harder workouts.',
  },
  ovulation: {
    label: 'Ovulation',
    color: '#7C5CFC',
    bg: 'rgba(124,92,252,0.08)',
    border: 'rgba(124,92,252,0.25)',
    icon: <Sun className="w-5 h-5" />,
    tip: 'Peak energy and libido. Your body is primed for high-intensity activity and social connection.',
  },
  luteal: {
    label: 'Luteal',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
    icon: <Moon className="w-5 h-5" />,
    tip: 'Progesterone peaks then drops. Opt for calming activities, magnesium-rich foods, and self-care.',
  },
  unknown: {
    label: 'Unknown',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.08)',
    border: 'rgba(156,163,175,0.25)',
    icon: <Wind className="w-5 h-5" />,
    tip: 'Log your first period to start tracking your cycle.',
  },
};

const FLOW_LABELS: Record<string, { label: string; dot: string }> = {
  spotting: { label: 'Spotting', dot: '#FCA5A5' },
  light:    { label: 'Light',    dot: '#F87171' },
  medium:   { label: 'Medium',   dot: '#E8445A' },
  heavy:    { label: 'Heavy',    dot: '#991B1B' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysFromNow(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── AI Predictions Helpers ───────────────────────────────────────────────────

function getAiSimulationText(dateStr: string, status: CycleStatus | null): string {
  if (!status || !status.nextPeriodOn || !status.ovulationOn) {
    return 'We need more logged periods to simulate hormonal predictions for this date. Keep tracking to unlock AI Sync™ predictions!';
  }

  const targetDate = new Date(dateStr + 'T00:00:00');
  const nextPeriod = new Date(status.nextPeriodOn + 'T00:00:00');
  const ovulation  = new Date(status.ovulationOn + 'T00:00:00');
  
  // Calculate relative day offsets to estimate phase on future date
  const diffDays = Math.round((targetDate.getTime() - nextPeriod.getTime()) / 86400000);

  if (diffDays >= 0 && diffDays < 5) {
    return '🧬 Prediction: You are likely to start your menstrual phase. Energy levels might drop, and mild physical cramping is typical. Prioritize comfort, hydration, and gentle walks.';
  }

  const ovulationDiff = Math.round((targetDate.getTime() - ovulation.getTime()) / 86400000);
  if (Math.abs(ovulationDiff) <= 2) {
    return '⚡ Prediction: High fertile window. You are expected to be in the ovulation phase. Estrogen peaks today. You will likely experience high motivation, energy, and optimal muscle recovery rates.';
  }

  if (ovulationDiff < -2) {
    return '🌱 Prediction: Follicular phase transition. Estrogen is rising. Focus levels, productivity, and physical endurance are climbing. Great day for strength workouts and learning new skills.';
  }

  return '🧘 Prediction: Luteal phase. Progesterone is dominant. Mood shifts, mild bloating, or sugar cravings may occur as your body prepares for the next cycle. Try yoga, low-intensity training, and magnesium rich snacks.';
}

function getAiSimulationSymptoms(dateStr: string, status: CycleStatus | null): string[] {
  if (!status || !status.nextPeriodOn || !status.ovulationOn) {
    return [];
  }

  const targetDate = new Date(dateStr + 'T00:00:00');
  const nextPeriod = new Date(status.nextPeriodOn + 'T00:00:00');
  const ovulation  = new Date(status.ovulationOn + 'T00:00:00');
  const diffDays = Math.round((targetDate.getTime() - nextPeriod.getTime()) / 86400000);

  if (diffDays >= 0 && diffDays < 5) {
    return ['cramps', 'fatigue', 'back_pain', 'spotting'];
  }

  const ovulationDiff = Math.round((targetDate.getTime() - ovulation.getTime()) / 86400000);
  if (Math.abs(ovulationDiff) <= 2) {
    return ['high_energy', 'mood_happy', 'appetite_up'];
  }

  if (ovulationDiff < -2) {
    return ['high_energy', 'mood_happy'];
  }

  return ['bloating', 'fatigue', 'appetite_up', 'mood_low', 'breast_tender'];
}

// ─── Calendar Strip ────────────────────────────────────────────────────────────

interface CalendarStripProps {
  status: CycleStatus;
  periods: CyclePeriod[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const CalendarStrip: React.FC<CalendarStripProps> = ({ status, periods, selectedDate, onSelectDate }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Build a set of period dates
  const periodDates = new Set<string>();
  periods.forEach(p => {
    if (!p.started_on) return;
    const start = new Date(p.started_on + 'T00:00:00');
    const end   = p.ended_on ? new Date(p.ended_on + 'T00:00:00') : new Date(start.getTime() + 4 * 86400000);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      periodDates.add(toDateString(new Date(d)));
    }
  });

  const fertileDates  = new Set(status.fertileDays);
  const ovulationDate = status.ovulationOn;
  const today         = toDateString(new Date());

  // 14 days starting from (today - 3 days + weekOffset * 7)
  const days: Date[] = [];
  const anchor = new Date();
  anchor.setDate(anchor.getDate() - 3 + weekOffset * 7);
  for (let i = 0; i < 14; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    days.push(d);
  }

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>
          {days[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--hl-text-secondary)' }} />
          </button>
          <button
            onClick={() => { setWeekOffset(0); onSelectDate(today); }}
            className="px-2 h-7 rounded-lg text-[10px] font-bold transition-colors hover:opacity-80"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)', color: 'var(--hl-text-secondary)' }}
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
          >
            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--hl-text-secondary)' }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.slice(0, 14).map((d, i) => {
          const ds          = toDateString(d);
          const isToday     = ds === today;
          const isPeriod    = periodDates.has(ds);
          const isFertile   = fertileDates.has(ds);
          const isOvulation = ds === ovulationDate;

          const isSelected  = ds === selectedDate;

          let cellBg     = 'transparent';
          let cellColor  = 'var(--hl-text-secondary)';
          let dot        = '';

          if (isPeriod)    { cellBg = 'rgba(232,68,90,0.15)';  cellColor = '#E8445A'; dot = '#E8445A'; }
          if (isFertile)   { cellBg = 'rgba(45,174,124,0.12)'; cellColor = '#2DAE7C'; dot = '#2DAE7C'; }
          if (isOvulation) { cellBg = 'rgba(124,92,252,0.18)'; cellColor = '#7C5CFC'; dot = '#7C5CFC'; }

          return (
            <button
              key={ds}
              onClick={() => onSelectDate(ds)}
              className="flex flex-col items-center gap-0.5 focus:outline-none cursor-pointer"
            >
              {i < 7 && (
                <span className="text-[9px] font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>
                  {dayLabels[d.getDay()]}
                </span>
              )}
              <div
                className="w-8 h-8 rounded-full flex flex-col items-center justify-center relative transition-all"
                style={{
                  background: cellBg,
                  border: isSelected ? '2px solid var(--hl-lavender)' : 'none',
                  outline: isToday ? '1px dashed var(--hl-text-secondary)' : 'none',
                  outlineOffset: '2px',
                }}
              >
                <span className="text-[11px] font-bold" style={{ color: cellColor || 'var(--hl-text-primary)' }}>
                  {d.getDate()}
                </span>
                {dot && (
                  <span className="w-1 h-1 rounded-full absolute bottom-0.5" style={{ background: dot }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { color: '#E8445A', label: 'Period' },
          { color: '#7C5CFC', label: 'Ovulation' },
          { color: '#2DAE7C', label: 'Fertile' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Period Logger ─────────────────────────────────────────────────────────────

interface PeriodLoggerProps {
  status: CycleStatus;
  periods: CyclePeriod[];
  onRefresh: () => void;
}

const PeriodLogger: React.FC<PeriodLoggerProps> = ({ status, periods, onRefresh }) => {
  const [flow, setFlow]           = useState<string>('medium');
  const [logging, setLogging]     = useState(false);
  const [ending, setEnding]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const activePeriod = periods.find(p => !p.ended_on);
  const todayStr     = toDateString(new Date());

  const handleLogStart = async () => {
    setLogging(true);
    try {
      await api.logPeriod({ started_on: todayStr, flow });
      onRefresh();
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  const handleLogEnd = async () => {
    if (!activePeriod) return;
    setEnding(true);
    try {
      await api.updatePeriod(activePeriod.id, { ended_on: todayStr });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setEnding(false);
    }
  };

  if (activePeriod) {
    const startDays = daysFromNow(activePeriod.started_on);
    const daysAgo   = startDays !== null ? Math.abs(startDays) : 0;
    return (
      <div className="space-y-3">
        <div
          className="p-4 rounded-2xl flex items-start justify-between gap-3"
          style={{ background: 'rgba(232,68,90,0.08)', border: '1px solid rgba(232,68,90,0.2)' }}
        >
          <div className="space-y-0.5">
            <p className="text-xs font-bold" style={{ color: '#E8445A' }}>
              🩸 Period in progress
            </p>
            <p className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
              Started {formatDate(activePeriod.started_on)} · {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ background: FLOW_LABELS[activePeriod.flow]?.dot }} />
              <span className="text-[10px] font-semibold capitalize" style={{ color: 'var(--hl-text-tertiary)' }}>
                {FLOW_LABELS[activePeriod.flow]?.label} flow
              </span>
            </div>
          </div>
        </div>

        {/* Flow update + End button */}
        <div className="flex gap-2">
          <button
            onClick={handleLogEnd}
            disabled={ending}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(232,68,90,0.1)', color: '#E8445A', border: '1px solid rgba(232,68,90,0.25)' }}
          >
            {ending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Mark Period as Ended
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
          How heavy is your flow?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(FLOW_LABELS) as [string, { label: string; dot: string }][]).map(([key, v]) => (
            <button
              key={key}
              onClick={() => setFlow(key)}
              className="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all"
              style={
                flow === key
                  ? { background: 'rgba(232,68,90,0.1)', borderColor: '#E8445A', color: '#E8445A' }
                  : { background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-secondary)' }
              }
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.dot }} />
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)', border: '1px solid var(--hl-border-light)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleLogStart}
            disabled={logging}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={{ background: '#E8445A', color: '#fff' }}
          >
            {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Log period
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all hover:opacity-80"
      style={{ borderColor: 'rgba(232,68,90,0.35)', color: '#E8445A', background: 'rgba(232,68,90,0.04)' }}
    >
      <Plus className="w-4 h-4" />
      Log period start
    </button>
  );
};

// ─── Symptom Grid ──────────────────────────────────────────────────────────────

interface SymptomGridProps {
  todaysSymptoms: string[];
  onToggle: (key: string) => Promise<void>;
  disabled?: boolean;
}

const CATEGORY_ORDER = ['physical', 'mood', 'energy', 'digestive'] as const;

const SymptomGrid: React.FC<SymptomGridProps> = ({ todaysSymptoms, onToggle, disabled = false }) => {
  const [pending, setPending] = useState<string | null>(null);
  const activeSet = new Set(todaysSymptoms);

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    items: SYMPTOMS.filter(s => s.category === cat),
  }));

  const handleToggle = async (key: string) => {
    if (disabled) return;
    setPending(key);
    try {
      await onToggle(key);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      {grouped.map(({ cat, label, items }) => (
        <div key={cat} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-tertiary)' }}>
            {label}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {items.map(s => {
              const active = activeSet.has(s.key);
              const loading = pending === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => handleToggle(s.key)}
                  disabled={disabled || !!pending}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  style={
                    active
                      ? { background: 'rgba(124,92,252,0.1)', borderColor: 'rgba(124,92,252,0.35)', color: '#7C5CFC' }
                      : { background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-secondary)' }
                  }
                >
                  <span className="text-sm flex-shrink-0">{loading ? '·' : s.icon}</span>
                  <span className="truncate">{s.label}</span>
                  {active && !loading && (
                    <CheckCircle2 className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: '#7C5CFC' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main View ─────────────────────────────────────────────────────────────────

interface CycleTrackerViewProps {
  user: UserProfile;
}

export const CycleTrackerView: React.FC<CycleTrackerViewProps> = ({ user: _user }) => {
  const [status,  setStatus]  = useState<CycleStatus | null>(null);
  const [periods, setPeriods] = useState<CyclePeriod[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalPeriodsLogged: number;
    avgPeriodDurationDays: number;
    firstPeriodDate: string | null;
    latestPeriodDate: string | null;
    totalSymptomsDuringMenstruation: number;
    topSymptoms: Array<{ symptomKey: string; occurrences: number; lastLoggedOn: string }>;
    flowDistribution: Array<{ flow: string; count: number }>;
  } | null>(null);
  const [timeline, setTimeline] = useState<Array<{
    eventDate: string;
    eventType: string;
    title: string;
    phaseTag: string;
    refId: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Tracks which calendar date is selected (defaults to today)
  const todayStr = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDateSymptoms, setSelectedDateSymptoms] = useState<string[]>([]);
  const [symptomLoading, setSymptomLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p, a, t] = await Promise.all([
        api.getCycleStatus(),
        api.getCyclePeriods(),
        api.getCycleAnalytics().catch(() => null),
        api.getCycleTimeline().catch(() => []),
      ]);
      setStatus(s);
      setPeriods(p);
      if (a) setAnalytics(a);
      if (t) setTimeline(t);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load cycle data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logged symptoms for the selected date
  const loadSymptomsForSelectedDate = useCallback(async () => {
    setSymptomLoading(true);
    try {
      // Use standard symptom api with date bounds around selected date
      const res = await api.getCycleSymptoms(selectedDate, selectedDate);
      const items = res[selectedDate] || [];
      setSelectedDateSymptoms(items);
    } catch (e) {
      console.error(e);
    } finally {
      setSymptomLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSymptomsForSelectedDate();
  }, [loadSymptomsForSelectedDate]);

  const handleToggleSymptom = async (key: string) => {
    const res = await api.toggleCycleSymptom(key, selectedDate);
    // If we updated today, synchronize with the status panel too
    if (selectedDate === todayStr) {
      setStatus(prev => prev ? { ...prev, todaysSymptoms: res.todaysSymptoms } : prev);
    }
    // Update the local list for selected date
    loadSymptomsForSelectedDate();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--hl-lavender)' }} />
          <p className="text-sm" style={{ color: 'var(--hl-text-tertiary)' }}>Loading your cycle data…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="w-10 h-10" style={{ color: '#E8445A' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--hl-text-primary)' }}>Could not load cycle data</p>
        <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="mt-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-primary)', border: '1px solid var(--hl-border)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) return null;

  const phase     = PHASE_META[status.phase] ?? PHASE_META.unknown;
  const daysToNext = daysFromNow(status.nextPeriodOn);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">

      {/* ── Status Banner ─────────────────────────────────────────────────── */}
      <div
        className="p-5 sm:p-6 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${phase.bg.replace('0.08', '0.12')} 0%, ${phase.bg} 100%)`,
          border: `1.5px solid ${phase.border}`,
        }}
      >
        {status.hasData ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Phase + cycle day */}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: phase.bg, color: phase.color, border: `1.5px solid ${phase.border}` }}
              >
                {phase.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: phase.bg, color: phase.color, border: `1px solid ${phase.border}` }}
                  >
                    {phase.label} Phase
                  </span>
                  {status.phaseDay && (
                    <span className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>
                      Day {status.phaseDay}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: 'var(--hl-text-primary)' }}>
                    Day {status.cycleDay}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--hl-text-tertiary)' }}>
                    of ~{status.avgCycleLength}
                  </span>
                </div>
                <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                  {phase.tip}
                </p>
              </div>
            </div>

            {/* Right: Predictions */}
            <div className="flex sm:flex-col gap-3 sm:gap-2 sm:text-right">
              {status.nextPeriodOn && (
                <div className="px-3 py-2 rounded-2xl" style={{ background: 'rgba(232,68,90,0.08)', border: '1px solid rgba(232,68,90,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: '#E8445A' }}>Next period</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                    {formatDate(status.nextPeriodOn)}
                    {daysToNext !== null && (
                      <span className="text-xs font-normal ml-1" style={{ color: 'var(--hl-text-tertiary)' }}>
                        ({daysToNext > 0 ? `in ${daysToNext}d` : daysToNext === 0 ? 'today' : `${Math.abs(daysToNext)}d ago`})
                      </span>
                    )}
                  </p>
                </div>
              )}
              {status.ovulationOn && (
                <div className="px-3 py-2 rounded-2xl" style={{ background: 'rgba(124,92,252,0.07)', border: '1px solid rgba(124,92,252,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: '#7C5CFC' }}>Ovulation est.</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>{formatDate(status.ovulationOn)}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No data onboarding */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,68,90,0.1)', color: '#E8445A' }}>
              <Heart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold" style={{ color: 'var(--hl-text-primary)' }}>Start tracking your cycle</h2>
              <p className="text-sm" style={{ color: 'var(--hl-text-secondary)' }}>
                Log your first period below to get phase predictions, fertile window estimates, and personalised guidance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left col (3/5): Calendar + Symptom grid */}
        <div className="lg:col-span-3 space-y-6">

          {/* Calendar strip */}
          <div className="p-5 rounded-3xl hl-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)' }}>
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>Cycle Calendar</h2>
            </div>
            <CalendarStrip
              status={status}
              periods={periods}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Selected day symptoms / AI Predictions */}
          <div className="p-5 rounded-3xl hl-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.1)', color: '#7C5CFC' }}>
                  <Heart className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                  {selectedDate > todayStr 
                    ? `AI Predictions for ${formatDate(selectedDate)}`
                    : `Logs for ${selectedDate === todayStr ? 'Today' : formatDate(selectedDate)}`
                  }
                </h2>
              </div>
              {selectedDate > todayStr ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                  ✨ AI Simulated
                </span>
              ) : symptomLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--hl-lavender)' }} />
              ) : selectedDateSymptoms.length > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,92,252,0.1)', color: '#7C5CFC' }}>
                  {selectedDateSymptoms.length} logged
                </span>
              ) : (
                <span className="text-[10px] font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>
                  No logs recorded
                </span>
              )}
            </div>

            {selectedDate > todayStr ? (
              <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'rgba(124,92,252,0.03)', borderColor: 'rgba(124,92,252,0.15)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--hl-text-secondary)' }}>
                  {getAiSimulationText(selectedDate, status)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {getAiSimulationSymptoms(selectedDate, status).map(sKey => {
                    const def = SYMPTOMS.find(s => s.key === sKey);
                    if (!def) return null;
                    return (
                      <span key={sKey} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)', border: '1px solid var(--hl-border-light)' }}>
                        <span>{def.icon}</span>
                        <span>{def.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <SymptomGrid 
                todaysSymptoms={selectedDateSymptoms} 
                onToggle={handleToggleSymptom} 
                disabled={selectedDate > todayStr}
              />
            )}
          </div>
        </div>

        {/* Right col (2/5): Period logger + stats */}
        <div className="lg:col-span-2 space-y-5">

          {/* Period logger */}
          <div className="p-5 rounded-3xl hl-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,68,90,0.1)', color: '#E8445A' }}>
                <Droplets className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>Period Log</h2>
            </div>
            <PeriodLogger status={status} periods={periods} onRefresh={load} />
          </div>

          {/* Cycle stats */}
          {status.hasData && (
            <div className="p-5 rounded-3xl hl-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-tertiary)' }}>
                Your Cycle
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Avg cycle length', value: `${status.avgCycleLength} days` },
                  { label: 'Cycles tracked',   value: `${periods.length}` },
                  { label: 'Last period',       value: formatDate(status.periodStartedOn) },
                  { label: 'Period ended',      value: status.periodEndedOn ? formatDate(status.periodEndedOn) : status.isOnPeriod ? 'Ongoing' : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>{label}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past periods */}
          {periods.length > 0 && (
            <div className="p-5 rounded-3xl hl-card">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--hl-text-tertiary)' }}>
                Period History
              </h3>
              <div className="space-y-4">
                <PeriodHistoryList periods={periods} onRefresh={load} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SQL Aggregated Analytics & Biomarker Intelligence (COUNT, AVG, LEFT JOIN) ── */}
      {analytics && analytics.totalPeriodsLogged > 0 && (
        <div className="p-6 rounded-3xl hl-card space-y-5 border border-purple-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600">
                <Flower2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
                  Hormonal Biomarker Intelligence
                </h2>
                <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
                  Computed in database engine via SQL Aggregators (COUNT, AVG) & LEFT JOIN
                </p>
              </div>
            </div>
            <span className="hl-badge hl-badge-purple text-[10px]">
              {analytics.totalPeriodsLogged} cycles analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
              <p className="text-[10px] font-bold uppercase text-slate-400">Avg Period Duration</p>
              <h4 className="text-xl font-extrabold mt-1" style={{ color: 'var(--hl-text-primary)' }}>
                {analytics.avgPeriodDurationDays} <span className="text-xs font-normal text-slate-400">days</span>
              </h4>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
              <p className="text-[10px] font-bold uppercase text-slate-400">Menstrual Symptoms (LEFT JOIN)</p>
              <h4 className="text-xl font-extrabold mt-1" style={{ color: '#E8445A' }}>
                {analytics.totalSymptomsDuringMenstruation} <span className="text-xs font-normal text-slate-400">logged</span>
              </h4>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
              <p className="text-[10px] font-bold uppercase text-slate-400">Tracking Range</p>
              <h4 className="text-xs font-bold mt-1.5" style={{ color: 'var(--hl-text-primary)' }}>
                {analytics.firstPeriodDate ? `${formatDate(analytics.firstPeriodDate)} — ${formatDate(analytics.latestPeriodDate)}` : 'Active'}
              </h4>
            </div>
          </div>

          {/* Top Symptoms */}
          {analytics.topSymptoms.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Most Frequent Recurring Symptoms (SQL GROUP BY + COUNT)
              </label>
              <div className="flex flex-wrap gap-2">
                {analytics.topSymptoms.map((ts) => {
                  const def = SYMPTOMS.find((s) => s.key === ts.symptomKey);
                  return (
                    <div
                      key={ts.symptomKey}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
                    >
                      <span>{def?.icon || '🔹'}</span>
                      <span style={{ color: 'var(--hl-text-primary)' }}>{def?.label || ts.symptomKey}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        {ts.occurrences}x
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chronological Cycle Timeline (SQL UNION ALL) ── */}
      {timeline.length > 0 && (
        <div className="p-6 rounded-3xl hl-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-500/10 text-teal-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>
                Biological Timeline Feed
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
                Combined period & symptom events generated by PostgreSQL SQL UNION ALL
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {timeline.slice(0, 15).map((ev, i) => (
              <div
                key={`${ev.eventDate}_${ev.eventType}_${i}`}
                className="flex items-center justify-between p-3 rounded-2xl text-xs"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">
                    {ev.eventType === 'period_start' ? '🩸' : ev.eventType === 'period_end' ? '✨' : '📝'}
                  </span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--hl-text-primary)' }}>{ev.title}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(ev.eventDate)}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  ev.eventType === 'period_start'
                    ? 'bg-rose-100 text-rose-700'
                    : ev.eventType === 'period_end'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {ev.eventType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Period History List Component with Edit/Delete ────────────────────────────

interface PeriodHistoryListProps {
  periods: CyclePeriod[];
  onRefresh: () => void;
}

const PeriodHistoryList: React.FC<PeriodHistoryListProps> = ({ periods, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartedOn, setEditStartedOn] = useState('');
  const [editEndedOn, setEditEndedOn] = useState('');
  const [editFlow, setEditFlow] = useState<'spotting' | 'light' | 'medium' | 'heavy'>('medium');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (p: CyclePeriod) => {
    setEditingId(p.id);
    setEditStartedOn(p.started_on);
    setEditEndedOn(p.ended_on || '');
    setEditFlow(p.flow);
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await api.updatePeriod(id, {
        started_on: editStartedOn,
        ended_on: editEndedOn === '' ? null : editEndedOn,
        flow: editFlow,
      });
      setEditingId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to update period');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this period record?')) return;
    setDeletingId(id);
    try {
      await api.deletePeriod(id);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to delete period');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {periods.map(p => {
        const isEditing = editingId === p.id;
        const isDeleting = deletingId === p.id;
        const dur = p.ended_on
          ? Math.round((new Date(p.ended_on + 'T00:00:00').getTime() - new Date(p.started_on + 'T00:00:00').getTime()) / 86400000) + 1
          : null;

        if (isEditing) {
          return (
            <div key={p.id} className="p-3.5 rounded-2xl border space-y-3" style={{ background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border)' }}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--hl-text-tertiary)' }}>Start Date</label>
                  <input
                    type="date"
                    value={editStartedOn}
                    onChange={e => setEditStartedOn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--hl-text-tertiary)' }}>End Date</label>
                  <input
                    type="date"
                    value={editEndedOn}
                    onChange={e => setEditEndedOn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100"
                    placeholder="Ongoing"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--hl-text-tertiary)' }}>Flow Intensity</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['spotting', 'light', 'medium', 'heavy'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEditFlow(f)}
                      className="py-1 rounded-md text-[10px] font-bold border capitalize"
                      style={
                        editFlow === f
                          ? { background: 'rgba(232,68,90,0.15)', borderColor: '#E8445A', color: '#E8445A' }
                          : { background: 'var(--hl-surface)', borderColor: 'var(--hl-border-light)', color: 'var(--hl-text-secondary)' }
                      }
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-text-secondary)', border: '1px solid var(--hl-border-light)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(p.id)}
                  disabled={saving}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all text-white flex items-center gap-1"
                  style={{ background: '#7C5CFC' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={p.id} className="flex flex-col gap-2 pb-2.5" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: FLOW_LABELS[p.flow]?.dot ?? '#E8445A' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--hl-text-primary)' }}>
                  {formatDate(p.started_on)} {p.ended_on ? `to ${formatDate(p.ended_on)}` : '(Ongoing)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                  {dur ? `${dur}d` : p.ended_on === null ? 'ongoing' : '—'}
                </span>
                <span className="text-[10px] capitalize px-1.5 py-0.5 rounded" style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-tertiary)' }}>
                  {p.flow}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => startEdit(p)}
                className="text-[10px] font-bold px-2 py-1 rounded transition-colors hover:bg-slate-200/50"
                style={{ color: 'var(--hl-lavender)', background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={isDeleting}
                className="text-[10px] font-bold px-2 py-1 rounded transition-colors hover:bg-red-50"
                style={{ color: '#E8445A', background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
