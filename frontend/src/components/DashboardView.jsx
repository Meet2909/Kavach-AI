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
      <div className="relative flex flex-col items-center justify-center border-b border-white/10 pb-10 mb-4 pt-6">
        <div className="w-full flex justify-end md:absolute md:right-0 md:top-6 mb-6 md:mb-0 z-10">
          <button
            onClick={fetchStatus}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 flex items-center space-x-2 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="font-stardom">Sync Telemetry</span>
            {lastRefreshed && <span className="text-gray-500">({lastRefreshed})</span>}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
              KAVACH-AI OS v1.0
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Air-Gapped Sovereign Node</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-stardom text-6xl md:text-8xl lg:text-[7rem] leading-none tracking-widest text-white">कAVACH</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: API Gateway */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">FastAPI Gateway</span>
            <Server size={18} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <div className="text-xl font-bold font-mono text-white">
                {health ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="text-xs font-mono text-gray-400 mt-1">
              Port 8000 · CORS Enabled
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed font-cabinet">
            {health?.version ? `Version: ${health.version}` : 'Waiting for connection'}
          </div>
        </div>

        {/* Card 2: Air-Gap Proof */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Air-Gap Status</span>
            <Lock size={18} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              <div className="text-xl font-bold font-mono text-emerald-300">
                {sovereignty?.is_air_gapped ? 'Zero External' : 'Verifying'}
              </div>
            </div>
            <div className="text-xs font-mono text-gray-400 mt-1">
              External Connections: <strong className="text-white">{sovereignty?.external_count ?? 0}</strong>
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed font-cabinet">
            {sovereignty?.verdict || 'OS kernel network monitored'}
          </div>
        </div>

        {/* Card 3: Distributed Hardware */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Compute Nodes</span>
            <Cpu size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">2 Laptops</div>
            <div className="text-xs font-mono text-purple-300 mt-1">
              Dual 6GB RTX 4050 GPUs
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed font-cabinet">
            Laptop 1: Llama 8B · Laptop 2: Qwen VL/Coder
          </div>
        </div>

        {/* Card 4: Docker Sandbox */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Isolation Sandbox</span>
            <FileCode size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              {health?.sandbox?.ready ? 'Docker Active' : 'Ready'}
            </div>
            <div className="text-xs font-mono text-gray-400 mt-1">
              --network none · 256MB cap
            </div>
          </div>
          {/* UPDATED: Changed font-mono to font-cabinet */}
          <div className="mt-4 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed font-cabinet">
            Hard 15s subprocess timeout
          </div>
        </div>
      </div>

      {/* Operational Modules / Quick Launch Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-gray-400">
          Operational Control Suites
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Action 1: Document Intake */}
          <div
            onClick={() => onNavigateTab(1)}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-110 transition">
                <Layers size={22} />
              </div>
              <ArrowRight size={18} className="text-gray-500 group-hover:text-purple-300 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-white group-hover:text-purple-200">
              Document Intake & Dispatch
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-gray-400 font-cabinet mt-2 leading-relaxed">
              Upload P&ID blueprints, maintenance logs, or engineering manuals. Triggers rule-based routing to specialist models.
            </p>
          </div>

          {/* Quick Action 2: Judge Sovereignty Proof */}
          <div
            onClick={() => onNavigateTab(6)}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition">
                <ShieldCheck size={22} />
              </div>
              <ArrowRight size={18} className="text-gray-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-white group-hover:text-emerald-200">
              Live Air-Gap Proof (Judges)
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-gray-400 font-cabinet mt-2 leading-relaxed">
              Execute OS-level baseline snapshot diff: prove bytes_sent_delta ≈ 0 during multimodal task inference.
            </p>
          </div>

          {/* Quick Action 3: Human Approval & Tool Gate */}
          <div
            onClick={() => onNavigateTab(5)}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-950/20 backdrop-blur-md cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:scale-110 transition">
                <Lock size={22} />
              </div>
              <ArrowRight size={18} className="text-gray-500 group-hover:text-blue-300 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-base font-bold font-mono text-white group-hover:text-blue-200">
              Least Privilege Gate & Sandbox
            </div>
            {/* UPDATED: Changed font-mono to font-cabinet */}
            <p className="text-sm text-gray-400 font-cabinet mt-2 leading-relaxed">
              Audit the static ALLOW/DENY/HUMAN_APPROVAL tool matrix and test python execution in Docker isolation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
