
import React, { useState } from 'react';
import { ArrowLeft, Clapperboard, Film, Play, Loader2, Video, Maximize2, Smartphone, Monitor } from 'lucide-react';
import { useForge } from '../hooks/useForge';

interface Props {
  onBack: () => void;
}

const ForgeMode: React.FC<Props> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const { generate, loading, rendering, progress, videoUri, error } = useForge();

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-orange">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <Clapperboard className="text-nexus-orange" size={28} />
          <h2 className="text-3xl font-bold tracking-wider text-nexus-orange">THE FORGE</h2>
        </div>
        <span className="bg-nexus-orange/10 text-nexus-orange text-xs font-mono px-2 py-1 rounded border border-nexus-orange/20">
            VEO ENGINE ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Prompt Input */}
           <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 shadow-lg">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">
                 Production Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene (e.g., 'Cyberpunk city flyover at night, neon rain, cinematic lighting')..."
                className="w-full bg-black/50 text-white p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-orange resize-none h-40 scrollbar-thin scrollbar-thumb-gray-700 font-sans mb-4"
              />
              
              <div className="flex justify-between items-center mb-6">
                 <span className="text-xs font-mono text-gray-500">FORMAT</span>
                 <div className="flex space-x-2 bg-black/30 p-1 rounded-lg border border-white/5">
                    <button 
                       onClick={() => setAspectRatio('16:9')}
                       className={`p-2 rounded flex items-center space-x-2 transition-all ${aspectRatio === '16:9' ? 'bg-nexus-orange text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                       title="Landscape (16:9)"
                    >
                       <Monitor size={16} />
                       <span className="text-xs">16:9</span>
                    </button>
                    <button 
                       onClick={() => setAspectRatio('9:16')}
                       className={`p-2 rounded flex items-center space-x-2 transition-all ${aspectRatio === '9:16' ? 'bg-nexus-orange text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                       title="Portrait (9:16)"
                    >
                       <Smartphone size={16} />
                       <span className="text-xs">9:16</span>
                    </button>
                 </div>
              </div>

              <button
                onClick={() => generate(prompt, aspectRatio)}
                disabled={loading || !prompt.trim()}
                className={`w-full py-4 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center space-x-2 ${
                  loading 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-nexus-orange text-black hover:bg-orange-400 hover:shadow-[0_0_20px_#ff5f1f]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>RENDERING...</span>
                  </>
                ) : (
                  <>
                    <Film size={20} />
                    <span>GENERATE VIDEO</span>
                  </>
                )}
              </button>
           </div>
           
           {/* Instructions / Info */}
           <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-sm text-gray-400 leading-relaxed">
              <h4 className="text-nexus-orange font-bold uppercase tracking-widest text-xs mb-2">Veo Capabilities</h4>
              <p>Generates high-definition video from text. Rendering typically takes 10-20 seconds. Use specific descriptions for lighting, camera movement, and style.</p>
           </div>
        </div>

        {/* Right Column: The Monitor */}
        <div className="lg:col-span-2 flex flex-col">
           <div className="flex-1 bg-black border-2 border-gray-800 rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
              
              {/* Monitor Bezel Header */}
              <div className="h-8 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center px-4">
                 <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                 </div>
                 <span className="text-[10px] font-mono text-gray-600 tracking-widest">OUTPUT MONITOR A</span>
              </div>

              {/* Screen Area */}
              <div className="flex-1 relative flex items-center justify-center bg-[#050505]">
                 
                 {/* Empty State */}
                 {!videoUri && !rendering && (
                    <div className="flex flex-col items-center text-gray-700 space-y-4">
                       <Video size={64} strokeWidth={1} />
                       <span className="font-mono text-sm tracking-wider">NO SIGNAL INPUT</span>
                    </div>
                 )}

                 {/* Rendering State */}
                 {rendering && (
                    <div className="w-full max-w-md p-8 flex flex-col items-center space-y-6">
                       <div className="relative w-24 h-24 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-gray-800"></div>
                          <div className="absolute inset-0 rounded-full border-t-2 border-nexus-orange animate-spin"></div>
                          <span className="text-nexus-orange font-bold font-mono">{progress}%</span>
                       </div>
                       <div className="w-full space-y-2">
                          <div className="flex justify-between text-xs text-nexus-orange font-mono">
                             <span>PROCESSING FRAMES</span>
                             <span>VEO-3.1</span>
                          </div>
                          <div className="h-1 bg-gray-800 w-full rounded-full overflow-hidden">
                             <div className="h-full bg-nexus-orange transition-all duration-200" style={{ width: `${progress}%` }}></div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Result Player */}
                 {videoUri && !rendering && (
                    <div className={`relative ${aspectRatio === '9:16' ? 'h-full w-auto aspect-[9/16] py-4' : 'w-full aspect-video'}`}>
                       <video 
                          src={videoUri} 
                          controls 
                          autoPlay 
                          loop 
                          className="w-full h-full object-contain shadow-[0_0_50px_rgba(255,95,31,0.1)]"
                       />
                       
                       <div className="absolute top-4 right-4 bg-nexus-orange/90 text-black text-[10px] font-bold px-2 py-1 rounded">
                          GENERATED
                       </div>
                    </div>
                 )}

                 {/* Error State */}
                 {error && (
                    <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center backdrop-blur-sm">
                       <div className="text-red-500 flex flex-col items-center space-y-2 p-6 bg-black border border-red-500/30 rounded-xl">
                          <span className="font-bold tracking-widest">RENDER FAILED</span>
                          <span className="text-sm font-mono">{error}</span>
                       </div>
                    </div>
                 )}

              </div>
              
           </div>
        </div>

      </div>
    </div>
  );
};

export default ForgeMode;
