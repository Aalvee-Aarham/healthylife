import React from 'react';
import { NavigationTab, UserProfile } from '../../types';
import { UtensilsCrossed, Dumbbell, Sparkles, Zap, ChevronRight, Droplet } from 'lucide-react';

interface QuickNavCardsProps {
  onSelectTab: (tab: NavigationTab) => void;
  user?: UserProfile;
}

interface QuickCard {
  id: NavigationTab;
  icon: React.ElementType;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeText: string;
}

export const QuickNavCards: React.FC<QuickNavCardsProps> = ({ onSelectTab, user }) => {
  const isMale = user?.gender === 'male';

  const cards: QuickCard[] = [
    {
      id: 'nutrition',
      icon: UtensilsCrossed,
      label: 'Nutrition',
      description: 'Log meals & track macros',
      iconBg: 'var(--hl-green-light)',
      iconColor: 'var(--hl-green)',
      badgeBg: 'var(--hl-green-light)',
      badgeColor: 'var(--hl-green)',
      badgeText: 'Diet Plan',
    },
    {
      id: 'workouts',
      icon: Dumbbell,
      label: 'Workouts',
      description: 'Training plan & progress',
      iconBg: 'var(--hl-peach-light)',
      iconColor: 'var(--hl-peach)',
      badgeBg: 'var(--hl-peach-light)',
      badgeColor: 'var(--hl-peach-hover)',
      badgeText: 'View Plan',
    },
    ...(isMale
      ? [
          {
            id: 'water' as NavigationTab,
            icon: Droplet,
            label: 'Hydration',
            description: 'Daily water & cellular flow',
            iconBg: 'var(--hl-teal-light)',
            iconColor: 'var(--hl-teal)',
            badgeBg: 'var(--hl-teal-light)',
            badgeColor: 'var(--hl-teal)',
            badgeText: 'Hydrate',
          },
        ]
      : [
          {
            id: 'cycle' as NavigationTab,
            icon: Sparkles,
            label: 'CycleSync™',
            description: 'Phase tracking & tips',
            iconBg: 'var(--hl-lavender-light)',
            iconColor: 'var(--hl-lavender)',
            badgeBg: 'var(--hl-lavender-light)',
            badgeColor: 'var(--hl-lavender)',
            badgeText: user?.cycleDay ? `Day ${user.cycleDay}` : 'Sync',
          },
        ]),
    {
      id: 'ai-assistant',
      icon: Zap,
      label: 'AI Advisor',
      description: 'Ask health questions',
      iconBg: 'var(--hl-amber-light)',
      iconColor: 'var(--hl-amber)',
      badgeBg: 'var(--hl-amber-light)',
      badgeColor: 'var(--hl-amber)',
      badgeText: 'Live',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            onClick={() => onSelectTab(card.id)}
            className="hl-card hl-card-hover text-left p-4 rounded-2xl space-y-3 group transition-all"
            style={{ display: 'block' }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: card.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
              <span
                className="hl-badge"
                style={{ background: card.badgeBg, color: card.badgeColor }}
              >
                {card.badgeText}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                {card.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                {card.description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: card.iconColor }}>
              <span>Go to {card.label}</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

