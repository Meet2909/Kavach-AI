import { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, CheckCircle2, AlertCircle, FileText, 
  Table, BarChart2, ShieldCheck, RefreshCw, Cpu 
} from 'lucide-react';
import api from '../api/client.js';

export default function EvidenceRagView() {
  const [schema, setSchema] = useState(null);
  const [filterKey, setFilterKey] = useState('Equipment_ID');
  const [filterVal, setFilterVal] = useState('PUMP-A');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load schema on mount
  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      setError(null);
      const res = await api.getCsvSchema();
      if (res.success) {
        setSchema(res);
        if (res.columns && res.columns.length > 0) {
          setFilterKey(res.columns[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching CSV schema:', err);
      setError('Unable to load demo CSV schema from backend.');
    }
  };

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = filterVal.trim() ? { [filterKey]: filterVal.trim() } : {};
      const res = await api.queryCsv(null, filters);
      setResults(res);
    } catch (err) {
      console.error('CSV query failed:', err);
      setError(err.message || 'CSV query failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="pb-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-mono border border-[#282B4A]/20 border-2">
            Grounding & Verification Layer
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] font-mono border border-[#282B4A]/20 border-2">
            Pandas Local Query Engine
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono text-[#282B4A]">
          Evidence & Historical RAG
        </h1>
        <p className="text-base text-[#282B4A] font-mono mt-1 leading-relaxed">
          Grounds LLM responses in real plant records (maintenance_history.csv) without SQL servers or external telemetry.
        </p>
      </div>

      {/* CSV Introspection & Filter Bar */}
      <div className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 text-base font-mono font-semibold text-[#282B4A]">
            <Database size={18} className="text-[#282B4A]" />
            <span>Target: maintenance_history.csv</span>
            {schema && (
              <span className="text-sm text-[#282B4A]">
                ({schema.total_rows} total records Â· {schema.columns.length} columns)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setFilterKey('Equipment_ID');
                setFilterVal('PUMP-A');
                handleQuery();
              }}
              className="text-sm font-mono px-2.5 py-1 rounded bg-[#EEEBDA] hover:bg-gray-100 text-[#282B4A] border border-[#282B4A]/20 border-2 transition"
            >
              Preset: PUMP-A
            </button>
            <button
              onClick={() => {
                setFilterKey('Status');
                setFilterVal('FAILED');
                handleQuery();
              }}
              className="text-sm font-mono px-2.5 py-1 rounded bg-[#EEEBDA] hover:bg-gray-100 text-[#282B4A] border border-[#282B4A]/20 border-2 transition"
            >
              Preset: FAILED
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-mono text-[#282B4A] mb-1">Filter Column</label>
            <select
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 font-mono text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
            >
              {schema ? (
                schema.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))
              ) : (
                <option value="Equipment_ID">Equipment_ID</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono text-[#282B4A] mb-1">Filter Value</label>
            <input
              type="text"
              value={filterVal}
              onChange={(e) => setFilterVal(e.target.value)}
              placeholder="e.g. PUMP-A, FAILED, VALVE-101"
              className="w-full p-2.5 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 font-mono text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleQuery}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-mono text-sm font-bold bg-[#282B4A] hover:bg-[#282B4A]/90 text-[#EEEBDA] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Search size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Querying Pandas...' : 'Query Plant Records'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] text-sm font-mono flex items-center space-x-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#282B4A]/10/10 border border-[#282B4A]/20 border-2/30 text-[#282B4A] text-sm font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-[#282B4A] shrink-0" />
              <span>{results.summary || `Matched ${results.count} records in local Pandas engine.`}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EEEBDA] border border-[#282B4A]/20 border-2/40 text-[#282B4A] font-bold">
              {results.count} Rows
            </span>
          </div>

          {/* Table of Matched Records */}
          <div className="rounded-2xl border border-[#282B4A]/20 border-2 bg-[#EEEBDA] backdrop-blur-md overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left font-mono text-sm">
                <thead className="bg-gray-50 border-b border-[#282B4A]/20 border-2 text-[#282B4A] sticky top-0">
                  <tr>
                    {results.rows.length > 0 && Object.keys(results.rows[0]).map((col) => (
                      <th key={col} className="p-3 font-semibold uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[#282B4A]">
                  {results.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="p-3 whitespace-nowrap">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hallucination Prevention Proof Card */}
      <div className="p-6 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 backdrop-blur-md space-y-3">
        <div className="flex items-center space-x-2 text-base font-mono font-bold text-[#282B4A]">
          <ShieldCheck size={18} className="text-[#282B4A]" />
          <span>Research Differentiator: Anti-Hallucination Grounding</span>
        </div>
        <p className="text-sm text-[#282B4A] font-mono leading-relaxed">
          The agent loop executes <code className="text-[#282B4A] font-bold">get_csv_schema()</code> during the <strong>PLAN</strong> phase so the model knows verified column headers before generating Pandas filter predicates. If the query yields zero records, the model abstains rather than inventing failure counts.
        </p>
      </div>
    </div>
  );
}




