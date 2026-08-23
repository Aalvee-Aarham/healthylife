import React from 'react';
import { NavigationTab } from '../../types';
import { Video, Star } from 'lucide-react';

interface CoachBannerProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const CoachBanner: React.FC<CoachBannerProps> = ({ onSelectTab }) => (
  <div
    className="relative overflow-hidden rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
    style={{
      background: 'linear-gradient(135deg, var(--hl-green) 0%, var(--hl-teal) 100%)',
      boxShadow: '0 8px 24px rgba(61,122,90,0.20)',
    }}
  >
    {/* Subtle texture */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.14) 0%, transparent 65%)',
      }}
    />
    <div
      className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at bottom right, rgba(244,149,106,0.14) 0%, transparent 70%)',
      }}
    />

    <div className="flex items-center gap-4 relative z-10">
      {/* Coach avatar */}
      <div className="relative shrink-0">
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
          alt="Coach"
          className="w-14 h-14 rounded-2xl object-cover"
          style={{ border: '2px solid rgba(255,255,255,0.5)' }}
        />
        <span
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white flex items-center justify-center"
          style={{ background: '#4ade80' }}
        >
          <span className="w-2 h-2 rounded-full bg-white" />
        </span>
      </div>

      {/* Text */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Certified Coach · Available Now</span>
        </div>
        <p className="text-base font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Book a 1-on-1 Coaching Session
        </p>
        <p className="text-xs text-white/70 mt-0.5">
          Get a personalised form audit, macro review & accountability plan
        </p>
      </div>
    </div>

    <button
      onClick={() => onSelectTab('chat')}
      className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all hover:scale-105 relative z-10"
      style={{
        background: 'rgba(255,255,255,0.22)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.35)',
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.30)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)'; }}
    >
      <Video className="w-4 h-4" />
      <span>Chat with Coach</span>
    </button>
  </div>
);
