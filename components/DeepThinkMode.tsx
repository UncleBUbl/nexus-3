
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BrainCircuit, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Send, Loader2, Terminal, Code2, History, X, Clock, MessageSquarePlus, RotateCcw, Share2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useDeepThink } from '../hooks/useDeepThink';
import { ReasoningStep, DeepThinkSession, DeepThinkInteraction } from '../types';
import { useUser } from '../App';
import { useToast } from './Toast';

interface Props {
  onBack: () => void;
  initialPrompt?: string;
}

// Enhanced Parser for Better Readability
const RichTextRenderer: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
  if (!text) return null;
  // Replace newlines with breaks
  const lines = text.split('\n');
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, i) => {
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-2 mb-1">
              <span className="text-nexus-cyan">•</span>
              <span>{formatInline(line.trim().substring(2))}</span>
            </div>
          );
        }
        // Headers (Simple markdown style)
        if (line.trim().startsWith('### ')) {
            return <h4 key={i} className="text-nexus-cyan font-bold mt-4 mb-2 uppercase tracking-wide text-sm">{formatInline(line.substring(4))}</h4>
        }
        // Paragraphs
        if (line.trim() === '') return <div key={i} className="h-2"></div>;
        
        return <div key={i} className="mb-1">{formatInline(line)}</div>;
      })}
    </div>
  );
};

const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="text-nexus-cyan font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-white/10 text-nexus-blue px-1 rounded font-mono text-xs border border-white/5">{part.slice(1, -1)}</code>;
        }
        return <span key={index}>{part}</span>;
    });
};


