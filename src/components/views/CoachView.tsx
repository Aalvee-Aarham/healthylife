import React, { useState } from 'react';
import { ClientRecord, CoachSession } from '../../types';
import { 
  Briefcase, 
  Users, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  MessageSquare, 
  TrendingUp, 
  Star, 
  FileText,
  Send
} from 'lucide-react';

interface CoachViewProps {
  clients: ClientRecord[];
  sessions: CoachSession[];
  activeTab?: string;
}

export const CoachView: React.FC<CoachViewProps> = ({ clients, sessions, activeTab }) => {
  const [selectedClient, setSelectedClient] = useState<ClientRecord>(clients[0]);
  const [chatMessage, setChatMessage] = useState('');
  const [planGoal, setPlanGoal] = useState('Muscle Hypertrophy & Luteal Phase Sync');
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const [messages, setMessages] = useState([
    { sender: 'client', text: 'Hi Coach Alex! Completed today’s RDL set at 75kg in Ovulation Phase.', time: '10:15 AM' },
    { sender: 'coach', text: 'Awesome work Sarah! Your hip hinge form looked super clean on video review.', time: '10:18 AM' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: 'coach', text: chatMessage, time: 'Just now' }
    ]);
    setChatMessage('');
  };

  const handleGenerateAIPlan = async () => {
    setIsGeneratingPlan(true);
    // Simulate AI plan builder generation
    setTimeout(() => {
      setGeneratedPlan(`### 🏋️ AI Coaching Plan Blueprint for ${selectedClient.name}
**Primary Goal**: ${planGoal}
**Cycle Alignment**: Luteal Phase (Focus on moderate weight, 12-15 rep range, steady cardio)

#### 1. Workout Microcycle
- **Day 1**: Incline Dumbbell Bench Press 4x10 + Face Pulls 3x15
- **Day 2**: Goblet Squats 4x12 + Romanian Deadlifts 3x12
- **Day 3**: Active Mobility Flow & 30-min Low HR Zone 2 Walk

#### 2. Macro Targets
- **Calories**: 2,200 kcal/day
- **Protein**: 140g | **Carbs**: 220g | **Fats**: 65g

*Generated with HealthyLife AI Coaching Engine.*`);
      setIsGeneratingPlan(false);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Coach Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Pro Coach Portal • Dr. Alex Rivera</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Client Roster & Consultation Suite
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Monitor client adherence, conduct video form audits, and build cycle-aligned training blueprints.
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-teal-800 hover:bg-teal-50 font-extrabold text-xs shadow-lg transition-colors">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Client</span>
          </button>
        </div>

        {/* AI Plan Builder Subview */}
      {activeTab === 'plan-builder' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-teal-500/40 dark:border-teal-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Client Training & Macro Plan Builder</h2>
              <p className="text-xs text-slate-500">Generate cycle-aligned training programs for {selectedClient.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Client Goal</label>
              <input
                type="text"
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateAIPlan}
                disabled={isGeneratingPlan}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingPlan ? 'Generating Plan...' : '✨ Generate AI Plan'}
              </button>
            </div>
          </div>

          {generatedPlan && (
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {generatedPlan}
            </div>
          )}
        </div>
      )}

      {/* Consultations Subview */}
      {activeTab === 'consultations' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-teal-600" />
            <span>Scheduled Live Consultations</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.clientName}</p>
                  <p className="text-[11px] text-teal-600 font-medium">{s.date} at {s.time}</p>
                  <span className="text-[10px] text-slate-500">{s.type}</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500">
                  Join Call
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-[10px] text-teal-100 font-bold uppercase">Active Clients</p>
            <p className="text-xl font-black text-white">24 <span className="text-xs text-amber-300 font-semibold">+3 this mo</span></p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-[10px] text-teal-100 font-bold uppercase">Monthly Revenue</p>
            <p className="text-xl font-black text-white">$4,850</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-[10px] text-teal-100 font-bold uppercase">Adherence Rate</p>
            <p className="text-xl font-black text-white">92.4%</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-[10px] text-teal-100 font-bold uppercase">Coach Rating</p>
            <p className="text-xl font-black text-amber-300 flex items-center gap-1">
              4.9 <Star className="w-4 h-4 fill-amber-300" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Roster vs Client Details & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Client Roster List (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Client Roster</span>
          </h2>

          <div className="space-y-3">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`w-full p-4 rounded-3xl border text-left transition-all ${
                  selectedClient.id === c.id
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.planName}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'On Track' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{c.adherencePercent}% Adherence</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Client Workspace & Chat (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Selected Client Overview Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <img src={selectedClient.avatar} alt={selectedClient.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-500">{selectedClient.email} • {selectedClient.planName}</p>
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-md">
                <Video className="w-4 h-4" />
                <span>Launch Consultation Call</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Coach Clinical & Bio Notes:</p>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedClient.notes}
              </div>
            </div>
          </div>

          {/* Client Chat Interface */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Direct Client Messaging</span>
            </h3>

            {/* Message Feed */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'coach' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs max-w-xs ${
                    m.sender === 'coach'
                      ? 'bg-teal-600 text-white font-medium shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Send a message to client..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
