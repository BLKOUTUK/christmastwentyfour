import React, { useEffect, useState } from 'react';
import { CountdownTime, ThemeMode } from '../types';

interface ClockProps {
  targetDate: Date;
  onTick?: () => void;
  variant?: 'large' | 'small';
  theme: ThemeMode;
}

// 7-segment paths for a 100x160 viewBox
const SEGMENT_PATHS = {
  a: "M 22,10 L 78,10 L 68,26 L 32,26 Z",         // Top
  b: "M 80,12 L 80,76 L 64,66 L 64,28 Z",         // Top Right
  c: "M 80,84 L 80,148 L 64,132 L 64,94 Z",       // Bottom Right
  d: "M 22,150 L 78,150 L 68,134 L 32,134 Z",     // Bottom
  e: "M 20,84 L 20,148 L 36,132 L 36,94 Z",       // Bottom Left
  f: "M 20,12 L 20,76 L 36,66 L 36,28 Z",         // Top Left
  g: "M 22,80 L 32,70 L 68,70 L 78,80 L 68,90 L 32,90 Z" // Middle
};

const DIGIT_SEGMENTS: Record<number, string[]> = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'd', 'e', 'g'],
  3: ['a', 'b', 'c', 'd', 'g'],
  4: ['b', 'c', 'f', 'g'],
  5: ['a', 'c', 'd', 'f', 'g'],
  6: ['a', 'c', 'd', 'e', 'f', 'g'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
};

const SevenSegmentDigit: React.FC<{ value: number; pulse?: boolean; className?: string; theme: ThemeMode }> = ({ value, pulse, className, theme }) => {
  const activeSegments = DIGIT_SEGMENTS[value] || [];

  // Define colors based on theme
  const activeColor = theme === '24' ? 'fill-yellow-500' : 'fill-red-600';
  const pulseColor = theme === '24' ? 'fill-yellow-300' : 'fill-red-400';
  const inactiveColor = theme === '24' ? 'fill-yellow-900/10' : 'fill-red-900/10';
  
  const glowStyle = theme === '24' 
    ? (pulse ? 'drop-shadow(0 0 8px rgba(234,179,8,0.9))' : 'drop-shadow(0 0 2px rgba(234,179,8,0.5))')
    : (pulse ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.5))' : 'drop-shadow(0 0 1px rgba(220, 38, 38, 0.2))');

  return (
    <svg viewBox="0 0 100 160" className={className} style={{ filter: glowStyle }}>
      {/* Background (inactive) segments */}
      <g className={inactiveColor}>
        {Object.values(SEGMENT_PATHS).map((d, i) => <path key={i} d={d} />)}
      </g>
      {/* Active Segments */}
      <g className={`transition-opacity duration-75 ${pulse ? pulseColor : activeColor}`}>
        {activeSegments.map(segKey => (
          <path key={segKey} d={SEGMENT_PATHS[segKey as keyof typeof SEGMENT_PATHS]} />
        ))}
      </g>
    </svg>
  );
};

const Separator: React.FC<{ pulse?: boolean; className?: string; theme: ThemeMode }> = ({ pulse, className, theme }) => {
  const color = theme === '24' 
    ? (pulse ? 'fill-yellow-300' : 'fill-yellow-500') 
    : (pulse ? 'fill-red-400' : 'fill-red-600');

  return (
    <svg viewBox="0 0 40 160" className={className}>
      <rect x="12" y="50" width="16" height="16" className={`${color} transition-opacity duration-75`} />
      <rect x="12" y="100" width="16" height="16" className={`${color} transition-opacity duration-75`} />
    </svg>
  );
};

const Clock: React.FC<ClockProps> = ({ targetDate, onTick, variant = 'large', theme }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Timer loop
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setPulse(true);
      if (onTick) onTick();
      // Sharp, quick pulse off
      setTimeout(() => setPulse(false), 100);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onTick]);

  // Size configurations
  const digitClass = variant === 'large' 
    ? "w-8 h-14 md:w-12 md:h-20 lg:w-14 lg:h-24" 
    : "w-5 h-8 md:w-6 md:h-10";
    
  const separatorClass = variant === 'large'
    ? "w-6 h-14 md:w-8 md:h-20 lg:w-10 lg:h-24"
    : "w-3 h-8 md:w-4 md:h-10";

  const labelClass = variant === 'large'
    ? `text-[10px] md:text-xs tracking-[0.2em] mt-1 uppercase ${theme === '24' ? 'text-yellow-700' : 'text-red-800 font-serif font-bold'}`
    : `text-[8px] tracking-widest mt-0.5 uppercase ${theme === '24' ? 'text-yellow-700/80' : 'text-red-800/80'}`;

  const renderGroup = (value: number, label: string) => {
    const s = value.toString().padStart(2, '0');
    const d1 = parseInt(s[0]);
    const d2 = parseInt(s[1]);
    return (
      <div className="flex flex-col items-center mx-0.5 md:mx-1">
        <div className="flex">
          <SevenSegmentDigit value={d1} pulse={pulse} className={digitClass} theme={theme} />
          <SevenSegmentDigit value={d2} pulse={pulse} className={digitClass} theme={theme} />
        </div>
        <span className={labelClass}>{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-row items-start justify-center select-none">
      {renderGroup(timeLeft.days, 'Days')}
      <Separator pulse={pulse} className={separatorClass} theme={theme} />
      {renderGroup(timeLeft.hours, 'Hours')}
      <Separator pulse={pulse} className={separatorClass} theme={theme} />
      {renderGroup(timeLeft.minutes, 'Min')}
      <Separator pulse={pulse} className={separatorClass} theme={theme} />
      {renderGroup(timeLeft.seconds, 'Sec')}
    </div>
  );
};

export default Clock;
