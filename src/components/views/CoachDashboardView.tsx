import React, { useState, useEffect } from 'react';
import { ClientRecord, UserProfile } from '../../types';
import { api } from '../../services/api';
import {
  Briefcase, Users, Video, Plus, MessageSquare, Star,
  FileText, Send, TrendingUp, Loader2, AlertCircle, Search
} from 'lucide-react';

interface CoachDashboardViewProps {
  user: UserProfile;
}

export const CoachDashboardView: React.FC<CoachDashboardViewProps> = ({ user }) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'client', text: 'Hi Coach! Completed today\'s RDL set at 75kg.', time: '10:15 AM' },
    { sender: 'coach', text: 'Awesome work! Your hip hinge form looked clean.', time: '10:18 AM' },
  ]);

  useEffect(() => {
    api.getClients()
      .then((data) => {
        setClients(data);
        if (data.length > 0) setSelectedClient(data[0]);
      })
      .catch((e) => setError(e?.message || 'Failed to load clients.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.planName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    setMessages((prev) => [...prev, { sender: 'coach', text: chatMsg, time: 'Just now' }]);
    setChatMsg('');
  };

  const stats = [
    { label: 'Active Clients', value: clients.length.toString(), sub: 'Total roster', icon: <Users className="w-4 h-4 text-teal-400" /> },
    { label: 'Avg Adherence', value: clients.length > 0 ? `${Math.round(clients.reduce((a, c) => a + c.adherencePercent, 0) / clients.length)}%` : '—', sub: 'Across all clients', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
    { label: 'Coach Rating', value: '4.9', sub: 'Platform average', icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> },
    { label: 'Sessions', value: '12', sub: 'This month', icon: <Video className="w-4 h-4 text-violet-400" /> },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Coach Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="text-xs text-slate-400">Manage clients, review progress, and build AI-powered training blueprints.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-colors shadow-md">
            <Plus className="w-4 h-4 stroke-[3]" />
            Add New Client
          </button>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-4 border-t border-slate-800/60">
          {stats.map((s) => (
            <div key={s.label} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                {s.icon}
              </div>
              <p className="text-xl font-black text-slate-100">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Client Roster */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-slate-100">Client Roster</h2>
            <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">{clients.length}</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-teal-500 mr-2" />
                <span className="text-xs">Loading clients…</span>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No clients found.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`w-full p-4 rounded-3xl border text-left transition-all ${
                    selectedClient?.id === c.id
                      ? 'bg-teal-950/60 border-teal-600 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/60" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-100 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.planName}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'On Track' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                    }`}>{c.status}</span>
                    <span className="text-slate-400 font-semibold">{c.adherencePercent}%</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Client Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedClient ? (
            <div className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-3xl">
              <p className="text-sm text-slate-500">Select a client to view details</p>
            </div>
          ) : (
            <>
              {/* Client Overview */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <img src={selectedClient.avatar} alt={selectedClient.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{selectedClient.name}</h3>
                      <p className="text-xs text-slate-400">{selectedClient.email} • {selectedClient.planName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Last active: {selectedClient.lastActive}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-md">
                    <Video className="w-4 h-4" />
                    Start Video Call
                  </button>
                </div>

                {selectedClient.notes && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-400">Clinical & Bio Notes</p>
                    <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-200 leading-relaxed">
                      {selectedClient.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Chat */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  Direct Message — {selectedClient.name.split(' ')[0]}
                </h3>

                <div className="max-h-52 overflow-y-auto p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.sender === 'coach' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-xs ${
                        m.sender === 'coach' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-200 border border-slate-600'
                      }`}>{m.text}</div>
                      <span className="text-[9px] text-slate-500 mt-0.5">{m.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    placeholder={`Message ${selectedClient.name.split(' ')[0]}…`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
