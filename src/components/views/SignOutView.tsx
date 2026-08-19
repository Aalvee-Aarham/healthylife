import React from 'react';
import { NavigationTab } from '../../types';
import { 
  LogOut, 
  LogIn, 
  Home, 
  CheckCircle2, 
} from 'lucide-react';

interface SignOutViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const SignOutView: React.FC<SignOutViewProps> = ({
  onSelectTab,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-center">
      
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
        
        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold shadow-md">
          <LogOut className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Successfully Signed Out</span>
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            See You Soon!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your fitness, nutrition, and cycle data have been saved. You can sign back in anytime to continue your streak.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onSelectTab('signin')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
          </button>

          <button
            onClick={() => onSelectTab('home')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Return to Landing Page</span>
          </button>
        </div>

      </div>

    </div>
  );
};
