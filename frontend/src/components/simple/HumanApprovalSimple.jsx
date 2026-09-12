import { useState, useEffect } from 'react';
import { Bot, CheckCircle2, XCircle, Edit3, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../../api/client.js';

const ACTION_DESCRIPTIONS = {
  write_docx: { plain: 'Save a report file to your computer', icon: 'ðŸ’¾' },
  run_code: { plain: 'Run a calculation in an isolated sandbox', icon: 'ðŸ”¢' },
  read_pdf: { plain: 'Read a PDF document', icon: 'ðŸ“„' },
  query_csv: { plain: 'Look through a data file', icon: 'ðŸ“Š' },
  default: { plain: 'Perform an action on your behalf', icon: 'ðŸ¤–' },
};

export default function HumanApprovalSimple() {
  const [approvalState, setApprovalState] = useState({
    pending: true,
    toolName: 'write_docx',
    actionDesc: 'Write approval_note.docx to disk for final plant engineer sign-off',
    verdict: null,
  });

  const action = ACTION_DESCRIPTIONS[approvalState.toolName] || ACTION_DESCRIPTIONS.default;

  const handleDecision = (decision) => {
    setApprovalState(prev => ({ ...prev, pending: false, verdict: decision }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-lg mx-auto">

      {/* Main approval card */}
      <div className={`rounded-2xl border-2 p-8 text-center space-y-5 transition-all ${
        approvalState.verdict === 'approve' ? 'border-[#282B4A]/20 border-2 bg-[#282B4A]/10' :
        approvalState.verdict === 'reject' ? 'border-[#282B4A]/20 border-2 bg-[#282B4A]/10' :
        'border-[#282B4A]/20 border-2 bg-[#EEEBDA]'
      }`}>

        {/* AI icon */}
        <div className="flex justify-center">
          <div className={`p-5 rounded-full ${
            approvalState.verdict === 'approve' ? 'bg-[#282B4A]/10' :
            approvalState.verdict === 'reject' ? 'bg-[#282B4A]/10' :
            'bg-[#282B4A]/10'
          }`}>
            <Bot size={40} className={
              approvalState.verdict === 'approve' ? 'text-[#282B4A]' :
              approvalState.verdict === 'reject' ? 'text-[#282B4A]' :
              'text-[#282B4A]'
            } />
          </div>
        </div>

        {/* Verdict or question */}
        {!approvalState.verdict ? (
          <>
            <div>
              <p className="text-2xl font-bold text-[#282B4A]">
                The AI wants to:
              </p>
              <p className="text-xl text-[#282B4A] font-semibold mt-2">
                {action.plain}
              </p>
            </div>
            <p className="text-[#282B4A] text-sm leading-relaxed">
              Your AI assistant needs your permission before taking this action. 
              Nothing will happen until you approve.
            </p>

            {/* Safety assurance */}
            <div className="flex items-center justify-center space-x-2 text-xs text-[#282B4A]">
              <ShieldCheck size={14} />
              <span>This action stays on your computer - nothing goes online</span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => handleDecision('approve')}
                className="w-full py-3.5 rounded-xl bg-[#282B4A]/10 hover:bg-[#282B4A]/10 text-white font-bold text-base transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={18} />
                <span>Yes, allow this</span>
              </button>
              <button
                onClick={() => handleDecision('modify')}
                className="w-full py-3 rounded-xl border border-[#282B4A]/20 border-2 text-[#282B4A] font-semibold text-sm hover:bg-[#282B4A]/10 transition flex items-center justify-center space-x-2"
              >
                <Edit3 size={16} />
                <span>Allow with restrictions</span>
              </button>
              <button
                onClick={() => handleDecision('reject')}
                className="w-full py-3 rounded-xl border border-[#282B4A]/20 border-2 text-[#282B4A] font-semibold text-sm hover:bg-[#282B4A]/10 transition flex items-center justify-center space-x-2"
              >
                <XCircle size={16} />
                <span>No, block this</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {approvalState.verdict === 'approve' && (
              <>
                <CheckCircle2 size={48} className="text-[#282B4A] mx-auto" />
                <p className="text-xl font-bold text-[#282B4A]">Action Approved!</p>
                <p className="text-[#282B4A] text-sm">The AI is now proceeding with the task.</p>
              </>
            )}
            {approvalState.verdict === 'reject' && (
              <>
                <XCircle size={48} className="text-[#282B4A] mx-auto" />
                <p className="text-xl font-bold text-[#282B4A]">Action Blocked</p>
                <p className="text-[#282B4A] text-sm">The AI has been stopped. No changes were made.</p>
              </>
            )}
            {approvalState.verdict === 'modify' && (
              <>
                <AlertTriangle size={48} className="text-[#282B4A] mx-auto" />
                <p className="text-xl font-bold text-[#282B4A]">Restrictions Applied</p>
                <p className="text-[#282B4A] text-sm">The AI will proceed with the modified constraints.</p>
              </>
            )}
            <button
              onClick={() => setApprovalState(prev => ({ ...prev, pending: true, verdict: null }))}
              className="mt-4 px-6 py-2 rounded-xl border border-[#282B4A]/20 border-2 text-[#282B4A] text-sm hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Trust indicator */}
      <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2">
        <ShieldCheck size={18} className="text-[#282B4A] shrink-0" />
        <p className="text-sm text-[#282B4A]">
          <strong className="text-[#282B4A]">Human-in-the-loop protection:</strong> Your AI assistant 
          always asks before taking important actions. You are always in control.
        </p>
      </div>
    </div>
  );
}


