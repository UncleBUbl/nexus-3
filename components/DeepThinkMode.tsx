
import React, { useState } from 'react';
import { ArrowLeft, BrainCircuit, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Send, Loader2, Terminal, Code2 } from 'lucide-react';
import { useDeepThink } from '../hooks/useDeepThink';
import { ReasoningStep } from '../types';

interface Props {
  onBack: () => void;
}

// Simple parser for bold text, code blocks, and newlines
const RichTextRenderer: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-nexus-cyan font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-white/10 text-nexus-blue px-1 rounded font-mono text-sm">{part.slice(1, -1)}</code>;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

// Sub-component for individual, collapsible reasoning steps
const ReasoningStepItem: React.FC<{ step: ReasoningStep }> = ({ step }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`relative pl-6 border-l transition-colors duration-300 ${step.isError ? 'border-red-500/50' : 'border-nexus-cyan/30'}`}>
      <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${step.isError ? 'bg-red-500' : 'bg-nexus-cyan'} shadow-[0_0_8px_currentColor]`} />
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 mb-2 group cursor-pointer select-none focus:outline-none"
      >
        <span className={`text-xs font-bold uppercase tracking-wider ${step.isError ? 'text-red-400' : 'text-nexus-cyan'}`}>
          {step.step}
        </span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-300 ${step.isError ? 'text-red-400' : 'text-nexus-cyan'} opacity-50 group-hover:opacity-100 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 mb-6 space-y-3">
          <p className="text-gray-300 leading-relaxed opacity-90 text-sm font-light">
            {step.thought}
          </p>

          {step.code && (
            <div className="bg-[#0a0a0a] rounded-lg border border-white/5 overflow-hidden">
              <div className="flex items-center px-3 py-1 bg-white/5 border-b border-white/5 text-xs text-gray-500 gap-2">
                  <Code2 size={12} />
                  <span>PYTHON EXECUTED</span>
              </div>
              <div className="p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-800">
                <pre className="text-nexus-blue text-xs font-mono">{step.code}</pre>
              </div>
              {step.codeOutput && (
                <div className="border-t border-white/5">
                    <div className="flex items-center px-3 py-1 bg-white/5 border-b border-white/5 text-xs text-gray-500 gap-2">
                      <Terminal size={12} />
                      <span>OUTPUT</span>
                  </div>
                  <div className="p-3 bg-black/50 text-green-400 text-xs font-bold font-mono whitespace-pre-wrap">
                    {step.codeOutput}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DeepThinkMode: React.FC<Props> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(true);

  const { 
    loading, 
    reasoning, 
    confidenceScore, 
    finalAnswer, 
    error, 
    think 
  } = useDeepThink();
  
  // Check if we have results to show
  const hasResult = finalAnswer !== '' || reasoning.length > 0;

  const handleThink = () => {
    think(input);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 1. Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-cyan">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-3">
            <BrainCircuit className="text-nexus-cyan" size={28} />
            <h2 className="text-3xl font-bold tracking-wider text-nexus-cyan">THE ARCHITECT</h2>
          </div>
        </div>
        <p className="text-gray-400 text-sm font-mono tracking-wide ml-14">
          Deep reasoning engine with Python code execution
        </p>
      </div>

      {/* 2. Input Section */}
      <div className="bg-nexus-panel border border-white/10 rounded-xl p-1 shadow-lg relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a complex question (math, logic, data)..."
          className="w-full bg-black/50 text-white p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-cyan resize-none h-32 scrollbar-thin scrollbar-thumb-gray-700 font-sans"
        />
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleThink}
            disabled={loading || !input.trim()}
            className={`px-6 py-2 rounded-lg font-bold tracking-wide transition-all flex items-center space-x-2 ${
              loading 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-nexus-cyan text-black hover:shadow-neon-cyan hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>THINKING...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>THINK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {hasResult && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          
          {/* 3. Inner Monologue Section */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-nexus-panel">
            <button 
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BrainCircuit size={16} className="text-gray-400" />
                <span className="font-mono text-sm text-gray-400 uppercase tracking-widest">Inner Monologue</span>
              </div>
              {detailsOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            
            {detailsOpen && (
              <div className="p-6 pb-2 bg-black/40 font-mono text-sm border-t border-white/5 max-h-[600px] overflow-y-auto scrollbar-thin">
                {reasoning.map((step, idx) => (
                  <ReasoningStepItem key={idx} step={step} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* 4. Confidence Thermometer - Sticky Container */}
            <div className="md:col-span-1">
              <div className="sticky top-6 bg-nexus-panel border border-white/10 rounded-xl p-6 flex flex-col items-center space-y-6 shadow-2xl z-10">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center">Confidence Thermometer</h3>
                
                <div className="relative h-64 w-8 bg-gray-800 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  {/* Background grid lines for thermometer */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-between py-2 opacity-30 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-full h-px bg-white/50"></div>
                    ))}
                  </div>
                  
                  <div 
                    className={`absolute bottom-0 w-full transition-all duration-1000 ease-out ${
                      confidenceScore > 80 ? 'bg-gradient-to-t from-green-600 via-green-400 to-green-300 shadow-[0_0_20px_#4ade80]' :
                      confidenceScore > 50 ? 'bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-300' :
                      'bg-gradient-to-t from-red-600 via-red-400 to-red-300'
                    }`}
                    style={{ height: `${confidenceScore}%` }}
                  />
                </div>
                
                <div className="text-center">
                  <span className={`text-4xl font-bold font-mono ${
                     confidenceScore > 80 ? 'text-green-400 text-glow-green' :
                     confidenceScore > 50 ? 'text-yellow-400' :
                     'text-red-400'
                  }`}>
                    {confidenceScore}%
                  </span>
                  <div className="text-xs text-gray-600 mt-2 font-mono uppercase">Calculated Certainty</div>
                </div>
              </div>
            </div>

            {/* 5. Final Answer Section */}
            <div className="md:col-span-2 flex flex-col">
              <div className="flex-1 bg-nexus-panel border-2 border-green-500/50 rounded-xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <CheckCircle2 size={100} className="text-green-500" />
                </div>
                
                <h3 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-6 border-b border-green-500/30 pb-2 inline-block">
                  Final Answer
                </h3>
                
                <div className="relative z-10">
                  <RichTextRenderer 
                    text={finalAnswer} 
                    className="text-lg md:text-xl text-white leading-relaxed font-light" 
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DeepThinkMode;
