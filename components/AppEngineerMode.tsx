
import React, { useState } from 'react';
import { ArrowLeft, Cpu, Layers, Database, Globe, DollarSign, Layout, Server, Box, GitBranch, Send, Loader2, Share2, MessageSquare, History, X, Clock, Trash2, UserCheck } from 'lucide-react';
import { useAppEngineer } from '../hooks/useAppEngineer';
import { AppBlueprint, BlueprintSession } from '../types';
import { useUser } from '../App';

interface Props {
  onBack: () => void;
  initialPrompt?: string;
}

const AppEngineerMode: React.FC<Props> = ({ onBack, initialPrompt }) => {
  const [idea, setIdea] = useState(initialPrompt || '');
  const [activeTab, setActiveTab] = useState<'strategy' | 'ui' | 'data' | 'api'>('strategy');
  const [chatInput, setChatInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);
  const { user } = useUser();
  
  const { 
    loading, 
    blueprint, 
    error, 
    chatHistory, 
    isChatting, 
    history,
    generate, 
    askCTO,
    loadSession,
    deleteSession
  } = useAppEngineer(user?.id);

  React.useEffect(() => {
    if (initialPrompt && !blueprint && !loading) {
      generate(initialPrompt);
    }
  }, []);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  const handleShare = () => {
     if (!idea) return;
     const url = `${window.location.origin}?mode=APP_ENGINEER&q=${encodeURIComponent(idea)}`;
     navigator.clipboard.writeText(url);
     alert("Deep link copied!");
  };

  const handleAskCTO = () => {
    if (chatInput.trim()) {
      askCTO(chatInput);
      setChatInput('');
    }
  };

  const handleLoadSession = (session: BlueprintSession) => {
    setIdea(session.idea);
    loadSession(session);
    setShowHistory(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if(confirm("Delete this blueprint?")) deleteSession(sessionId);
  };

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto p-4 space-y-4 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-indigo">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Cpu className="text-nexus-indigo" size={24} />
            <h2 className="text-xl md:text-3xl font-bold tracking-wider text-nexus-indigo">APP ENGINEER</h2>
          </div>
          <span className="bg-nexus-indigo/10 text-nexus-indigo text-xs font-mono px-2 py-1 rounded border border-nexus-indigo/20 hidden md:inline">
              AUTONOMOUS CTO
          </span>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowHistory(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
              <History size={20} />
           </button>
           {blueprint && (
              <button onClick={handleShare} className="p-2 text-nexus-indigo hover:bg-nexus-indigo/20 rounded-lg">
                 <Share2 size={20} />
              </button>
           )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full lg:h-[calc(100vh-140px)]">
        
        {/* Left Column: Input & Chat */}
        <div className="lg:w-1/3 flex flex-col gap-4">
           {/* Idea Input */}
           <div className="bg-nexus-panel border border-white/10 rounded-xl p-4 md:p-6 shadow-lg shrink-0">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Application Concept</label>
              <div className="flex flex-col gap-3">
                 <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Describe your app idea (e.g., 'Uber for Dog Walkers')..."
                    className="w-full bg-black/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-indigo text-sm font-sans resize-none h-24"
                    disabled={loading}
                 />
                 <button
                    onClick={() => generate(idea)}
                    disabled={loading || !idea.trim()}
                    className={`px-6 py-3 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center space-x-2 ${
                       loading
                       ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                       : 'bg-nexus-indigo text-black hover:bg-indigo-400 hover:shadow-[0_0_15px_#6366f1]'
                    }`}
                 >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Box size={18} />}
                    <span>ENGINEER BLUEPRINT</span>
                 </button>
              </div>
           </div>

           {/* CTO Chat Interface */}
           {blueprint && (
             <div className="flex-1 bg-nexus-panel border border-nexus-indigo/30 rounded-xl overflow-hidden flex flex-col min-h-[350px] md:min-h-[400px]">
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                   <MessageSquare size={16} className="text-nexus-indigo" />
                   <span className="text-xs font-bold tracking-wider text-white">CONSULT CTO</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
                   {(chatHistory || []).map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-3 rounded-lg text-xs md:text-sm ${
                            msg.role === 'user' 
                            ? 'bg-nexus-indigo/20 text-indigo-100 border border-nexus-indigo/30' 
                            : 'bg-white/5 text-gray-300 border border-white/10 font-mono'
                         }`}>
                            {msg.content}
                         </div>
                      </div>
                   ))}
                   {isChatting && (
                      <div className="flex justify-start">
                         <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-nexus-indigo" />
                            <span className="text-xs text-gray-500 font-mono">CTO IS TYPING...</span>
                         </div>
                      </div>
                   )}
                   <div ref={chatBottomRef} />
                </div>

                <div className="p-3 bg-black/40 border-t border-white/10 flex gap-2">
                   <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskCTO()}
                      placeholder="Ask about the architecture..."
                      className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-nexus-indigo"
                   />
                   <button 
                      onClick={handleAskCTO}
                      disabled={!chatInput.trim() || isChatting}
                      className="p-2 bg-nexus-indigo text-black rounded hover:bg-indigo-400 disabled:opacity-50"
                   >
                      <Send size={16} />
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Blueprint Visualization */}
        <div className="lg:w-2/3 flex flex-col min-h-[500px]">
           {error && (
             <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2 animate-in fade-in mb-4">
               <Cpu size={20} />
               <span>{error}</span>
             </div>
           )}

           {blueprint && (
              <div className="flex-1 bg-nexus-panel border border-nexus-indigo/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col animate-in slide-in-from-bottom-4 duration-700 relative">
                 
                 {/* Blueprint Header */}
                 <div className="bg-black/40 p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                       <h1 className="text-2xl font-bold text-white tracking-tight">{blueprint.appName}</h1>
                       <p className="text-nexus-indigo font-mono text-sm mt-1">{blueprint.tagline}</p>
                    </div>
                    <div className="flex space-x-4 text-[10px] md:text-xs font-mono text-gray-500 bg-white/5 p-2 rounded-lg overflow-x-auto whitespace-nowrap">
                       <div>
                          <span className="block text-nexus-indigo font-bold">STACK</span>
                          {blueprint.backend?.techStack}
                       </div>
                       <div className="w-px bg-white/10"></div>
                       <div>
                          <span className="block text-nexus-indigo font-bold">FRAMEWORK</span>
                          {blueprint.frontend?.framework}
                       </div>
                    </div>
                 </div>

                 {/* Navigation Tabs */}
                 <div className="flex border-b border-white/10 bg-black/20 overflow-x-auto scrollbar-hide">
                    <TabButton id="strategy" icon={<DollarSign size={16} />} label="Strategy" active={activeTab} set={setActiveTab} />
                    <TabButton id="ui" icon={<Layout size={16} />} label="UI / UX" active={activeTab} set={setActiveTab} />
                    <TabButton id="data" icon={<Database size={16} />} label="Schema" active={activeTab} set={setActiveTab} />
                    <TabButton id="api" icon={<Server size={16} />} label="API Docs" active={activeTab} set={setActiveTab} />
                 </div>

                 {/* Content Viewer */}
                 <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-fixed relative">
                    <div className="absolute inset-0 bg-nexus-black/90 pointer-events-none z-0"></div>
                    <div className="relative z-10">
                       
                       {activeTab === 'strategy' && blueprint.businessStrategy && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                             <div className="md:col-span-2">
                                <StrategyCard title="Unique Value Proposition" content={blueprint.businessStrategy.uniqueValueProp} icon={<Globe size={16} />} />
                             </div>
                             <StrategyCard title="Target Audience" content={blueprint.businessStrategy.targetAudience} icon={<UserCheck size={16} />} />
                             <StrategyCard title="Revenue Model" content={blueprint.businessStrategy.revenueModel} icon={<DollarSign size={16} />} />
                             
                             <div className="md:col-span-2 mt-4 pt-6 border-t border-white/10">
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                   <GitBranch size={14} /> Deployment Pipeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="bg-nexus-panel border border-white/10 p-4 rounded-lg">
                                      <div className="text-nexus-indigo text-xs font-bold mb-1">INFRASTRUCTURE</div>
                                      <div className="text-xs text-gray-300 font-mono">{blueprint.deployment?.infrastructure}</div>
                                   </div>
                                   <div className="bg-nexus-panel border border-white/10 p-4 rounded-lg">
                                      <div className="text-nexus-indigo text-xs font-bold mb-1">CI/CD FLOW</div>
                                      <div className="text-xs text-gray-300 font-mono">{blueprint.deployment?.cicdPipeline}</div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'ui' && blueprint.frontend && (
                          <div className="space-y-8 animate-in fade-in">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                   <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Component Tree</h3>
                                   <div className="bg-nexus-panel border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-3 overflow-x-auto">
                                      {(blueprint.frontend.componentTree || []).map((comp, i) => (
                                         <div key={i} className="flex items-center gap-2 pl-2 border-l border-nexus-indigo/20 whitespace-nowrap">
                                            <Layers size={10} className="text-nexus-indigo" />
                                            {comp}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                                <div className="md:col-span-2">
                                   <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">User Experience Flow</h3>
                                   <div className="bg-nexus-panel border border-white/10 rounded-lg p-6 text-sm text-gray-300 leading-relaxed">
                                      {blueprint.frontend.uxFlow}
                                   </div>
                                </div>
                             </div>

                             <div>
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Design System</h3>
                                <div className="flex flex-wrap gap-4">
                                   {(blueprint.frontend.colorPalette || []).map((color, i) => (
                                      <div key={i} className="group flex flex-col items-center space-y-2 cursor-pointer">
                                         <div 
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-lg border border-white/10 group-hover:scale-110 transition-transform" 
                                            style={{ backgroundColor: color }}
                                         ></div>
                                         <span className="text-[10px] font-mono text-gray-500 bg-black/50 px-2 py-1 rounded">{color}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'data' && blueprint.backend && (
                          <div className="animate-in fade-in">
                             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {(blueprint.backend.databaseSchema || []).map((table, i) => (
                                   <div key={i} className="bg-nexus-panel border border-white/10 rounded-lg overflow-hidden hover:border-nexus-indigo/50 transition-colors shadow-lg">
                                      <div className="bg-gradient-to-r from-nexus-indigo/10 to-transparent p-3 border-b border-white/10 flex items-center gap-2">
                                         <Database size={14} className="text-nexus-indigo" />
                                         <span className="font-bold text-white text-sm tracking-wide">{table.table}</span>
                                      </div>
                                      <div className="p-3 space-y-1 overflow-x-auto">
                                         {(table.columns || []).map((col, j) => (
                                            <div key={j} className="flex items-center justify-between text-xs font-mono text-gray-400 py-1 border-b border-white/5 last:border-0 whitespace-nowrap gap-4">
                                               <span>{col.split(' ')[0]}</span>
                                               <span className="text-nexus-indigo/70">{col.split(' ').slice(1).join(' ')}</span>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {activeTab === 'api' && blueprint.backend && (
                          <div className="space-y-4 animate-in fade-in">
                             {(blueprint.backend.apiEndpoints || []).map((ep, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center bg-nexus-panel border border-white/5 rounded-lg p-4 hover:border-nexus-indigo/30 transition-colors group">
                                   <div className={`
                                      px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider w-20 text-center mr-4 mb-2 md:mb-0
                                      ${ep.method === 'GET' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' : ''}
                                      ${ep.method === 'POST' ? 'bg-green-900/20 text-green-400 border border-green-500/20' : ''}
                                      ${ep.method === 'PUT' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20' : ''}
                                      ${ep.method === 'DELETE' ? 'bg-red-900/20 text-red-400 border border-red-500/20' : ''}
                                   `}>
                                      {ep.method}
                                   </div>
                                   <div className="font-mono text-sm text-white mr-4 mb-2 md:mb-0 md:w-1/3 truncate group-hover:text-nexus-indigo transition-colors">{ep.path}</div>
                                   <div className="text-sm text-gray-400 flex-1">{ep.description}</div>
                                </div>
                             ))}
                          </div>
                       )}

                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowHistory(false)}>
            <div className="bg-nexus-panel border border-white/20 rounded-xl w-[95%] max-w-lg shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                     <History className="text-nexus-indigo" />
                     PROJECT ARCHIVES
                  </h3>
                  <button onClick={() => setShowHistory(false)}><X size={24} className="text-gray-500 hover:text-white" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {history.length === 0 ? (
                     <div className="text-center text-gray-500 py-10 font-mono text-xs">NO BLUEPRINTS FOUND</div>
                  ) : (
                     history.map((session, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-nexus-indigo/30 transition-all group flex items-center justify-between">
                           <div className="flex-1 cursor-pointer" onClick={() => handleLoadSession(session)}>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[10px] text-gray-500 font-mono">
                                    {new Date(session.timestamp).toLocaleDateString()}
                                 </span>
                                 <span className="text-[10px] bg-nexus-indigo/10 text-nexus-indigo px-1.5 rounded">{session.blueprint.appName}</span>
                              </div>
                              <h4 className="text-sm text-gray-300 font-bold line-clamp-1">{session.idea}</h4>
                           </div>
                           <button 
                              onClick={(e) => handleDeleteSession(e, session.id)}
                              className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

const Section: React.FC<{ title: string, content: string }> = ({ title, content }) => (
   <div>
      <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed text-sm">{content}</p>
   </div>
);

const StrategyCard: React.FC<{ title: string, content: string, icon: React.ReactNode }> = ({ title, content, icon }) => (
   <div className="bg-nexus-panel border border-white/10 rounded-lg p-4 h-full">
      <div className="flex items-center gap-2 mb-3 text-nexus-indigo">
         {icon}
         <h3 className="font-bold uppercase tracking-widest text-xs">{title}</h3>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{content}</p>
   </div>
);

const TabButton: React.FC<{ id: string, label: string, icon: React.ReactNode, active: string, set: (v: any) => void }> = ({ id, label, icon, active, set }) => (
   <button
      onClick={() => set(id)}
      className={`flex items-center space-x-2 px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 ${
         active === id 
         ? 'text-nexus-indigo bg-nexus-indigo/5 border-b-2 border-nexus-indigo' 
         : 'text-gray-500 hover:text-white'
      }`}
   >
      {icon}
      <span>{label}</span>
   </button>
);

export default AppEngineerMode;
