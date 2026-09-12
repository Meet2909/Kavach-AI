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
      case 'INTAKE': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'PLAN': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'RETRIEVE': return 'text-[#282B4A] bg-[#282B4A]/10/10 border-[#282B4A]/20 border-2/30';
      case 'ACT': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'OBSERVE': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'VERIFY': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'COMPLETED': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'FAILED': return 'text-[#282B4A] bg-[#282B4A]/10 border-[#282B4A]/20 border-2';
      case 'SYSTEM': return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      case 'FALLBACK': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-[#282B4A] bg-[#EEEBDA]/5 border-white/10';
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
              Agent State Machine (Max 8 Steps Â· Air-Gapped)
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
            const isFinished = status === 'COMPLETED' && step === 'COMPLETED';

            return (
              <div 
                key={step}
                className={`py-2 px-1 text-center rounded-lg border text-[11px] font-mono font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A] shadow-[0_0_15px_rgba(136,19,55,0.3)] animate-pulse'
                    : hasPassed || isFinished
                    ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A]'
                    : 'bg-slate-600 border-slate-500 text-white'
                }`}
              >
                <div className="text-[9px] text-white opacity-80">0{idx + 1}</div>
                <div className="truncate font-bold text-white">{step}</div>
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
            <div className="text-[#EEEBDA] flex items-center space-x-2 py-8 justify-center">
              <span className="text-[#EEEBDA] animate-pulse">$</span>
              <span>Awaiting job execution payload from /upload and /task endpoints...</span>
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
          {status === 'PROCESSING' && (
            <div className="flex items-center space-x-3 text-[#282B4A] pt-2">
              <span className="text-[#282B4A] shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-[#282B4A]/20 border-2 bg-[#282B4A]/10 text-[#282B4A]">
                ACTIVE
              </span>
              <span className="text-[#282B4A]">âžœ</span>
              <span className="text-[#282B4A]">Bounded agent reasoning state transition in progress...</span>
              <span className="w-2 h-4 bg-[#282B4A]/10 animate-pulse inline-block"></span>
            </div>
          )}

          {/* Finalized Banner */}
          {status === 'COMPLETED' && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#9D9167]/10 to-[#9D9167]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 size={24} className="text-[#282B4A] shrink-0" />
                <div>
                  <div className="font-bold text-sm text-white">Execution Cycle Successfully Finalized</div>
                  <div className="text-xs text-[#282B4A]/80">
                    Deterministic verification passed. Deliverable artifact generated with citations.
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onNavigateToArtifact && (
                  <button
                    onClick={onNavigateToArtifact}
                    className="px-3.5 py-2 rounded-lg bg-[#282B4A]/10 hover:bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] text-xs font-bold font-mono transition flex items-center space-x-1.5"
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



