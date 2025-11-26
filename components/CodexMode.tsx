
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileCode, Upload, FileText, Send, Trash2, Database, Loader2, Cpu, Code, MessageSquare, Sparkles, Check, Clock } from 'lucide-react';
import { useCodex } from '../hooks/useCodex';

interface Props {
  onBack: () => void;
  initialPrompt?: string;
}

const CodexMode: React.FC<Props> = ({ onBack, initialPrompt }) => {
  const [input, setInput] = useState(initialPrompt || '');
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    files, 
    history, 
    loading, 
    ingesting, 
    error, 
    editorCode,
    setEditorCode,
    suggestion,
    setSuggestion,
    isCompleting,
    completeCode,
    ingestFile, 
    ask, 
    clearSession 
  } = useCodex();

  useEffect(() => {
    if (initialPrompt && files.length > 0 && !loading) {
       ask(initialPrompt);
    }
  }, [files, initialPrompt]);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      ingestFile(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      ask(input);
      setInput('');
    }
  };

  const handleApplySuggestion = () => {
    setEditorCode(prev => prev + suggestion);
    setSuggestion('');
    setTimeout(() => editorRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-crimson">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-3">
            <FileCode className="text-nexus-crimson" size={28} />
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-nexus-crimson">THE CODEX</h2>
          </div>
          <span className="bg-nexus-crimson/10 text-nexus-crimson text-xs font-mono px-2 py-1 rounded border border-nexus-crimson/20 hidden md:inline">
              LONG CONTEXT ANALYZER
          </span>
        </div>
        
        {files.length > 0 && (
          <button 
            onClick={clearSession}
            className="flex items-center space-x-2 text-xs font-bold text-red-500 hover:text-white transition-colors uppercase tracking-wider"
          >
            <Trash2 size={14} />
            <span>Purge Archives</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-150px)]">
        
        {/* Left Col: Ingestion Zone */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          
          {/* Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-nexus-crimson rounded-xl p-6 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all hover:bg-white/5 group h-48 lg:h-auto lg:flex-1 min-h-[12rem]"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="p-4 bg-nexus-crimson/10 rounded-full text-nexus-crimson group-hover:scale-110 transition-transform">
              {ingesting ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
            </div>
            <div className="text-center">
              <span className="text-white font-bold block text-sm">INGEST DATA</span>
              <span className="text-gray-500 text-xs font-mono">ALL FORMATS ACCEPTED</span>
            </div>
          </div>

          {/* File List */}
          <div className="flex-none lg:flex-1 bg-nexus-panel border border-white/10 rounded-xl p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 max-h-48 lg:max-h-none">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Database size={14} />
                <span>Active Context</span>
             </div>
             
             {files.length === 0 ? (
               <div className="text-center text-gray-600 text-xs font-mono mt-10">
                 NO DATA STREAMS FOUND
               </div>
             ) : (
               <div className="space-y-2">
                 {files.map((f, i) => (
                   <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center space-x-3 group hover:border-nexus-crimson/30 transition-colors">
                      <FileText size={18} className="text-gray-400 group-hover:text-nexus-crimson" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate font-mono">{f.name}</div>
                        <div className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
          
          {/* Stats */}
          {files.length > 0 && (
             <div className="bg-nexus-crimson/10 border border-nexus-crimson/20 p-3 rounded-lg flex justify-between items-center text-xs text-nexus-crimson font-mono">
                <span>TOTAL FILES: {files.length}</span>
                <Cpu size={14} className="animate-pulse" />
             </div>
          )}

        </div>

        {/* Right Col: Neural Interface (Chat & Editor) */}
        <div className="lg:col-span-3 flex flex-col bg-nexus-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl relative h-[600px] lg:h-auto">
           
           {/* Tab Switcher */}
           <div className="flex border-b border-white/10 bg-black/50">
             <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'chat' ? 'text-nexus-crimson bg-nexus-crimson/5 border-b-2 border-nexus-crimson' : 'text-gray-500 hover:text-white'}`}
             >
                <MessageSquare size={16} />
                <span>Neural Chat</span>
             </button>
             <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'editor' ? 'text-nexus-crimson bg-nexus-crimson/5 border-b-2 border-nexus-crimson' : 'text-gray-500 hover:text-white'}`}
             >
                <Code size={16} />
                <span>Code Editor</span>
             </button>
           </div>

           {/* CHAT VIEW */}
           {activeTab === 'chat' && (
             <>
               {/* Terminal Output */}
               <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
                  {history.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 space-y-4">
                        <Database size={64} strokeWidth={1} />
                        <p className="font-mono text-sm tracking-widest text-center">AWAITING QUERY INPUT...</p>
                     </div>
                  ) : (
                     history.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4`}>
                           <div className={`max-w-[90%] md:max-w-[85%] rounded-xl p-4 text-sm leading-relaxed ${
                              msg.role === 'user'
                              ? 'bg-nexus-crimson/20 text-red-100 border border-nexus-crimson/30 rounded-br-none'
                              : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-none font-mono'
                           }`}>
                              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                           </div>
                           <span className="text-[10px] text-gray-600 font-mono mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     ))
                  )}
                  {loading && (
                     <div className="flex justify-start">
                        <div className="bg-white/5 rounded-xl p-4 rounded-bl-none flex items-center space-x-3">
                           <Loader2 size={18} className="animate-spin text-nexus-crimson" />
                           <span className="text-xs text-gray-400 font-mono tracking-widest">ANALYZING VECTOR SPACE...</span>
                        </div>
                     </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               {/* Input Bar */}
               <div className="p-4 bg-black/50 border-t border-white/10">
                  <div className="relative">
                     <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading || files.length === 0}
                        placeholder={files.length === 0 ? "Ingest data to enable query interface..." : "Query the archives..."}
                        className="w-full bg-nexus-dark text-white pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-crimson text-sm font-mono placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                     />
                     <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim() || files.length === 0}
                        className="absolute right-2 top-1.5 p-1.5 bg-nexus-crimson hover:bg-red-500 text-black rounded transition-colors disabled:opacity-0 disabled:cursor-not-allowed"
                     >
                        <Send size={16} />
                     </button>
                  </div>
               </div>
             </>
           )}

           {/* EDITOR VIEW */}
           {activeTab === 'editor' && (
             <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                <textarea
                  ref={editorRef}
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  placeholder="// Type code here or use context from uploaded files... Press 'AI Complete' to generate."
                  className="flex-1 w-full h-full bg-transparent text-gray-300 font-mono p-4 resize-none focus:outline-none text-sm leading-relaxed"
                  spellCheck={false}
                />
                
                {/* AI Suggestion Overlay (Simulated Ghost Text UI) */}
                {suggestion && (
                  <div className="absolute bottom-20 left-4 right-4 bg-nexus-panel border border-nexus-crimson/50 rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-2 z-10">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-nexus-crimson">
                           <Sparkles size={16} />
                           <span className="text-xs font-bold uppercase tracking-widest">AI Suggestion</span>
                        </div>
                        <div className="flex space-x-2">
                           <button 
                             onClick={() => setSuggestion('')} 
                             className="text-gray-500 hover:text-white text-xs px-2 py-1"
                           >
                             Discard
                           </button>
                           <button 
                             onClick={handleApplySuggestion} 
                             className="bg-nexus-crimson text-black text-xs font-bold px-3 py-1 rounded flex items-center space-x-1 hover:bg-red-500"
                           >
                             <Check size={12} />
                             <span>Apply</span>
                           </button>
                        </div>
                     </div>
                     <pre className="text-gray-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-32 p-2 bg-black/30 rounded border border-white/5">
                        {suggestion}
                     </pre>
                  </div>
                )}

                {/* Editor Toolbar */}
                <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between">
                   <div className="text-[10px] text-gray-500 font-mono">
                      LINES: {editorCode.split('\n').length} | CHARS: {editorCode.length}
                   </div>
                   <button
                      onClick={completeCode}
                      disabled={isCompleting || files.length === 0 || !editorCode.trim()}
                      className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-bold tracking-wider transition-all ${
                        isCompleting || !editorCode.trim()
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-nexus-crimson text-black hover:bg-red-500 hover:shadow-neon-crimson'
                      }`}
                   >
                      {isCompleting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>AI COMPLETE</span>
                   </button>
                </div>
             </div>
           )}

        </div>

      </div>
    </div>
  );
};

export default CodexMode;
