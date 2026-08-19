import React, { useState, useEffect, useCallback } from 'react';
import { WaterLogEntry } from '../../types';
import { api } from '../../services/api';
import { Droplet, Plus, Trash2, Loader2, AlertCircle, Clock } from 'lucide-react';

const QUICK_AMOUNTS = [100, 250, 500, 750, 1000];

export const WaterView: React.FC = () => {
  const [logs, setLogs] = useState<WaterLogEntry[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const [goalMl, setGoalMl] = useState(2500);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const fetchLogs = useCallback(() => {
    setIsLoading(true);
    api.getWaterLogs()
      .then(({ logs: l, totalMl: t, goalMl: g }) => {
        setLogs(l);
        setTotalMl(t);
        setGoalMl(g);
        setError(null);
      })
      .catch((e) => setError(e?.message || 'Failed to load water logs.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleAdd = async (ml: number) => {
    if (!ml || ml <= 0) return;
    setIsAdding(true);
    try {
      const { log, totalMl: t } = await api.logWater(ml);
      setLogs((prev) => [log, ...prev]);
      setTotalMl(t);
    } catch (e: any) {
      setError(e?.message || 'Failed to log water.');
    } finally {
      setIsAdding(false);
      setCustomAmount('');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { totalMl: t } = await api.deleteWaterLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setTotalMl(t);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete log.');
    }
  };

  const pct = Math.min(100, goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0);
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <div className="space-y-8 pb-12 animate-fade-slide-up">

      {/* Header */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 hl-card space-y-4"
        style={{
          background: 'linear-gradient(135deg, var(--hl-teal) 0%, #3DAEA3 100%)',
          boxShadow: '0 8px 32px rgba(74,155,142,0.25)',
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Hydration Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Daily Water Log</h1>
            <p className="text-sm text-white/90">Stay hydrated — track every sip throughout your day.</p>
          </div>

          {/* Ring */}
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-md shrink-0"
               style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }}>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="56" stroke="currentColor" strokeWidth="7" className="text-white/30" fill="transparent"
                  style={{ strokeDasharray: `${2 * Math.PI * 33} ${2 * Math.PI * 33}` }} />
                <circle cx="40" cy="40" r="33" stroke="currentColor" strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 33}`}
                  strokeDashoffset={`${2 * Math.PI * 33 - (2 * Math.PI * 33 * pct) / 100}`}
                  className="text-white transition-all duration-700"
                  strokeLinecap="round" fill="transparent" />
              </svg>
              <span className="absolute text-base font-black text-white">{pct}%</span>
            </div>
            <div>
              <p className="text-xs text-white/90 font-semibold">Consumed</p>
              <p className="text-xl font-black text-white">{(totalMl / 1000).toFixed(2)}<span className="text-xs text-white/80 font-normal ml-0.5">L</span></p>
              <p className="text-[10px] text-white/90 mt-0.5">Goal: {(goalMl / 1000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl text-xs flex items-center gap-3 animate-fade-slide-up"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Quick Add Buttons */}
      <div className="hl-card rounded-3xl p-6 shadow-md space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--hl-teal-light)' }}>
            <Plus className="w-4 h-4" style={{ color: 'var(--hl-teal)' }} />
          </div>
          Quick Add Water
        </h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAdd(ml)}
              disabled={isAdding}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hl-card-hover"
              style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-teal-border)', color: 'var(--hl-teal)' }}
            >
              +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Droplet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hl-text-tertiary)' }} />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount in ml..."
              min="1"
              max="5000"
              className="w-full pl-9 pr-4 py-3 rounded-2xl text-xs focus:ring-2 focus:outline-none transition-all"
              style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)', color: 'var(--hl-text-primary)' }}
            />
          </div>
          <button
            onClick={() => handleAdd(parseInt(customAmount, 10))}
            disabled={!customAmount || isAdding}
            className="px-5 py-3 rounded-2xl font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white shadow-sm"
            style={{ background: 'var(--hl-teal)' }}
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Log
          </button>
        </div>
      </div>

      {/* Log Timeline */}
      <div className="hl-card rounded-3xl p-6 shadow-md space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--hl-text-primary)' }}>
          <Clock className="w-4 h-4" style={{ color: 'var(--hl-text-tertiary)' }} />
          Today's Log
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10" style={{ color: 'var(--hl-text-tertiary)' }}>
            <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: 'var(--hl-teal)' }} />
            <span className="text-xs">Loading logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-xs py-8" style={{ color: 'var(--hl-text-tertiary)' }}>No water logged yet. Start hydrating! 💧</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3.5 rounded-2xl transition-all"
                   style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                       style={{ background: 'var(--hl-teal-light)' }}>
                    <Droplet className="w-4 h-4" style={{ color: 'var(--hl-teal)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--hl-text-primary)' }}>+{log.amountMl}ml</p>
                    <p className="text-[10px]" style={{ color: 'var(--hl-text-secondary)' }}>{log.time || new Date(log.loggedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 rounded-xl transition-colors hover:bg-red-50 hover:text-red-500"
                  style={{ color: 'var(--hl-text-tertiary)' }}
                  title="Remove log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
