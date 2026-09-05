// @ts-nocheck React type declarations are unavailable in this project.
import React, { useState } from 'react';
import { MealPreset } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SkeletonRow } from '../ui/Skeleton';
import { Bookmark, Trash2, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '⚡',
};

interface MealPresetsSectionProps {
  presets: MealPreset[];
  isLoading: boolean;
  onLog: (preset: MealPreset) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

/** Collapsible "Saved Presets" panel: one-tap re-log of frequently eaten meals. */
export const MealPresetsSection: React.FC<MealPresetsSectionProps> = ({ presets, isLoading, onLog, onDelete }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLog = async (preset: MealPreset) => {
    if (loggingId) return;
    setLoggingId(preset.id);
    try {
      await onLog(preset);
    } finally {
      setLoggingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid var(--hl-border)', background: 'var(--hl-surface)', boxShadow: 'var(--hl-shadow-xs)' }}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between p-5 transition-colors hover:opacity-90"
        style={{ background: 'var(--hl-surface-alt)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--hl-amber-light)' }}>
            <Bookmark className="w-4 h-4" style={{ color: 'var(--hl-amber)' }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>Saved Presets</h3>
            <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
              {isLoading ? 'Loading…' : `${presets.length} preset${presets.length !== 1 ? 's' : ''} · one-tap log`}
            </p>
          </div>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} /> : <ChevronUp className="w-4 h-4" style={{ color: 'var(--hl-text-secondary)' }} />}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-6 space-y-1.5">
              <span className="text-2xl">🔖</span>
              <p className="text-xs font-semibold" style={{ color: 'var(--hl-text-secondary)' }}>
                No presets saved yet. Save a logged or parsed meal as a preset to reuse it later.
              </p>
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-3 p-3 rounded-2xl group transition-all"
                style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}
              >
                {preset.image ? (
                  <img src={preset.image} alt={preset.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--hl-surface)' }}>
                    {CATEGORY_EMOJI[preset.category] || '🍽️'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{preset.name}</p>
                    <Badge variant="amber" className="text-[9px] shrink-0">{preset.category}</Badge>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--hl-text-secondary)' }}>
                    {preset.calories} kcal · {preset.protein}g P · {preset.carbs}g C · {preset.fat}g F
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleLog(preset)}
                    disabled={loggingId === preset.id}
                    title="Log this preset to today's diary"
                  >
                    {loggingId === preset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Log
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(preset.id)}
                    disabled={deletingId === preset.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{ background: 'var(--hl-peach-light)', color: 'var(--hl-peach)' }}
                    title="Delete preset"
                  >
                    {deletingId === preset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MealPresetsSection;
