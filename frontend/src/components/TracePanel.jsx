import { useEffect, useRef } from 'react';
import { 
  Terminal, CheckCircle2, AlertTriangle, Cpu, ArrowRight, ShieldCheck, 
  RotateCw, FileCheck2, Activity, Play, Loader2
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

// Animated loading dots component
function LoadingDots() {
  return (
    <div className="flex items-center space-x-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-green-400"
          style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

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
      case 'INTAKE': return 'text-blue-300 bg-blue-500/15 border-blue-400/30';
      case 'PLAN': return 'text-purple-300 bg-purple-500/15 border-purple-400/30';
      case 'RETRIEVE': return 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30';
      case 'ACT': return 'text-orange-300 bg-orange-500/15 border-orange-400/30';
      case 'OBSERVE': return 'text-yellow-300 bg-yellow-500/15 border-yellow-400/30';
      case 'VERIFY': return 'text-indigo-300 bg-indigo-500/15 border-indigo-400/30';
      case 'COMPLETED': return 'text-green-300 bg-green-500/15 border-green-400/30';
      case 'FAILED': return 'text-red-300 bg-red-500/15 border-red-400/30';
      case 'SYSTEM': return 'text-pink-300 bg-pink-500/15 border-pink-400/30';
      case 'FALLBACK': return 'text-yellow-300 bg-yellow-500/15 border-yellow-400/30';
      case 'ABSTAIN': return 'text-amber-300 bg-amber-500/15 border-amber-400/30';
      case 'ROUTING': return 'text-teal-300 bg-teal-500/15 border-teal-400/30';
      case 'WARN': return 'text-orange-300 bg-orange-500/15 border-orange-400/30';
      default: return 'text-[#EEEBDA]/70 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* State Machine Pipeline Progress Bar */}
      <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity size={16} className="text-white animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
              Agent State Machine (Max 8 Steps · Air-Gapped)
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {jobId && (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#EEEBDA]/10 text-[#282B4A] border border-white/15">
                Job ID: <strong className="text-[#282B4A]">{jobId}</strong>
              </span>
            )}
            <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              status === 'COMPLETED'
                ? 'bg-[#282B4A]/10 text-white border-[#282B4A]/20 border-2'
                : status === 'FAILED'
                ? 'bg-[#282B4A]/10 text-white border-[#282B4A]/20 border-2'
                : 'bg-[#282B4A]/10 text-white border-[#282B4A]/20 border-2 animate-pulse'
            }`}>
              {status}
            </span>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-1 rounded text-white hover:text-gray-300 transition"
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
            const isCompleted = status === 'COMPLETED' && step === 'COMPLETED';
            const isFailed = status === 'FAILED';

            let containerClass = '';
            let numClass = '';
            let labelClass = '';

            if (isCurrent) {
              // Bright glowing amber — clearly the active step
              containerClass = 'bg-amber-400 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.6)] animate-pulse scale-105';
              numClass = 'text-amber-900 opacity-90';
              labelClass = 'text-amber-900';
            } else if (isCompleted || (hasPassed && step === 'COMPLETED')) {
              // Vivid green for the final completed step
              containerClass = 'bg-green-500 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]';
              numClass = 'text-green-100 opacity-80';
              labelClass = 'text-white';
            } else if (isFailed && hasPassed && step !== 'COMPLETED') {
              // Red tint for steps that ran before a failure
              containerClass = 'bg-red-500/80 border-red-400';
              numClass = 'text-red-100 opacity-80';
              labelClass = 'text-white';
            } else if (hasPassed) {
              // Teal highlight for passed steps
              containerClass = 'bg-teal-600/70 border-teal-400/60 shadow-[0_0_8px_rgba(20,184,166,0.3)]';
              numClass = 'text-teal-200 opacity-80';
              labelClass = 'text-white';
            } else {
              // Dim/inactive
              containerClass = 'bg-slate-700 border-slate-600 opacity-50';
              numClass = 'text-slate-400';
              labelClass = 'text-slate-300';
            }

            return (
              <div
                key={step}
                className={`py-2 px-1 text-center rounded-lg border text-[11px] font-mono font-bold transition-all duration-300 ${containerClass}`}
              >
                <div className={`text-[9px] ${numClass}`}>0{idx + 1}</div>
                <div className={`truncate font-bold ${labelClass}`}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Trace Panel */}
      <div className="rounded-2xl border border-white/15 bg-[#282B4A] backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#EEEBDA]/[0.04]">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center space-x-2 text-[#EEEBDA]">
              <Terminal size={14} className="text-[#EEEBDA]" />
              <span className="font-mono text-xs text-[#EEEBDA]">kavach-agent@sovereign-node:~/jobs/{jobId || 'daemon'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#EEEBDA]">
            <Cpu size={13} className="text-[#EEEBDA]" />
            <span>Hardware: Distributed 6GB RTX 4050 Cluster</span>
          </div>
        </div>

        {/* Terminal Content Stream */}
        <div className="p-6 font-mono text-xs space-y-2.5 min-h-[340px] max-h-[500px] overflow-y-auto leading-relaxed">
          {traceLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-5 text-[#EEEBDA]/70">
              {status === 'PROCESSING' ? (
                <>
                  <div className="relative">
                    <Loader2 size={36} className="animate-spin text-[#EEEBDA]/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[#EEEBDA] font-semibold text-sm animate-pulse">Initializing agent execution...</p>
                    <p className="text-[#EEEBDA]/50 text-[11px]">Waiting for first trace log from the state machine</p>
                  </div>
                  <LoadingDots />
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 opacity-60">
                    <span className="text-green-400 text-lg animate-pulse">$</span>
                    <span className="text-[#EEEBDA]/60 text-[11px] tracking-wide">kavach-agent ready — awaiting job payload</span>
                    <span className="inline-block w-2 h-3.5 bg-[#EEEBDA]/40 animate-pulse" />
                  </div>
                  <p className="text-[#EEEBDA]/40 text-[10px] text-center">Upload a document on Tab 02 to start a job</p>
                </>
              )}
            </div>
          ) : (
            traceLog.map((log, index) => {
              const badgeStyle = getStepColor(log.step);
              return (
                <div key={index} className="flex items-start space-x-3 text-[#EEEBDA] hover:bg-[#EEEBDA]/[0.02] p-1 rounded transition">
                  <span className="text-[#EEEBDA] shrink-0 select-none">[{log.time}]</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border select-none ${badgeStyle}`}>
                    {log.step}
                  </span>
                  <span className="text-[#EEEBDA] shrink-0 select-none">➔</span>
                  <span className="text-[#EEEBDA] break-words flex-1">{log.detail}</span>
                </div>
              );
            })
          )}

          {/* Live Typing Pulse when processing */}
          {status === 'PROCESSING' && traceLog.length > 0 && (
            <div className="flex items-center space-x-3 text-[#EEEBDA] pt-2">
              <span className="text-[#EEEBDA]/60 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-green-400/40 bg-green-400/10 text-green-400">
                ACTIVE
              </span>
              <span className="text-[#EEEBDA]/60">➜</span>
              <span className="text-[#EEEBDA]/80">Bounded agent reasoning state transition in progress...</span>
              <span className="w-2 h-4 bg-green-400/70 animate-pulse inline-block"></span>
            </div>
          )}

          {/* Finalized Banner */}
          {status === 'COMPLETED' && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#9D9167]/10 to-[#9D9167]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 size={24} className="text-[#282B4A] shrink-0" />
                <div>
                  <div className="font-bold text-sm text-white">Execution Cycle Successfully Finalized</div>
                  <div className="text-xs text-[#ffff]/80">
                    Deterministic verification passed. Deliverable artifact generated with citations.
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onNavigateToArtifact && (
                  <button
                    onClick={onNavigateToArtifact}
                    className="px-3.5 py-2 rounded-lg bg-[#282B4A]/10 hover:bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#ffff] text-xs font-bold font-mono transition flex items-center space-x-1.5"
                  >
                    <FileCheck2 size={14} />
                    <span>Inspect Artifact</span>
                  </button>
                )}
                {onNavigateToAudit && (
                  <button
                    onClick={onNavigateToAudit}
                    className="px-3.5 py-2 rounded-lg bg-[#EEEBDA]/10 hover:bg-[#EEEBDA]/20 border border-white/20 text-white text-xs font-bold font-mono transition flex items-center space-x-1.5"
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



