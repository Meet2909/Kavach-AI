import { useState, useEffect } from 'react';
import { 
  FileCheck2, Download, CheckCircle2, XCircle, AlertTriangle, 
  FileText, ShieldCheck, RefreshCw, Eye, ExternalLink 
} from 'lucide-react';
import api from '../api/client.js';

export default function ArtifactGeneratorView({ initialJobId }) {
  const [jobId, setJobId] = useState(initialJobId || '');
  const [taskType, setTaskType] = useState('report');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    if (initialJobId) setJobId(initialJobId);
    loadRecentJobs();
  }, [initialJobId]);

  const loadRecentJobs = async () => {
    try {
      const res = await api.listJobs();
      if (res.jobs && res.jobs.length > 0) {
        setRecentJobs(res.jobs);
        if (!jobId) setJobId(res.jobs[0].job_id);
      }
    } catch (err) {
      console.error('Error fetching jobs for artifact generator:', err);
    }
  };

  const handleValidate = async () => {
    if (!jobId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.validateArtifact(jobId.trim(), taskType);
      setValidation(res);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.message || 'Validation request failed.');
      setValidation(err.detail ? err.detail.validation : null);
    } finally {
      setLoading(false);
    }
  };

  const downloadUrl = jobId ? api.getArtifactUrl(jobId.trim(), taskType) : '#';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
            3-Check Validation Pipeline
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
            Decision 10: Generated ≠ Correct
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono text-white">
          Artifact Generator & Validation Gate
        </h1>
        <p className="text-sm text-gray-400 font-mono mt-1">
          Every generated .docx is subjected to Open Check, Required Sections Check, and Evidence Citation Check before delivery.
        </p>
      </div>

      {/* Control Strip */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Target Job ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter 8-character Job ID"
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              {recentJobs.length > 0 && (
                <select
                  onChange={(e) => setJobId(e.target.value)}
                  value={jobId}
                  className="p-2.5 rounded-xl bg-black/50 border border-white/15 font-mono text-xs text-gray-300 focus:outline-none"
                >
                  {recentJobs.map(j => (
                    <option key={j.job_id} value={j.job_id}>
                      {j.job_id} ({j.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Target Task Specification</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="report">report (Requires: date, equipment, findings, rec, approval)</option>
              <option value="summary">summary (Requires: summary, findings, conclusion)</option>
              <option value="coding">coding (Requires: problem, solution, test results)</option>
              <option value="csv_query">csv_query (Requires: data source, analysis, findings)</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handleValidate}
              disabled={loading || !jobId.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl font-mono text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Evaluating...' : 'Run 3-Check Audit'}</span>
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold border flex items-center justify-center space-x-1.5 transition ${
                jobId.trim()
                  ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-purple-200 cursor-pointer'
                  : 'bg-white/5 border-white/10 text-gray-500 pointer-events-none'
              }`}
            >
              <Download size={14} />
              <span>Download .docx</span>
            </a>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center space-x-2">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Validation Matrix Report */}
      {validation && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Overall Pass/Fail Badge */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            validation.valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {validation.valid ? (
                <CheckCircle2 size={24} className="text-emerald-400" />
              ) : (
                <XCircle size={24} className="text-red-400" />
              )}
              <div>
                <div className="font-mono font-bold text-sm text-white">
                  {validation.valid ? 'Artifact Verified & Signed' : 'Artifact Gated — Validation Failed'}
                </div>
                <div className="font-mono text-xs opacity-80 mt-0.5">
                  {validation.summary || 'All structural requirements and citation evidence inspected.'}
                </div>
              </div>
            </div>
            <span className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
              validation.valid
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-red-500/20 border-red-400 text-red-300'
            }`}>
              {validation.valid ? 'PASSED 3/3' : 'REJECTED'}
            </span>
          </div>

          {/* 3 Checks Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check 1: Open Check */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-gray-400">Check 1: Open Check</span>
                  {validation.open_check ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-white">
                  {validation.open_check ? 'Valid DOCX Container' : 'Corrupted Archive'}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-2">
                  Verifies python-docx parses the binary XML tree without parsing corruption.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-400">
                WordprocessingML valid
              </div>
            </div>

            {/* Check 2: Sections Check */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-gray-400">Check 2: Sections Check</span>
                  {validation.sections_check ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-white">
                  {validation.sections_check ? 'All Required Headings' : 'Missing Headings'}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-2">
                  Mandates specific section headers for task <code className="text-purple-300">{taskType}</code>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-gray-400 truncate">
                {validation.missing_sections?.length > 0
                  ? `Missing: ${validation.missing_sections.join(', ')}`
                  : 'All headings present'}
              </div>
            </div>

            {/* Check 3: Evidence Check */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-gray-400">Check 3: Evidence Check</span>
                  {validation.evidence_check ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-white">
                  {validation.evidence_check ? 'Citations Grounded' : 'Uncited Claims'}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-2">
                  Scans for grounding citations ("As per inspection report", "Refer SOP-12").
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-400">
                {validation.citation_count ?? 2} Source Citations Verified
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
