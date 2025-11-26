
import React, { useEffect } from 'react';
import { ArrowLeft, Ghost, ScanFace, Sparkles, AlertTriangle, TrendingUp, Brain, ShieldCheck } from 'lucide-react';
import { useMirror } from '../hooks/useMirror';

interface Props {
  onBack: () => void;
}

const MirrorMode: React.FC<Props> = ({ onBack }) => {
  const { loading, analysis, error, analyzeSystem } = useMirror();

  // Auto-start analysis on mount
  useEffect(() => {
    analyzeSystem();
  }, []);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20 text-nexus-slate">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-slate">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <Ghost className="text-nexus-slate" size={28} />
          <h2 className="text-3xl font-bold tracking-wider text-nexus-slate">THE MIRROR</h2>
        </div>
        <span className="bg-nexus-slate/10 text-nexus-slate text-xs font-mono px-2 py-1 rounded border border-nexus-slate/20">
            META-COGNITION MODULE
        </span>
      </div>

      <div className="flex flex-col gap-6 h-full">
        
        {loading && (
           <div className="flex flex-col items-center justify-center h-64 space-y-6">
              <ScanFace size={64} className="text-nexus-slate animate-pulse" strokeWidth={1} />
              <div className="font-mono text-sm tracking-[0.2em] text-nexus-slate">
                 ANALYZING NEURAL PATHWAYS...
              </div>
              <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-nexus-slate animate-shimmer"></div>
              </div>
           </div>
        )}

        {error && (
           <div className="p-6 bg-red-900/10 border border-red-500/30 rounded-xl flex flex-col items-center justify-center space-y-4 text-center">
              <AlertTriangle size={32} className="text-red-500" />
              <p className="text-red-400 font-mono text-sm">{error}</p>
              <button onClick={analyzeSystem} className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-300 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                 Retry Diagnostics
              </button>
           </div>
        )}

        {analysis && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
              
              {/* Score Card */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-nexus-panel border border-nexus-slate/30 rounded-xl p-8 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(148,163,184,0.1)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-nexus-slate/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                       <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="64" cy="64" r="60" className="stroke-gray-800 fill-none" strokeWidth="8" />
                          <circle 
                            cx="64" cy="64" r="60" 
                            className="stroke-nexus-slate fill-none transition-all duration-1000" 
                            strokeWidth="8" 
                            strokeDasharray={377} 
                            strokeDashoffset={377 - (377 * (analysis.cognitiveIntegrityScore || 0) / 100)} 
                            strokeLinecap="round"
                          />
                       </svg>
                       <span className="text-4xl font-bold text-white">{analysis.cognitiveIntegrityScore}%</span>
                    </div>
                    <h3 className="text-nexus-slate font-bold uppercase tracking-widest text-xs">Cognitive Integrity</h3>
                 </div>

                 <div className="bg-nexus-panel border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                       <ShieldCheck size={14} />
                       <span>Detected Biases</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                       {(analysis.detectedBiases || []).map((bias, i) => (
                          <span key={i} className="px-3 py-1 bg-red-900/20 border border-red-500/20 text-red-300 rounded text-xs font-mono">
                             {bias}
                          </span>
                       ))}
                       {(!analysis.detectedBiases || analysis.detectedBiases.length === 0) && (
                          <span className="text-gray-600 text-xs italic">No significant biases detected.</span>
                       )}
                    </div>
                 </div>
              </div>

              {/* Analysis Details */}
              <div className="lg:col-span-2 space-y-6">
                 
                 {/* Failures & Corrections */}
                 <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Brain size={100} className="text-nexus-slate" />
                    </div>
                    <h3 className="text-nexus-slate font-bold uppercase tracking-widest text-sm mb-6 border-b border-white/10 pb-4">
                       Reasoning Analysis
                    </h3>
                    
                    <div className="space-y-4">
                       {(!analysis.reasoningFailures || analysis.reasoningFailures.length === 0) ? (
                          <div className="text-gray-500 text-sm font-mono p-4 border border-white/5 rounded">
                             Systems nominal. No critical logic failures detected in recent logs.
                          </div>
                       ) : (
                          analysis.reasoningFailures.map((item, i) => (
                             <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-4 space-y-2">
                                <div className="text-xs text-gray-500 font-mono uppercase">Context: {item.context}</div>
                                <div className="text-red-400 text-sm font-bold flex items-start gap-2">
                                   <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                   <span>Flaw: {item.flaw}</span>
                                </div>
                                <div className="text-green-400 text-sm flex items-start gap-2 pl-5 border-l border-white/10 ml-0.5">
                                   <Sparkles size={14} className="mt-0.5 shrink-0" />
                                   <span>Correction: {item.correction}</span>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 {/* Patterns & Improvements */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-nexus-panel border border-white/10 rounded-xl p-6">
                       <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Emerging Patterns</h3>
                       <ul className="space-y-2">
                          {(analysis.emergingPatterns || []).map((pat, i) => (
                             <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-nexus-slate">•</span>
                                {pat}
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div className="bg-nexus-panel border border-nexus-slate/30 rounded-xl p-6">
                       <h3 className="text-nexus-slate font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                          <TrendingUp size={14} />
                          <span>Self-Improvement Protocol</span>
                       </h3>
                       <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                          {analysis.selfImprovementPlan || "No protocol generated."}
                       </p>
                    </div>
                 </div>

              </div>

           </div>
        )}

      </div>
    </div>
  );
};

export default MirrorMode;
