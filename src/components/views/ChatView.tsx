import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, UserProfile } from '../../types';
import { api } from '../../services/api';
import { MessageSquare, Send, Loader2, AlertCircle, ChevronLeft, Users } from 'lucide-react';

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
      .then(setConversations)
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedConv) return;
    const text = msgText.trim();
    setMsgText('');
    setIsSending(true);
    try {
      const msg = await api.sendMessage(selectedConv.id, text);
      setMessages((prev) => [...prev, msg]);
    } catch (e: any) {
      setError(e?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

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
              {user.role === 'coach' ? 'Client Messaging' : 'Coach Messaging'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {user.role === 'coach' ? 'Client Chat' : 'Chat with your Coach'}
          </h1>
          <p className="text-sm text-white/90">
            {user.role === 'coach'
              ? 'Communicate directly with clients, share plans and feedback.'
              : 'Ask questions, share progress, and get real-time guidance from your coach.'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

        {/* Conversation List */}
        <div className={`hl-card rounded-3xl flex flex-col overflow-hidden ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--hl-lavender)' }} />
              Conversations
            </h2>
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
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border hl-card-hover ${
                    selectedConv?.id === conv.id
                      ? 'shadow-sm'
                      : ''
                  }`}
                  style={
                    selectedConv?.id === conv.id
                      ? { background: 'var(--hl-surface-alt)', borderColor: 'var(--hl-border)', color: 'var(--hl-text-primary)' }
                      : { background: 'transparent', borderColor: 'transparent', color: 'var(--hl-text-secondary)' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 ring-2" style={{ borderColor: 'var(--hl-lavender)', color: 'var(--hl-lavender)' }}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>
                        {conv.partner.role === 'coach' ? 'HealthyLife Coach' : 'HealthyLife Member'}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                        {conv.lastMessage?.body || 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
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
                <p className="text-sm" style={{ color: 'var(--hl-text-secondary)' }}>Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
                <button onClick={() => setSelectedConv(null)} className="lg:hidden p-1.5 rounded-lg transition-colors" style={{ color: 'var(--hl-text-tertiary)' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 ring-2" style={{ borderColor: 'var(--hl-lavender)', color: 'var(--hl-lavender)' }}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>
                    {selectedConv.partner.role === 'coach' ? 'HealthyLife Coach' : 'HealthyLife Member'}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: 'var(--hl-text-tertiary)' }}>{selectedConv.partner.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--hl-surface)' }}>
                {isLoadingMsgs ? (
                  <div className="flex items-center justify-center py-10" style={{ color: 'var(--hl-text-tertiary)' }}>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--hl-lavender)' }} />
                    <span className="text-xs">Loading messages…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: 'var(--hl-text-tertiary)' }}>No messages yet. Say hello! 👋</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-xs leading-relaxed shadow-sm`}
                           style={
                             msg.isMine
                               ? { background: 'var(--hl-lavender)', color: '#fff' }
                               : { background: 'var(--hl-surface-alt)', color: 'var(--hl-text-primary)', border: '1px solid var(--hl-border-light)' }
                           }>
                        {msg.body}
                      </div>
                      <span className="text-[9px] mt-0.5 px-1" style={{ color: 'var(--hl-text-tertiary)' }}>{msg.time}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--hl-border-light)', background: 'var(--hl-bg)' }}>
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Type a message…"
                  disabled={isSending}
                  className="flex-1 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 disabled:opacity-60 transition-all"
                  style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
                />
                <button
                  type="submit"
                  disabled={!msgText.trim() || isSending}
                  className="px-4 py-2.5 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
