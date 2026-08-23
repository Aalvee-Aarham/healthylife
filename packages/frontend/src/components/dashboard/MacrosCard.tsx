import React from 'react';
import { DailyMacros, NavigationTab } from '../../types';
import { ChevronRight, Flame } from 'lucide-react';

interface MacrosCardProps {
  macros: DailyMacros;
  onSelectTab: (tab: NavigationTab) => void;
}

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  fillColor: string;
  trackColor: string;
  textColor: string;
  unit?: string;
}

const MacroBar: React.FC<MacroBarProps> = ({ label, consumed, goal, fillColor, trackColor, textColor, unit = 'g' }) => {
  const pct = Math.min(100, goal > 0 ? Math.round((consumed / goal) * 100) : 0);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold" style={{ color: textColor }}>{consumed}{unit}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--hl-text-tertiary)' }}>/ {goal}{unit}</span>
        </div>
      </div>
      <div className="hl-progress-track" style={{ background: trackColor }}>
        <div
          className="hl-progress-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <p className="text-[10px] font-medium" style={{ color: 'var(--hl-text-tertiary)' }}>{pct}% of daily goal</p>
    </div>
  );
};

export const MacrosCard: React.FC<MacrosCardProps> = ({ macros, onSelectTab }) => {
  const caloriesRemaining = macros.caloriesGoal - macros.caloriesConsumed;
  const caloriePercent = Math.min(100, macros.caloriesGoal > 0
    ? Math.round((macros.caloriesConsumed / macros.caloriesGoal) * 100)
    : 0);
  const circumference = 402;
  const offset = circumference - (circumference * caloriePercent) / 100;

  return (
    <div
      className="lg:col-span-2 rounded-3xl p-6 space-y-5"
      style={{
        background: 'var(--hl-surface)',
        border: '1px solid var(--hl-border)',
        boxShadow: 'var(--hl-shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--hl-border-light)' }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
            Daily Nutrition
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
            Target: {macros.caloriesGoal} kcal · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onSelectTab('nutrition')}
          className="text-xs font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full"
          style={{
            color: 'var(--hl-green)',
            background: 'var(--hl-green-light)',
            border: '1px solid var(--hl-green-border)',
          }}
        >
          <span>Diet Plan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

        {/* Donut ring */}
        <div
          className="flex flex-col items-center justify-center p-5 rounded-2xl"
          style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
        >
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="64" stroke="var(--hl-green-light)" strokeWidth="10" fill="transparent" />
              <circle
                cx="80" cy="80" r="64"
                stroke="var(--hl-green)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                {macros.caloriesConsumed}
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                of {macros.caloriesGoal}
              </span>
              <span className="block text-[9px]" style={{ color: 'var(--hl-text-tertiary)' }}>kcal</span>
            </div>
          </div>

          {/* Remaining chip */}
          <div
            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={
              caloriesRemaining > 0
                ? { background: 'var(--hl-green-light)', color: 'var(--hl-green)', border: '1px solid var(--hl-green-border)' }
                : { background: 'var(--hl-peach-light)', color: 'var(--hl-peach-hover)', border: '1px solid var(--hl-peach-border)' }
            }
          >
            <Flame className="w-3.5 h-3.5" />
            {caloriesRemaining > 0 ? `${caloriesRemaining} kcal remaining` : '🎯 Daily target hit!'}
          </div>
        </div>

        {/* Macro Bars */}
        <div className="space-y-4">
          <MacroBar
            label="Protein"
            consumed={macros.proteinConsumedG}
            goal={macros.proteinGoalG}
            fillColor="var(--hl-green)"
            trackColor="var(--hl-green-light)"
            textColor="var(--hl-green)"
          />
          <MacroBar
            label="Carbohydrates"
            consumed={macros.carbsConsumedG}
            goal={macros.carbsGoalG}
            fillColor="var(--hl-teal)"
            trackColor="var(--hl-teal-light)"
            textColor="var(--hl-teal)"
          />
          <MacroBar
            label="Healthy Fats"
            consumed={macros.fatsConsumedG}
            goal={macros.fatsGoalG}
            fillColor="var(--hl-amber)"
            trackColor="var(--hl-amber-light)"
            textColor="var(--hl-amber)"
          />
        </div>
      </div>
    </div>
  );
};
