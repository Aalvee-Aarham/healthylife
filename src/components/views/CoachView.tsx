import React, { useState } from 'react';
import { ClientRecord, CoachSession } from '../../types';
import { 
  Briefcase, 
  Users, 
  Video, 
  Plus, 
  MessageSquare, 
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
    <div className="space-y-8 pb-12 animate-fade-slide-up">
      
      {/* Coach Header Banner */}
      <div 
        className="p-6 sm:p-8 rounded-3xl relative overflow-hidden hl-card space-y-4"
        style={{
          background: 'linear-gradient(135deg, var(--hl-teal) 0%, #3DAEA3 100%)',
          boxShadow: '0 8px 32px rgba(74,155,142,0.25)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
        />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md"
                 style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              <Briefcase className="w-3.5 h-3.5" />
              <span>Pro Coach Portal • Dr. Alex Rivera</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Client Roster & Consultation Suite
            </h1>
            <p className="text-sm max-w-xl text-white/90">
              Monitor client adherence, conduct video form audits, and build cycle-aligned training blueprints.
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-lg transition-colors hl-card-hover"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-teal)' }}>
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Client</span>
          </button>
        </div>

        {/* AI Plan Builder Subview */}
      {activeTab === 'plan-builder' && (
        <div className="p-6 rounded-3xl hl-card shadow-xl space-y-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
                 style={{ background: 'var(--hl-teal)', color: '#fff' }}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>AI Client Training & Macro Plan Builder</h2>
              <p className="text-xs" style={{ color: 'var(--hl-text-secondary)' }}>Generate cycle-aligned training programs for {selectedClient.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--hl-text-secondary)' }}>Target Client Goal</label>
              <input
                type="text"
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:outline-none transition-all"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateAIPlan}
                disabled={isGeneratingPlan}
                className="w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                style={{ background: 'var(--hl-teal)', color: '#fff' }}
              >
                {isGeneratingPlan ? 'Generating Plan...' : '✨ Generate AI Plan'}
              </button>
            </div>
          </div>

          {generatedPlan && (
            <div className="p-4 rounded-2xl text-xs whitespace-pre-line leading-relaxed font-mono"
                 style={{ background: 'var(--hl-teal-light)', border: '1px solid var(--hl-teal-border)', color: 'var(--hl-text-primary)' }}>
              {generatedPlan}
            </div>
          )}
        </div>
      )}

      {/* Consultations Subview */}
      {activeTab === 'consultations' && (
        <div className="p-6 rounded-3xl hl-card shadow-xl space-y-4 relative z-10">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
            <Video className="w-5 h-5" style={{ color: 'var(--hl-teal)' }} />
            <span>Scheduled Live Consultations</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl flex items-center justify-between"
                   style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)' }}>
                <div>
                  <p className="font-bold text-xs" style={{ color: 'var(--hl-text-primary)' }}>{s.clientName}</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--hl-teal)' }}>{s.date} at {s.time}</p>
                  <span className="text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>{s.type}</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        style={{ background: 'var(--hl-teal)', color: '#fff' }}>
                  Join Call
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
          <div className="p-3.5 rounded-2xl border backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[10px] text-white/90 font-bold uppercase">Active Clients</p>
            <p className="text-xl font-black text-white">24 <span className="text-xs font-semibold" style={{ color: 'var(--hl-amber)' }}>+3 this mo</span></p>
          </div>
          <div className="p-3.5 rounded-2xl border backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[10px] text-white/90 font-bold uppercase">Monthly Revenue</p>
            <p className="text-xl font-black text-white">$4,850</p>
          </div>
          <div className="p-3.5 rounded-2xl border backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[10px] text-white/90 font-bold uppercase">Adherence Rate</p>
            <p className="text-xl font-black text-white">92.4%</p>
          </div>
          <div className="p-3.5 rounded-2xl border backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}>
            <p className="text-[10px] text-white/90 font-bold uppercase">Coach Rating</p>
            <p className="text-xl font-black flex items-center gap-1" style={{ color: 'var(--hl-amber)' }}>
              4.9 <Star className="w-4 h-4 fill-amber-300" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Roster vs Client Details & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Client Roster List (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--hl-teal)' }} />
            <span>Client Roster</span>
          </h2>

          <div className="space-y-3">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`w-full p-4 rounded-3xl border text-left transition-all hl-card-hover`}
                style={
                  selectedClient.id === c.id
                    ? { background: 'var(--hl-teal-light)', borderColor: 'var(--hl-teal-border)', boxShadow: 'var(--hl-shadow-sm)' }
                    : { background: 'var(--hl-surface)', borderColor: 'var(--hl-border)' }
                }
              >
                <div className="flex items-center gap-3">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover ring-2" style={{ borderColor: 'var(--hl-teal)' }} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>{c.planName}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--hl-border-light)' }}>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold`}
                        style={c.status === 'On Track' ? { background: 'var(--hl-green-light)', color: 'var(--hl-green)' } : { background: 'var(--hl-amber-light)', color: 'var(--hl-amber)' }}>
                    {c.status}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>{c.adherencePercent}% Adherence</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Client Workspace & Chat (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Selected Client Overview Card */}
          <div className="p-6 rounded-3xl hl-card shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
              <div className="flex items-center gap-4">
                <img src={selectedClient.avatar} alt={selectedClient.name} className="w-14 h-14 rounded-2xl object-cover ring-2" style={{ borderColor: 'var(--hl-teal)' }} />
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>{selectedClient.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}>{selectedClient.email} • {selectedClient.planName}</p>
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                      style={{ background: 'var(--hl-teal)', color: '#fff' }}>
                <Video className="w-4 h-4" />
                <span>Launch Consultation Call</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold" style={{ color: 'var(--hl-text-secondary)' }}>Coach Clinical & Bio Notes:</p>
              <div className="p-3.5 rounded-2xl text-xs leading-relaxed"
                   style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}>
                {selectedClient.notes}
              </div>
            </div>
          </div>

          {/* Client Chat Interface */}
          <div className="p-6 rounded-3xl hl-card shadow-sm space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--hl-teal)' }} />
              <span>Direct Client Messaging</span>
            </h3>

            {/* Message Feed */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 p-4 rounded-2xl"
                 style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'coach' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs max-w-xs shadow-sm`}
                       style={
                         m.sender === 'coach'
                           ? { background: 'var(--hl-teal)', color: '#fff' }
                           : { background: 'var(--hl-surface)', color: 'var(--hl-text-primary)', border: '1px solid var(--hl-border)' }
                       }>
                    {m.text}
                  </div>
                  <span className="text-[9px] mt-0.5 px-1" style={{ color: 'var(--hl-text-tertiary)' }}>{m.time}</span>
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
                className="flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                style={{ background: 'var(--hl-teal)', color: '#fff' }}
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
