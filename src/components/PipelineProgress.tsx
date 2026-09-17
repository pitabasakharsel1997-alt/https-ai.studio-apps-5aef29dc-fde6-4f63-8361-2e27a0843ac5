import { CheckCircle2, Loader2, AlertTriangle, XCircle, Terminal, RefreshCw } from 'lucide-react';
import type { GenerationJob } from '../types';

interface PipelineProgressProps {
  job: GenerationJob | null;
  onRetry?: () => void;
}

export function PipelineProgress({ job, onRetry }: PipelineProgressProps) {
  if (!job) return null;

  const pipelineStages = [
    { key: 'QUEUED', label: 'Queued', sub: 'Worker queue allocation' },
    { key: 'PROCESSING', label: 'Script & Blueprint', sub: 'Intent & narrative synthesis' },
    { key: 'GENERATING_SCENES', label: 'Scene & Visuals', sub: 'Camera moves & keyframe rendering' },
    { key: 'GENERATING_AUDIO', label: 'Voice & Ducking', sub: 'Voiceover, SFX & soundtrack' },
    { key: 'QUALITY_CHECK', label: 'Quality Control', sub: '10-point automated inspection' },
    { key: 'COMPLETED', label: 'Ready', sub: 'Interactive editor & MP4 ready' },
  ];

  const getStageIndex = (state: string) => {
    switch (state) {
      case 'QUEUED':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'GENERATING_SCENES':
        return 2;
      case 'GENERATING_AUDIO':
        return 3;
      case 'QUALITY_CHECK':
      case 'RETRYING':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 1;
    }
  };

  const currentStageIndex = getStageIndex(job.state);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              {job.state === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : job.state === 'FAILED' ? (
                <XCircle className="w-4 h-4 text-rose-400" />
              ) : job.state === 'RETRYING' ? (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              )}
              <span>Pipeline Stage: {job.state.replace('_', ' ')}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
              {job.progressPercent}%
            </span>
          </div>
          <p className="text-xs text-indigo-300 mt-1 font-medium">{job.currentStepMessage}</p>
        </div>

        {job.state === 'FAILED' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Pipeline</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            job.state === 'FAILED'
              ? 'bg-rose-500'
              : job.state === 'COMPLETED'
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
          }`}
          style={{ width: `${Math.max(5, job.progressPercent)}%` }}
        />
      </div>

      {/* Pipeline Steps Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {pipelineStages.map((stage, idx) => {
          const isDone = currentStageIndex > idx || job.state === 'COMPLETED';
          const isCurrent = currentStageIndex === idx && job.state !== 'COMPLETED' && job.state !== 'FAILED';
          const isFailed = job.state === 'FAILED' && currentStageIndex === idx;

          return (
            <div
              key={stage.key}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30'
                  : isFailed
                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1 font-semibold">
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                ) : isFailed ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="truncate">{stage.label}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{stage.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Terminal Live Logs */}
      {job.logs && job.logs.length > 0 && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 text-[11px] font-mono space-y-1 max-h-32 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-slate-500 font-sans font-medium text-[10px] pb-1 border-b border-slate-800/80">
            <Terminal className="w-3 h-3 text-slate-400" />
            <span>Worker Execution Logs</span>
          </div>
          {job.logs.slice(-5).map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-slate-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span
                className={`font-semibold shrink-0 ${
                  log.status === 'success'
                    ? 'text-emerald-400'
                    : log.status === 'warn'
                    ? 'text-amber-400'
                    : log.status === 'error'
                    ? 'text-rose-400'
                    : 'text-indigo-400'
                }`}
              >
                [{log.step}]
              </span>
              <span className="text-slate-300 truncate">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
