import React from 'react';
import { NavigationTab } from '../types';
import { Sparkles, Heart, ShieldCheck, Zap } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Col */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Healthy<span className="text-emerald-600 dark:text-emerald-400">Life</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
            Next-generation organic tech ecosystem unifying fitness, nutrition, hormonal biological rhythms, pro coaching, and AI intelligence.
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            ● Llama-3.3-70b AI Engine Active • 99.99% System Operational
          </p>
        </div>

        {/* Workspace Quick Links */}
        <div className="space-y-2">
          <p className="text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">Ecosystem</p>
          <ul className="space-y-1.5">
            <li><button onClick={() => onSelectTab('dashboard')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Member Overview</button></li>
            <li><button onClick={() => onSelectTab('nutrition')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Nutrition & AI Meals</button></li>
            <li><button onClick={() => onSelectTab('workouts')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Workouts & Sculpt</button></li>
            <li><button onClick={() => onSelectTab('cycle')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">CycleSync™ Biological Phase</button></li>
            <li><button onClick={() => onSelectTab('ai-assistant')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">HealthyLife AI Advisor</button></li>
          </ul>
        </div>

        {/* Community & Pro Roles */}
        <div className="space-y-2">
          <p className="text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">Roles & Workspaces</p>
          <ul className="space-y-1.5">
            <li><button onClick={() => onSelectTab('dashboard')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">👤 Member Dashboard</button></li>
            <li><button onClick={() => onSelectTab('coach-dashboard')} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">🏋️ Coach Portal</button></li>
            <li><button onClick={() => onSelectTab('admin-dashboard')} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">🛡️ Admin Suite</button></li>
            <li><button onClick={() => onSelectTab('community')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Community Leaderboard</button></li>
          </ul>
        </div>

        {/* Digest */}
        <div className="space-y-3">
          <p className="text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">HealthyLife Digest</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Subscribe for weekly bio-hacking, nutrition research & AI coaching tips.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email..."
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 w-full"
            />
            <button className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shrink-0">
              Subscribe
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© 2026 HealthyLife Organic Tech Ecosystem. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-900 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-900 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
          <span>•</span>
          <span className="hover:text-slate-900 dark:hover:text-slate-300 cursor-pointer">AI Security & Privacy</span>
        </div>
      </div>
    </footer>
  );
};
