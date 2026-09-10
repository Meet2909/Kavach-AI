import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Prism from './components/Prism.jsx';
import DashboardView from './components/DashboardView.jsx';
import UploadBox from './components/UploadBox.jsx';
import TracePanel from './components/TracePanel.jsx';
import EvidenceRagView from './components/EvidenceRagView.jsx';
import ArtifactGeneratorView from './components/ArtifactGeneratorView.jsx';
import HumanApproval from './components/HumanApproval.jsx';
import SecurityAuditView from './components/SecurityAuditView.jsx';
import HardwareConfigView from './components/HardwareConfigView.jsx';
import api from './api/client.js';
import { ShieldCheck, Server, Activity, ChevronRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [traceLog, setTraceLog] = useState([]);
  const [jobStatus, setJobStatus] = useState('WAITING');
  const [apiOnline, setApiOnline] = useState(false);
  const [airgapped, setAirgapped] = useState(true);

  // Poll backend health & status on boot
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const h = await api.checkHealth();
        setApiOnline(!!h);
      } catch {
        setApiOnline(false);
      }
      try {
        const s = await api.getSovereigntyStatus();
        setAirgapped(s?.is_air_gapped ?? true);
      } catch {
        // fallback
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll trace log for currentJobId
  const pollTrace = useCallback(async (jobId) => {
    if (!jobId) return;
    try {
      const res = await api.pollJobStatus(jobId);
      if (res && res.trace) {
        setTraceLog(res.trace);
        setJobStatus(res.status || 'PROCESSING');
      }
    } catch (err) {
      console.warn('Trace poll error:', err);
    }
  }, []);

  useEffect(() => {
    if (!currentJobId) return;

    // Immediately poll once
    pollTrace(currentJobId);

    // If job is already finished, don't keep polling
    if (jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    const timer = setInterval(() => {
      pollTrace(currentJobId);
    }, 1500);

    return () => clearInterval(timer);
  }, [currentJobId, jobStatus, pollTrace]);

  // Handler when UploadBox starts a task
  const handleTaskStarted = (jobId, taskType, fileName) => {
    setCurrentJobId(jobId);
    setJobStatus('PROCESSING');
    setTraceLog([
      { time: new Date().toLocaleTimeString(), step: 'INTAKE', detail: `Initiated task='${taskType}' for artifact '${fileName}'` }
    ]);
    setActiveTab(2); // Automatically transition to Active AI Jobs tab
  };

  // Render the selected tab content
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <span>Tab 02</span>
                <ChevronRight size={12} />
                <span>Multimodal Intake</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-white">Document Intake</h1>
            </div>
            <UploadBox onTaskStarted={handleTaskStarted} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <span>Tab 03</span>
                <ChevronRight size={12} />
                <span>State Machine Execution</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-white">Active AI Jobs</h1>
            </div>
            <TracePanel 
              jobId={currentJobId} 
              traceLog={traceLog} 
              status={jobStatus} 
              onNavigateToArtifact={() => setActiveTab(4)}
              onNavigateToAudit={() => setActiveTab(6)}
              onRefresh={() => currentJobId && pollTrace(currentJobId)}
            />
          </div>
        );
      case 3:
        return <EvidenceRagView />;
      case 4:
        return <ArtifactGeneratorView initialJobId={currentJobId} />;
      case 5:
        return <HumanApproval />;
      case 6:
        return <SecurityAuditView />;
      case 7:
        return <HardwareConfigView />;
      default:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060608] text-white select-none">
      
      {/* 3D WebGL PRISM BACKGROUND */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40">
        <Prism
          height={4}
          baseWidth={5}
          animationType="3drotate"
          glow={0.5}
          noise={0.1}
          transparent
          scale={1.3} 
          hueShift={0}
          colorFrequency={2.8}
          timeScale={0.12} 
        />
      </div>

      {/* FOREGROUND LAYOUT */}
      <div className="relative z-10 flex w-full h-full bg-black/40">
        
        {/* COLLAPSIBLE / DOCKED FROSTED SIDEBAR */}
        <aside className="w-[300px] shrink-0 h-full border-r border-white/10 bg-black/60 backdrop-blur-2xl flex flex-col justify-between shadow-[15px_0_35px_rgba(0,0,0,0.6)]">
          {/* Logo & Header */}
          <div className="p-8 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="text-sm font-bold tracking-widest text-white uppercase font-mono">KAVACH-AI</div>
                <div className="text-[10px] text-purple-400 font-mono tracking-wider">SOVEREIGN AIR-GAP OS</div>
              </div>
            </div>
          </div>

          {/* Interactive Line Sidebar for 8 Operational Panels */}
          <div className="px-6 flex-1 flex flex-col justify-center overflow-y-auto">
            <Sidebar 
              defaultActive={activeTab} 
              onItemClick={(index) => setActiveTab(index)} 
              textColor="#d1d5db"
              accentColor="#c084fc"
            />
          </div>

          {/* Sidebar Status Footer */}
          <div className="p-6 border-t border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-gray-400">{apiOnline ? 'Gateway Live' : 'Connecting...'}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-300">
                Air-Gapped
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col">
          {/* Top Operational Bar */}
          <header className="h-16 px-10 border-b border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4 text-xs font-mono text-gray-400">
              <span className="text-gray-200 font-semibold">Petroleum Infrastructure Cluster</span>
              <span className="text-white/20">|</span>
              <span>MRPL Refinery Node</span>
              {currentJobId && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-purple-300 flex items-center space-x-1">
                    <Activity size={12} className="animate-pulse" />
                    <span>Job Active: {currentJobId}</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center space-x-2">
                <Server size={12} className="text-purple-400" />
                <span>Dual GPU Cluster (6GB x2)</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1.5">
                <ShieldCheck size={13} />
                <span>Zero Telemetry</span>
              </div>
            </div>
          </header>

          {/* Dynamic Panel Content Container */}
          <div className="flex-1 p-10 max-w-6xl w-full mx-auto">
            {renderContent()}
          </div>
        </main>
        
      </div>
    </div>
  );
}