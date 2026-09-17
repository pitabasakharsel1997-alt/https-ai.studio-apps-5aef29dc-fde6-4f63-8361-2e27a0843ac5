import { useState } from 'react';
import { Film, Sparkles, ShieldCheck, Clock, Zap, BookOpen } from 'lucide-react';
import type { UserFairUseQuota } from '../types';

interface HeaderProps {
  quota: UserFairUseQuota | null;
  onOpenCharacterBible: () => void;
  onOpenQCModal?: () => void;
}

export function Header({ quota, onOpenCharacterBible, onOpenQCModal }: HeaderProps) {
  const [showQuotaTooltip, setShowQuotaTooltip] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                AIVideo Studio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              All-in-One AI Video Generation &amp; Editing Platform
            </p>
          </div>
        </div>

        {/* Action Controls & Quota */}
        <div className="flex items-center gap-3">
          {/* Character Bible Button */}
          <button
            type="button"
            onClick={onOpenCharacterBible}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
            title="Open Character Bible"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Character Bible</span>
          </button>

          {/* QC Inspection Button */}
          {onOpenQCModal && (
            <button
              type="button"
              onClick={onOpenQCModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-emerald-400 transition-colors"
              title="View 10-Point Quality Control System"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">QC Suite</span>
            </button>
          )}

          {/* Fair-Use Quota Pill */}
          <div
            className="relative"
            onMouseEnter={() => setShowQuotaTooltip(true)}
            onMouseLeave={() => setShowQuotaTooltip(false)}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-xs font-medium text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Free Quota:{' '}
                <strong className="text-white font-bold">
                  {quota ? quota.dailyQuotaRemaining : 5}/{quota ? quota.dailyQuotaTotal : 5}
                </strong>
              </span>
            </div>

            {showQuotaTooltip && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-xs z-50 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fair-Use Generation Quota</span>
                </div>
                <p className="text-slate-400 mb-2 leading-relaxed">
                  Free tier provides 5 high-definition video renders per day with up to 1080p H.264 export.
                </p>
                <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800 pt-2">
                  <div className="flex justify-between">
                    <span>Max Duration:</span>
                    <span className="font-semibold text-white">{quota?.maxVideoDurationSec || 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Resolution:</span>
                    <span className="font-semibold text-white">{quota?.maxResolution || '1080p'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Concurrent Jobs:</span>
                    <span className="font-semibold text-white">{quota?.maxConcurrentJobs || 2}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
