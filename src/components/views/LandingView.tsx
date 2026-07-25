import React, { useState } from 'react';
import { NavigationTab, UserRole } from '../../types';
import { askGroqAI } from '../../services/groqApi';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  Dumbbell, 
  Utensils, 
  Users, 
  Check, 
  Zap, 
  Send,
  User,
  Briefcase,
  Sliders,
  Heart,
  Bot
} from 'lucide-react';

interface LandingViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAuthModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectTab, onOpenAuthModal }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [heroPrompt, setHeroPrompt] = useState('Create a 15-min Ovulation Peak energizing workout');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleTestGroqAI = async () => {
    if (!heroPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const res = await askGroqAI(heroPrompt, 'member');
      setAiResponse(res);
    } catch {
      setAiResponse('HealthyLife AI generated a quick workout & meal plan recommendation!');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Light Theme Primary Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-sm">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>HealthyLife Organic Tech & Bio-Hormonal Sync Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Your Health & Fitness, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
              Empowered by HealthyLife AI.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Harmonize workouts, AI nutrition, and hormonal cycle intelligence in one unified workspace for Members, Coaches, and Admins.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              <span>Launch Live Member App</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold text-sm shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sign In / Select Role</span>
            </button>
          </div>

          {/* Live AI Sandbox Banner on Hero */}
          <div className="max-w-2xl mx-auto mt-8 p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-emerald-200 dark:border-slate-700 shadow-xl text-left space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Bot className="w-4 h-4" />
                <span>Test Drive HealthyLife AI Health Advisor</span>
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                Llama-3.3-70b
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                placeholder="Ask HealthyLife AI anything..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleTestGroqAI}
                disabled={isAiLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'Thinking...' : 'Generate'}</span>
              </button>
            </div>

            {aiResponse && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto whitespace-pre-line font-sans leading-relaxed">
                {aiResponse}
              </div>
            )}
          </div>

          {/* Platform Stats */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Active Healthy Members', value: '14,280+' },
              { label: 'AI Bio-Plans', value: '142,980+' },
              { label: 'CycleSync™ Accuracy', value: '99.4%' },
              { label: 'Certified Coaches', value: '184+' }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3 User Role Breakdown Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
            Tailored Experiences for Every Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            HealthyLife provides purpose-built interfaces for Members, Coaches, and System Admins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Member Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                Role 1: Member Experience
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Personal Health & Vitality</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Daily Macro & Hydration Tracker</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> CycleSync™ Biological Guidance</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Recipe & Workout Assistant</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Community Challenges & Feed</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors"
            >
              Open Member Dashboard
            </button>
          </div>

          {/* Coach Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold">
                Role 2: Coach Portal
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pro Client Management</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-500" /> Client Roster & Compliance Stats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-500" /> Live Video Consultations & Form Check</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-500" /> AI Client Plan Builder</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-500" /> Automated Progress Notifications</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectTab('coach-dashboard')}
              className="w-full py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs transition-colors"
            >
              Open Coach Portal
            </button>
          </div>

          {/* Admin Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 hover:border-purple-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold">
                Role 3: Admin Suite
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">System Command Center</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Platform Financial & User KPIs</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Instant Role Assignment & Switching</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> AI API Call Telemetry & Logs</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Community Moderation Queue</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectTab('admin-dashboard')}
              className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors"
            >
              Open Admin Dashboard
            </button>
          </div>

        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
            HealthyLife Transparent Pricing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the perfect plan for individual wellness or coaching businesses.
          </p>

          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 mt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Yearly</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Free Tier</h3>
              <p className="text-xs text-slate-500 mt-1">Basic macro & workout logging.</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">$0</span>
                <span className="text-xs text-slate-500"> / forever</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Daily Calorie & Macro Logging</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Standard Workout Routines</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Community Access</li>
            </ul>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Start Free
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-xl space-y-6 relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Vitality Plus</h3>
              <p className="text-xs text-slate-500 mt-1">Full CycleSync™ & AI Assistant.</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                  {billingCycle === 'yearly' ? '$14' : '$18'}
                </span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> CycleSync™ Biological Intelligence</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Advanced Llama-3.3-70b AI Advisor</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Custom Macro & Meal Generator</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited PR Logs</li>
            </ul>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pro Coach Studio</h3>
              <p className="text-xs text-slate-500 mt-1">For trainers & nutrition coaches.</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                  {billingCycle === 'yearly' ? '$49' : '$59'}
                </span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Client Roster & Compliance Tools</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Client Routine Generator</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Live Consultation Queue</li>
            </ul>
            <button
              onClick={() => onSelectTab('coach-dashboard')}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Open Coach Workspace
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
