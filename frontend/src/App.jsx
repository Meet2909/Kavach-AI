import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';

// --- Technical Views (existing, unchanged) ---
import DashboardView from './components/DashboardView.jsx';
import UploadBox from './components/UploadBox.jsx';
import TracePanel from './components/TracePanel.jsx';
import EvidenceRagView from './components/EvidenceRagView.jsx';
import ArtifactGeneratorView from './components/ArtifactGeneratorView.jsx';
import HumanApproval from './components/HumanApproval.jsx';
import SecurityAuditView from './components/SecurityAuditView.jsx';
import HardwareConfigView from './components/HardwareConfigView.jsx';

// --- Simple Views (new, parallel) ---
import DashboardSimple from './components/simple/DashboardSimple.jsx';
import ActiveJobsSimple from './components/simple/ActiveJobsSimple.jsx';
import EvidenceRagSimple from './components/simple/EvidenceRagSimple.jsx';
import ArtifactGeneratorSimple from './components/simple/ArtifactGeneratorSimple.jsx';
import HumanApprovalSimple from './components/simple/HumanApprovalSimple.jsx';
import SecurityAuditSimple from './components/simple/SecurityAuditSimple.jsx';
import HardwareConfigSimple from './components/simple/HardwareConfigSimple.jsx';

import api from './api/client.js';
import { ShieldCheck, Server, Activity, ChevronRight, Layers, Eye } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [traceLog, setTraceLog] = useState([]);
  const [jobStatus, setJobStatus] = useState('WAITING');
  const [apiOnline, setApiOnline] = useState(false);
  const [airgapped, setAirgapped] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isDraggingRef = useRef(false);

  // --- View Mode (Simple / Technical) ---
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('kavach_view_mode') || 'simple';
  });
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('kavach_view_mode', mode);
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    let newWidth = e.clientX;
    if (newWidth < 220) newWidth = 220;
    if (newWidth > 600) newWidth = 600;
    setSidebarWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      document.body.style.cursor = 'default';
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  const isSimple = viewMode === 'simple';

  // Render the selected tab content
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return isSimple
          ? <DashboardSimple onNavigateTab={(tab) => setActiveTab(tab)} />
          : <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-b border-[#282B4A]/20 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#282B4A] uppercase tracking-wider">
                <span>Tab 02</span>
                <ChevronRight size={12} />
                <span>Multimodal Intake</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-[#282B4A]">
                {isSimple ? 'Upload a Document' : 'Document Intake'}
              </h1>
              {isSimple && (
                <p className="text-[#282B4A] mt-1">Upload your document - we'll figure out how to process it automatically.</p>
              )}
            </div>
            <UploadBox onTaskStarted={handleTaskStarted} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="border-b border-[#282B4A]/20 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#282B4A] uppercase tracking-wider">
                <span>Tab 03</span>
                <ChevronRight size={12} />
                <span>{isSimple ? 'Progress' : 'State Machine Execution'}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-[#282B4A]">
                {isSimple ? 'What\'s Happening' : 'Active AI Jobs'}
              </h1>
            </div>
            {isSimple
              ? <ActiveJobsSimple traceLog={traceLog} status={jobStatus} jobId={currentJobId} />
              : <TracePanel
                  jobId={currentJobId}
                  traceLog={traceLog}
                  status={jobStatus}
                  onNavigateToArtifact={() => setActiveTab(4)}
                  onNavigateToAudit={() => setActiveTab(6)}
                  onRefresh={() => currentJobId && pollTrace(currentJobId)}
                />
            }
          </div>
        );
      case 3:
        return isSimple ? <EvidenceRagSimple /> : <EvidenceRagView />;
      case 4:
        return isSimple
          ? <ArtifactGeneratorSimple initialJobId={currentJobId} />
          : <ArtifactGeneratorView initialJobId={currentJobId} />;
      case 5:
        return isSimple ? <HumanApprovalSimple /> : <HumanApproval />;
      case 6:
        return isSimple ? <SecurityAuditSimple /> : <SecurityAuditView />;
      case 7:
        return isSimple ? <HardwareConfigSimple /> : <HardwareConfigView />;
      default:
        return isSimple
          ? <DashboardSimple onNavigateTab={(tab) => setActiveTab(tab)} />
          : <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#EEEBDA] text-[#282B4A] select-none">
      
      {/* FOREGROUND LAYOUT */}
      <div className="relative z-10 flex w-full h-full bg-transparent">
        
        {/* COLLAPSIBLE / DOCKED FROSTED SIDEBAR */}
        <aside 
          className="shrink-0 h-full border-r border-[#282B4A]/20 bg-[#282B4A] backdrop-blur-2xl flex flex-col justify-between shadow-[15px_0_35px_rgba(0,0,0,0.05)] relative"
          style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
        >
          {/* Resize Handle */}
          <div 
            className="w-1.5 cursor-col-resize bg-transparent hover:bg-[#282B4A] transition-colors z-50 absolute right-0 top-0 bottom-0"
            onMouseDown={handleMouseDown}
          />
          {/* Logo & Header */}
          <div className="p-8 pb-4">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-stardom text-2xl tracking-widest text-[#EEEBDA]">कVACH</span>
              </div>
              <div className="text-[10px] text-[#EEEBDA] font-mono tracking-wider mt-1">SOVEREIGN AIR-GAP OS</div>
            </div>
          </div>

          {/* Interactive Line Sidebar for 8 Operational Panels */}
          <div className="px-6 flex-1 flex flex-col justify-center overflow-y-auto">
            <Sidebar 
              defaultActive={activeTab} 
              onItemClick={(index) => setActiveTab(index)} 
              textColor="#4b5563"
              accentColor="#743014"
            />
          </div>

          {/* Sidebar Status Footer */}
          <div className="p-6 border-t border-[#282B4A]/20 bg-gray-50/50">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-[#282B4A]/20 animate-pulse' : 'bg-[#282B4A]/15'}`}></span>
                <span className="text-[#EEEBDA]/70">{apiOnline ? 'Gateway Live' : 'Connecting...'}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#282B4A]/20 border border-[#282B4A] text-[#EEEBDA] font-medium">
                Air-Gapped
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col">
          {/* Top Operational Bar */}
          <header className="h-16 px-10 border-b border-[#282B4A]/20 bg-[#EEEBDA]/50 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4 text-xs font-mono text-[#282B4A]">
              <span className="text-[#282B4A] font-semibold font-stardom text-xl">Petroleum Infrastructure Cluster</span>
              <span className="text-[#282B4A]">|</span>
              <span className="font-stardom text-base">MRPL Refinery Node</span>
              {currentJobId && (
                <>
                  <span className="text-[#282B4A]">|</span>
                  <span className="text-[#282B4A] flex items-center space-x-1">
                    <Activity size={12} className="animate-pulse" />
                    <span>Job Active: {currentJobId}</span>
                  </span>
                </>
              )}
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ VIEW MODE TOGGLE Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 space-x-1">
              <button
                onClick={() => handleSetViewMode('simple')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  viewMode === 'simple'
                    ? 'bg-[#282B4A] text-white shadow-sm'
                    : 'text-[#282B4A] hover:text-[#282B4A]'
                }`}
              >
                <Eye size={13} />
                <span>Simple View</span>
              </button>
              <button
                onClick={() => handleSetViewMode('technical')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  viewMode === 'technical'
                    ? 'bg-[#282B4A] text-white shadow-sm'
                    : 'text-[#282B4A] hover:text-[#282B4A]'
                }`}
              >
                <Layers size={13} />
                <span>Technical View</span>
              </button>
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


