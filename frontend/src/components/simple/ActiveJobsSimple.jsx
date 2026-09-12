import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const STEPS = [
  { label: 'Reading your request', key: 'INTAKE' },
  { label: 'Making a plan', key: 'PLAN' },
  { label: 'Looking for evidence', key: 'RETRIEVE' },
  { label: 'Doing the work', key: 'EXECUTE' },
  { label: 'Double-checking', key: 'VALIDATE' },
  { label: 'Verifying it\'s correct', key: 'AUDIT' },
  { label: 'Done!', key: 'COMPLETE' },
];

const STEP_KEYS = STEPS.map(s => s.key);

function getStepStatus(stepKey, traceLog, jobStatus) {
  const completedSteps = (traceLog || []).map(t => t.step?.toUpperCase());
  const currentIdx = STEP_KEYS.indexOf(stepKey);

  if (jobStatus === 'COMPLETED' || jobStatus === 'DONE') return 'done';

  // Find the highest step that appears in trace
  let highestDone = -1;
  completedSteps.forEach(s => {
    const idx = STEP_KEYS.indexOf(s);
    if (idx > highestDone) highestDone = idx;
  });

  if (currentIdx < highestDone) return 'done';
  if (currentIdx === highestDone) return 'active';
  return 'pending';
}

function getStatusMessage(jobStatus, traceLog) {
  if (!traceLog || traceLog.length === 0) return 'Waiting for a task to begin...';
  if (jobStatus === 'COMPLETED') return 'âœ… All done! Your results are ready to view.';
  if (jobStatus === 'FAILED') return 'âŒ Something went wrong. Please try again.';

  const lastStep = traceLog[traceLog.length - 1]?.step?.toUpperCase();
  const messages = {
    INTAKE: 'Reading your document and understanding what you need...',
    PLAN: 'The AI is making a plan for how to help you...',
    RETRIEVE: 'Looking through your documents for relevant information...',
    EXECUTE: 'The AI is doing the work right now...',
    VALIDATE: 'Double-checking all the results for accuracy...',
    AUDIT: 'Running a final verification to make sure everything is correct...',
    COMPLETE: 'âœ… All done! Your results are ready.',
  };
  return messages[lastStep] || 'Processing your request...';
}

export default function ActiveJobsSimple({ traceLog, status, jobId }) {
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="p-6 rounded-full bg-gray-100">
          <Loader2 size={40} className="text-[#282B4A]" />
        </div>
        <p className="text-[#282B4A] text-lg">No active task right now.</p>
        <p className="text-[#282B4A] text-sm">Upload a document to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Status message */}
      <div className="p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 text-center">
        <p className="text-[#282B4A] text-base font-medium leading-relaxed">
          {getStatusMessage(status, traceLog)}
        </p>
      </div>

      {/* Horizontal step tracker */}
      <div className="bg-[#EEEBDA] rounded-2xl border border-[#282B4A]/20 border-2 p-6">
        <h3 className="text-sm font-semibold text-[#282B4A] uppercase tracking-wider mb-6">Progress</h3>
        <div className="flex items-start justify-between relative">
          {/* Connector line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />

          {STEPS.map((step, i) => {
            const stepStatus = getStepStatus(step.key, traceLog, status);
            return (
              <div key={step.key} className="flex flex-col items-center space-y-2 z-10 flex-1">
                {stepStatus === 'done' && (
                  <div className="w-10 h-10 rounded-full bg-[#282B4A]/10 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                )}
                {stepStatus === 'active' && (
                  <div className="w-10 h-10 rounded-full bg-[#282B4A] flex items-center justify-center shadow-md ring-4 ring-[#743014]/20">
                    <Loader2 size={18} className="text-white animate-spin" />
                  </div>
                )}
                {stepStatus === 'pending' && (
                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-[#282B4A]/20 border-2 flex items-center justify-center">
                    <Circle size={14} className="text-[#282B4A]" />
                  </div>
                )}
                <span className={`text-[10px] text-center leading-tight max-w-[70px] ${
                  stepStatus === 'done' ? 'text-[#282B4A] font-semibold' :
                  stepStatus === 'active' ? 'text-[#282B4A] font-bold' :
                  'text-[#282B4A]'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall status badge */}
      <div className="flex justify-center">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          status === 'COMPLETED' ? 'bg-[#282B4A]/10 text-[#282B4A]' :
          status === 'FAILED' ? 'bg-[#282B4A]/10 text-[#282B4A]' :
          'bg-[#282B4A]/10 text-[#282B4A]'
        }`}>
          {status === 'COMPLETED' ? 'âœ… Complete' :
           status === 'FAILED' ? 'âŒ Failed' :
           status === 'WAITING' ? 'â³ Waiting for task...' :
           'ðŸ”„ Processing...'}
        </span>
      </div>
    </div>
  );
}


