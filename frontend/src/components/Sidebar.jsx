import { useState, useEffect } from 'react';

const DEFAULT_ITEMS = [
  'Dashboard',            // Overview & stats
  'Document Intake',      // PDF/Image uploads
  'Active AI Jobs',       // TracePanel & live execution
  'Evidence & RAG',       // Day 3: Conflict detection
  'Artifact Generator',   // Day 4: DOCX creation
  'Human Approval',       // Tool gating
  'Security Audit',       // Day 5: Sovereignty & Hashes
  'Hardware Config'       // Llama/Qwen IPs & VRAM
];

const LineSidebar = ({
  items = DEFAULT_ITEMS,
  accentColor = '#c084fc',
  textColor = '#9ca3af',
  markerColor = 'rgba(255, 255, 255, 0.15)',
  showIndex = true,
  showMarker = true,
  markerLength = 40,
  markerGap = 12,
  itemGap = 18,
  fontSize = 0.95,
  defaultActive = 0,
  onItemClick,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive ?? 0);

  useEffect(() => {
    if (defaultActive !== null && defaultActive !== undefined) {
      setActiveIndex(defaultActive);
    }
  }, [defaultActive]);

  const handleClick = (index, label) => {
    setActiveIndex(index);
    onItemClick?.(index, label);
  };

  return (
    <nav
      className={`relative flex justify-start ${showMarker ? 'pl-8' : ''} ${className}`}
      style={{
        '--accent-color': accentColor,
        '--text-color': textColor,
        '--marker-color': markerColor,
        '--item-gap': `${itemGap}px`,
        '--font-size': `${fontSize}rem`
      }}
    >
      <ul
        className="m-0 flex list-none flex-col py-2 w-full"
        style={{ gap: 'var(--item-gap)' }}
      >
        {items.map((label, index) => {
          const isActive = activeIndex === index;

          return (
            <li
              key={`${label}-${index}`}
              onClick={() => handleClick(index, label)}
              aria-current={isActive ? 'true' : undefined}
              className={`group relative flex items-center cursor-pointer select-none py-1.5 transition-all duration-200 ${
                isActive ? 'text-[#EEEBDA]' : 'text-[#EEEBDA]/70 hover:text-[#EEEBDA]'
              }`}
            >
              {/* Static Indicator Marker Line */}
              {showMarker && (
                <span
                  aria-hidden="true"
                  className={`absolute -left-8 top-1/2 -translate-y-1/2 h-px transition-all duration-200 ${
                    isActive
                      ? 'w-6 bg-[#EEEBDA] opacity-100 shadow-[0_0_8px_rgba(238,235,218,0.4)]'
                      : 'w-3 bg-[#EEEBDA] opacity-30 group-hover:w-4 group-hover:opacity-80'
                  }`}
                />
              )}

              {/* Static Content Item */}
              <span 
                className="relative inline-flex items-baseline leading-[1.2] transition-colors duration-150"
                style={{ fontSize: 'var(--font-size)' }}
              >
                {/* 2-Digit Index Marker */}
                {showIndex && (
                  <span 
                    className={`mr-3 font-mono text-[0.82em] transition-colors duration-150 ${
                      isActive 
                        ? 'text-[#EEEBDA] font-bold opacity-100' 
                        : 'text-[#EEEBDA]/50 opacity-60 group-hover:text-[#EEEBDA]/70 group-hover:opacity-90'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}

                {/* Tab Label */}
                <span 
                  className={`font-mono transition-colors duration-150 ${
                    isActive
                      ? 'text-[#EEEBDA] font-bold tracking-wide'
                      : 'text-[#EEEBDA]/70 font-normal group-hover:text-[#EEEBDA]'
                  }`}
                >
                  {label}
                </span>

                {/* Subtle active pill dot on far right */}
                {isActive && (
                  <span className="ml-2.5 w-1.5 h-1.5 rounded-full bg-[#EEEBDA] shadow-[0_0_8px_rgba(238,235,218,0.6)] inline-block self-center"></span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default LineSidebar;



