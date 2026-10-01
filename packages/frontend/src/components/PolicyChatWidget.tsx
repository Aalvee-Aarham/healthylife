import React, { useEffect, useRef, useState } from 'react';
import { FileText, MessageCircle, Send, X } from 'lucide-react';
import { api } from '../services/api';

interface Msg {
  from: 'bot' | 'user';
  text: string;
  error?: boolean;
}

const GREETING: Msg = {
  from: 'bot',
  text: 'Hi! I answer questions from the HealthyLife Policy Handbook: plans, refunds, bookings, privacy and more.',
};

const SUGGESTIONS = [
  'Can I get a refund on my annual plan?',
  'What happens if I miss a session?',
  'How is my health data protected?',
  'What certifications do coaches have?',
];

/** Floating chat bubble for the landing page, backed by the policy RAG service (/api/policy/ask).
 *  Uses the .hl-type-dot animation defined in LandingView's LANDING_CSS. */
export const PolicyChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setMessages(m => [...m, { from: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const { answer } = await api.askPolicy(q);
      setMessages(m => [...m, { from: 'bot', text: answer }]);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Something went wrong.';
      setMessages(m => [...m, { from: 'bot', text, error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Policy assistant"
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
          className="fixed z-50 right-4 bottom-24 flex flex-col rounded-3xl overflow-hidden"
          style={{
            width: 'min(380px, calc(100vw - 2rem))',
            height: 'min(560px, calc(100dvh - 8rem))',
            background: 'var(--hl-surface)',
            border: '1px solid var(--hl-border)',
            boxShadow: 'var(--hl-shadow-xl)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 text-white" style={{ background: 'var(--hl-gradient-hero)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,.2)' }}>
              <FileText className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold leading-tight">Policy Assistant</p>
              <p className="text-[11px] text-white/85 truncate">Answers from the HealthyLife Policy Handbook</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close policy assistant"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} aria-live="polite" className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line"
                  style={
                    m.from === 'user'
                      ? { background: 'var(--hl-green)', color: '#fff', borderBottomRightRadius: 6 }
                      : {
                          background: m.error ? '#FDECEC' : 'var(--hl-surface-alt)',
                          color: m.error ? '#9B2C2C' : 'var(--hl-text-primary)',
                          border: '1px solid var(--hl-border-light)',
                          borderBottomLeftRadius: 6,
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl text-left transition-colors hover:brightness-95"
                    style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)', border: '1px solid var(--hl-border-light)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl w-fit" style={{ background: 'var(--hl-surface-alt)' }}>
                <span className="sr-only">Looking it up…</span>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="hl-type-dot w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--hl-green-medium)', animationDelay: i * 0.16 + 's' }}
                  />
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 p-3"
            style={{ borderTop: '1px solid var(--hl-border-light)' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask about refunds, bookings, privacy…"
              aria-label="Your policy question"
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-green)]"
              style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send question"
              className="hl-btn-primary w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-50"
              style={{ padding: 0 }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="px-4 pb-2.5 -mt-1 text-[10px]" style={{ color: 'var(--hl-text-tertiary)' }}>
            AI answers can be wrong. Check the handbook page cited.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close policy assistant' : 'Open policy assistant'}
        aria-expanded={open}
        className="hl-cta-lift fixed z-50 right-4 bottom-5 h-14 rounded-full flex items-center gap-2 px-5 text-white text-sm font-bold"
        style={{ background: 'var(--hl-green)', boxShadow: 'var(--hl-shadow-xl)' }}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Policy questions?'}</span>
      </button>
    </>
  );
};
