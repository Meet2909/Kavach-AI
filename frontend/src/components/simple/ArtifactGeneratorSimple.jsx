import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Download, FileText, Loader2 } from 'lucide-react';
import api from '../../api/client.js';

const CHECK_LABELS = [
  { key: 'open_check', label: 'File opens correctly', desc: 'The document can be read and processed.' },
  { key: 'section_check', label: 'All required sections included', desc: 'The report contains every required part.' },
  { key: 'evidence_check', label: 'Every fact is sourced', desc: 'All claims are backed by your uploaded documents.' },
];

function CheckItem({ label, desc, status }) {
  return (
    <div className={`flex items-start space-x-4 p-4 rounded-2xl border ${
      status === true ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2' :
      status === false ? 'bg-[#282B4A]/10 border-[#282B4A]/20 border-2' :
      'bg-gray-50 border-[#282B4A]/20 border-2'
    }`}>
      <div className="mt-0.5 shrink-0">
        {status === true && <CheckCircle2 size={24} className="text-[#282B4A]" />}
        {status === false && <XCircle size={24} className="text-[#282B4A]" />}
        {status === undefined && <AlertCircle size={24} className="text-[#282B4A]" />}
      </div>
      <div>
        <p className={`font-bold text-sm ${
          status === true ? 'text-[#282B4A]' :
          status === false ? 'text-[#282B4A]' :
          'text-[#282B4A]'
        }`}>{label}</p>
        <p className="text-xs text-[#282B4A] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function ArtifactGeneratorSimple({ initialJobId }) {
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
      if (res.jobs?.length > 0) {
        setRecentJobs(res.jobs);
        if (!jobId) setJobId(res.jobs[0].job_id);
      }
    } catch {}
  };

  const handleValidate = async () => {
    if (!jobId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.validateArtifact(jobId.trim(), taskType);
      setValidation(res);
    } catch (err) {
      setError(err.message || 'Validation failed.');
      setValidation(err.detail?.validation ?? null);
    } finally {
      setLoading(false);
    }
  };

  const downloadUrl = jobId ? api.getArtifactUrl(jobId.trim(), taskType) : '#';
  const allPassed = validation && CHECK_LABELS.every(c => validation[c.key] === true);

  return (
    <div className="space-y-6 animate-fade-in-up max-w-xl mx-auto">
      {/* Job selector */}
      {recentJobs.length > 0 && (
        <div className="bg-[#EEEBDA] rounded-2xl border border-[#282B4A]/20 border-2 p-4 flex items-center space-x-3">
          <FileText size={18} className="text-[#282B4A] shrink-0" />
          <select
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#282B4A] focus:outline-none"
          >
            {recentJobs.map(j => (
              <option key={j.job_id} value={j.job_id}>
                {j.job_id} â€” {j.task_type || 'Task'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3 Check items */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#282B4A] uppercase tracking-wider">Quality Checks</h3>
        {CHECK_LABELS.map(c => (
          <CheckItem
            key={c.key}
            label={c.label}
            desc={c.desc}
            status={validation ? (validation.validation?.[c.key] ?? validation[c.key]) : undefined}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] text-sm flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* All passed banner */}
      {allPassed && (
        <div className="p-4 rounded-2xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-center">
          <p className="text-[#282B4A] font-bold text-lg">âœ… Your document is ready!</p>
          <p className="text-[#282B4A] text-sm mt-1">All checks passed. You can download it now.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleValidate}
          disabled={loading || !jobId}
          className="flex-1 py-3 rounded-xl bg-[#282B4A] text-white font-bold text-sm hover:bg-[#282B4A]/10 transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>{loading ? 'Checking...' : 'Check My Document'}</span>
        </button>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 rounded-xl border border-[#282B4A]/20 border-2 text-[#282B4A] font-bold text-sm hover:bg-[#282B4A]/10 transition flex items-center justify-center space-x-2"
        >
          <Download size={16} />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}


