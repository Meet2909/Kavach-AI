import { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, Database } from 'lucide-react';
import api from '../../api/client.js';

function ConfidenceBadge({ score }) {
  if (score === undefined || score === null) return null;
  if (score >= 0.8) return (
    <span className="px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] text-xs font-bold">ðŸŸ¢ High Match</span>
  );
  if (score >= 0.5) return (
    <span className="px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] text-xs font-bold">ðŸŸ¡ Partial Match</span>
  );
  return (
    <span className="px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] text-xs font-bold">ðŸ”´ Weak Match</span>
  );
}

export default function EvidenceRagSimple() {
  const [schema, setSchema] = useState(null);
  const [filterKey, setFilterKey] = useState('Equipment_ID');
  const [filterVal, setFilterVal] = useState('PUMP-A');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const res = await api.getCsvSchema();
        if (res.success) {
          setSchema(res);
          if (res.columns?.length > 0) setFilterKey(res.columns[0]);
        }
      } catch {}
    };
    loadSchema();
  }, []);

  const handleSearch = async () => {
    if (!filterVal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const filters = { [filterKey]: filterVal.trim() };
      const res = await api.queryCsv(null, filters);
      setResults(res);
    } catch (e) {
      setError(e.message || 'Could not search records.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const rows = results?.rows || results?.data || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Intro */}
      <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-[#282B4A]/10 text-[#282B4A] shrink-0">
          <Database size={24} />
        </div>
        <div>
          <h3 className="font-bold text-[#282B4A]">Search Plant Records</h3>
          <p className="text-sm text-[#282B4A] mt-0.5">
            Find maintenance history, equipment data, and failure logs â€” all stored locally on your computer.
          </p>
          {schema && (
            <p className="text-xs text-[#282B4A] mt-1">
              ðŸ“‹ {schema.total_rows} records available Â· {schema.columns?.length} data fields
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#EEEBDA] rounded-2xl border border-[#282B4A]/20 border-2 p-5 space-y-3">
        <label className="block text-sm font-semibold text-[#282B4A]">Search by:</label>
        <div className="flex flex-col md:flex-row gap-3">
          {schema?.columns && (
            <select
              value={filterKey}
              onChange={e => setFilterKey(e.target.value)}
              className="p-2.5 rounded-xl bg-gray-50 border border-[#282B4A]/20 border-2 text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
            >
              {schema.columns.map(col => (
                <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={filterVal}
            onChange={e => setFilterVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. PUMP-A"
            className="flex-1 p-2.5 rounded-xl bg-gray-50 border border-[#282B4A]/20 border-2 text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#282B4A] text-white text-sm font-bold hover:bg-[#282B4A]/10 transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Search size={15} />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-[#282B4A] text-sm">{error}</div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="flex flex-col items-center py-12 space-y-3">
          <BookOpen size={40} className="text-[#282B4A]" />
          <p className="text-[#282B4A]">Your search results will appear here.</p>
        </div>
      )}

      {/* Results as friendly cards */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[#282B4A] font-medium">Found {rows.length} record{rows.length !== 1 ? 's' : ''}:</p>
          {rows.slice(0, 10).map((row, i) => (
            <div key={i} className="bg-[#EEEBDA] rounded-2xl border border-[#282B4A]/20 border-2 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText size={15} className="text-[#282B4A]" />
                  <span className="text-sm font-bold text-[#282B4A]">
                    {row.Equipment_ID || row.equipment_id || `Record ${i + 1}`}
                  </span>
                </div>
                {row.score !== undefined && <ConfidenceBadge score={row.score} />}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {Object.entries(row).filter(([k]) => k !== 'score').slice(0, 6).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-[#282B4A]">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-[#282B4A] font-medium ml-2 truncate max-w-[100px]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rows.length > 10 && (
            <p className="text-xs text-[#282B4A] text-center">Showing first 10 of {rows.length} records.</p>
          )}
        </div>
      )}

      {results && rows.length === 0 && (
        <div className="p-5 rounded-2xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 text-center">
          <p className="text-[#282B4A] font-semibold">No records found for that search.</p>
          <p className="text-[#282B4A] text-sm mt-1">Try a different value or field name.</p>
        </div>
      )}
    </div>
  );
}


