import React from 'react';
import { UserProfile, DailyMacros } from '../../types';
import { Scale, Moon, Droplet, Smile, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardsProps {
  user: UserProfile;
  macros: DailyMacros;
}

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  extra?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, icon, iconBg, accentColor, extra }) => (
  <div
    className="p-5 rounded-2xl space-y-3 hl-card-hover transition-all cursor-default"
    style={{
      background: 'var(--hl-surface)',
      border: '1px solid var(--hl-border)',
      boxShadow: 'var(--hl-shadow-xs)',
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--hl-text-tertiary)' }}>{label}</span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
    </div>
    <p className="text-2xl font-black" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
    <p className="text-[11px] font-semibold flex items-center gap-1" style={{ color: accentColor }}>{sub}</p>
    {extra}
  </div>
);

export const MetricCards: React.FC<MetricCardsProps> = ({ user, macros }) => {
  const waterPct = Math.min(100, macros.waterGoalMl > 0
    ? Math.round((macros.waterConsumedMl / macros.waterGoalMl) * 100)
    : 0);

  const weightDiff = user.weightCurrentKg && user.weightTargetKg
    ? (user.weightCurrentKg - user.weightTargetKg).toFixed(1)
    : null;
  const weightTrend = weightDiff ? (parseFloat(weightDiff) > 0 ? 'above' : parseFloat(weightDiff) < 0 ? 'below' : 'on') : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      {/* Body Weight */}
      {user.weightCurrentKg && (
        <MetricCard
          label="Body Weight"
          value={<>{user.weightCurrentKg} <span className="text-sm font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>kg</span></>}
          sub={
            <>
              {weightTrend === 'above' ? <TrendingDown className="w-3 h-3" /> :
               weightTrend === 'below' ? <TrendingUp className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              Target: {user.weightTargetKg ?? '—'} kg
            </>
          }
          icon={<Scale className="w-4 h-4 text-white" />}
          iconBg="var(--hl-green)"
          accentColor="var(--hl-green)"
        />
      )}

      {/* Sleep & Recovery */}
      <MetricCard
        label="Sleep & Recovery"
        value={<>7.8 <span className="text-sm font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>hrs</span></>}
        sub="88% REM · Great recovery"
        icon={<Moon className="w-4 h-4 text-white" />}
        iconBg="var(--hl-lavender)"
        accentColor="var(--hl-lavender)"
      />

      {/* Hydration */}
      <MetricCard
        label="Hydration"
        value={<>{(macros.waterConsumedMl / 1000).toFixed(2)} <span className="text-sm font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>L</span></>}
        sub={`${waterPct}% of daily goal`}
        icon={<Droplet className="w-4 h-4 text-white" />}
        iconBg="var(--hl-teal)"
        accentColor="var(--hl-teal)"
        extra={
          <div className="hl-progress-track" style={{ background: 'var(--hl-teal-light)', height: '6px' }}>
            <div
              className="hl-progress-fill"
              style={{ width: `${waterPct}%`, background: 'var(--hl-teal)' }}
            />
          </div>
        }
      />

      {/* Mood & Mind */}
      <MetricCard
        label="Mood & Mind"
        value="Calm ✨"
        sub="Cortisol balanced · High focus"
        icon={<Smile className="w-4 h-4 text-white" />}
        iconBg="var(--hl-peach)"
        accentColor="var(--hl-peach-hover)"
      />
    </div>
  );
};
