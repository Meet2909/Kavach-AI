import { CheckCircle2, ShieldCheck, Server, Lock, Upload, Eye, Zap } from 'lucide-react';

const STATUS_CARDS = [
  {
    icon: CheckCircle2,
    title: 'System Online',
    desc: 'Your AI assistant is ready to use',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    dot: 'bg-[#282B4A]',
  },
  {
    icon: ShieldCheck,
    title: 'Air-Gap Verified',
    desc: 'Your data never leaves this computer',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    dot: 'bg-[#282B4A]',
  },
  {
    icon: Server,
    title: '2 Computers Ready',
    desc: 'Both AI processing nodes are active',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    dot: 'bg-[#282B4A]',
  },
  {
    icon: Lock,
    title: 'Safety Sandbox Ready',
    desc: 'All tools run in an isolated environment',
    color: 'text-[#282B4A]',
    bg: 'bg-[#282B4A]/10',
    border: 'border-[#282B4A]/20 border-2',
    dot: 'bg-[#282B4A]',
  },
];

const ACTION_CARDS = [
  {
    icon: Upload,
    title: 'Upload a Document',
    desc: 'Send a blueprint, manual, or maintenance log to your AI assistant for analysis.',
    tab: 1,
    cta: 'Start Upload â†’',
  },
  {
    icon: Eye,
    title: 'Check AI Activity',
    desc: 'See what your AI is currently working on and track its progress step by step.',
    tab: 2,
    cta: 'View Progress â†’',
  },
  {
    icon: Zap,
    title: 'Review & Approve',
    desc: 'The AI will ask for your permission before taking any important action.',
    tab: 5,
    cta: 'Open Gate â†’',
  },
];

export default function DashboardSimple({ onNavigateTab }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero greeting */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-[#282B4A]">Everything is running safely.</h2>
        <p className="text-[#282B4A] mt-1">Your sovereign AI system is active and air-gapped.</p>
      </div>

      {/* 4 Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`rounded-2xl p-5 border ${card.bg} ${card.border} flex flex-col items-center text-center space-y-3`}>
              <div className={`p-3 rounded-full ${card.bg} ${card.border} border`}>
                <Icon size={28} className={card.color} />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${card.dot} animate-pulse`} />
                <span className={`text-sm font-bold ${card.color}`}>{card.title}</span>
              </div>
              <p className="text-xs text-[#282B4A] leading-relaxed">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* What do you want to do? */}
      <div>
        <h3 className="text-base font-semibold text-[#282B4A] mb-3">What would you like to do?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ACTION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => onNavigateTab && onNavigateTab(card.tab)}
                className="text-left p-5 rounded-2xl bg-[#EEEBDA] border border-[#282B4A]/20 border-2 hover:border-[#282B4A]/20 border-2 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-xl bg-[#282B4A]/10 text-[#282B4A] group-hover:bg-[#282B4A]/10 group-hover:text-white transition-all">
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-[#282B4A]">{card.title}</span>
                </div>
                <p className="text-sm text-[#282B4A] leading-relaxed">{card.desc}</p>
                <span className="text-xs text-[#282B4A] font-semibold mt-3 block">{card.cta}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


