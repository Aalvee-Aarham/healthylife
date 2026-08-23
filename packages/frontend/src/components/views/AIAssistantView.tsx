import React, { useState } from 'react';
import { UserRole } from '../../types';
import { askGroqAI } from '../../services/groqApi';
import { Sparkles, Send, User, RefreshCw, Zap } from 'lucide-react';

interface AIAssistantViewProps {
  userRole?: UserRole;
  userName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ 
  userRole = 'member', 
  userName = 'Guest Member' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_init',
      sender: 'ai',
      text: `Hello! I am **HealthyLife AI**, powered by ultra-fast Llama-3.3-70b. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roleSuggestions = {
    member: [
      '🥗 Suggest a 2000 kcal high-protein meal plan',
      '⚡ Best workout routine for Ovulation Peak Phase',
      '💧 How to stay hydrated during heavy lifting sessions?',
      '🧘 Restorative yoga flow for stress relief'
    ],
    coach: [
      '🏋️ Generate client hypertrophy program for Ovulation Phase',
      '📊 Analyze client macro adherence drop and recovery suggestions',
      '📹 Form correction cues for Romanian Deadlift hip hinge',
      '💡 Nutritional audit template for high cortisol clients'
    ],
    admin: [
      '⚡ Summarize platform AI token usage & latency',
      '🛡️ Run community content safety audit check',
      '📈 Recommend strategy to boost MRR & Coach conversions',
      '⚙️ Server operational health and uptime status'
    ]
  };

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const activeRole: UserRole = (userRole as UserRole) || 'member';
      const responseText = await askGroqAI(query, activeRole);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI call error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered a brief connection glitch. Please try again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-slide-up">
      
      {/* Header Banner */}
      <div 
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden hl-card"
        style={{
          background: 'var(--hl-gradient-hero)',
          boxShadow: '0 8px 32px rgba(61,122,90,0.25)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
        />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                 style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              <Zap className="w-3.5 h-3.5" style={{ fill: '#fff' }} />
              <span>Llama-3.3-70b Intelligence Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              HealthyLife AI Health Advisor
            </h1>
            <p className="text-sm max-w-xl text-white/90">
              Real-time bio-nutritional intelligence, workout alignment, and {userRole} insights.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-md text-right shrink-0"
               style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }}>
            <span className="text-[10px] uppercase tracking-wider block font-bold text-white/90">Current Context</span>
            <span className="text-sm font-black capitalize text-white">{userRole} Workspace</span>
          </div>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-2">
        <span className="hl-section-label">Recommended Quick Prompts for {userRole.toUpperCase()}:</span>
        <div className="flex flex-wrap gap-2">
          {roleSuggestions[userRole].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all text-left shadow-sm hl-card-hover"
              style={{ background: 'var(--hl-surface)', color: 'var(--hl-text-secondary)', border: '1px solid var(--hl-border)' }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-3xl p-4 sm:p-6 shadow-sm min-h-[420px] max-h-[550px] flex flex-col justify-between space-y-4" style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)' }}>
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
          {messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-md mt-1"
                       style={{ background: 'var(--hl-green)' }}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-sm`}
                  style={
                    isAI
                      ? { background: 'var(--hl-surface-alt)', color: 'var(--hl-text-primary)', border: '1px solid var(--hl-border-light)' }
                      : { background: 'var(--hl-green)', color: '#fff' }
                  }
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1 gap-4">
                    <span>{isAI ? 'HealthyLife AI' : userName}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-line text-xs font-sans">{m.text}</div>
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 font-bold text-xs mt-1"
                       style={{ background: 'var(--hl-peach)' }}>
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs animate-pulse" style={{ color: 'var(--hl-text-tertiary)' }}>
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold"
                   style={{ background: 'var(--hl-green)' }}>
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>HealthyLife AI is generating personalized response...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-3"
          style={{ borderTop: '1px solid var(--hl-border-light)' }}
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask AI for ${userRole} guidance...`}
            className="flex-1 px-4 py-3 rounded-2xl text-xs focus:ring-2 transition-all"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="hl-btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
