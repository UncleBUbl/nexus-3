import React from 'react';
import { ArrowLeft, Camera, Eye, Zap, Aperture } from 'lucide-react';
import { useVibe } from '../hooks/useVibe';
import { VibeLevel } from '../types';

interface Props {
  onBack: () => void;
}

const VibeMode: React.FC<Props> = ({ onBack }) => {
  const {
    videoRef,
    canvasRef,
    streamActive,
    level,
    setLevel,
    analyzing,
    result,
    captureAndAnalyze
  } = useVibe();

  const getLevelLabel = (l: VibeLevel) => {
    switch(l) {
      case VibeLevel.LITERAL: return "LEVEL 1: LITERAL";
      case VibeLevel.CONTEXTUAL: return "LEVEL 2: CONTEXTUAL";
      case VibeLevel.ABSTRACT: return "LEVEL 3: ABSTRACT";
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in duration-500">
       {/* Header */}
       <div className="flex items-center space-x-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-purple">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-2">
          <Eye className="text-nexus-purple" />
          <h2 className="text-2xl font-bold tracking-wider text-nexus-purple">VIBE CHECK // THE LENS</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: Camera & Controls */}
        <div className="space-y-6">
          {/* Responsive Camera Container */}
          <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video group shadow-2xl">
            
            {/* Visual Indicator: Active Border & Glow */}
            <div className={`absolute inset-0 z-10 pointer-events-none rounded-xl border-2 transition-all duration-500 ${
                streamActive 
                  ? 'border-nexus-purple shadow-[0_0_20px_rgba(157,78,221,0.4)]' 
                  : 'border-white/10'
            }`} />
            
            {/* Pulsing Overlay when Active */}
            {streamActive && !analyzing && (
               <div className="absolute inset-0 z-10 pointer-events-none rounded-xl border border-nexus-purple/60 animate-pulse shadow-[inset_0_0_30px_rgba(157,78,221,0.2)]"></div>
            )}

            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-30'}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {!streamActive && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-sm tracking-wider">
                [ CAMERA INACTIVE ]
              </div>
            )}

            {/* Scanner Overlay Animation */}
            {streamActive && !analyzing && (
              <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10 z-0"></div>
            )}
            
            {/* Analyzing State Overlay */}
            {analyzing && (
               <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center space-y-2 backdrop-blur-sm">
                 <Aperture className="animate-spin text-nexus-purple" size={48} />
                 <span className="text-nexus-purple font-mono animate-pulse tracking-widest text-sm">READING PHOTONS...</span>
               </div>
            )}
          </div>

          {/* Slider Control */}
          <div className="bg-nexus-panel p-4 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-gray-400 font-mono mb-2">
              <span>OBJECTIVE</span>
              <span>EMOTIONAL</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="1"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) as VibeLevel)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nexus-purple focus:outline-none focus:ring-2 focus:ring-nexus-purple/50"
            />
            <div className="text-center mt-3 font-bold text-nexus-purple tracking-widest text-sm">
              {getLevelLabel(level)}
            </div>
          </div>

          <button 
            onClick={captureAndAnalyze}
            disabled={analyzing || !streamActive}
            className={`w-full py-4 font-bold tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 ${
               analyzing || !streamActive
               ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
               : 'bg-nexus-purple text-white hover:bg-purple-600 hover:shadow-neon-purple'
            }`}
          >
            <Camera size={20} />
            <span>CAPTURE & ANALYZE</span>
          </button>
        </div>

        {/* Right Col: Analysis Results */}
        <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 min-h-[400px] flex flex-col">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
              <Eye size={48} />
              <div className="text-sm font-mono italic">Ready for visual input...</div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Visual Interpretation</h3>
                <p className="text-lg text-white leading-relaxed font-light">"{result.description}"</p>
              </div>

              {result.interpretation && (
                <div>
                   <h3 className="text-xs font-bold text-nexus-purple uppercase tracking-widest mb-1">Contextual Layer</h3>
                   <p className="text-gray-300 border-l-2 border-nexus-purple/30 pl-3">{result.interpretation}</p>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Vibe Metrics</h3>
                 <div className="space-y-3">
                    <MetricBar label="Energy" value={result.scores.energy} color="bg-yellow-400" />
                    <MetricBar label="Mood" value={result.scores.mood} color="bg-pink-400" />
                    <MetricBar label="Clarity" value={result.scores.clarity} color="bg-blue-400" />
                 </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Suggested Action</h3>
                <div className="flex items-center space-x-3 text-nexus-purple bg-nexus-purple/10 p-4 rounded-lg border border-nexus-purple/20">
                  <Zap size={20} />
                  <span className="font-bold text-lg tracking-wide">{result.suggestedAction}</span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const MetricBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="flex items-center space-x-3">
    <span className="w-16 text-xs font-mono text-gray-400 uppercase">{label}</span>
    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} shadow-[0_0_8px_currentColor]`} style={{ width: `${value * 10}%` }} />
    </div>
    <span className="text-xs font-mono text-white w-4 text-right">{value}</span>
  </div>
);

export default VibeMode;