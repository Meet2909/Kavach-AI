import { useState } from 'react';

const menuItems = [
  { name: "Dashboard" },
  { name: "Documents" },
  { name: "AI Jobs" },
  { name: "Knowledge" },
  { name: "Artifacts" },
  { name: "Audit" },
  { name: "Network" },
  { name: "Settings" }
];

export default function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      {/* 1. The Hidden SVG Filter from the video */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <filter id="lg">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* 2. The Sidebar with the Glass Effect Applied */}
      <div 
        className="h-screen w-64 flex flex-col py-12 px-8 font-sans border-r border-slate-200/50 z-50 relative"
        style={{
          // A highly transparent white base so the glass effect is visible
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          // The magic from the video: custom SVG blur + saturate
          backdropFilter: 'url(#lg) blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'url(#lg) blur(8px) saturate(180%)', // For Safari compatibility
          // The inner rim light she added to simulate edge reflection
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.36)'
        }}
      >
        
        {/* Centered Navigation List */}
        <div className="flex-1 w-full flex flex-col justify-center space-y-6 mt-10">
          {menuItems.map((item, index) => {
            const isActive = activeIndex === index;
            const number = String(index + 1).padStart(2, '0'); 
            
            return (
              <div
                key={index}
                onClick={() => setActiveIndex(index)}
                className="flex items-center group cursor-pointer"
              >
                {/* The Horizontal Line */}
                <div 
                  className={`h-[1px] transition-all duration-300 ease-out mr-4 ${
                    isActive 
                      ? "w-12 bg-slate-900" 
                      : "w-4 bg-slate-300 group-hover:w-8 group-hover:bg-slate-500"
                  }`}
                ></div>
                
                {/* The Number */}
                <span className={`text-xs font-mono mr-4 transition-colors duration-300 ${
                  isActive 
                    ? "text-slate-900 font-semibold" 
                    : "text-slate-400 group-hover:text-slate-600"
                }`}>
                  {number}
                </span>
                
                {/* The Text Label */}
                <span className={`text-sm tracking-wide transition-colors duration-300 ${
                  isActive 
                    ? "text-slate-900 font-semibold" 
                    : "text-slate-500 group-hover:text-slate-700"
                }`}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}