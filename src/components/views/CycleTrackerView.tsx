import React, { useState } from 'react';
import { CyclePhaseInfo, SymptomLog } from '../../types';
import { 
  Sparkles, 
  Heart, 
  Activity, 
  Calendar as CalendarIcon, 
  Check, 
  Info, 
  Zap, 
  Smile, 
  Utensils, 
  Dumbbell, 
  Brain,
  ChevronRight
} from 'lucide-react';

interface CycleTrackerViewProps {
  symptoms: SymptomLog[];
  onToggleSymptom: (symptomId: string) => void;
  phasesData: Record<string, CyclePhaseInfo>;
}

export const CycleTrackerView: React.FC<CycleTrackerViewProps> = ({
  symptoms,
  onToggleSymptom,
  phasesData
}) => {
  const [selectedPhaseKey, setSelectedPhaseKey] = useState<'follicular' | 'ovulation' | 'luteal' | 'menstrual'>('ovulation');
  const activePhase = phasesData[selectedPhaseKey];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 border border-purple-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 text-purple-300 text-xs font-bold border border-purple-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CycleSync™ Hormonal Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              4-Phase Biological Rhythms & Biomarkers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Currently in <span className="text-purple-300 font-bold">Ovulation Peak Phase (Day 14)</span>. Estrogen and testosterone are at max concentration.
            </p>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated Next Period</p>
            <p className="text-sm font-black text-pink-400">In 14 Days (Aug 8)</p>
          </div>
        </div>

        {/* Phase Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          {(['follicular', 'ovulation', 'luteal', 'menstrual'] as const).map((key) => {
            const phase = phasesData[key];
            const isCurrent = key === selectedPhaseKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedPhaseKey(key)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-purple-950/80 border-purple-500 shadow-lg text-slate-100'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase" style={{ color: phase.color }}>{phase.daysRange}</span>
                  {key === 'ovulation' && (
                    <span className="text-[9px] bg-purple-500 text-slate-950 px-1.5 py-0.2 rounded font-black">Active</span>
                  )}
                </div>
                <p className="text-xs font-bold mt-1">{phase.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Phase Wheel & Biomarkers vs Symptom Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Phase Ring Visualizer & Biomarkers (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Circular 4-Phase Canvas Visualizer */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 text-center">
            <h2 className="text-base font-bold text-slate-100">Biological Phase Wheel</h2>
            
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
              
              <svg className="w-64 h-64 transform -rotate-90">
                {/* Follicular arc */}
                <circle cx="128" cy="128" r="100" stroke="#10B981" strokeWidth="16" strokeDasharray="157 471" strokeDashoffset="0" fill="transparent" />
                {/* Ovulation arc */}
                <circle cx="128" cy="128" r="100" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="94 534" strokeDashoffset="-157" fill="transparent" />
                {/* Luteal arc */}
                <circle cx="128" cy="128" r="100" stroke="#F59E0B" strokeWidth="16" strokeDasharray="235 393" strokeDashoffset="-251" fill="transparent" />
                {/* Menstrual arc */}
                <circle cx="128" cy="128" r="100" stroke="#EC4899" strokeWidth="16" strokeDasharray="141 487" strokeDashoffset="-486" fill="transparent" />
              </svg>

              {/* Center Info */}
              <div className="absolute flex flex-col items-center justify-center space-y-0.5">
                <span className="text-3xl font-black text-slate-100">Day 14</span>
                <span className="text-xs font-bold text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                  {activePhase.name}
                </span>
                <span className="text-[10px] text-slate-400">Estrogen Peak</span>
              </div>
            </div>

            {/* Biomarker Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left pt-2 border-t border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Estrogen Concentration</p>
                <p className="text-sm font-bold text-emerald-400">Peak Maximum</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Progesterone</p>
                <p className="text-sm font-bold text-amber-400">Rising Steady</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Basal Temp Shift</p>
                <p className="text-sm font-bold text-purple-400">+0.4°C Rise</p>
              </div>
            </div>
          </div>

          {/* Phase Aligned Guidance Cards (Nutrition, Workouts, Mindset) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bio Nutrition */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Bio-Nutrition Strategy</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activePhase.nutritionAdvice}</p>
            </div>

            {/* Peak Performance */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Exercise Strategy</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activePhase.workoutAdvice}</p>
            </div>

            {/* Mindset & Focus */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Mindset Alignment</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activePhase.mindsetAdvice}</p>
            </div>

          </div>

        </div>

        {/* Sidebar: Interactive Daily Symptom Logger */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span>Today's Symptom Logger</span>
              </h3>
              <span className="text-[10px] text-slate-400">Tap to toggle</span>
            </div>

            <div className="space-y-2">
              {symptoms.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onToggleSymptom(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                    s.logged
                      ? 'bg-pink-950/60 border-pink-500/80 text-pink-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{s.icon}</span>
                    <span>{s.symptom}</span>
                  </div>
                  {s.logged && <Check className="w-4 h-4 text-pink-400 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
