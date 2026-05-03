import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-xl' },
    md: { icon: 52, text: 'text-3xl' },
    lg: { icon: 72, text: 'text-5xl' }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: sizes[size].icon, height: sizes[size].icon }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Shopping Cart Body */}
          <path
            d="M25 35H75L68 65C67 69 64 72 60 72H40C36 72 33 69 32 65L25 35Z"
            fill="white"
          />
          <path
            d="M25 35L20 25H12"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="38" cy="82" r="5" fill="#1A1A1A" />
          <circle cx="62" cy="82" r="5" fill="#1A1A1A" />

          {/* Browser Window inside Cart */}
          <rect x="34" y="28" width="32" height="32" rx="4" fill="url(#browser-grad)" />
          <rect x="34" y="28" width="32" height="8" rx="2" fill="url(#header-grad)" />
          <circle cx="38" cy="32" r="1.2" fill="white" fillOpacity="0.9" />
          <circle cx="42" cy="32" r="1.2" fill="white" fillOpacity="0.9" />
          <circle cx="46" cy="32" r="1.2" fill="white" fillOpacity="0.9" />

          {/* Growth Swoosh Arrow */}
          <path
            d="M12 62C12 62 22 84 50 78C78 72 88 50 88 42"
            stroke="url(#swoosh-grad)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M80 46L88 40L92 50"
            stroke="url(#swoosh-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient id="browser-grad" x1="34" y1="28" x2="66" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="header-grad" x1="34" y1="28" x2="66" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="swoosh-grad" x1="12" y1="70" x2="88" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4D00" />
              <stop offset="1" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-[0.8] mt-1">
          <span className={`${sizes[size].text} font-black tracking-tighter`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Next</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Flippers</span>
          </span>
          {size !== 'sm' && (
            <div className="flex items-center gap-1.5 mt-1.5 ml-0.5 opacity-60">
              <div className="h-px bg-gray-300 flex-grow" />
              <span className="text-[8px] md:text-[9px] font-bold text-gray-500 tracking-[0.25em] whitespace-nowrap uppercase">
                Buy • Sell • Grow
              </span>
              <div className="h-px bg-gray-300 w-8" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
