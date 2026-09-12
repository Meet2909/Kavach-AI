import { useState, useEffect } from 'react';
import {
  ShieldCheck, Server, Cpu, Database, ArrowRight, Activity,
  CheckCircle2, AlertCircle, RefreshCw, Layers, Lock, FileCode, Clock
} from 'lucide-react';
import api from '../api/client.js';

export default function DashboardView({ onNavigateTab }) {
  const [health, setHealth] = useState(null);
  const [sovereignty, setSovereignty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [hRes, sRes] = await Promise.allSettled([
        api.checkHealth(),
        api.getSovereigntyStatus()
      ]);

      if (hRes.status === 'fulfilled') setHealth(hRes.value);
      if (sRes.status === 'fulfilled') setSovereignty(sRes.value);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Banner */}
      <div className="relative flex flex-col items-center justify-center pb-10 mb-4 pt-6">
        <div className="w-full flex justify-end md:absolute md:right-0 md:top-6 mb-6 md:mb-0 z-10">
          <button
            onClick={fetchStatus}
            className="px-4 py-2 rounded-xl border border-[#282B4A]/20 border-2 bg-[#EEEBDA] hover:bg-gray-100 text-xs font-mono text-[#282B4A] flex items-center space-x-2 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="font-stardom">Sync Telemetry</span>
            {lastRefreshed && <span className="text-[#282B4A]">({lastRefreshed})</span>}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-medium font-mono border border-[#282B4A]/20 border-2">
              KAVACH-AI OS v1.0
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-medium font-mono border border-[#282B4A]/20 border-2 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#282B4A]/10 animate-ping"></span>
              <span>Air-Gapped Sovereign Node</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-stardom text-5xl md:text-6xl lg:text-7xl leading-none tracking-widest text-[#282B4A]">कVACH</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: API Gateway */}
        <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-[#282B4A] tracking-wider">FastAPI Gateway</span>
            <Server size={18} className="text-[#282B4A]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health ? 'bg-[#282B4A]/10 animate-pulse' : 'bg-[#282B4A]/10'}`}></div>
              <div className="text-xl font-bold font-mono text-[#282B4A]">
                {health ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="text-xs font-mono text-[#282B4A] mt-1">
              Port 8000 Ã‚Â· CORS Enabled
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 text-sm text-[#282B4A] leading-relaxed font-cabinet">
            {health?.version ? `Version: ${health.version}` : 'Waiting for connection'}
          </div>
        </div>

        {/* Card 2: Air-Gap Proof */}
        <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-[#282B4A] tracking-wider">Air-Gap Status</span>
            <Lock size={18} className="text-[#282B4A]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck size={20} className="text-[#282B4A]" />
              <div className="text-xl font-bold font-mono text-[#282B4A]">
                {sovereignty?.is_air_gapped ? 'Zero External' : 'Verifying'}
              </div>
            </div>
            <div className="text-xs font-mono text-[#282B4A] mt-1">
              External Connections: <strong className="text-[#282B4A]">{sovereignty?.external_count ?? 0}</strong>
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 text-sm text-[#282B4A] leading-relaxed font-cabinet">
            {sovereignty?.verdict || 'OS kernel network monitored'}
          </div>
        </div>

        {/* Card 3: Distributed Hardware */}
        <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-[#282B4A] tracking-wider">Compute Nodes</span>
            <Cpu size={18} className="text-[#282B4A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#282B4A]">2 Laptops</div>
            <div className="text-xs font-mono text-[#282B4A] mt-1">
              Dual 6GB RTX 4050 GPUs
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 text-sm text-[#282B4A] leading-relaxed font-cabinet">
            Laptop 1: Llama 8B Ã‚Â· Laptop 2: Qwen VL/Coder
          </div>
        </div>

        {/* Card 4: Docker Sandbox */}
        <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-[#282B4A] tracking-wider">Isolation Sandbox</span>
            <FileCode size={18} className="text-[#282B4A]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#282B4A]">
              {health?.sandbox?.ready ? 'Docker Active' : 'Ready'}
            </div>
            <div className="text-xs font-mono text-[#282B4A] mt-1">
              --network none Ã‚Â· 256MB cap
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 text-sm text-[#282B4A] leading-relaxed font-cabinet">
            Hard 15s subprocess timeout
          </div>
        </div>
      </div>

      {/* Operational Modules / Quick Launch Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#282B4A]">
          Operational Control Suites
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Action 1: Document Intake */}
          <div
            onClick={() => onNavigateTab(1)}
            className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 hover:border-[#282B4A]/20 border-2 hover:bg-[#282B4A]/10 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#282B4A]/10 text-[#282B4A] border border-[#282B4A]/20 border-2 group-hover:scale-110 transition">
                <Layers size={22} />
              </div>
              <ArrowRight size={18} className="text-[#282B4A] group-hover:text-[#282B4A] group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-[#282B4A] group-hover:text-[#282B4A]">
              Document Intake & Dispatch
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-[#282B4A] font-cabinet mt-2 leading-relaxed">
              Upload P&ID blueprints, maintenance logs, or engineering manuals. Triggers rule-based routing to specialist models.
            </p>
          </div>

          {/* Quick Action 2: Judge Sovereignty Proof */}
          <div
            onClick={() => onNavigateTab(6)}
            className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 hover:border-[#282B4A]/20 border-2 hover:bg-[#282B4A]/10 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#282B4A]/10 text-[#282B4A] border border-[#282B4A]/20 border-2 group-hover:scale-110 transition">
                <ShieldCheck size={22} />
              </div>
              <ArrowRight size={18} className="text-[#282B4A] group-hover:text-[#282B4A] group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-[#282B4A] group-hover:text-[#282B4A]">
              Live Air-Gap Proof (Judges)
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-[#282B4A] font-cabinet mt-2 leading-relaxed">
              Execute OS-level baseline snapshot diff: prove bytes_sent_delta Ã¢â€°Ë† 0 during multimodal task inference.
            </p>
          </div>

          {/* Quick Action 3: Human Approval & Tool Gate */}
          <div
            onClick={() => onNavigateTab(5)}
            className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 hover:border-[#282B4A]/20 border-2 hover:bg-[#282B4A]/10 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#282B4A]/10 text-[#282B4A] border border-[#282B4A]/20 border-2 group-hover:scale-110 transition">
                <Lock size={22} />
              </div>
              <ArrowRight size={18} className="text-[#282B4A] group-hover:text-[#282B4A] group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-[#282B4A] group-hover:text-[#282B4A]">
              Least Privilege Gate & Sandbox
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-[#282B4A] font-cabinet mt-2 leading-relaxed">
              Audit the static ALLOW/DENY/HUMAN_APPROVAL tool matrix and test python execution in Docker isolation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 



