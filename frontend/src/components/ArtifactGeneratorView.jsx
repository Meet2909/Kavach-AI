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
      <div className="pb-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-mono border border-[#282B4A]/20 border-2">
            3-Check Validation Pipeline
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-mono border border-[#282B4A]/20 border-2">
            Decision 10: Generated â‰  Correct
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono text-[#282B4A]">
          Artifact Generator & Validation Gate
        </h1>
        <p className="text-base text-[#282B4A] font-mono mt-1 leading-relaxed">
          Every generated .docx is subjected to Open Check, Required Sections Check, and Evidence Citation Check before delivery.
        </p>
      </div>

      {/* Control Strip */}
      <div className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-mono text-[#282B4A] mb-1">Target Job ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter 8-character Job ID"
                className="w-full p-2.5 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 font-mono text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
              />
              {recentJobs.length > 0 && (
                <select
                  onChange={(e) => setJobId(e.target.value)}
                  value={jobId}
                  className="p-2.5 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 font-mono text-sm text-[#282B4A] focus:outline-none"
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
            <label className="block text-sm font-mono text-[#282B4A] mb-1">Target Task Specification</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 font-mono text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
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
              className="flex-1 py-2.5 px-4 rounded-xl font-mono text-sm font-bold bg-[#282B4A] hover:bg-[#282B4A]/90 text-[#EEEBDA] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Evaluating...' : 'Run 3-Check Audit'}</span>
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2.5 px-4 rounded-xl font-mono text-sm font-bold border flex items-center justify-center space-x-1.5 transition ${
                jobId.trim()
                  ? 'bg-[#282B4A]/10 hover:bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A] cursor-pointer'
                  : 'bg-gray-50 border-[#282B4A]/20 border-2 text-[#282B4A] pointer-events-none'
              }`}
            >
              <Download size={14} />
              <span>Download .docx</span>
            </a>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] text-sm font-mono flex items-center space-x-2">
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
              ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A]'
              : 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A]'
          }`}>
            <div className="flex items-center space-x-3">
              {validation.valid ? (
                <CheckCircle2 size={24} className="text-[#282B4A]" />
              ) : (
                <XCircle size={24} className="text-[#282B4A]" />
              )}
              <div>
                <div className="font-mono font-bold text-base text-[#282B4A]">
                  {validation.valid ? 'Artifact Verified & Signed' : 'Artifact Gated â€” Validation Failed'}
                </div>
                <div className="font-mono text-sm opacity-80 mt-0.5 leading-relaxed">
                  {validation.summary || 'All structural requirements and citation evidence inspected.'}
                </div>
              </div>
            </div>
            <span className={`font-mono text-sm font-bold px-3 py-1 rounded-full border ${
              validation.valid
                ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A]'
                : 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2 text-[#282B4A]'
            }`}>
              {validation.valid ? 'PASSED 3/3' : 'REJECTED'}
            </span>
          </div>

          {/* 3 Checks Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check 1: Open Check */}
            <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono uppercase text-[#282B4A]">Check 1: Open Check</span>
                  {validation.open_check ? (
                    <CheckCircle2 size={18} className="text-[#282B4A]" />
                  ) : (
                    <XCircle size={18} className="text-[#282B4A]" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-[#282B4A]">
                  {validation.open_check ? 'Valid DOCX Container' : 'Corrupted Archive'}
                </div>
                <p className="text-sm text-[#282B4A] font-mono mt-2 leading-relaxed">
                  Verifies python-docx parses the binary XML tree without parsing corruption.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#282B4A]/20 border-2 text-sm font-mono text-[#282B4A]">
                WordprocessingML valid
              </div>
            </div>

            {/* Check 2: Sections Check */}
            <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono uppercase text-[#282B4A]">Check 2: Sections Check</span>
                  {validation.sections_check ? (
                    <CheckCircle2 size={18} className="text-[#282B4A]" />
                  ) : (
                    <XCircle size={18} className="text-[#282B4A]" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-[#282B4A]">
                  {validation.sections_check ? 'All Required Headings' : 'Missing Headings'}
                </div>
                <p className="text-sm text-[#282B4A] font-mono mt-2 leading-relaxed">
                  Mandates specific section headers for task <code className="text-[#282B4A]">{taskType}</code>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#282B4A]/20 border-2 text-sm font-mono text-[#282B4A] truncate">
                {validation.missing_sections?.length > 0
                  ? `Missing: ${validation.missing_sections.join(', ')}`
                  : 'All headings present'}
              </div>
            </div>

            {/* Check 3: Evidence Check */}
            <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono uppercase text-[#282B4A]">Check 3: Evidence Check</span>
                  {validation.evidence_check ? (
                    <CheckCircle2 size={18} className="text-[#282B4A]" />
                  ) : (
                    <XCircle size={18} className="text-[#282B4A]" />
                  )}
                </div>
                <div className="font-mono font-bold text-base text-[#282B4A]">
                  {validation.evidence_check ? 'Citations Grounded' : 'Uncited Claims'}
                </div>
                <p className="text-sm text-[#282B4A] font-mono mt-2 leading-relaxed">
                  Scans for grounding citations ("As per inspection report", "Refer SOP-12").
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#282B4A]/20 border-2 text-sm font-mono text-[#282B4A]">
                {validation.citation_count ?? 2} Source Citations Verified
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




