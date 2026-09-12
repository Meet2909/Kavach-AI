import { useState } from 'react';
import { 
  Cpu, Server, Zap, CheckCircle2, ArrowRight, ShieldCheck, 
  RefreshCw, Layers, Gauge, Database, Compass 
} from 'lucide-react';
import api from '../api/client.js';

export default function HardwareConfigView() {
  const [testTask, setTestTask] = useState('vision');
  const [testExt, setTestExt] = useState('png');
  const [routeResult, setRouteResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const handleTestRoute = async () => {
    setSimulating(true);
    try {
      const res = await api.testRoute(testTask, testExt);
      setRouteResult(res);
    } catch (err) {
      console.error('Route test error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-[#E8D1A7] pb-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#743014]/15 text-[#743014] font-mono border border-[#743014]">
            Decisions 2 & 3: Hardware Distribution & Rule-Based Router
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84592B]/15 text-[#84592B] font-mono border border-[#84592B]">
            Dual RTX 4050 (6GB) Topology
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono text-black">
          Hardware Topology & Model Routing
        </h1>
        <p className="text-sm text-gray-700 font-mono mt-1">
          Distributes multimodal reasoning across two 6GB RTX 4050 machines to prevent out-of-memory (OOM) crashes.
        </p>
      </div>

      {/* Cluster Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node 1: Laptop 1 */}
        <div className="p-6 rounded-2xl bg-white border border-[#E8D1A7] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#743014]/15 text-[#743014] border border-[#743014]">
                <Server size={20} />
              </div>
              <div>
                <h3 className="font-mono font-bold text-base text-black">Laptop 1 (Reasoning Host)</h3>
                <p className="font-mono text-xs text-[#84592B]">Endpoint: http://127.0.0.1:11434</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#9D9167]/20 text-[#9D9167] border border-[#9D9167]">
              Active Host
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Assigned Model:</span>
              <span className="font-bold text-[#743014]">llama3.1:8b (4-bit GGUF)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Assigned Capabilities:</span>
              <span className="text-[#743014] font-bold">Text summaries, inspection notes, approval reports</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Hardware Profile:</span>
              <span className="text-[#743014] font-bold">NVIDIA RTX 4050 (~6GB VRAM)</span>
            </div>
          </div>
        </div>

        {/* Node 2: Laptop 2 */}
        <div className="p-6 rounded-2xl bg-white border border-[#E8D1A7] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#84592B]/15 text-[#84592B] border border-[#84592B]">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="font-mono font-bold text-base text-black">Laptop 2 (Vision & Coder Engine)</h3>
                <p className="font-mono text-xs text-[#84592B]">Endpoint: http://10.12.142.163:11434</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#84592B]/15 text-[#84592B] border border-[#84592B]">
              Specialist Node
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Hot-Swap Models:</span>
              <span className="font-bold text-[#84592B]">qwen2.5-vl:7b ⇄ qwen2.5-coder:7b</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Peak VRAM Observed:</span>
              <span className="text-[#9D9167] font-bold">4.5 GB / 6.0 GB (1.5 GB Headroom)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-600">Hot-Swap Latency:</span>
              <span className="text-[#743014] font-bold">1s VRAM flush via keep_alive: 0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Deterministic Router Tester */}
      <div className="p-6 rounded-2xl bg-white border border-[#E8D1A7] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-mono font-bold text-black">
            <Compass size={18} className="text-[#743014]" />
            <span>Rule-Based Explainable Router Simulator (/route)</span>
          </div>
          <span className="text-xs font-mono text-gray-600">
            Zero Machine Learning Classifier Overhead
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">Simulated Task Type</label>
            <select
              value={testTask}
              onChange={(e) => setTestTask(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 font-mono text-xs text-black focus:outline-none focus:border-[#743014]"
            >
              <option value="vision">vision (P&ID Blueprint / Diagram)</option>
              <option value="coding">coding (Engineering Python Calculation)</option>
              <option value="csv_query">csv_query (Maintenance Log Query)</option>
              <option value="report">report (Formal Approval Note)</option>
              <option value="summary">summary (PDF Manual Extraction)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">File Extension</label>
            <input
              type="text"
              value={testExt}
              onChange={(e) => setTestExt(e.target.value)}
              placeholder="e.g. png, pdf, csv, jpg"
              className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 font-mono text-xs text-black focus:outline-none focus:border-[#743014]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestRoute}
              disabled={simulating}
              className="w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Zap size={14} className={simulating ? 'animate-spin' : ''} />
              <span>{simulating ? 'Evaluating...' : 'Simulate Router Decision'}</span>
            </button>
          </div>
        </div>

        {/* Router Output Card */}
        {routeResult && (
          <div className="p-4 rounded-xl bg-white border border-[#E8D1A7] shadow-sm space-y-3 font-mono text-xs animate-fade-in-up">
            <div className="flex items-center justify-between text-[#743014] font-bold">
              <span>Deterministic Dispatch Routing Decision</span>
              <span className="px-2 py-0.5 rounded bg-[#743014]/15 border border-[#743014]">
                Confidence: {(routeResult.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-gray-700 pt-1">
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="text-gray-500 text-[10px]">SELECTED SPECIALIST</div>
                <div className="font-bold text-[#743014] text-sm mt-0.5">{routeResult.model_id}</div>
              </div>
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="text-gray-500 text-[10px]">DESIGNATED HOST</div>
                <div className="font-bold text-[#84592B] text-sm mt-0.5">{routeResult.host}</div>
              </div>
              <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="text-gray-500 text-[10px]">REJECTED MODELS</div>
                <div className="text-gray-600 text-xs mt-0.5">{routeResult.rejected_models?.join(', ') || 'None'}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#743014]/15 border border-[#743014] text-[#743014]">
              <strong className="text-black">Explanation:</strong> {routeResult.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


