import React, { useState } from 'react';
import { AdminSystemStats, SystemUser, AIApiLog, SocialPost } from '../../types';
import { mockAdminStats, mockSystemUsers, mockAILogs, mockSocialPosts } from '../../data/mockData';
import { 
  Users, 
  DollarSign, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  Database, 
  Key, 
  TrendingUp, 
  UserPlus, 
  RefreshCw 
} from 'lucide-react';

interface AdminViewProps {
  activeTab?: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ activeTab }) => {
  const [internalSubTab, setInternalSubTab] = useState<'overview' | 'users' | 'ai-logs' | 'moderation'>('overview');
  
  // Sync activeTab from navbar if provided
  const activeAdminSubTab = React.useMemo(() => {
    if (activeTab === 'user-management') return 'users';
    if (activeTab === 'ai-logs') return 'ai-logs';
    if (activeTab === 'content-moderation') return 'moderation';
    if (activeTab === 'admin-dashboard') return 'overview';
    return internalSubTab;
  }, [activeTab, internalSubTab]);

  const setActiveAdminSubTab = (tab: 'overview' | 'users' | 'ai-logs' | 'moderation') => {
    setInternalSubTab(tab);
  };
  const [stats] = useState<AdminSystemStats>(mockAdminStats);
  const [usersList, setUsersList] = useState<SystemUser[]>(mockSystemUsers);
  const [aiLogs] = useState<AIApiLog[]>(mockAILogs);
  const [postsList, setPostsList] = useState<SocialPost[]>(mockSocialPosts);
  const [searchQuery, setSearchQuery] = useState('');

  // User management action handlers
  const handleToggleUserRole = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextRole = u.role === 'member' ? 'coach' : u.role === 'coach' ? 'admin' : 'member';
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HealthyLife System Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time management for platform operations, role permissions, AI API logs, and revenue.
          </p>
        </div>

        {/* Sub tab navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'User & Roles', icon: Users },
            { id: 'ai-logs', label: 'AI Telemetry Logs', icon: Zap },
            { id: 'moderation', label: 'Moderation', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-bold">↑ +14.2% this month</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Monthly Revenue (MRR)</span>
            <DollarSign className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">${stats.mrrDollars.toLocaleString()}</p>
          <p className="text-[10px] text-teal-600 font-bold">↑ +18.5% YoY</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Certified Coaches</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.certifiedCoaches}</p>
          <p className="text-[10px] text-purple-600 font-bold">12 Pending Approvals</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>AI Latency</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.avgAiLatencyMs}ms</p>
          <p className="text-[10px] text-emerald-600 font-bold">{stats.serverHealth}</p>
        </div>
      </div>

      {/* SUB-VIEW 1: OVERVIEW */}
      {activeAdminSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent System Activity */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span>Platform Health & Traffic Metrics</span>
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AI API Llama-3.3-70b Key Status</p>
                  <p className="text-[11px] text-slate-500">API Key configured in environment. Rate limits normal.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Active (200 OK)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Database Synchronization</p>
                  <p className="text-[11px] text-slate-500">Local client cache & persistent state active.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Synced
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">CycleSync™ Engine</p>
                  <p className="text-[11px] text-slate-500">99.4% biological prediction accuracy reported.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  Optimal
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Admin Quick Controls</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveAdminSubTab('users')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Manage Users & Roles</span>
                <Users className="w-4 h-4 text-purple-500" />
              </button>

              <button
                onClick={() => setActiveAdminSubTab('ai-logs')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Inspect AI API Usage</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </button>

              <button
                onClick={() => setActiveAdminSubTab('moderation')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Community Moderation Queue</span>
                <AlertTriangle className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: USER MANAGEMENT & ROLE SWITCHING */}
      {activeAdminSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">User Account & Role Controls</h3>
              <p className="text-xs text-slate-500">Seamlessly assign Member, Coach, or Admin privileges.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-extrabold text-slate-400">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Role & Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-3">
                        <img src={usr.avatar} alt={usr.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-400/50" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{usr.name}</p>
                          <p className="text-[10px] text-slate-400">{usr.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        usr.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300' 
                          : usr.role === 'coach'
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                      }`}>
                        {usr.role}
                      </span>
                    </td>

                    <td className="py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {usr.plan}
                    </td>

                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        usr.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {usr.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right pr-2 space-x-2">
                      <button
                        onClick={() => handleToggleUserRole(usr.id)}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold transition-all"
                      >
                        Cycle Role
                      </button>

                      <button
                        onClick={() => handleToggleUserStatus(usr.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-all"
                      >
                        {usr.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: AI TELEMETRY LOGS */}
      {activeAdminSubTab === 'ai-logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">AI API Telemetry & Logs</h3>
              <p className="text-xs text-slate-500">Live token metrics for Llama-3.3-70b execution.</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Key: gsk_CkXp...qJgBj0</span>
            </div>
          </div>

          <div className="space-y-3">
            {aiLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{log.endpoint}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.2 rounded font-mono">
                      {log.model}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Requested by role: <strong className="capitalize">{log.requestedByRole}</strong> • Latency: <strong>{log.latencyMs}ms</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">{log.tokensUsed} tokens</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: MODERATION */}
      {activeAdminSubTab === 'moderation' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Community Safety & Moderation</h3>
            <p className="text-xs text-slate-500">Review user posts, transformations, and flagged items.</p>
          </div>

          <div className="space-y-4">
            {postsList.map((post) => (
              <div key={post.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{post.author}</span>
                      <span className="text-[10px] text-slate-400 block">{post.timeAgo}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    Safe & Approved
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{post.content}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Post</span>
                  </button>
                  <button className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
