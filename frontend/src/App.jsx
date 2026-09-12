import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';

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
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isDraggingRef = useRef(false);

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

  // Render the selected tab content
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#743014] uppercase tracking-wider">
                <span>Tab 02</span>
                <ChevronRight size={12} />
                <span>Multimodal Intake</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-[#442D1C]">Document Intake</h1>
            </div>
            <UploadBox onTaskStarted={handleTaskStarted} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#743014] uppercase tracking-wider">
                <span>Tab 03</span>
                <ChevronRight size={12} />
                <span>State Machine Execution</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mt-1 font-mono text-[#442D1C]">Active AI Jobs</h1>
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#F9F7F3] text-[#442D1C] select-none">
      
      {/* FOREGROUND LAYOUT */}
      <div className="relative z-10 flex w-full h-full bg-transparent">
        
        {/* COLLAPSIBLE / DOCKED FROSTED SIDEBAR */}
        <aside 
          className="shrink-0 h-full border-r border-gray-200 bg-[#E8D1A7] backdrop-blur-2xl flex flex-col justify-between shadow-[15px_0_35px_rgba(0,0,0,0.05)] relative"
          style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
        >
          {/* Resize Handle */}
          <div 
            className="w-1.5 cursor-col-resize bg-transparent hover:bg-[#743014] transition-colors z-50 absolute right-0 top-0 bottom-0"
            onMouseDown={handleMouseDown}
          />
          {/* Logo & Header */}
          <div className="p-8 pb-4">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-stardom text-2xl tracking-widest text-[#442D1C]">कAVACH</span>
              </div>
              <div className="text-[10px] text-[#743014] font-mono tracking-wider mt-1">SOVEREIGN AIR-GAP OS</div>
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
          <div className="p-6 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-[#9D9167]/20 animate-pulse' : 'bg-[#743014]/15'}`}></span>
                <span className="text-gray-600">{apiOnline ? 'Gateway Live' : 'Connecting...'}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#9D9167]/20 border border-[#9D9167] text-[#442D1C] font-medium">
                Air-Gapped
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col">
          {/* Top Operational Bar */}
          <header className="h-16 px-10 border-b border-gray-200 bg-white/50 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4 text-xs font-mono text-gray-600">
              <span className="text-[#442D1C] font-semibold font-stardom text-xl">Petroleum Infrastructure Cluster</span>
              <span className="text-gray-300">|</span>
              <span className="font-stardom text-base">MRPL Refinery Node</span>
              {currentJobId && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-[#743014] flex items-center space-x-1">
                    <Activity size={12} className="animate-pulse" />
                    <span>Job Active: {currentJobId}</span>
                  </span>
                </>
              )}
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