const ReasoningStepItem: React.FC<{ step: ReasoningStep }> = ({ step }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative pl-6 border-l transition-colors duration-300 ${step.isError ? 'border-red-500/50' : 'border-nexus-cyan/30'}`}>
      <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${step.isError ? 'bg-red-500' : 'bg-nexus-cyan'} shadow-[0_0_8px_currentColor]`} />
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 mb-2 group cursor-pointer select-none focus:outline-none w-full text-left"
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
          <p className="text-gray-300 leading-relaxed opacity-90 text-sm font-light break-words">
            {step.thought}
          </p>

          {step.code && (
            <div className="bg-[#0a0a0a] rounded-lg border border-white/5 overflow-hidden">
              <div className="flex items-center px-3 py-1 bg-white/5 border-b border-white/5 text-xs text-gray-500 gap-2">
                  <Code2 size={12} />
                  <span>PYTHON EXECUTED</span>
              </div>
              <div className="p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-800">
                <pre className="text-nexus-blue text-xs font-mono whitespace-pre">{step.code}</pre>
              </div>
              {step.codeOutput && (
                <div className="border-t border-white/5">
                    <div className="flex items-center px-3 py-1 bg-white/5 border-b border-white/5 text-xs text-gray-500 gap-2">
                      <Terminal size={12} />
                      <span>OUTPUT</span>
                  </div>
                  <div className="p-3 bg-black/50 text-green-400 text-xs font-bold font-mono whitespace-pre-wrap break-all">
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

const InteractionBlock: React.FC<{ interaction: DeepThinkInteraction, isLatest: boolean }> = ({ interaction, isLatest }) => {
  const [detailsOpen, setDetailsOpen] = useState(isLatest);
  const { question, result } = interaction;
  
  // Guard against null result
  if (!result) return null;
  const { steps, confidence, finalAnswer } = result;

  return (
    <div className={`space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-12 ${!isLatest ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
      
      <div className="flex justify-end">
        <div className="max-w-[90%] md:max-w-[70%] bg-nexus-panel border border-nexus-cyan/30 rounded-2xl rounded-tr-sm p-4 md:p-6 relative shadow-lg">
          <div className="absolute -top-3 -right-2 bg-nexus-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 shadow-md">
             <MessageSquarePlus size={10} />
             <span>USER QUERY</span>
          </div>
          <p className="text-white text-sm md:text-lg font-light leading-relaxed">{question}</p>
        </div>
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-nexus-panel shadow-2xl">
        <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
          <div className="flex items-center space-x-3">
             <BrainCircuit size={20} className="text-nexus-cyan" />
             <span className="font-bold text-nexus-cyan tracking-wider text-sm hidden md:inline">ARCHITECT RESPONSE</span>
             <span className="font-bold text-nexus-cyan tracking-wider text-sm md:hidden">ARCHITECT</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 uppercase font-mono hidden sm:inline">Confidence</span>
                <span className={`text-sm font-mono font-bold ${confidence > 80 ? 'text-green-400' : confidence > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                   {confidence}%
                </span>
             </div>
             <button 
               onClick={() => setDetailsOpen(!detailsOpen)}
               className="text-gray-500 hover:text-white transition-colors"
             >
               {detailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
             </button>
          </div>
        </div>

        {detailsOpen && (
          <div className="p-4 md:p-6 space-y-6">
             <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-bold">Reasoning Process</h4>
                <div className="space-y-1">
                  {(steps || []).map((step, idx) => (
                    <ReasoningStepItem key={idx} step={step} />
                  ))}
                </div>
             </div>

             <div className="relative">
                <h4 className="text-[10px] text-green-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                   <CheckCircle2 size={12} />
                   <span>Optimal Solution</span>
                </h4>
                <div className="pl-4 border-l-2 border-green-500/50">
                  <RichTextRenderer 
                    text={finalAnswer} 
                    className="text-base md:text-lg text-white leading-relaxed font-light" 
                  />
                </div>
             </div>
          </div>
        )}

        {!detailsOpen && (
           <div className="p-4 bg-black/20 text-gray-400 text-sm line-clamp-2 italic font-light">
              {finalAnswer}
           </div>
        )}
      </div>
    </div>
  );
};

const DeepThinkMode: React.FC<Props> = ({ onBack, initialPrompt }) => {
  const [input, setInput] = useState(initialPrompt || '');
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { showToast } = useToast();

  const { 
    loading, 
    interactions, 
    error, 
    history,
    hasContext,
    think,
    loadSession,
    clearSession,
    deleteSession
  } = useDeepThink(user?.id);
  
  useEffect(() => {
    if (!loading) {
       bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interactions, loading]);

  useEffect(() => {
    if (initialPrompt && interactions.length === 0 && !loading) {
       think(initialPrompt);
    }
  }, [initialPrompt]);

  const handleThink = () => {
    think(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleThink();
    }
  };

  const handleLoadSession = (session: DeepThinkSession) => {
    loadSession(session);
    setShowSidebar(false);
    showToast("Session loaded from archives", "info");
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if(confirm("Delete this thread?")) {
      deleteSession(sessionId);
      showToast("Thread deleted from history");
    }
  };

  const handleShare = () => {
    if (interactions.length === 0) return;
    const lastQ = interactions[interactions.length - 1].question;
    const url = `${window.location.origin}?mode=DEEP_THINK&q=${encodeURIComponent(lastQ)}`;
    navigator.clipboard.writeText(url);
    showToast("Deep link copied to clipboard");
  };

  return (
    <div className="flex h-full max-w-7xl mx-auto relative overflow-hidden">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showSidebar ? 'mr-0 md:mr-[320px]' : ''}`}>
         
         <div className="p-4 flex flex-col h-full relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center space-x-4">
                  <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-cyan">
                     <ArrowLeft size={24} />
                  </button>
                  <div className="flex flex-col">
                     <h2 className="text-xl md:text-2xl font-bold tracking-wider text-nexus-cyan flex items-center gap-2">
                        <BrainCircuit size={28} />
                        THE ARCHITECT
                     </h2>
                     <span className="text-xs text-gray-500 font-mono hidden md:inline">SYSTEM 2 REASONING ENGINE</span>
                  </div>
               </div>
               
               <div className="flex gap-2">
                  {hasContext && (
                     <>
                        <button onClick={handleShare} className="p-2 text-nexus-cyan hover:bg-nexus-cyan/10 rounded-lg transition-colors" title="Share">
                           <Share2 size={20} />
                        </button>
                        <button onClick={clearSession} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="New">
                           <RotateCcw size={20} />
                        </button>
                     </>
                  )}
                  <button 
                     onClick={() => setShowSidebar(!showSidebar)}
                     className={`p-2 rounded-lg transition-colors flex items-center gap-2 border ${showSidebar ? 'bg-white/10 text-white border-white/20' : 'text-gray-400 border-transparent hover:bg-white/5'}`}
                  >
                     {showSidebar ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                  </button>
               </div>
            </div>

            {/* Scrollable Conversation Feed */}
            <div className="flex-1 overflow-y-auto px-2 pb-48 scrollbar-thin scrollbar-thumb-gray-800">
               {interactions.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-600 space-y-4 opacity-50 mt-12">
                     <BrainCircuit size={64} strokeWidth={1} />
                     <p className="font-mono tracking-widest text-sm text-center px-4">AWAITING COMPLEX QUERY INPUT...</p>
                  </div>
               )}
               {interactions.map((interaction, idx) => (
                  <InteractionBlock key={interaction.id} interaction={interaction} isLatest={idx === interactions.length - 1} />
               ))}
               {loading && (
                  <div className="flex justify-center py-12">
                     <div className="flex flex-col items-center space-y-4">
                        <Loader2 size={32} className="text-nexus-cyan animate-spin" />
                        <span className="text-nexus-cyan font-mono text-xs tracking-[0.2em] animate-pulse">REASONING IN PROGRESS...</span>
                     </div>
                  </div>
               )}
               <div ref={bottomRef} />
            </div>

            {/* Fixed Input Area */}
            <div className="fixed bottom-0 left-0 right-0 z-30">
               {/* Stronger gradient mask to hide scrolling content */}
               <div className="absolute inset-0 bg-gradient-to-t from-nexus-black via-nexus-black/95 to-transparent h-[140%] -top-[40%] pointer-events-none" />
               
               <div className="relative max-w-5xl mx-auto px-4 pb-6 pt-4">
                  <div className={`bg-[#0a0a0a] border rounded-xl p-1 shadow-2xl relative transition-all duration-300 ${hasContext ? 'border-nexus-cyan/50 shadow-[0_0_30px_rgba(0,217,255,0.15)]' : 'border-white/10'}`}>
                     <div className="relative">
                        <textarea
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           onKeyDown={handleKeyDown}
                           placeholder={hasContext ? "Follow up on this reasoning..." : "Ask a complex question..."}
                           className="w-full bg-black/80 text-white p-4 pr-32 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-cyan resize-none h-16 md:h-24 scrollbar-thin font-sans text-sm md:text-base backdrop-blur-md"
                           autoFocus
                        />
                        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                           <button
                              onClick={handleThink}
                              disabled={loading || !input.trim()}
                              className={`px-4 py-2 rounded-lg font-bold tracking-wide transition-all flex items-center space-x-2 text-sm ${
                                 loading ? 'bg-gray-800 text-gray-500' : 'bg-nexus-cyan text-black hover:scale-105'
                              }`}
                           >
                              <Send size={16} />
                              <span className="hidden sm:inline">{hasContext ? 'REPLY' : 'THINK'}</span>
                           </button>
                        </div>
                     </div>
                  </div>
                  {error && (
                     <div className="absolute -top-10 left-0 right-0 mx-auto w-max max-w-[90%] p-2 bg-red-900/90 border border-red-500/50 text-red-200 rounded-lg flex items-center space-x-2 text-xs backdrop-blur-md">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="truncate">{error}</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Right Sidebar for History */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[320px] bg-[#0c0c0c] border-l border-white/10 transform transition-transform duration-300 z-40 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
               <h3 className="font-bold text-gray-200 tracking-wider text-sm flex items-center gap-2">
                  <History size={16} />
                  THREADS
               </h3>
               <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {history.length === 0 ? (
                  <div className="text-center text-gray-600 mt-10 font-mono text-xs">NO ARCHIVES</div>
               ) : (
                  history.map((session) => (
                     <div key={session.id} className="relative group">
                         <button 
                            onClick={() => handleLoadSession(session)}
                            className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-nexus-cyan/30 rounded-lg p-3 transition-all"
                         >
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                               <span className="text-[10px] bg-black px-1.5 rounded text-gray-400">{session.interactions.length}</span>
                            </div>
                            <h4 className="text-xs font-bold text-gray-300 group-hover:text-nexus-cyan line-clamp-2 pr-6">
                               {session.title}
                            </h4>
                         </button>
                         <button 
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="absolute right-2 bottom-3 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Thread"
                         >
                            <X size={14} />
                         </button>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default DeepThinkMode;
