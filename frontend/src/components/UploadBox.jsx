import { useState, useRef } from 'react';
import {
  UploadCloud, File as FileIcon, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, FileText, Image as ImageIcon, Code2, Database, ShieldCheck, RefreshCw
} from 'lucide-react';
import api from '../api/client.js';

const TASK_OPTIONS = [
  {
    id: 'report',
    label: 'Approval Report',
    desc: 'Formal inspection & maintenance approval note',
    icon: FileText,
    model: 'llama3.1:8b (Laptop 1)',
    badge: 'Standard'
  },
  {
    id: 'vision',
    label: 'P&ID / Vision Analysis',
    desc: 'Extract equipment tags from blueprint or scan',
    icon: ImageIcon,
    model: 'qwen2.5-vl:7b (Laptop 2)',
    badge: 'Multimodal'
  },
  {
    id: 'csv_query',
    label: 'Plant Historical Query',
    desc: 'Structured query on maintenance & failure logs',
    icon: Database,
    model: 'qwen2.5-coder / Pandas',
    badge: 'Grounding'
  },
  {
    id: 'coding',
    label: 'Sandbox Engineering Code',
    desc: 'Isolated Python calculation in offline sandbox',
    icon: Code2,
    model: 'qwen2.5-coder:7b (Docker)',
    badge: 'Sandboxed'
  },
  {
    id: 'summary',
    label: 'Document Summary',
    desc: 'High-density technical PDF extraction via PyMuPDF',
    icon: FileText,
    model: 'llama3.1:8b (Laptop 1)',
    badge: 'Reasoning'
  },
];

const PRESET_PROMPTS = [
  {
    label: 'Valve V-301 Approval Note',
    type: 'report',
    text: 'Draft a formal maintenance approval note for valve V-301 based on inspection report and SOP-12 safety protocols.'
  },
  {
    label: 'P&ID Blueprint Tag Extraction',
    type: 'vision',
    text: 'Analyze the MRPL P&ID diagram and extract all equipment tags (Furnace F-101, Reactor R-101, Heat Exchanger E-102).'
  },
  {
    label: 'Pump Failure Analysis',
    type: 'csv_query',
    text: 'Filter maintenance history for PUMP-A failure events, calculate MTBF, and check seal replacement records.'
  },
  {
    label: 'Nozzle Stress Calculation',
    type: 'coding',
    text: 'Write a Python calculation function to compute hoop stress on ASTM A106 pipe at 15.2 MPa internal pressure.'
  }
];

export default function UploadBox({ onTaskStarted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [taskType, setTaskType] = useState('report');
  const [activePreset, setActivePreset] = useState(PRESET_PROMPTS[0].label);
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0].text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setSelectedFile(dropped);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePresetClick = (preset) => {
    setTaskType(preset.type);
    setActivePreset(preset.label);
    setPrompt(preset.text);
  };


  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      let jobId = null;

      // 1. If file selected, upload via /upload endpoint
      if (selectedFile) {
        const uploadRes = await api.uploadFiles([selectedFile]);
        jobId = uploadRes.job_id;
      } else {
        // If no file uploaded, create a mock dummy file so /upload endpoint initializes workspace
        const dummyBlob = new Blob([`# Kavach AI Task Payload: ${taskType}\n${prompt}`], { type: 'text/plain' });
        const dummyFile = new File([dummyBlob], `${taskType}_request.txt`, { type: 'text/plain' });
        const uploadRes = await api.uploadFiles([dummyFile]);
        jobId = uploadRes.job_id;
      }

      // 2. Trigger task execution via /task/{jobId}
      await api.startTask(jobId, taskType, prompt);

      // 3. Callback to parent to transition to Active Jobs view
      if (onTaskStarted) {
        onTaskStarted(jobId, taskType, selectedFile ? selectedFile.name : 'Direct Instruction');
      }
    } catch (err) {
      console.error('Failed to dispatch task:', err);
      setError(err.message || 'Error communicating with FastAPI backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Drag & Drop Upload Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDragging
          ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
          : selectedFile
            ? 'border-purple-500/50 bg-purple-950/20 backdrop-blur-md'
            : 'border-white/15 bg-white/5 hover:border-purple-500/40 hover:bg-white/[0.07] backdrop-blur-md'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.csv,.docx,.txt"
        />

        {selectedFile ? (
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <FileIcon size={32} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-white text-base">{selectedFile.name}</span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-mono leading-relaxed">
                Artifact ready for sovereign RAG indexing & model routing. Click to change file.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner">
              <UploadCloud size={36} />
            </div>
            <div>
              <p className="font-mono text-base font-semibold text-white">Drag & drop engineering artifact, or browse</p>
              <p className="text-base text-gray-400 font-cabinet mt-1 leading-relaxed">
                Supports P&ID Diagrams (.png, .jpg), Plant Standards (.pdf), Maintenance Logs (.csv)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Task Type Selector Grid */}
      <div className="space-y-3">
        <label className="block text-base font-cabinet font-semibold tracking-wider text-gray-400 uppercase">
          1. Select Autonomous Agent Pipeline
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TASK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = taskType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTaskType(opt.id);
                  const matchedPreset = PRESET_PROMPTS.find(p => p.type === opt.id);

                  if (matchedPreset) {
                    setActivePreset(matchedPreset.label);
                    setPrompt(matchedPreset.text);
                  } else {
                    setActivePreset(null);
                    setPrompt('');
                  }
                }}

                className={`p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${isSelected
                  ? 'border-purple-500 bg-purple-500/15 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-mono px-2 py-0.5 rounded border border-white/10 text-gray-300">
                    {opt.badge}
                  </span>
                </div>
                <div>
                  <div className="font-mono font-semibold text-base text-white">{opt.label}</div>
                  <div className="text-sm text-gray-400 mt-1 leading-relaxed">{opt.desc}</div>
                  <div className="text-sm font-cabinet text-purple-400 mt-2 font-medium">Node: {opt.model}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Engineering Prompt Specification */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-mono font-semibold tracking-wider text-gray-400 uppercase">
            2. Operational Instruction & Constraints
          </label>
          <div className="flex items-center space-x-1.5 text-sm text-purple-400 font-mono">
            <Sparkles size={13} />
            <span>Preset Templates</span>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset, idx) => {
            // Add the missing visual check!
            const isActive = activePreset === preset.label;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`text-base font-cabinet px-3 py-1.5 rounded-lg border transition leading-relaxed ${isActive
                    ? 'bg-purple-500/30 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 text-gray-300'
                  }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt instructions for the autonomous agent loop..."
          className="w-full p-4 rounded-xl bg-black/40 border border-white/15 focus:border-purple-500 focus:outline-none font-stardom text-base text-gray-200 placeholder-gray-600 backdrop-blur-sm transition"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start space-x-3 text-base font-mono">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Action Button */}
      <div className="flex justify-end items-center space-x-4 pt-2">
        <div className="text-base text-gray-400 font-stardom flex items-center space-x-1.5">
          <ShieldCheck size={14} className="text-green-400" />
          <span>Least-Privilege Tool Gate Armed</span>
        </div>
        <button
          type="button"
          disabled={isSubmitting || !prompt.trim()}
          onClick={handleSubmit}
          className="px-6 py-3.5 rounded-xl font-mono text-base font-bold tracking-wide transition-all duration-200 flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Initializing Agent Loop...</span>
            </>
          ) : (
            <>
              <span>Dispatch Sovereign Task</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
} 