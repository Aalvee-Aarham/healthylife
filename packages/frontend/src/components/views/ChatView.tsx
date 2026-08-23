import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, UserProfile } from '../../types';
import { api } from '../../services/api';
import { MessageSquare, Send, Loader2, AlertCircle, ChevronLeft, Users, Dumbbell, Apple, Sparkles } from 'lucide-react';

interface ChatViewProps {
  user: UserProfile;
}

export const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoadingConvs(true);
    api.getConversations()
      .then((data) => {
        setConversations(data);
        if (data.length > 0 && !selectedConv) {
          setSelectedConv(data[0]);
        }
      })
      .catch((e) => setError(e?.message || 'Failed to load conversations.'))
      .finally(() => setIsLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    setIsLoadingMsgs(true);
    api.getMessages(selectedConv.id)
      .then(setMessages)
      .catch((e) => setError(e?.message || 'Failed to load messages.'))
      .finally(() => setIsLoadingMsgs(false));
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || msgText).trim();
    if (!text || !selectedConv) return;
    setMsgText('');
    setIsSending(true);
    try {
      const msg = await api.sendMessage(selectedConv.id, text);
      setMessages((prev) => [...prev, msg]);
      // Update the last message in conversations list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? { ...c, lastMessage: msg } : c
        )
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const getPartnerDisplayName = (conv: Conversation) => {
    if (conv.partner.name) return conv.partner.name;
    if (conv.partner.role === 'coach') {
      const specialty = conv.partner.coachSpecialty || conv.partner.specialty;
      return specialty === 'nutritionist' ? 'Nutrition Coach' : 'Fitness & Strength Coach';
    }
    return 'HealthyLife Member';
  };

  const getPartnerSpecialtyLabel = (conv: Conversation) => {
    const specialty = conv.partner.coachSpecialty || conv.partner.specialty;
    if (specialty === 'nutritionist') return 'Nutritionist';
    if (specialty === 'trainer') return 'Trainer';
    return conv.partner.role;
  };

  const quickPrompts = selectedConv?.partner.coachSpecialty === 'nutritionist'
    ? [
        'How can I optimize my protein intake today?',
        'Can you review my lunch macro breakdown?',
        'What should I eat before my workout?'
      ]
    : [
        'Can you give me form tips on my squats?',
        'What weights should I target for my next workout?',
        'How many rest days should I take this week?'
      ];

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">

      {/* Header */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 hl-card space-y-2"
        style={{
          background: 'linear-gradient(135deg, var(--hl-lavender) 0%, #A594F9 100%)',
          boxShadow: '0 8px 32px rgba(139,92,246,0.25)',
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {user.role === 'coach' ? 'Client Messaging' : 'Dedicated Coaches'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {user.role === 'coach' ? 'Client Chat' : 'Chat with Your Coaches'}
          </h1>
          <p className="text-sm text-white/90">
            {user.role === 'coach'
              ? 'Communicate directly with clients, share plans and feedback.'
              : 'Direct 1-on-1 guidance with your dedicated Fitness Trainer and Nutritionist.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl text-xs flex items-center gap-3 animate-fade-slide-up"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">

        {/* Conversation List */}
        <div className={`hl-card rounded-3xl flex flex-col overflow-hidden ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--hl-lavender)' }} />
              {user.role === 'coach' ? 'Client Roster' : 'Your Coaches'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {conversations.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingConvs ? (
              <div className="flex items-center justify-center py-10" style={{ color: 'var(--hl-text-tertiary)' }}>
                <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--hl-lavender)' }} />
                <span className="text-xs">Loading…</span>
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-xs py-8" style={{ color: 'var(--hl-text-tertiary)' }}>No conversations yet.</p>
            ) : (
              conversations.map((conv) => {
                const specialty = conv.partner.coachSpecialty || conv.partner.specialty;
                const isNutritionist = specialty === 'nutritionist';
                const isSelected = selectedConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border hl-card-hover ${
                      isSelected ? 'shadow-sm' : ''
                    }`}
                    style={
                      isSelected
                        ? { background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border)', color: 'var(--hl-text-primary)' }
                        : { background: 'transparent', borderColor: 'transparent', color: 'var(--hl-text-secondary)' }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {conv.partner.avatar ? (
                          <img
                            src={conv.partner.avatar}
                            alt={conv.partner.name || 'Avatar'}
                            className="w-11 h-11 rounded-2xl object-cover ring-2"
                            style={{
                              borderColor: isNutritionist ? '#f97316' : '#14b8a6'
                            }}
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm"
                            style={{
                              background: isNutritionist ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #0d9488, #0f766e)'
                            }}
                          >
                            {isNutritionist ? <Apple className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white flex items-center justify-center"
                          style={{ background: '#22c55e' }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>
                            {getPartnerDisplayName(conv)}
                          </p>
                          <span
                            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0"
                            style={
                              isNutritionist
                                ? { background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }
                                : { background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1' }
                            }
                          >
                            {getPartnerSpecialtyLabel(conv)}
                          </span>
                        </div>
                        <p className="text-[10px] truncate mt-1 text-slate-500" style={{ color: 'var(--hl-text-tertiary)' }}>
                          {conv.lastMessage?.body || 'Start a conversation'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`lg:col-span-2 hl-card rounded-3xl flex flex-col overflow-hidden ${selectedConv ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--hl-surface-alt)' }}>
                  <MessageSquare className="w-8 h-8" style={{ color: 'var(--hl-text-tertiary)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>Select a coach conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConv(null)} className="lg:hidden p-1.5 rounded-lg transition-colors" style={{ color: 'var(--hl-text-tertiary)' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="relative shrink-0">
                    {selectedConv.partner.avatar ? (
                      <img
                        src={selectedConv.partner.avatar}
                        alt={selectedConv.partner.name}
                        className="w-10 h-10 rounded-2xl object-cover ring-2"
                        style={{
                          borderColor: (selectedConv.partner.coachSpecialty || selectedConv.partner.specialty) === 'nutritionist' ? '#f97316' : '#14b8a6'
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 ring-2" style={{ borderColor: 'var(--hl-lavender)', color: 'var(--hl-lavender)' }}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white bg-green-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                        {getPartnerDisplayName(selectedConv)}
                      </p>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={
                          (selectedConv.partner.coachSpecialty || selectedConv.partner.specialty) === 'nutritionist'
                            ? { background: '#fff7ed', color: '#c2410c' }
                            : { background: '#f0fdfa', color: '#0f766e' }
                        }
                      >
                        {getPartnerSpecialtyLabel(selectedConv)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate" style={{ color: 'var(--hl-text-tertiary)' }}>
                      {selectedConv.partner.title || (selectedConv.partner.role === 'coach' ? 'HealthyLife Verified Coach' : 'Member')}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-600">Online & Ready</span>
                </div>
              </div>

              {/* Quick suggestion chips (if member) */}
              {user.role === 'member' && quickPrompts.length > 0 && (
                <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-purple-600" /> Quick Ask:
                  </span>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(undefined, prompt)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5" style={{ background: 'var(--hl-surface)' }}>
                {isLoadingMsgs ? (
                  <div className="flex items-center justify-center py-10" style={{ color: 'var(--hl-text-tertiary)' }}>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--hl-lavender)' }} />
                    <span className="text-xs">Loading messages…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>No messages yet.</p>
                    <p className="text-[11px] text-slate-400">Say hello to your coach to start personalized guidance!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className="p-3.5 rounded-2xl text-xs max-w-sm sm:max-w-md leading-relaxed shadow-sm"
                        style={
                          msg.isMine
                            ? { background: 'var(--hl-lavender)', color: '#fff' }
                            : { background: 'var(--hl-surface-alt)', color: 'var(--hl-text-primary)', border: '1px solid var(--hl-border-light)' }
                        }
                      >
                        {msg.body}
                      </div>
                      <span className="text-[9px] mt-1 px-1 font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>{msg.time}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={(e) => handleSend(e)} className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--hl-border-light)', background: 'var(--hl-bg)' }}>
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder={`Message ${getPartnerDisplayName(selectedConv)}…`}
                  disabled={isSending}
                  className="flex-1 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 disabled:opacity-60 transition-all shadow-inner"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
                <button
                  type="submit"
                  disabled={!msgText.trim() || isSending}
                  className="px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'var(--hl-lavender)', color: '#fff' }}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
