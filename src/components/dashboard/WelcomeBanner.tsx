import React from 'react';
import { UserProfile } from '../../types';
import { Flame, Sparkles, TrendingUp, Calendar } from 'lucide-react';

interface WelcomeBannerProps {
  user: UserProfile;
}

const phaseLabel: Record<string, string> = {
  follicular: 'Follicular Phase',
  ovulation: 'Ovulation Peak',
  luteal: 'Luteal Phase',
  menstrual: 'Menstrual Phase',
};

const phaseEmoji: Record<string, string> = {
  follicular: '🌱',
  ovulation: '⚡',
  luteal: '🌙',
  menstrual: '💜',
};

const phaseSubtitle: Record<string, string> = {
  ovulation: 'Your metabolic energy is at Peak Potential — ideal for strength & high-protein nutrition.',
  follicular: 'Energy is building — great time for progressive overload and new goals.',
  luteal: 'Prioritise recovery & steady cardio today. Focus on magnesium-rich foods.',
  menstrual: 'Listen to your body. Rest & restore with anti-inflammatory nutrition.',
};

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user }) => {
  const isMale = user.gender === 'male';
  const phaseText = !isMale && user.cyclePhase ? phaseLabel[user.cyclePhase] : null;
  const phaseIcon = !isMale && user.cyclePhase ? phaseEmoji[user.cyclePhase] : null;
  const subtitle = isMale
    ? (user.goal ? `Focusing on ${user.goal.replace('_', ' ')} — track workouts, macros, and cellular recovery.` : `Track your strength, nutrition, and wellness — all in one place.`)
    : (user.cyclePhase ? phaseSubtitle[user.cyclePhase] : `Track your nutrition, fitness, and wellness — all in one place.`);
  const vitality = user.vitalityScore ?? 0;
  const circumference = 163.3;
  const offset = circumference - (circumference * vitality) / 100;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 animate-fade-slide-up"
      style={{
        background: 'var(--hl-gradient-hero)',
        boxShadow: '0 8px 32px rgba(61,122,90,0.25)',
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at bottom left, rgba(244,149,106,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">

        {/* Left: Greeting */}
        <div className="space-y-3 flex-1 min-w-0">

          {/* Date + Phase badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)' }}
            >
              <Calendar className="w-3 h-3" />
              {dateStr}
            </span>
            {phaseText && (
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <Sparkles className="w-3 h-3" />
                {phaseIcon} {phaseText}{user.cycleDay ? ` · Day ${user.cycleDay}` : ''}
              </span>
            )}
            {(user.streakDays ?? 0) > 0 && (
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(244,149,106,0.30)', color: '#FDDCC8', border: '1px solid rgba(244,149,106,0.40)' }}
              >
                <Flame className="w-3 h-3" style={{ color: '#F4956A' }} />
                {user.streakDays} Day Streak
              </span>
            )}
          </div>

          <div>
            <h1
              className="text-2xl sm:text-4xl font-extrabold text-white"
              style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}
            >
              Welcome back, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 text-sm text-white/75 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-4 flex-wrap pt-1">
            {user.weightCurrentKg && (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-white/50" />
                <span><strong className="text-white font-bold">{user.weightCurrentKg}kg</strong> current weight</span>
              </div>
            )}
            {user.weightTargetKg && (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <span>🎯 <strong className="text-white font-bold">{user.weightTargetKg}kg</strong> target</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Vitality Ring */}
        {vitality > 0 && (
          <div
            className="flex items-center gap-4 p-4 rounded-2xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)' }}
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="transparent" />
                <circle
                  cx="32" cy="32" r="26"
                  stroke="white"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-lg font-black text-white">{vitality}</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Vitality Score</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {vitality >= 90 ? '✨ Optimal Sync' : vitality >= 70 ? '💪 Good Form' : '🌱 Building Up'}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">Updated today</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
