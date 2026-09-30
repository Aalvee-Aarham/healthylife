import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  Conversation,
  ChatMessage,
  NavigationTab,
  ClientRecord,
  ClientDetail,
  Plan,
  PlanContent,
  PlanDay,
  PlanItem,
  PlanNutritionItem,
  PlanWorkoutItem,
} from '../../types';
import { api } from '../../services/api';
import {
  MessageSquare, Send, Loader2, Search, User, Users, FileText, Plus, Trash2, Sparkles,
  ArrowLeft, AlertTriangle, TrendingUp, Dumbbell, UtensilsCrossed, Archive, Save, ClipboardList, Wand2,
} from 'lucide-react';
import { useConversationPolling } from '../../hooks/useConversationPolling';
import { SkeletonRow, SkeletonChatBubble, SkeletonCard } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CoachDashboardViewProps {
  user: UserProfile;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const fieldStyle: React.CSSProperties = { background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' };
const miniFieldStyle: React.CSSProperties = { background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' };
const headingStyle: React.CSSProperties = { color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" };

function thisMonday(): string {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const diff = (jsDay + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

function emptyDays(): Record<string, PlanDay> {
  const days: Record<string, PlanDay> = {};
  DAY_LABELS.forEach((label, i) => {
    days[String(i)] = { label, items: [] };
  });
  return days;
}

/** Plan days arrive keyed "0".."6" as an object or (from PHP json_encode) an array; AI output may skip days. */
function normalizeDays(src: unknown): Record<string, PlanDay> {
  const days = emptyDays();
  const source = (src ?? {}) as Record<string, PlanDay | undefined>;
  Object.keys(days).forEach((key) => {
    const items = source[key]?.items;
    if (Array.isArray(items)) days[key].items = items;
  });
  return days;
}

const dayList = (days: Record<string, PlanDay>): PlanDay[] => DAY_LABELS.map((_, i) => days[String(i)]);

function emptyItem(type: 'nutrition' | 'workout'): PlanItem {
  return type === 'nutrition'
    ? { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, category: 'breakfast' }
    : { name: '', sets: 3, reps: 10, notes: '' };
}

function planProgress(plan: Plan) {
  const days = normalizeDays(plan.content?.days);
  const total = dayList(days).reduce((n, d) => n + d.items.length, 0);
  const done = Math.min(total, plan.completions.length);
  return { days, total, done, pct: total ? Math.round((100 * done) / total) : 0 };
}

function statusVariant(status: string): 'green' | 'amber' | 'peach' {
  if (status === 'On Track') return 'green';
  if (status === 'No Plan') return 'peach';
  return 'amber';
}

type Roster = { clients: ClientRecord[]; totalClients: number; avgAdherencePct: number };

/** Shared client list (GET /coach/clients). */
function useRoster(): Roster | null {
  const [roster, setRoster] = useState<Roster | null>(null);
  useEffect(() => {
    api.getClients()
      .then((data) => setRoster({ ...data, clients: data.clients as ClientRecord[] }))
      .catch((err) => {
        console.error('Failed to load clients:', err);
        setRoster({ clients: [], totalClients: 0, avgAdherencePct: 0 });
      });
  }, []);
  return roster;
}

const Avatar: React.FC<{ src?: string | null; name: string; size?: string }> = ({ src, name, size = 'w-10 h-10' }) =>
  src ? (
    <img src={src} alt={name} className={`${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-full flex items-center justify-center shrink-0`} style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-teal)' }}>
      <User className="w-1/2 h-1/2" />
    </div>
  );

const ProgressBar: React.FC<{ pct: number; color?: string; height?: string }> = ({ pct, color = 'var(--hl-teal)', height = '5px' }) => (
  <div className="hl-progress-track" style={{ height }}>
    <div className="hl-progress-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
  </div>
);

const StatTile: React.FC<{ label: string; value: string | number; hint?: string; color: string; icon: React.ElementType }> = ({ label, value, hint, color, icon: Icon }) => (
  <Card padding="p-4" className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="hl-section-label">{label}</span>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="text-2xl font-bold" style={headingStyle}>{value}</p>
    {hint && <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>{hint}</p>}
  </Card>
);

interface ClientActions {
  onOpenClient: (clientId: string) => void;
  onBuildPlan: (clientId: string) => void;
  onMessage: (clientId: string) => void;
}

/** ── Overview: 'coach-dashboard' tab ─────────────────────────────────────── */
const CoachOverview: React.FC<{ user: UserProfile } & ClientActions> = ({ user, onOpenClient, onBuildPlan, onMessage }) => {
  const roster = useRoster();

  if (!roster) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <SkeletonCard lines={4} />
      </div>
    );
  }

  const { clients } = roster;
  const needsAttention = clients.filter((c) => c.status === 'Needs Attention');
  const noPlan = clients.filter((c) => c.status === 'No Plan');
  const onTrack = clients.filter((c) => c.status === 'On Track');
  const attentionList = [...needsAttention, ...noPlan].sort((a, b) => a.adherencePercent - b.adherencePercent);
  const topClients = [...onTrack].sort((a, b) => b.adherencePercent - a.adherencePercent).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8 animate-fade-slide-up">
      <div>
        <h1 className="text-xl font-bold" style={headingStyle}>Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
          Here's how your clients are doing with their {user.coachSpecialty === 'trainer' ? 'training' : 'nutrition'} plans this week.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Clients" value={roster.totalClients} icon={Users} color="var(--hl-teal)" hint="Assigned or in conversation" />
        <StatTile label="Avg adherence" value={`${roster.avgAdherencePct}%`} icon={TrendingUp} color="var(--hl-green)" hint="Completed plan items" />
        <StatTile label="Needs attention" value={needsAttention.length} icon={AlertTriangle} color="var(--hl-amber)" hint="Below 70% adherence" />
        <StatTile label="Without a plan" value={noPlan.length} icon={ClipboardList} color="var(--hl-peach)" hint="No active plan yet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="p-4" className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2" style={headingStyle}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--hl-amber)' }} /> Needs your attention
          </h2>
          {attentionList.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: 'var(--hl-text-tertiary)' }}>
              {clients.length === 0 ? 'No clients yet — members appear here once they choose you as their coach.' : 'Everyone is on track. Nice work!'}
            </p>
          ) : (
            <div className="space-y-2">
              {attentionList.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--hl-surface-alt)' }}>
                  <Avatar src={c.avatar} name={c.name} size="w-9 h-9" />
                  <button onClick={() => onOpenClient(c.id)} className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                      {c.status === 'No Plan' ? 'No active plan' : `${c.adherencePercent}% adherence`} · active {c.lastActive}
                    </p>
                  </button>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onMessage(c.id)} aria-label={`Message ${c.name}`}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => onBuildPlan(c.id)}>
                      <FileText className="w-3.5 h-3.5" /> {c.status === 'No Plan' ? 'Create plan' : 'Adjust plan'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="p-4" className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2" style={headingStyle}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--hl-green)' }} /> On track
          </h2>
          {topClients.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: 'var(--hl-text-tertiary)' }}>No clients above 70% yet.</p>
          ) : (
            topClients.map((c) => (
              <button key={c.id} onClick={() => onOpenClient(c.id)} className="w-full text-left space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{c.name}</span>
                  <span className="font-bold" style={{ color: 'var(--hl-green)' }}>{c.adherencePercent}%</span>
                </div>
                <ProgressBar pct={c.adherencePercent} color="var(--hl-green)" height="4px" />
              </button>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

/** ── Roster panel: 'clients' tab ─────────────────────────────────────────── */
const STATUS_FILTERS = ['All', 'On Track', 'Needs Attention', 'No Plan'] as const;

const ClientRoster: React.FC<{ user: UserProfile } & ClientActions> = ({ user, onOpenClient, onBuildPlan, onMessage }) => {
  const roster = useRoster();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All');

  const clients = roster?.clients ?? [];
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'All' || c.status === statusFilter)
  );
  const planLabel = user.coachSpecialty === 'trainer' ? 'Training Plan' : 'Nutrition Plan';

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 animate-fade-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={headingStyle}>
            <Users className="w-5 h-5" style={{ color: 'var(--hl-teal)' }} />
            My Clients
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
            {clients.length} client{clients.length === 1 ? '' : 's'} assigned to you as a {user.coachSpecialty || 'coach'}.
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            aria-label="Search clients"
            className="pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 transition-all"
            style={fieldStyle}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const count = s === 'All' ? clients.length : clients.filter((c) => c.status === s).length;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={active}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={active
                ? { background: 'var(--hl-teal)', color: '#fff' }
                : { background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)', border: '1px solid var(--hl-border)' }}
            >
              {s} · {count}
            </button>
          );
        })}
      </div>

      {!roster ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} withAvatar lines={2} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card padding="p-8" className="text-center">
          <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>No clients found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((client) => (
            <Card key={client.id} padding="p-4" className="space-y-3">
              <button onClick={() => onOpenClient(client.id)} className="w-full flex items-center gap-3 text-left">
                <Avatar src={client.avatar} name={client.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{client.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{client.email}</p>
                </div>
                <Badge variant={statusVariant(client.status)}>{client.status}</Badge>
              </button>

              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>
                <span>{client.planName || planLabel} · active {client.lastActive}</span>
                <span className="font-bold" style={{ color: 'var(--hl-teal)' }}>{client.adherencePercent}% adherence</span>
              </div>

              <ProgressBar pct={client.adherencePercent} />

              {client.notes && (
                <p className="text-[10px] line-clamp-2 italic" style={{ color: 'var(--hl-text-tertiary)' }}>“{client.notes}”</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenClient(client.id)}>
                  <TrendingUp className="w-3.5 h-3.5" /> Progress
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onMessage(client.id)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>
                <Button variant="primary" size="sm" onClick={() => onBuildPlan(client.id)}>
                  <FileText className="w-3.5 h-3.5" /> Plan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/** ── Client detail: monitoring one client (inside 'clients' tab) ─────────── */
const ClientDetailView: React.FC<{ clientId: string; onBack: () => void } & Omit<ClientActions, 'onOpenClient'>> = ({
  clientId, onBack, onBuildPlan, onMessage,
}) => {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesMsg, setNotesMsg] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const load = () => {
    api.getClientDetail(clientId)
      .then((d) => { setDetail(d); setNotes(d.notes); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load client.'));
  };

  useEffect(load, [clientId]);

  const saveNotes = async () => {
    setIsSavingNotes(true);
    setNotesMsg(null);
    try {
      await api.updateClientNotes(clientId, notes);
      setNotesMsg('Notes saved.');
    } catch (err) {
      setNotesMsg(err instanceof Error ? err.message : 'Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const endPlan = async (plan: Plan) => {
    if (!window.confirm(`End "${plan.title}"? The client will no longer see it as active.`)) return;
    try {
      await api.archivePlan(plan.id);
      load();
    } catch (err) {
      console.error('Failed to end plan:', err);
    }
  };

  const backButton = (
    <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--hl-text-secondary)' }}>
      <ArrowLeft className="w-3.5 h-3.5" /> All clients
    </button>
  );

  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {backButton}
        <Card padding="p-8" className="text-center"><p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>{error}</p></Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {backButton}
        <SkeletonCard withAvatar lines={2} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><SkeletonCard lines={5} /><SkeletonCard lines={5} /></div>
      </div>
    );
  }

  const { goals, intake } = detail;
  const loggedDays = intake.filter((d) => d.mealCount > 0);
  const avg = (key: 'calories' | 'protein' | 'waterMl') =>
    loggedDays.length ? Math.round(loggedDays.reduce((n, d) => n + d[key], 0) / loggedDays.length) : 0;
  const calorieScale = goals.calories || Math.max(1, ...intake.map((d) => d.calories));

  const profileFacts: Array<[string, string | null]> = [
    ['Goal', detail.goal],
    ['Activity', detail.activityLevel?.replace('_', ' ') ?? null],
    ['Age', detail.age ? `${detail.age}` : null],
    ['Height', detail.heightCm ? `${detail.heightCm} cm` : null],
    ['Weight', detail.weightCurrentKg ? `${detail.weightCurrentKg} kg${detail.weightTargetKg ? ` → ${detail.weightTargetKg} kg` : ''}` : null],
    ['Body type', detail.bodyType],
    ['Daily targets', goals.calories ? `${goals.calories} kcal · P${goals.protein ?? '–'} C${goals.carbs ?? '–'} F${goals.fat ?? '–'}` : null],
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 animate-fade-slide-up">
      {backButton}

      <Card padding="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={detail.avatar} name={detail.name} size="w-14 h-14" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate" style={headingStyle}>{detail.name}</h1>
            <p className="text-[11px]" style={{ color: 'var(--hl-text-tertiary)' }}>{detail.email} · last active {detail.lastActive}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: 'var(--hl-teal)' }}>{detail.adherencePercent}%</p>
            <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>{detail.completedItems}/{detail.plannedItems} plan items done</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onMessage(detail.id)}><MessageSquare className="w-3.5 h-3.5" /> Message</Button>
            <Button variant="primary" size="sm" onClick={() => onBuildPlan(detail.id)}><FileText className="w-3.5 h-3.5" /> Edit plan</Button>
          </div>
        </div>
      </Card>

      {detail.medicalConditions && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'var(--hl-amber-light)', color: 'var(--hl-amber)', border: '1px solid var(--hl-amber-border)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>Medical notes:</strong> {detail.medicalConditions}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Card padding="p-4" className="space-y-2">
          <h2 className="text-sm font-bold" style={headingStyle}>Profile</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {profileFacts.map(([label, value]) => (
              <div key={label}>
                <dt className="hl-section-label">{label}</dt>
                <dd className="text-xs capitalize" style={{ color: 'var(--hl-text-primary)' }}>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Last 7 days intake */}
        <Card padding="p-4" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={headingStyle}>
              <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--hl-peach)' }} /> Last 7 days
            </h2>
            <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
              {loggedDays.length}/7 days logged · avg {avg('calories')} kcal · {avg('protein')}g protein
            </span>
          </div>
          <div className="space-y-2">
            {intake.map((d) => {
              const over = goals.calories ? d.calories > goals.calories * 1.1 : false;
              return (
                <div key={d.date} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 text-[10px]">
                  <span className="font-bold" style={{ color: 'var(--hl-text-secondary)' }}>
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <ProgressBar pct={(100 * d.calories) / calorieScale} color={over ? 'var(--hl-amber)' : 'var(--hl-peach)'} height="6px" />
                  <span className="tabular-nums" style={{ color: 'var(--hl-text-secondary)' }}>
                    {d.mealCount ? `${d.calories} kcal · P${d.protein}g` : 'not logged'}
                    {d.waterMl > 0 && ` · ${(d.waterMl / 1000).toFixed(1)}L`}
                  </span>
                </div>
              );
            })}
          </div>
          {goals.calories && (
            <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>Bar = share of the {goals.calories} kcal daily target (amber = 10%+ over).</p>
          )}
        </Card>
      </div>

      {/* Active plans */}
      <Card padding="p-4" className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2" style={headingStyle}>
          <ClipboardList className="w-4 h-4" style={{ color: 'var(--hl-lavender)' }} /> Active plans
        </h2>
        {detail.plans.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>No active plan.</p>
            <Button variant="primary" size="sm" onClick={() => onBuildPlan(detail.id)}><Plus className="w-3.5 h-3.5" /> Create plan</Button>
          </div>
        ) : (
          detail.plans.map((plan) => {
            const { days, total, done, pct } = planProgress(plan);
            return (
              <div key={plan.id} className="p-3 rounded-xl space-y-2" style={{ background: 'var(--hl-surface-alt)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  {plan.type === 'workout'
                    ? <Dumbbell className="w-4 h-4" style={{ color: 'var(--hl-teal)' }} />
                    : <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--hl-peach)' }} />}
                  <p className="text-xs font-bold flex-1 min-w-0 truncate" style={{ color: 'var(--hl-text-primary)' }}>{plan.title}</p>
                  <Badge variant="teal">{plan.createdBy === 'ai' ? 'AI' : plan.createdBy}</Badge>
                  <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>week of {plan.weekStartDate}</span>
                  <button onClick={() => endPlan(plan)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--hl-text-tertiary)' }}>
                    <Archive className="w-3 h-3" /> End
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><ProgressBar pct={pct} color="var(--hl-lavender)" /></div>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--hl-lavender)' }}>{done}/{total} · {pct}%</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_LABELS.map((label, i) => {
                    const dayTotal = days[String(i)].items.length;
                    const dayDone = plan.completions.filter((c) => c.dayOfWeek === i).length;
                    const complete = dayTotal > 0 && dayDone >= dayTotal;
                    return (
                      <div
                        key={label}
                        title={`${label}: ${dayDone}/${dayTotal} done`}
                        className="text-center rounded-lg py-1"
                        style={{
                          background: complete ? 'var(--hl-green-light)' : 'var(--hl-surface)',
                          border: `1px solid ${complete ? 'var(--hl-green-border)' : 'var(--hl-border-light)'}`,
                        }}
                      >
                        <p className="text-[9px] font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>{label.slice(0, 3)}</p>
                        <p className="text-[10px] font-bold" style={{ color: complete ? 'var(--hl-green)' : 'var(--hl-text-secondary)' }}>
                          {dayTotal ? `${dayDone}/${dayTotal}` : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent workouts */}
        <Card padding="p-4" className="space-y-2">
          <h2 className="text-sm font-bold flex items-center gap-2" style={headingStyle}>
            <Dumbbell className="w-4 h-4" style={{ color: 'var(--hl-teal)' }} /> Recent workouts
          </h2>
          {detail.recentWorkouts.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--hl-text-tertiary)' }}>No workouts logged.</p>
          ) : (
            detail.recentWorkouts.map((w) => {
              const doneSets = w.sets.filter((s) => s.completed).length;
              return (
                <div key={w.id} className="flex items-center justify-between text-xs py-1.5" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{w.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>{w.date}{w.durationMinutes ? ` · ${w.durationMinutes} min` : ''}</p>
                  </div>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--hl-teal)' }}>{doneSets}/{w.sets.length} sets</span>
                </div>
              );
            })
          )}
        </Card>

        {/* Coach notes */}
        <Card padding="p-4" className="space-y-2">
          <h2 className="text-sm font-bold" style={headingStyle}>Private notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            disabled={!detail.assigned}
            placeholder={detail.assigned ? 'Allergies, preferences, progress observations… (only you can see these)' : 'Notes are available once this member picks you as their coach.'}
            aria-label="Private notes about this client"
            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 disabled:opacity-60"
            style={fieldStyle}
          />
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={saveNotes} loading={isSavingNotes} disabled={!detail.assigned || notes === detail.notes}>
              <Save className="w-3.5 h-3.5" /> Save notes
            </Button>
            {notesMsg && <span className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>{notesMsg}</span>}
          </div>
        </Card>
      </div>

      {/* Plan history */}
      {detail.planHistory.length > 0 && (
        <Card padding="p-4" className="space-y-2">
          <h2 className="text-sm font-bold" style={headingStyle}>Plan history</h2>
          {detail.planHistory.map((plan) => {
            const { done, total, pct } = planProgress(plan);
            return (
              <div key={plan.id} className="flex items-center gap-3 text-xs">
                <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--hl-text-primary)' }}>{plan.title}</span>
                <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>week of {plan.weekStartDate}</span>
                <span className="text-[10px] font-bold w-20 text-right" style={{ color: 'var(--hl-text-secondary)' }}>{done}/{total} · {pct}%</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

/** ── Plan Builder panel: 'consultations' tab ─────────────────────────────── */
const PlanBuilder: React.FC<{ user: UserProfile; initialClientId: string | null }> = ({ user, initialClientId }) => {
  const roster = useRoster();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);
  const [detail, setDetail] = useState<ClientDetail | null>(null);

  const planType: 'nutrition' | 'workout' = user.coachSpecialty === 'trainer' ? 'workout' : 'nutrition';
  const defaultTitle = planType === 'nutrition' ? 'Weekly Nutrition Plan' : 'Weekly Workout Plan';

  const [title, setTitle] = useState(defaultTitle);
  const [weekStartDate, setWeekStartDate] = useState(thisMonday());
  const [days, setDays] = useState<Record<string, PlanDay>>(emptyDays());
  const [notes, setNotes] = useState('');
  const [existingPlan, setExistingPlan] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const resetForm = () => {
    setExistingPlan(null);
    setTitle(defaultTitle);
    setWeekStartDate(thisMonday());
    setDays(emptyDays());
    setNotes('');
  };

  useEffect(() => {
    if (!selectedClientId) return;
    setIsLoadingPlan(true);
    setSaveMsg(null);
    api.getClientDetail(selectedClientId)
      .then((d) => {
        setDetail(d);
        const existing = d.plans.find((p) => p.type === planType);
        if (existing) {
          setExistingPlan(existing);
          setTitle(existing.content.title || existing.title);
          setWeekStartDate(existing.weekStartDate);
          setDays(normalizeDays(existing.content.days));
          setNotes(existing.content.notes || '');
        } else {
          resetForm();
        }
      })
      .catch((err) => {
        console.error(err);
        setSaveMsg('Could not load this client.');
      })
      .finally(() => setIsLoadingPlan(false));
  }, [selectedClientId, planType]);

  const addItem = (dayKey: string) => {
    setDays((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], items: [...prev[dayKey].items, emptyItem(planType)] },
    }));
  };

  const removeItem = (dayKey: string, idx: number) => {
    setDays((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], items: prev[dayKey].items.filter((_, i) => i !== idx) },
    }));
  };

  const updateItem = (dayKey: string, idx: number, patch: Partial<PlanNutritionItem & PlanWorkoutItem>) => {
    setDays((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        items: prev[dayKey].items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
      },
    }));
  };

  const copyDay = (fromKey: string, toKey: string) => {
    setDays((prev) => ({
      ...prev,
      [toKey]: { ...prev[toKey], items: prev[fromKey].items.map((it) => ({ ...it })) },
    }));
  };

  const handleDraft = async () => {
    if (!selectedClientId) return;
    const hasItems = dayList(days).some((d) => d.items.length > 0);
    if (hasItems && !window.confirm('Replace the current days with an AI draft?')) return;
    setIsDrafting(true);
    setSaveMsg(null);
    try {
      const draft = await api.draftPlan(selectedClientId, planType);
      if (draft.title) setTitle(draft.title);
      setDays(normalizeDays(draft.days));
      setNotes(draft.notes || '');
      setSaveMsg('AI draft loaded — review and edit before saving.');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'AI draft failed.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClientId) return;
    setIsSaving(true);
    setSaveMsg(null);
    // Drop blank rows so the client never sees unnamed items.
    const cleanDays = normalizeDays(null);
    dayList(days).forEach((d, i) => { cleanDays[String(i)].items = d.items.filter((it) => it.name?.trim()); });
    const content: PlanContent = { title, days: cleanDays, notes: notes || undefined };
    try {
      const saved = await api.createPlan({
        member_id: selectedClientId,
        type: planType,
        title,
        week_start_date: weekStartDate,
        content,
      });
      setExistingPlan(saved);
      setDays(cleanDays);
      setSaveMsg(existingPlan ? 'Plan updated — the previous version was archived.' : 'Plan saved and shared with your client.');
    } catch (err) {
      console.error('Failed to save plan:', err);
      setSaveMsg(err instanceof Error ? err.message : 'Failed to save plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndPlan = async () => {
    if (!existingPlan || !window.confirm(`End "${existingPlan.title}"? The client will no longer see it as active.`)) return;
    try {
      await api.archivePlan(existingPlan.id);
      resetForm();
      setSaveMsg('Plan ended.');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to end plan.');
    }
  };

  const namedItemCount = dayList(days).reduce((n, d) => n + d.items.filter((it) => it.name?.trim()).length, 0);
  const calorieGoal = detail?.goals.calories ?? null;
  const proteinGoal = detail?.goals.protein ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10 animate-fade-slide-up">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={headingStyle}>
          <FileText className="w-5 h-5" style={{ color: 'var(--hl-lavender)' }} />
          Plan Builder
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
          Build a {planType} plan for a client, day by day — start from scratch or from an AI draft.
        </p>
      </div>

      {/* Client picker */}
      <Card padding="p-4" className="space-y-2">
        <label htmlFor="plan-client" className="hl-section-label block">Client</label>
        {!roster ? (
          <SkeletonRow />
        ) : (
          <select
            id="plan-client"
            value={selectedClientId || ''}
            onChange={(e) => setSelectedClientId(e.target.value || null)}
            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1"
            style={fieldStyle}
          >
            <option value="">Select a client…</option>
            {roster.clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.status}</option>
            ))}
          </select>
        )}
        {detail && selectedClientId === detail.id && (
          <p className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
            {[detail.goal && `Goal: ${detail.goal}`, calorieGoal && `${calorieGoal} kcal/day`, proteinGoal && `${proteinGoal}g protein`, detail.medicalConditions && `⚠ ${detail.medicalConditions}`]
              .filter(Boolean).join(' · ') || 'No goals set by this client yet.'}
          </p>
        )}
      </Card>

      {!selectedClientId ? (
        <Card padding="p-8" className="text-center">
          <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>Select a client to build or edit their plan.</p>
        </Card>
      ) : isLoadingPlan ? (
        <div className="space-y-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <>
          <Card padding="p-4" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {existingPlan ? (
                <Badge variant="amber">Editing active plan — saving creates a new version and archives this one</Badge>
              ) : (
                <Badge variant="teal">New plan</Badge>
              )}
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={handleDraft} loading={isDrafting}>
                <Wand2 className="w-3.5 h-3.5" /> AI draft
              </Button>
              {existingPlan && (
                <Button variant="ghost" size="sm" onClick={handleEndPlan}>
                  <Archive className="w-3.5 h-3.5" /> End plan
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="plan-title" className="hl-section-label block mb-1">Title</label>
                <input id="plan-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1" style={fieldStyle} />
              </div>
              <div>
                <label htmlFor="plan-week" className="hl-section-label block mb-1">Week starting (Monday)</label>
                <input id="plan-week" type="date" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1" style={fieldStyle} />
              </div>
            </div>
            <div>
              <label htmlFor="plan-notes" className="hl-section-label block mb-1">Notes for the client (optional)</label>
              <textarea id="plan-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1" style={fieldStyle} />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {DAY_LABELS.map((label, i) => {
              const dayKey = String(i);
              const day = days[dayKey];
              const kcal = planType === 'nutrition'
                ? day.items.reduce((n, it) => n + (Number((it as PlanNutritionItem).calories) || 0), 0)
                : 0;
              const protein = planType === 'nutrition'
                ? day.items.reduce((n, it) => n + (Number((it as PlanNutritionItem).protein) || 0), 0)
                : 0;
              const offTarget = calorieGoal ? Math.abs(kcal - calorieGoal) > calorieGoal * 0.1 : false;
              return (
                <Card key={dayKey} padding="p-3" className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>{label}</p>
                    {day.items.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && copyDay(dayKey, e.target.value)}
                        aria-label={`Copy ${label} to another day`}
                        className="text-[10px] px-1 py-0.5 rounded-lg"
                        style={miniFieldStyle}
                      >
                        <option value="">Copy to…</option>
                        {DAY_LABELS.map((l, j) => (j === i ? null : <option key={l} value={String(j)}>{l}</option>))}
                      </select>
                    )}
                  </div>
                  {planType === 'nutrition' && day.items.length > 0 && (
                    <p className="text-[10px] font-bold" style={{ color: offTarget ? 'var(--hl-amber)' : 'var(--hl-green)' }}>
                      {kcal}{calorieGoal ? ` / ${calorieGoal}` : ''} kcal · {protein}{proteinGoal ? ` / ${proteinGoal}` : ''}g protein
                    </p>
                  )}
                  <div className="space-y-2">
                    {day.items.map((item, idx) => (
                      <div key={idx} className="p-2 rounded-xl space-y-1" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Name"
                            aria-label="Item name"
                            value={item.name ?? ''}
                            onChange={(e) => updateItem(dayKey, idx, { name: e.target.value })}
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg text-[10px] focus:outline-none"
                            style={miniFieldStyle}
                          />
                          <button onClick={() => removeItem(dayKey, idx)} aria-label="Remove item" className="shrink-0 p-1 rounded-lg" style={{ color: 'var(--hl-red, #e05555)' }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {planType === 'nutrition' ? (
                          <div className="grid grid-cols-2 gap-1">
                            <input type="number" min={0} placeholder="kcal" aria-label="Calories" value={(item as PlanNutritionItem).calories ?? 0}
                              onChange={(e) => updateItem(dayKey, idx, { calories: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle} />
                            <select value={(item as PlanNutritionItem).category ?? 'snack'} aria-label="Meal category"
                              onChange={(e) => updateItem(dayKey, idx, { category: e.target.value as PlanNutritionItem['category'] })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle}>
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                            <input type="number" min={0} placeholder="protein" aria-label="Protein (g)" value={(item as PlanNutritionItem).protein ?? 0}
                              onChange={(e) => updateItem(dayKey, idx, { protein: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle} />
                            <input type="number" min={0} placeholder="carbs" aria-label="Carbs (g)" value={(item as PlanNutritionItem).carbs ?? 0}
                              onChange={(e) => updateItem(dayKey, idx, { carbs: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle} />
                            <input type="number" min={0} placeholder="fat" aria-label="Fat (g)" value={(item as PlanNutritionItem).fat ?? 0}
                              onChange={(e) => updateItem(dayKey, idx, { fat: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px] col-span-2" style={miniFieldStyle} />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1">
                            <input type="number" min={1} placeholder="sets" aria-label="Sets" value={(item as PlanWorkoutItem).sets ?? 1}
                              onChange={(e) => updateItem(dayKey, idx, { sets: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle} />
                            <input type="number" min={0} placeholder="reps" aria-label="Reps" value={(item as PlanWorkoutItem).reps ?? 0}
                              onChange={(e) => updateItem(dayKey, idx, { reps: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={miniFieldStyle} />
                            <input type="text" placeholder="notes" aria-label="Coaching notes" value={(item as PlanWorkoutItem).notes || ''}
                              onChange={(e) => updateItem(dayKey, idx, { notes: e.target.value })}
                              className="px-2 py-1 rounded-lg text-[10px] col-span-2" style={miniFieldStyle} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addItem(dayKey)}
                    className="w-full flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg transition-all"
                    style={{ background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)' }}
                  >
                    <Plus className="w-3 h-3" /> {planType === 'nutrition' ? 'Add meal' : 'Add exercise'}
                  </button>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={!title.trim() || !weekStartDate || namedItemCount === 0}>
              <Sparkles className="w-3.5 h-3.5" /> {existingPlan ? 'Save new version' : 'Save & share plan'}
            </Button>
            <span className="text-[11px]" style={{ color: 'var(--hl-text-tertiary)' }}>{namedItemCount} item{namedItemCount === 1 ? '' : 's'}</span>
            {saveMsg && <span className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>{saveMsg}</span>}
          </div>
        </>
      )}
    </div>
  );
};

/** ── Chat panel: 'chat' tab — opens initialPartnerId's thread when given ── */
const CoachChatPanel: React.FC<{ user: UserProfile; initialPartnerId?: string | null }> = ({ user, initialPartnerId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [search, setSearch] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    setIsLoadingConvs(true);
    api.getConversations()
      .then((data) => {
        setConversations(data);
        if (data.length > 0 && !selectedConv) {
          setSelectedConv(data.find((c) => c.partner?.id === initialPartnerId) ?? data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingConvs(false));
  }, []);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConv) return;
    setIsLoadingMsgs(true);
    api.getMessages(selectedConv.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setIsLoadingMsgs(false));
  }, [selectedConv]);

  // Real-time polling for messages & conversation updates
  useConversationPolling(selectedConv, setMessages, setConversations);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !selectedConv || isSending) return;
    const text = chatMsg.trim();
    setChatMsg('');
    setIsSending(true);

    try {
      const newMsg = await api.sendMessage(selectedConv.id, text);
      setMessages((prev) => [...prev, newMsg]);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, lastMessage: newMsg } : c))
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.partner?.name || 'Client';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const getPartnerName = (conv: Conversation | null) => {
    if (!conv) return 'Client';
    return conv.partner?.name || 'HealthyLife Member';
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] min-h-[500px] flex flex-col animate-fade-slide-up pb-4">
      {/* Minimalist Chat Container */}
      <div
        className="flex-1 flex rounded-3xl overflow-hidden shadow-sm"
        style={{
          background: 'var(--hl-surface)',
          border: '1px solid var(--hl-border)',
        }}
      >
        {/* Left: Client List */}
        <div
          className={`w-full lg:w-80 flex flex-col ${selectedConv ? 'hidden lg:flex' : 'flex'}`}
          style={{ borderRight: '1px solid var(--hl-border-light)' }}
        >
          {/* Header & Search */}
          <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--hl-green)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                  Client Chats
                </h2>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)' }}
              >
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 transition-all"
                style={{
                  background: 'var(--hl-surface-alt)',
                  border: '1px solid var(--hl-border)',
                  color: 'var(--hl-text-primary)',
                }}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConvs ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-center text-xs py-8" style={{ color: 'var(--hl-text-tertiary)' }}>
                No clients found.
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const partnerName = conv.partner?.name || 'Member';
                const lastMsg = conv.lastMessage?.body || 'Start chatting';
                const avatar = conv.partner?.avatar;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className="w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3"
                    style={
                      isSelected
                        ? {
                            background: 'var(--hl-green-light)',
                            border: '1px solid var(--hl-green-border)',
                          }
                        : {
                            background: 'transparent',
                            border: '1px solid transparent',
                          }
                    }
                  >
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={partnerName}
                          className="w-10 h-10 rounded-full object-cover ring-2"
                          style={{ borderColor: isSelected ? 'var(--hl-green)' : 'var(--hl-border)' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-green)' }}
                        >
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-green-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className="text-xs font-bold truncate"
                          style={{ color: 'var(--hl-text-primary)' }}
                        >
                          {partnerName}
                        </p>
                        {conv.lastMessage?.time && (
                          <span
                            className="text-[9px]"
                            style={{ color: 'var(--hl-text-tertiary)' }}
                          >
                            {conv.lastMessage.time}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] truncate mt-0.5"
                        style={{ color: isSelected ? 'var(--hl-green)' : 'var(--hl-text-tertiary)' }}
                      >
                        {lastMsg}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream & Input */}
        <div className={`flex-1 flex flex-col ${selectedConv ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-tertiary)' }}
                >
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--hl-text-secondary)' }}>
                  Select a client to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Minimal Header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--hl-border-light)' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="lg:hidden text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-text-secondary)' }}
                  >
                    ← Back
                  </button>

                  <div className="relative">
                    {selectedConv.partner?.avatar ? (
                      <img
                        src={selectedConv.partner.avatar}
                        alt={getPartnerName(selectedConv)}
                        className="w-9 h-9 rounded-full object-cover ring-2"
                        style={{ borderColor: 'var(--hl-green-border)' }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-green)' }}
                      >
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-white bg-green-500" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                      {getPartnerName(selectedConv)}
                    </h3>
                    <p className="text-[10px] flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ background: 'var(--hl-surface-alt)' }}
              >
                {isLoadingMsgs ? (
                  <div className="space-y-3">
                    <SkeletonChatBubble align="left" width="45%" />
                    <SkeletonChatBubble align="right" width="35%" />
                    <SkeletonChatBubble align="left" width="55%" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 space-y-1">
                    <p className="text-xs font-medium" style={{ color: 'var(--hl-text-secondary)' }}>
                      No messages yet
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--hl-text-tertiary)' }}>
                      Send a message to start the consultation.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMine = m.isMine ?? (m.sender === 'coach');
                    const text = m.body ?? m.text;
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className="px-4 py-2.5 rounded-2xl text-xs max-w-sm sm:max-w-md leading-relaxed shadow-xs"
                          style={
                            isMine
                              ? { background: 'var(--hl-green)', color: '#fff' }
                              : {
                                  background: 'var(--hl-surface)',
                                  color: 'var(--hl-text-primary)',
                                  border: '1px solid var(--hl-border-light)',
                                }
                          }
                        >
                          {text}
                        </div>
                        {m.time && (
                          <span
                            className="text-[9px] mt-1 px-1"
                            style={{ color: 'var(--hl-text-tertiary)' }}
                          >
                            {m.time}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Minimal Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 flex gap-2 items-center"
                style={{
                  borderTop: '1px solid var(--hl-border-light)',
                  background: 'var(--hl-surface)',
                }}
              >
                <input
                  type="text"
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  placeholder={`Message ${getPartnerName(selectedConv)}…`}
                  disabled={isSending}
                  className="flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 transition-all"
                  style={{
                    background: 'var(--hl-surface-alt)',
                    border: '1px solid var(--hl-border)',
                    color: 'var(--hl-text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatMsg.trim() || isSending}
                  className="p-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center disabled:opacity-40"
                  style={{ background: 'var(--hl-green)', color: '#fff' }}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** ── Root: branches on currentTab ────────────────────────────────────────── */
export const CoachDashboardView: React.FC<CoachDashboardViewProps> = ({ user, currentTab, onSelectTab }) => {
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [planClientId, setPlanClientId] = useState<string | null>(null);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);

  const actions: ClientActions = {
    onOpenClient: (id) => { setOpenClientId(id); onSelectTab('clients'); },
    onBuildPlan: (id) => { setPlanClientId(id); onSelectTab('consultations'); },
    onMessage: (id) => { setChatPartnerId(id); onSelectTab('chat'); },
  };

  switch (currentTab) {
    case 'ai-assistant':
      return null; // rendered by App as a shared view
    case 'clients':
      return openClientId
        ? <ClientDetailView key={openClientId} clientId={openClientId} onBack={() => setOpenClientId(null)} {...actions} />
        : <ClientRoster user={user} {...actions} />;
    case 'consultations':
      return <PlanBuilder key={planClientId ?? 'none'} user={user} initialClientId={planClientId} />;
    case 'chat':
      return <CoachChatPanel key={chatPartnerId ?? 'none'} user={user} initialPartnerId={chatPartnerId} />;
    default:
      return <CoachOverview user={user} {...actions} />;
  }
};

export default CoachDashboardView;
