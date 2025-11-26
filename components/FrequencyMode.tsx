
import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Activity, Radio, Volume2 } from 'lucide-react';
import { useLiveAudio } from '../hooks/useLiveAudio';

interface Props {
  onBack: () => void;
}

const Visualizer: React.FC<{ analyser: AnalyserNode | null, isConnected: boolean }> = ({ analyser, isConnected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Resize handling
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 300;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isConnected) {
         // Idle Pulse
         const time = Date.now() / 1000;
         ctx.beginPath();
         ctx.arc(centerX, centerY, radius * 0.5 + Math.sin(time * 2) * 10, 0, 2 * Math.PI);
         ctx.strokeStyle = '#333';
         ctx.lineWidth = 2;
         ctx.stroke();
         return;
      }

      if (analyser) {
         const bufferLength = analyser.frequencyBinCount;
         const dataArray = new Uint8Array(bufferLength);
         analyser.getByteFrequencyData(dataArray);

         ctx.beginPath();
         ctx.strokeStyle = '#00d9ff';
         ctx.lineWidth = 3;

         // Draw circular waveform
         for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const val = dataArray[i] / 255.0; // 0.0 to 1.0
            // const freqOffset = val * 50;
            
            // Mirror logic for symmetry
            const r = radius * 0.6 + (val * radius * 0.4);
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
         }
         ctx.closePath();
         ctx.stroke();

         // Inner glow
         ctx.beginPath();
         const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
         ctx.arc(centerX, centerY, radius * 0.4 + (avg / 255 * 30), 0, 2 * Math.PI);
         ctx.fillStyle = `rgba(0, 217, 255, ${Math.max(0.1, avg / 255 * 0.5)})`;
         ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, isConnected]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

const FrequencyMode: React.FC<Props> = ({ onBack }) => {
  const { isConnected, isSpeaking, error, connect, disconnect, analyser } = useLiveAudio();

  const toggleConnection = () => {
    if (isConnected) disconnect();
    else connect();
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-cyan">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <Activity className="text-nexus-cyan" size={28} />
          <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-nexus-cyan">THE FREQUENCY</h2>
        </div>
      </div>
      <p className="text-gray-400 text-xs md:text-sm font-mono tracking-wide ml-14">
        Real-time low-latency neural voice interface
      </p>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
        
        {/* Central Visualizer */}
        <div className="relative w-full max-w-[300px] aspect-square md:max-w-md">
           <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-1000 ${isConnected ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`}></div>
           <div className={`absolute inset-0 rounded-full border border-nexus-cyan/20 blur-md transition-all duration-500 ${isSpeaking ? 'scale-110 opacity-80' : 'scale-100 opacity-20'}`}></div>
           
           <Visualizer analyser={analyser} isConnected={isConnected} />
        </div>

        {/* Status Text */}
        <div className="mt-8 font-mono text-sm tracking-[0.2em] h-6">
           {error ? (
              <span className="text-red-500 animate-pulse text-xs">{error}</span>
           ) : isConnected ? (
              isSpeaking ? (
                 <span className="text-nexus-cyan text-glow-cyan animate-pulse">TRANSMITTING...</span>
              ) : (
                 <span className="text-gray-500">LISTENING...</span>
              )
           ) : (
              <span className="text-gray-600">CHANNEL CLOSED</span>
           )}
        </div>

      </div>

      {/* Controls */}
      <div className="flex justify-center pb-12">
         <button 
            onClick={toggleConnection}
            className={`
               group relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300
               ${isConnected 
                  ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                  : 'border-nexus-cyan bg-nexus-cyan/10 hover:bg-nexus-cyan/20 hover:shadow-neon-cyan'
               }
            `}
         >
            {isConnected ? (
               <MicOff size={32} className="text-red-500" />
            ) : (
               <Mic size={32} className="text-nexus-cyan" />
            )}
            
            <div className={`absolute -bottom-10 text-[10px] font-bold tracking-widest uppercase transition-colors ${isConnected ? 'text-red-500' : 'text-nexus-cyan'}`}>
               {isConnected ? 'Disconnect' : 'Connect'}
            </div>
         </button>
      </div>

    </div>
  );
};

export default FrequencyMode;
