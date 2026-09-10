import { useEffect, useRef } from 'react';
import { 
  Terminal, CheckCircle2, AlertTriangle, Cpu, ArrowRight, ShieldCheck, 
  RotateCw, FileCheck2, Activity, Play 
} from 'lucide-react';

const PIPELINE_STEPS = [
  'INTAKE',
  'PLAN',
  'RETRIEVE',
  'ACT',
  'OBSERVE',
  'VERIFY',
  'COMPLETED'
];

export default function TracePanel({ 
  jobId, 
  traceLog = [], 
  status = 'WAITING', 
  onNavigateToArtifact, 
  onNavigateToAudit,
  onRefresh 
}) {
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal to bottom as new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traceLog]);

  // Determine current active step in pipeline
  const currentStep = traceLog.length > 0 ? traceLog[traceLog.length - 1].step : 'INTAKE';

  const getStepColor = (step) => {
    switch (step) {
      case 'INTAKE': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'PLAN': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'RETRIEVE': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'ACT': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'OBSERVE': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'VERIFY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'COMPLETED': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'FAILED': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'SYSTEM': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      case 'FALLBACK': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-300 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* State Machine Pipeline Progress Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity size={16} className="text-purple-400 animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-300">
              Agent State Machine (Max 8 Steps · Air-Gapped)
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {jobId && (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">
                Job ID: <strong className="text-purple-300">{jobId}</strong>
              </span>
            )}
            <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              status === 'COMPLETED'
                ? 'bg-green-500/20 text-green-300 border-green-500/40'
                : status === 'FAILED'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
            }`}>
              {status}
            </span>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-1 rounded text-gray-400 hover:text-white transition"
                title="Refresh trace"
              >
                <RotateCw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Step Indicators */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {PIPELINE_STEPS.map((step, idx) => {
            const hasPassed = traceLog.some(log => log.step === step);
            const isCurrent = currentStep === step && status === 'PROCESSING';
            const isFinished = status === 'COMPLETED' && step === 'COMPLETED';

            return (
              <div 
                key={step}
                className={`py-2 px-1 text-center rounded-lg border text-[11px] font-mono font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse'
                    : hasPassed || isFinished
                    ? 'bg-green-500/15 border-green-500/30 text-green-300'
                    : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
                }`}
              >
                <div className="text-[9px] opacity-60">0{idx + 1}</div>
                <div className="truncate">{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Trace Panel */}
      <div className="rounded-2xl border border-white/15 bg-black/70 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.04]">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Terminal size={14} className="text-purple-400" />
              <span className="font-mono text-xs text-gray-300">kavach-agent@sovereign-node:~/jobs/{jobId || 'daemon'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-400">
            <Cpu size={13} className="text-cyan-400" />
            <span>Hardware: Distributed 6GB RTX 4050 Cluster</span>
          </div>
        </div>

        {/* Terminal Content Stream */}
        <div className="p-6 font-mono text-xs space-y-2.5 min-h-[340px] max-h-[500px] overflow-y-auto leading-relaxed">
          {traceLog.length === 0 ? (
            <div className="text-gray-500 flex items-center space-x-2 py-8 justify-center">
              <span className="text-purple-500 animate-pulse">$</span>
              <span>Awaiting job execution payload from /upload and /task endpoints...</span>
            </div>
          ) : (
            traceLog.map((log, index) => {
              const badgeStyle = getStepColor(log.step);
              return (
                <div key={index} className="flex items-start space-x-3 text-gray-300 hover:bg-white/[0.02] p-1 rounded transition">
                  <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border select-none ${badgeStyle}`}>
                    {log.step}
                  </span>
                  <span className="text-purple-400 shrink-0 select-none">➜</span>
                  <span className="text-gray-200 break-words flex-1">{log.detail}</span>
                </div>
              );
            })
          )}

          {/* Live Typing Pulse when processing */}
          {status === 'PROCESSING' && (
            <div className="flex items-center space-x-3 text-purple-400 pt-2">
              <span className="text-gray-500 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/40 bg-purple-500/20 text-purple-300">
                ACTIVE
              </span>
              <span className="text-purple-400">➜</span>
              <span className="text-purple-300">Bounded agent reasoning state transition in progress...</span>
              <span className="w-2 h-4 bg-purple-400 animate-pulse inline-block"></span>
            </div>
          )}

          {/* Finalized Banner */}
          {status === 'COMPLETED' && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 size={24} className="text-green-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-white">Execution Cycle Successfully Finalized</div>
                  <div className="text-xs text-green-400/80">
                    Deterministic verification passed. Deliverable artifact generated with citations.
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onNavigateToArtifact && (
                  <button
                    onClick={onNavigateToArtifact}
                    className="px-3.5 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-200 text-xs font-bold font-mono transition flex items-center space-x-1.5"
                  >
                    <FileCheck2 size={14} />
                    <span>Inspect Artifact</span>
                  </button>
                )}
                {onNavigateToAudit && (
                  <button
                    onClick={onNavigateToAudit}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold font-mono transition flex items-center space-x-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>Audit Log</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}