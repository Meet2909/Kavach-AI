import { useState } from 'react';
import { Brain, Eye, Zap, ArrowRight } from 'lucide-react';
import api from '../../api/client.js';

const COMPUTERS = [
  {
    icon: Brain,
    name: 'Computer 1',
    role: 'The Thinking Brain',
    desc: 'Handles complex reasoning, report writing, and analysis of text documents.',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    models: ['llama3.1:8b'],
  },
  {
    icon: Eye,
    name: 'Computer 2',
    role: 'The Eyes & Hands',
    desc: 'Handles blueprints, images, engineering calculations, and visual analysis.',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    models: ['qwen2.5-vl:7b', 'qwen2.5-coder:7b'],
  },
];

const TASK_PLAIN = {
  vision: { label: 'a blueprint or image', computer: 'Computer 2', reason: 'it understands visual diagrams' },
  coding: { label: 'an engineering calculation', computer: 'Computer 2', reason: 'it handles code and calculations' },
  csv_query: { label: 'a data file query', computer: 'Computer 2', reason: 'it can process structured data' },
  report: { label: 'a report or summary', computer: 'Computer 1', reason: 'it is the best at reasoning and writing' },
  summary: { label: 'a PDF document', computer: 'Computer 1', reason: 'it excels at reading and summarising text' },
};

export default function HardwareConfigSimple() {
  const [testTask, setTestTask] = useState('vision');
  const [testExt, setTestExt] = useState('png');
  const [routeResult, setRouteResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await api.testRoute(testTask, testExt);
      setRouteResult(res);
    } catch {}
    finally { setSimulating(false); }
  };

  const plain = TASK_PLAIN[testTask] || TASK_PLAIN.report;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* 2 computer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {COMPUTERS.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.name} className={`p-6 rounded-2xl bg-[#EEEBDA] border ${c.border} space-y-3`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${c.bg} ${c.border} border`}>
                  <Icon size={28} className={c.color} />
                </div>
                <div>
                  <p className="text-xs text-[#282B4A] font-medium">{c.name}</p>
                  <p className={`font-bold text-base ${c.color}`}>{c.role}</p>
                </div>
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-[#282B4A]/10 text-[#282B4A] text-xs font-bold">
                  â— Online
                </span>
              </div>
              <p className="text-sm text-[#282B4A] leading-relaxed">{c.desc}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {c.models.map(m => (
                  <span key={m} className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.color} font-medium`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Router simulator â€” plain language */}
      <div className="bg-[#EEEBDA] rounded-2xl border border-[#282B4A]/20 border-2 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-[#282B4A]">Which computer handles what?</h3>
          <p className="text-sm text-[#282B4A] mt-0.5">Choose a task type to see where it goes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#282B4A] mb-1 font-medium">Task Type</label>
            <select
              value={testTask}
              onChange={e => setTestTask(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-gray-50 border border-[#282B4A]/20 border-2 text-sm text-[#282B4A] focus:outline-none focus:border-[#282B4A]/20 border-2"
            >
              <option value="vision">Blueprint / Diagram</option>
              <option value="coding">Engineering Calculation</option>
              <option value="csv_query">Maintenance Log Query</option>
              <option value="report">Approval Report</option>
              <option value="summary">PDF Summary</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full py-2.5 rounded-xl bg-[#282B4A] text-white font-bold text-sm hover:bg-[#282B4A]/10 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Zap size={15} />
              <span>{simulating ? 'Checking...' : 'Show Me'}</span>
            </button>
          </div>
        </div>

        {/* Plain sentence result */}
        {(routeResult || !simulating) && plain && (
          <div className="p-4 rounded-xl bg-[#282B4A]/10 border border-[#282B4A]/20 border-2 flex items-start space-x-3">
            <ArrowRight size={18} className="text-[#282B4A] mt-0.5 shrink-0" />
            <p className="text-sm text-[#282B4A] leading-relaxed">
              {routeResult ? (
                <>
                  A <strong>{plain.label}</strong> would be sent to{' '}
                  <strong className="text-[#282B4A]">{plain.computer}</strong>{' '}
                  because {plain.reason}.
                </>
              ) : (
                <>Click "Show Me" to see which computer would handle your task.</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


