import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Conversation, ChatMessage } from '../../types';
import { api } from '../../services/api';
import { MessageSquare, Send, Loader2, Search, User, CheckCircle2 } from 'lucide-react';

interface CoachDashboardViewProps {
  user: UserProfile;
}

export const CoachDashboardView: React.FC<CoachDashboardViewProps> = ({ user }) => {
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
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--hl-green)' }} />
                <span className="text-xs">Loading chats…</span>
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
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--hl-green)' }} />
                    <span className="text-xs">Loading messages…</span>
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

