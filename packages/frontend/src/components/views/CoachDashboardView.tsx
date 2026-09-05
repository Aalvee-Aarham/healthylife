import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserProfile,
  Conversation,
  ChatMessage,
  NavigationTab,
  ClientRecord,
  Plan,
  PlanContent,
  PlanDay,
  PlanItem,
  PlanNutritionItem,
  PlanWorkoutItem,
} from '../../types';
import { api } from '../../services/api';
import {
  MessageSquare, Send, Loader2, Search, User, CheckCircle2, Users, FileText,
  Plus, Trash2, Sparkles, ChevronRight,
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

function emptyItem(type: 'nutrition' | 'workout'): PlanItem {
  return type === 'nutrition'
    ? { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, category: 'breakfast' }
    : { name: '', sets: 3, reps: 10, notes: '' };
}

/** ── Roster panel: 'clients' tab ─────────────────────────────────────────── */
const ClientRoster: React.FC<{
  user: UserProfile;
  onBuildPlan: (client: ClientRecord) => void;
}> = ({ user, onBuildPlan }) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api.getMyCoaches()
      .then((data) => setClients(data as ClientRecord[]))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const planLabel = user.coachSpecialty === 'trainer' ? 'Training Plan' : 'Nutrition Plan';

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
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
            className="pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 transition-all"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
          />
        </div>
      </div>

      {isLoading ? (
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
              <div className="flex items-center gap-3">
                {client.avatar ? (
                  <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'var(--hl-surface-alt)', color: 'var(--hl-teal)' }}>
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{client.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{client.email}</p>
                </div>
                <Badge variant={client.status === 'active' || client.status === 'On Track' ? 'green' : 'amber'}>
                  {client.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>
                <span>{client.planName || planLabel}</span>
                <span className="font-bold" style={{ color: 'var(--hl-teal)' }}>{client.adherencePercent}% adherence</span>
              </div>

              <div className="hl-progress-track" style={{ height: '5px' }}>
                <div className="hl-progress-fill" style={{ width: `${client.adherencePercent}%`, background: 'var(--hl-teal)' }} />
              </div>

              <Button variant="primary" size="sm" fullWidth onClick={() => onBuildPlan(client)}>
                <FileText className="w-3.5 h-3.5" /> Build Plan
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/** ── Plan Builder panel: 'consultations' tab ─────────────────────────────── */
const PlanBuilder: React.FC<{ user: UserProfile; initialClient: ClientRecord | null }> = ({ user, initialClient }) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(initialClient);

  const planType: 'nutrition' | 'workout' = user.coachSpecialty === 'trainer' ? 'workout' : 'nutrition';

  const [title, setTitle] = useState(planType === 'nutrition' ? 'Weekly Nutrition Plan' : 'Weekly Workout Plan');
  const [weekStartDate, setWeekStartDate] = useState(thisMonday());
  const [days, setDays] = useState<Record<string, PlanDay>>(emptyDays());
  const [notes, setNotes] = useState('');
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingClients(true);
    api.getMyCoaches()
      .then((data) => setClients(data as ClientRecord[]))
      .catch(console.error)
      .finally(() => setIsLoadingClients(false));
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setIsLoadingPlan(true);
    setSaveMsg(null);
    api.getPlans(selectedClient.id)
      .then((plans) => {
        const existing = plans.find((p) => p.type === planType && p.status === 'active');
        if (existing) {
          setExistingPlanId(existing.id);
          setTitle(existing.content.title || existing.title);
          setWeekStartDate(existing.weekStartDate);
          setDays(existing.content.days || emptyDays());
          setNotes(existing.content.notes || '');
        } else {
          setExistingPlanId(null);
          setTitle(planType === 'nutrition' ? 'Weekly Nutrition Plan' : 'Weekly Workout Plan');
          setWeekStartDate(thisMonday());
          setDays(emptyDays());
          setNotes('');
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingPlan(false));
  }, [selectedClient, planType]);

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

  const handleSave = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    setSaveMsg(null);
    const content: PlanContent = { title, days, notes: notes || undefined };
    try {
      await api.createPlan({
        member_id: selectedClient.id,
        type: planType,
        title,
        week_start_date: weekStartDate,
        content,
      });
      setSaveMsg('Plan saved.');
    } catch (err) {
      console.error('Failed to save plan:', err);
      setSaveMsg('Failed to save plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10 animate-fade-slide-up">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--hl-lavender)' }} />
          Plan Builder
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
          Build a {planType} plan for a client, day by day.
        </p>
      </div>

      {/* Client picker */}
      <Card padding="p-4">
        <label className="hl-section-label block mb-2">Client</label>
        {isLoadingClients ? (
          <SkeletonRow />
        ) : (
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => setSelectedClient(clients.find((c) => c.id === e.target.value) || null)}
            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </Card>

      {!selectedClient ? (
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
            {existingPlanId && (
              <Badge variant="amber">Editing existing active plan — saving will create an updated version</Badge>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hl-section-label block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
              </div>
              <div>
                <label className="hl-section-label block mb-1">Week starting (Monday)</label>
                <input
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
              </div>
            </div>
            <div>
              <label className="hl-section-label block mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {DAY_LABELS.map((label, i) => {
              const dayKey = String(i);
              const day = days[dayKey];
              return (
                <Card key={dayKey} padding="p-3" className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'var(--hl-text-primary)' }}>{label}</p>
                  <div className="space-y-2">
                    {day.items.map((item, idx) => (
                      <div key={idx} className="p-2 rounded-xl space-y-1" style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Name"
                            value={item.name}
                            onChange={(e) => updateItem(dayKey, idx, { name: e.target.value })}
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg text-[10px] focus:outline-none"
                            style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                          />
                          <button onClick={() => removeItem(dayKey, idx)} className="shrink-0 p-1 rounded-lg" style={{ color: 'var(--hl-red, #e05555)' }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {planType === 'nutrition' ? (
                          <div className="grid grid-cols-2 gap-1">
                            <input type="number" placeholder="kcal" value={(item as PlanNutritionItem).calories}
                              onChange={(e) => updateItem(dayKey, idx, { calories: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                            <select value={(item as PlanNutritionItem).category}
                              onChange={(e) => updateItem(dayKey, idx, { category: e.target.value as PlanNutritionItem['category'] })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}>
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                            <input type="number" placeholder="protein" value={(item as PlanNutritionItem).protein}
                              onChange={(e) => updateItem(dayKey, idx, { protein: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                            <input type="number" placeholder="carbs" value={(item as PlanNutritionItem).carbs}
                              onChange={(e) => updateItem(dayKey, idx, { carbs: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                            <input type="number" placeholder="fat" value={(item as PlanNutritionItem).fat}
                              onChange={(e) => updateItem(dayKey, idx, { fat: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px] col-span-2" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1">
                            <input type="number" placeholder="sets" value={(item as PlanWorkoutItem).sets}
                              onChange={(e) => updateItem(dayKey, idx, { sets: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                            <input type="number" placeholder="reps" value={(item as PlanWorkoutItem).reps}
                              onChange={(e) => updateItem(dayKey, idx, { reps: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
                            <input type="text" placeholder="notes" value={(item as PlanWorkoutItem).notes || ''}
                              onChange={(e) => updateItem(dayKey, idx, { notes: e.target.value })}
                              className="px-2 py-1 rounded-lg text-[10px] col-span-2" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }} />
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
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={!title || !weekStartDate}>
              <Sparkles className="w-3.5 h-3.5" /> Save Plan
            </Button>
            {saveMsg && <span className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>{saveMsg}</span>}
          </div>
        </>
      )}
    </div>
  );
};

/** ── Chat panel: 'chat' tab (existing behavior, unchanged) ──────────────── */
const CoachChatPanel: React.FC<{ user: UserProfile }> = ({ user }) => {
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
          setSelectedConv(data[0]);
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
  const [planBuilderClient, setPlanBuilderClient] = useState<ClientRecord | null>(null);

  const handleBuildPlan = (client: ClientRecord) => {
    setPlanBuilderClient(client);
    onSelectTab('consultations');
  };

  if (currentTab === 'consultations') {
    return <PlanBuilder user={user} initialClient={planBuilderClient} />;
  }

  if (currentTab === 'chat') {
    return <CoachChatPanel user={user} />;
  }

  // 'clients' | 'coach-dashboard' | default
  return <ClientRoster user={user} onBuildPlan={handleBuildPlan} />;
};

export default CoachDashboardView;
