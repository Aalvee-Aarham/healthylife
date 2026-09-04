import React from 'react';
import { UserProfile, DailyMacros, MealItem, NavigationTab } from '../../types';
import { WelcomeBanner } from '../dashboard/WelcomeBanner';
import { MacrosCard } from '../dashboard/MacrosCard';
import { TodaysFocusCard } from '../dashboard/TodaysFocusCard';
import { CoachBanner } from '../dashboard/CoachBanner';
import { QuickNavCards } from '../dashboard/QuickNavCards';
import { FloatingQuickLog } from '../dashboard/FloatingQuickLog';
import { AlertCircle } from 'lucide-react';
import { Skeleton, SkeletonCard, SkeletonStatTile } from '../ui/Skeleton';

interface DashboardViewProps {
  user: UserProfile;
  macros: DailyMacros;
  meals: MealItem[];
  isLoading: boolean;
  error: string | null;
  onSelectTab: (tab: NavigationTab) => void;
  onLogWater: (amountMl: number) => void;
  onAddMeal?: (
    name: string,
    cal: number,
    protein: number,
    customCarbs?: number,
    customFat?: number,
    customImage?: string,
    category?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => Promise<void> | void;
  isOpenExternalQuickLog?: boolean;
  onCloseExternalQuickLog?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  macros,
  meals,
  isLoading,
  error,
  onSelectTab,
  onLogWater,
  onAddMeal,
  isOpenExternalQuickLog,
  onCloseExternalQuickLog,
}) => {

  if (isLoading) {
    return (
      <div className="space-y-8 pb-24">
        {/* Welcome banner skeleton */}
        <div className="hl-card p-6 space-y-3">
          <Skeleton height="1.5rem" width="40%" />
          <Skeleton height="0.75rem" width="60%" />
        </div>

        {/* Nutrition + Today's Focus skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonCard className="lg:col-span-1" lines={4} />
          <SkeletonCard className="lg:col-span-2" lines={4} />
        </div>

        {/* Quick nav skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatTile key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: '#fff0f0', border: '1px solid #fecaca' }}
        >
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>Failed to load dashboard</p>
          <p className="text-xs max-w-sm" style={{ color: 'var(--hl-text-tertiary)' }}>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="hl-btn-ghost px-5 py-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-fade-slide-up relative">

      {/* ══════════════════════════════════════════
          SECTION 1 — Welcome Hero Banner
      ══════════════════════════════════════════ */}
      <WelcomeBanner user={user} />

      {/* ══════════════════════════════════════════
          SECTION 2 — Nutrition + Today's Focus
      ══════════════════════════════════════════ */}
      <div>
        <p className="hl-section-label mb-3">NUTRITION & TODAY'S PLAN</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <MacrosCard macros={macros} onSelectTab={onSelectTab} />
          <TodaysFocusCard meals={meals} macros={macros} onSelectTab={onSelectTab} onLogWater={onLogWater} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 3 — Quick Navigation
      ══════════════════════════════════════════ */}
      <div>
        <p className="hl-section-label mb-3">QUICK ACCESS</p>
        <QuickNavCards onSelectTab={onSelectTab} user={user} />
      </div>

      {/* ══════════════════════════════════════════
          SECTION 4 — Coach CTA Banner
      ══════════════════════════════════════════ */}
      <CoachBanner onSelectTab={onSelectTab} />

      {/* ══════════════════════════════════════════
          SECTION 5 — Bottom Floating Quick Log Module
      ══════════════════════════════════════════ */}
      <FloatingQuickLog
        macros={macros}
        onLogWater={onLogWater}
        onAddMeal={onAddMeal}
        isOpenExternal={isOpenExternalQuickLog}
        onCloseExternal={onCloseExternalQuickLog}
      />

    </div>
  );
};
