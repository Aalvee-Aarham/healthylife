import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CoachAssignment, CoachListing, CoachSpecialty } from '../types';
import { X, Dumbbell, Apple, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SkeletonCard } from './ui/Skeleton';

interface FindCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful assign/switch so the parent can refresh conversations/coaches. */
  onAssigned?: () => void;
  /** Member's existing coach assignments, used to switch (remove-then-assign) and label buttons. */
  currentAssignments?: CoachAssignment[];
}

const SPECIALTIES: { key: CoachSpecialty; label: string; icon: React.ReactNode }[] = [
  { key: 'trainer', label: 'Trainer', icon: <Dumbbell className="w-4 h-4" /> },
  { key: 'nutritionist', label: 'Nutritionist', icon: <Apple className="w-4 h-4" /> },
];

export const FindCoachModal: React.FC<FindCoachModalProps> = ({ isOpen, onClose, onAssigned, currentAssignments }) => {
  const [coaches, setCoaches] = useState<CoachListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    api.getCoaches()
      .then(setCoaches)
      .catch((e) => setError(e?.message || 'Failed to load coaches.'))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async (coach: CoachListing) => {
    setAssigningId(coach.id);
    setError(null);
    setSuccessMsg(null);
    try {
      const existing = currentAssignments?.find((a) => a.specialty === coach.coachSpecialty);
      if (existing) {
        try {
          await api.removeCoachAssignment(existing.id);
        } catch (e) {
          console.warn('Failed to remove previous coach assignment, continuing anyway:', e);
        }
      }
      await api.assignCoach(coach.id, coach.coachSpecialty);
      setSuccessMsg(`${coach.name} is now your ${coach.coachSpecialty === 'nutritionist' ? 'Nutritionist' : 'Trainer'}!`);
      onAssigned?.();
    } catch (e: any) {
      setError(e?.message || 'Failed to assign coach. Please try again.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl"
        style={{ background: 'var(--hl-surface)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: 'var(--hl-text-primary)' }}>Find a Coach</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>
              Choose a dedicated Trainer and/or Nutritionist to guide your journey.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hl-card-hover" aria-label="Close">
            <X className="w-4 h-4" style={{ color: 'var(--hl-text-tertiary)' }} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} withAvatar lines={2} />
            ))}
          </div>
        ) : (
          SPECIALTIES.map(({ key, label, icon }) => {
            const list = coaches.filter((c) => c.coachSpecialty === key);
            if (list.length === 0) return null;
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--hl-text-secondary)' }}>
                  {icon}
                  <span>{label}s</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {list.map((coach) => {
                    const isCurrent = currentAssignments?.some((a) => a.specialty === coach.coachSpecialty && a.coach.id === coach.id);
                    return (
                      <Card key={coach.id} hover padding="p-4" className="flex items-center gap-3">
                        {coach.avatar ? (
                          <img src={coach.avatar} alt={coach.name} className="w-11 h-11 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shrink-0" style={{ background: 'var(--hl-green)' }}>
                            {coach.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--hl-text-primary)' }}>{coach.name}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{coach.title || label}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          loading={assigningId === coach.id}
                          onClick={() => handleAssign(coach)}
                          disabled={assigningId !== null}
                        >
                          {isCurrent ? 'Switch' : 'Select'}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {!isLoading && coaches.length === 0 && !error && (
          <p className="text-center text-xs py-8" style={{ color: 'var(--hl-text-tertiary)' }}>
            No coaches are available right now. Please check back later.
          </p>
        )}
      </div>
    </div>
  );
};

export default FindCoachModal;
