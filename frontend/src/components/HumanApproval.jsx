import { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Play, 
  Terminal, Lock, Code2, RefreshCw, Check, Edit3, Ban 
} from 'lucide-react';
import api from '../api/client.js';

const SAMPLE_CODE = `# Offline Sandbox Python Execution Test
# Demonstrates strict air-gapped calculation (Docker --network none)
import math

pipe_diameter = 0.254 # meters (10-inch nominal)
wall_thickness = 0.00927 # meters (Schedule 40)
pressure = 15.2e6 # 15.2 MPa internal design pressure

# Lamé equation for thick-walled cylinder hoop stress
r_i = (pipe_diameter / 2) - wall_thickness
r_o = pipe_diameter / 2
hoop_stress = pressure * (r_o**2 + r_i**2) / (r_o**2 - r_i**2)

print(f"Internal Radius: {r_i*1000:.1f} mm")
print(f"External Radius: {r_o*1000:.1f} mm")
print(f"Calculated Maximum Hoop Stress: {hoop_stress / 1e6:.2f} MPa")
print("Status: ASTM A106 Grade B Yield Strength (240 MPa) Check: PASS")
`;

export default function HumanApproval() {
  const [taskType, setTaskType] = useState('summary');
  const [toolsPolicy, setToolsPolicy] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  
  // Pending action simulation state
  const [approvalState, setApprovalState] = useState({
    pending: true,
    toolName: 'write_docx',
    actionDesc: 'Write approval_note.docx to disk for final plant engineer sign-off',
    verdict: null
  });

  // Sandbox Code Runner state
  const [code, setCode] = useState(SAMPLE_CODE);
  const [executing, setExecuting] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState(null);

  useEffect(() => {
    fetchPolicy(taskType);
  }, [taskType]);

  const fetchPolicy = async (type) => {
    setLoadingPolicy(true);
    try {
      const res = await api.listAllowedTools(type);
      setToolsPolicy(res);
    } catch (err) {
      console.error('Error loading tool policy:', err);
    } finally {
      setLoadingPolicy(false);
    }
  };

  const handleRunSandbox = async () => {
    setExecuting(true);
    setSandboxOutput(null);
    try {
      const res = await api.runCode(code);
      setSandboxOutput(res);
    } catch (err) {
      setSandboxOutput({
        success: false,
        stdout: '',
        stderr: err.message || 'Execution error in sandbox container.',
        exit_code: -1
      });
    } finally {
      setExecuting(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'ALLOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/20 text-green-300 border border-green-500/40">ALLOW</span>;
      case 'HUMAN_APPROVAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">HUMAN APPROVAL</span>;
      case 'DENY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">DENY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/40">{verdict}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            Principle of Least Privilege
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
            Decision 9 & 8: Human Approval Gate & Sandbox
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono text-white">
          Human Approval & Tool Permission Gate
        </h1>
        <p className="text-sm text-gray-400 font-mono mt-1">
          Guarantees that high-risk write or execute operations cannot occur without human authorization.
        </p>
      </div>

      {/* Human-in-the-Loop Intercept Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border border-amber-500/30 backdrop-blur-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-amber-300 font-mono font-bold text-sm">
            <AlertTriangle size={18} className="animate-pulse" />
            <span>Privileged Action Intercepted by Safety Gate</span>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
            Requires Human Sign-off
          </span>
        </div>

        <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-gray-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Requested Tool:</span>
            <code className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{approvalState.toolName}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Operation Scope:</span>
            <span className="text-gray-200">{approvalState.actionDesc}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Safety Verdict:</span>
            <span className="text-green-400 font-semibold">{approvalState.verdict ? `Verdict: ${approvalState.verdict}` : 'Waiting on Engineer Decision'}</span>
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={() => setApprovalState(s => ({ ...s, verdict: 'REJECTED' }))}
            className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-200 font-mono text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Ban size={14} />
            <span>Reject Call</span>
          </button>
          <button
            onClick={() => setApprovalState(s => ({ ...s, verdict: 'MODIFIED' }))}
            className="px-4 py-2 rounded-xl border border-yellow-500/40 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-200 font-mono text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Edit3 size={14} />
            <span>Modify Constraints</span>
          </button>
          <button
            onClick={() => setApprovalState(s => ({ ...s, verdict: 'APPROVED' }))}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-mono text-xs font-bold transition shadow-lg flex items-center space-x-1.5"
          >
            <Check size={14} />
            <span>Authorize Tool Execution</span>
          </button>
        </div>
      </div>

      {/* Tool Permission Gate Policy Explorer */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm font-mono font-bold text-white">
            <Lock size={16} className="text-purple-400" />
            <span>Static Policy Table (POLICY_TABLE)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-400">Select Task:</span>
            {['summary', 'coding', 'vision', 'csv_query', 'report'].map(t => (
              <button
                key={t}
                onClick={() => setTaskType(t)}
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition ${
                  taskType === t
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-bold'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Grid */}
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/50">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400">
              <tr>
                <th className="p-3">Available Tool</th>
                <th className="p-3">Permission Verdict</th>
                <th className="p-3">Differentiator Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {toolsPolicy?.tools && Object.entries(toolsPolicy.tools).map(([tool, verdict]) => (
                <tr key={tool} className="hover:bg-white/[0.02] transition">
                  <td className="p-3 font-bold text-purple-300">
                    <code>{tool}</code>
                  </td>
                  <td className="p-3">
                    {getVerdictBadge(verdict)}
                  </td>
                  <td className="p-3 text-xs text-gray-400">
                    {verdict === 'ALLOW' 
                      ? 'Read-only operation permitted for current context'
                      : verdict === 'HUMAN_APPROVAL'
                      ? 'High-risk write/execute — human intervention mandated'
                      : 'Irrelevant to task scope — blocked by least-privilege policy'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docker Offline Sandbox Interactive Runner */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-mono font-bold text-white">
            <Code2 size={16} className="text-cyan-400" />
            <span>Offline Docker Sandbox (--network none · 256M Memory)</span>
          </div>
          <button
            onClick={handleRunSandbox}
            disabled={executing}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play size={13} className={executing ? 'animate-spin' : ''} />
            <span>{executing ? 'Running Container...' : 'Execute in Sandbox'}</span>
          </button>
        </div>

        <textarea
          rows={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-4 rounded-xl bg-black/60 border border-white/15 font-mono text-xs text-green-300 focus:outline-none focus:border-cyan-400 leading-relaxed"
        />

        {sandboxOutput && (
          <div className="rounded-xl border border-white/15 bg-black/80 overflow-hidden font-mono text-xs">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-gray-400">
              <span>Sandbox Console Output</span>
              <span className={`font-bold ${sandboxOutput.success ? 'text-green-400' : 'text-red-400'}`}>
                Exit Code: {sandboxOutput.exit_code}
              </span>
            </div>
            <pre className="p-4 text-gray-200 overflow-x-auto whitespace-pre-wrap">
              {sandboxOutput.stdout || sandboxOutput.stderr || 'No console output returned.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
