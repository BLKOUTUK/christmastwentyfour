import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, RefreshCw, AlertTriangle, ShieldCheck, Download, Gift, Snowflake, Share2 } from 'lucide-react';
import Clock from './components/Clock';
import SoundEffect from './components/SoundEffect';
import { generateCharacterImage } from './services/geminiService';
import { AppState, ThemeMode } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [theme, setTheme] = useState<ThemeMode>('24');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tickActive, setTickActive] = useState(false);
  const [targetChristmas, setTargetChristmas] = useState<Date>(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set next Christmas
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const xmas = new Date(currentYear, 11, 25); // Month is 0-indexed (11 = Dec)
    if (now > xmas) {
      xmas.setFullYear(currentYear + 1);
    }
    setTargetChristmas(xmas);
  }, []);

  const handleTick = () => {
    setTickActive(true);
    setTimeout(() => setTickActive(false), 50); // Sharp tick
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setAppState(AppState.IDLE); // Reset state if re-uploading
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setAppState(AppState.PROCESSING);
    setErrorMessage(null);
    try {
      const result = await generateCharacterImage(uploadedImage, theme);
      setGeneratedImage(result);
      setAppState(AppState.COMPLETE);
    } catch (error: any) {
      console.error("Caught error in App:", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setUploadedImage(null);
    setGeneratedImage(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleTheme = () => {
    setTheme(prev => prev === '24' ? 'ELF' : '24');
    // Reset if we switch themes to avoid confusion
    if (appState === AppState.COMPLETE) {
      reset();
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `protocol-${theme.toLowerCase()}.png`, { type: 'image/png' });
      const shareData = {
        files: [file],
        title: theme === 'ELF' ? 'The North Pole Protocol' : 'The 24 Christmas Protocol',
        text: theme === 'ELF' ? 'I made this with The North Pole Protocol!' : 'The following takes place between now and Christmas Day.',
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        try {
           await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
           alert("Image copied to clipboard!"); 
        } catch (e) {
           alert("Sharing is not supported on this device. Please use the download button.");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Theme-based Styles
  const isElf = theme === 'ELF';
  
  const bgClass = isElf ? "bg-emerald-950" : "bg-black";
  const textClass = isElf ? "font-serif text-red-50" : "font-mono text-white";
  const accentColorClass = isElf ? "text-red-500" : "text-yellow-500";
  const buttonBgClass = isElf ? "bg-red-700 hover:bg-red-600" : "bg-yellow-600 hover:bg-yellow-500";
  const buttonTextClass = isElf ? "text-white" : "text-black";
  const borderColorClass = isElf ? "border-red-900/50" : "border-gray-800";
  const containerClass = isElf ? "bg-emerald-900/30 border-emerald-800" : "bg-gray-900/30 border-gray-800";
  const dropZoneHoverClass = isElf ? "hover:border-red-500/50 hover:bg-red-900/10" : "hover:border-yellow-500/50 hover:bg-yellow-900/5";

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} relative flex flex-col items-center transition-colors duration-500`}>
      {/* Background Ambience */}
      {isElf ? (
         <>
          {/* Simple CSS Snow effect */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         </>
      ) : (
         <>
          <div className="absolute inset-0 scanline z-10 pointer-events-none"></div>
          <div className="absolute inset-0 z-0 opacity-10" 
               style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
         </>
      )}

      {/* Sound Effect Visualizer Line */}
       <div className={`fixed top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden flex items-center justify-center opacity-20`}>
          {tickActive && (
             <div className={`w-full h-1 absolute top-1/2 animate-ping shadow-[0_0_50px_20px_rgba(255,255,255,0.5)] ${isElf ? 'bg-white' : 'bg-yellow-500 shadow-[0_0_50px_20px_rgba(234,179,8,0.8)]'}`}></div>
          )}
       </div>

      {/* Header */}
      <header className={`w-full p-6 flex justify-between items-center z-20 border-b ${borderColorClass} ${isElf ? 'bg-emerald-950/90' : 'bg-black/90'} backdrop-blur-md transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          {isElf ? (
             <div className="flex items-center gap-2">
                <Gift className="text-red-500" size={32} />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-red-100 flex flex-col md:flex-row md:items-baseline md:gap-3">
                   <span className="italic font-serif">The North Pole</span>
                   <span className="text-sm md:text-lg opacity-80 uppercase tracking-widest font-sans">Protocol</span>
                </h1>
             </div>
          ) : (
             <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-yellow-500 flex items-center gap-3">
                <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(234,179,8,0.5)]">24</span>
                <span className="text-white text-lg md:text-xl tracking-[0.3em] uppercase opacity-80 border-l border-gray-700 pl-4">Christmas Protocol</span>
             </h1>
          )}
        </div>
        
        <div className="flex items-center gap-4">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${
                isElf 
                  ? 'bg-emerald-800 border-emerald-700 text-emerald-100 hover:bg-emerald-700' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-yellow-500 hover:border-yellow-500'
             }`}
           >
             {isElf ? <><Snowflake size={14} /> Elf Mode</> : <><ShieldCheck size={14} /> 24 Mode</>}
           </button>
           
           <div className="hidden md:flex flex-col items-end text-[10px] opacity-70 leading-tight">
              {isElf ? (
                 <span className="font-serif italic text-red-200">Sleigh_Nav: ONLINE</span>
              ) : (
                 <span className="font-mono text-yellow-600">SECURE_CONNECTION: ESTABLISHED</span>
              )}
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl p-4 md:p-8 flex flex-col items-center z-20">
        
        {/* State 1: Setup Phase (Upload & Generate) */}
        {appState !== AppState.COMPLETE && (
          <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Small Clock for Setup */}
             <div className={`mb-12 border-b pb-8 flex flex-col items-center ${borderColorClass}`}>
                <div className={`${isElf ? 'text-red-400 font-serif italic text-lg' : 'text-red-600 uppercase tracking-[0.5em] text-xs font-bold'} mb-4 animate-pulse`}>
                  {isElf ? "Time until Santa arrives..." : "Time Remaining Until Target"}
                </div>
                <Clock targetDate={targetChristmas} onTick={handleTick} variant="small" theme={theme} />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Upload Section */}
                <div className={`${containerClass} border p-1 relative group transition-colors duration-500`}>
                  {/* Corners */}
                  {!isElf && (
                    <>
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500"></div>
                    </>
                  )}
                  {isElf && (
                     <div className="absolute -top-2 -left-2 text-red-500"><Snowflake size={24} /></div>
                  )}

                  <h2 className={`${isElf ? 'bg-emerald-800 text-emerald-100 font-serif' : 'bg-gray-800 text-gray-400 font-mono tracking-wider'} text-xs px-2 py-1 absolute -top-3 left-4 uppercase`}>
                    {isElf ? "Nice List Candidate" : "Subject Intel Source"}
                  </h2>

                  {!uploadedImage ? (
                    <div 
                      className={`h-96 border-2 border-dashed ${isElf ? 'border-emerald-700' : 'border-gray-700'} flex flex-col items-center justify-center cursor-pointer ${dropZoneHoverClass} transition-all`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      <Upload className={`w-16 h-16 mb-6 transition-colors ${isElf ? 'text-emerald-600 group-hover:text-red-500' : 'text-gray-600 group-hover:text-yellow-500'}`} />
                      <p className={`${accentColorClass} ${isElf ? 'font-serif text-lg' : 'font-mono text-sm uppercase tracking-widest'} mb-2`}>
                        {isElf ? "Upload Your Photo" : "Upload Subject Image"}
                      </p>
                      <p className={`opacity-60 text-xs ${isElf ? 'font-sans' : 'font-mono'}`}>Format: JPG, PNG // Max Size: 5MB</p>
                    </div>
                  ) : (
                    <div className="h-96 relative bg-black overflow-hidden">
                      <img src={uploadedImage} alt="Preview" className={`w-full h-full object-cover opacity-80 ${isElf ? '' : 'grayscale'}`} />
                      <button onClick={reset} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-sm backdrop-blur-sm transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status / Action Section */}
                <div className="flex flex-col justify-center gap-6">
                   <div className={`${isElf ? 'bg-emerald-900/50' : 'bg-black'} border ${borderColorClass} p-6 relative`}>
                      <h3 className={`${isElf ? 'text-emerald-300 font-serif' : 'text-gray-500 uppercase tracking-widest font-mono'} text-sm mb-4 border-b ${borderColorClass} pb-2`}>
                        {isElf ? "Workshop Parameters" : "Protocol Parameters"}
                      </h3>
                      <ul className={`space-y-3 text-xs md:text-sm ${isElf ? 'font-sans text-emerald-100' : 'font-mono text-gray-400'}`}>
                        <li className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full ${isElf ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                          <span>{isElf ? "Transform into Buddy the Elf" : "Reconstruct Subject identity to CTU Agent profile"}</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full ${isElf ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                          <span>{isElf ? "Apply 'North Pole' magic filter" : "Apply Season 1 atmospheric filters (Blue/Noir)"}</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full ${isElf ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                          <span>{isElf ? "Sync Countdown to Santa's Arrival" : "Synchronize Christmas Countdown Timer"}</span>
                        </li>
                      </ul>
                   </div>

                   <button 
                     disabled={!uploadedImage || appState === AppState.PROCESSING}
                     onClick={handleGenerate}
                     className={`
                        h-16 w-full font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group rounded-md
                        ${!uploadedImage ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : `${buttonBgClass} ${buttonTextClass} shadow-lg`}
                     `}
                   >
                     {appState === AppState.PROCESSING ? (
                       <>
                         <span className="animate-spin"><RefreshCw size={20} /></span>
                         <span>{isElf ? "Making Toys..." : "Processing Intel..."}</span>
                         <div className="absolute bottom-0 left-0 h-1 bg-white animate-loading-bar w-full"></div>
                       </>
                     ) : (
                       <>
                         {isElf ? <Gift size={20} /> : <ShieldCheck size={20} />}
                         <span>{isElf ? "Spread Cheer" : "Initiate Protocol"}</span>
                       </>
                     )}
                   </button>

                   {appState === AppState.ERROR && (
                      <div className="bg-red-900/20 border border-red-500/50 p-4 flex items-center gap-3 text-red-400">
                        <AlertTriangle size={24} className="shrink-0" />
                        <div className="flex flex-col">
                            <span className="uppercase text-xs tracking-wider font-bold mb-1">Transmission Failed</span>
                            <span className="text-xs opacity-80">{errorMessage || "Unknown error occurred."}</span>
                        </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* State 2: Final Output (Cinematic View) */}
        {appState === AppState.COMPLETE && generatedImage && (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
            
            {/* The Cinematic Container */}
            <div className={`relative w-full max-w-5xl aspect-[9/16] md:aspect-[16/9] ${isElf ? 'bg-emerald-900 border-4 border-red-900' : 'bg-black border-4 border-gray-900'} shadow-2xl overflow-hidden group`}>
               
               {/* Main Image */}
               <img src={generatedImage} alt="Protocol Result" className="w-full h-full object-contain md:object-cover" />
               
               {/* Vignette Overlay */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>

               {/* UI Overlay: Top Left */}
               <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
                  <div className={`${isElf ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'} text-xs font-bold px-2 py-0.5 inline-block w-max`}>
                     {isElf ? "SANTA CAM" : "LIVE FEED"}
                  </div>
                  <div className={`${isElf ? 'text-white/80' : 'text-yellow-500/80'} text-[10px] tracking-widest font-mono`}>
                     {isElf ? "WORKSHOP // SECTOR 7" : "CAM_2A // SECTOR 4"}
                  </div>
               </div>

               {/* UI Overlay: Bottom - THE COUNTDOWN */}
               <div className="absolute bottom-8 left-0 w-full flex flex-col items-center justify-center z-10 pointer-events-none">
                  <div className={`${isElf ? 'bg-red-900/80 border-white/30' : 'bg-black/60 border-yellow-500/30'} backdrop-blur-sm px-6 py-2 border rounded-lg flex flex-col items-center shadow-lg`}>
                    <p className={`${isElf ? 'text-white font-serif italic' : 'text-yellow-600 font-mono uppercase tracking-[0.5em] text-[8px] md:text-[10px]'} mb-1 animate-pulse`}>
                       {isElf ? "Countdown to Christmas" : "Time Remaining"}
                    </p>
                    <Clock targetDate={targetChristmas} onTick={handleTick} variant="large" theme={theme} />
                  </div>
               </div>

               {/* Interactive Controls (Hover to reveal) */}
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-50">
                  <button 
                    onClick={handleShare}
                    className={`${buttonBgClass} ${buttonTextClass} p-3 rounded-full shadow-lg transition-transform hover:scale-110`}
                    title="Share"
                  >
                    <Share2 size={20} />
                  </button>
                  <a 
                    href={generatedImage} 
                    download={`protocol-${theme.toLowerCase()}.png`}
                    className={`${buttonBgClass} ${buttonTextClass} p-3 rounded-full shadow-lg transition-transform hover:scale-110`}
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                  <button 
                    onClick={reset}
                    className="bg-white hover:bg-gray-200 text-black p-3 rounded-full shadow-lg transition-transform hover:scale-110"
                    title="New Protocol"
                  >
                    <RefreshCw size={20} />
                  </button>
               </div>
            </div>

            <div className="mt-8 text-center space-y-2 opacity-70">
              <p className={`text-xs uppercase tracking-widest ${isElf ? 'font-serif text-red-200' : 'font-mono text-gray-500'}`}>
                 {isElf ? "The best way to spread Christmas cheer is singing loud for all to hear." : "The following takes place between now and Christmas Day."}
              </p>
            </div>

          </div>
        )}

      </main>
      
      {/* Sound Effect Visualizer Line at Bottom */}
      <div className={`fixed bottom-0 left-0 w-full h-1 transition-colors duration-75 ${tickActive ? (isElf ? 'bg-red-500' : 'bg-yellow-500') : 'bg-transparent'}`}></div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); transform-origin: right; }
        }
      `}</style>
    </div>
  );
};

export default App;