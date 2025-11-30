import React from 'react';

// Since we cannot reliably autoplay audio without user interaction, 
// we use a visual "thump" bar that mimics the famous sound wave.
const SoundEffect: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden flex items-center justify-center opacity-20">
       {active && (
         <div className="w-full h-1 bg-yellow-500 absolute top-1/2 shadow-[0_0_50px_20px_rgba(234,179,8,0.8)] animate-ping"></div>
       )}
    </div>
  );
};

export default SoundEffect;