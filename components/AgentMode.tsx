
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Workflow, Check, Play, AlertCircle, X, Clock, Brain, UserCheck, Layout, Network, Sparkles, FileText, CheckCircle2, MessageSquare, Send, Database, History, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { Agent, AgentStatus, MissionArchive } from '../types';
import { useUser } from '../App';
import { useToast } from './Toast';

interface Props {
  onBack: () => void;
  initialPrompt?: string;
}

const EXAMPLE_MISSIONS = [
  { label: "Plan Tokyo Trip", prompt: "Plan a 2-week trip to Tokyo for March. Budget: $5000. Interests: Anime, Sushi, and Cyberpunk aesthetics. Need flight, hotel in Shibuya, and daily itinerary." },
  { label: "Build E-Commerce App", prompt: "Outline the architecture for a futuristic e-commerce React app. Break down tasks for: Frontend UI design, Backend API setup, Database schema, and Stripe integration." },
  { label: "Quantum Research", prompt: "Research the current state of Quantum Computing. Summarize 3 major breakthroughs from the last year and predict 2 industries that will be disrupted first." }
];

const RichTextRenderer: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
    if (!text) return null;
    return (
        <div className={`whitespace-pre-wrap ${className}`}>
        {text.split('\n').map((line, i) => {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
                <div key={i} className="flex gap-2 ml-2 mb-1">
                <span className="text-nexus-blue">•</span>
                <span>{line.trim().substring(2)}</span>
                </div>
            );
            }
            if (line.trim().startsWith('### ')) {
                return <h4 key={i} className="text-nexus-blue font-bold mt-4 mb-2 uppercase tracking-wide text-xs">{line.substring(4)}</h4>
            }
            if (line.trim() === '') return <div key={i} className="h-2"></div>;
            return <div key={i} className="mb-1">{line}</div>;
        })}
        </div>
    );
};

const TypewriterEffect: React.FC<{ text: string, className?: string, onComplete?: () => void }> = ({ text, className = "", onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);

  useEffect(() => {
    index.current = 0;
    setDisplayedText('');
    if (!text) return;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        if (index.current < text.length) {
          index.current++;
          return text.substring(0, index.current);
        }
        clearInterval(intervalId);
        if (onComplete) onComplete();
        return prev;
      });
    }, 5); // Faster typing
    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return <RichTextRenderer text={displayedText} className={className} />;
};

const AgentCard: React.FC<{ agent: Agent, onClick: () => void, getStatusColor: (s: AgentStatus) => string }> = ({ agent, onClick, getStatusColor }) => {
   return (
      <button 
         onClick={onClick} 
         className={`w-full text-left bg-[#0f0f0f] border ${getStatusColor(agent.status)} rounded-lg p-3 hover:bg-[#151515] transition-all group relative overflow-hidden shadow-lg`}
      >
         <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[10px] text-gray-500 font-mono">{agent.id}</span>
            <div className="flex items-center gap-2">
               {agent.dependencyId && agent.status === AgentStatus.QUEUED && (
                  <span className="text-[9px] bg-red-900/30 text-red-400 px-1.5 rounded border border-red-900/50">WAITING</span>
               )}
               {agent.status === AgentStatus.WORKING && <Loader2 size={14} className="animate-spin text-nexus-blue" />}
               {agent.status === AgentStatus.COMPLETE && <CheckCircle2 size={14} className="text-green-500" />}
               {agent.status === AgentStatus.QUEUED && !agent.dependencyId && <Clock size={14} className="text-gray-600" />}
            </div>
         </div>
         
         <div className="text-sm font-bold text-gray-200 mb-1 relative z-10 pr-2 leading-tight">{agent.name}</div>
         <div className="text-[10px] text-gray-500 line-clamp-1 relative z-10 mb-2">{agent.role}</div>

         {/* Progress Bar */}
         <div className="h-1 bg-gray-800 rounded-full overflow-hidden relative z-10">
            <div 
               className={`h-full transition-all duration-300 ${agent.status === AgentStatus.COMPLETE ? 'bg-green-500' : 'bg-nexus-blue'}`} 
               style={{width: `${agent.progress}%`}}
            ></div>
         </div>

         {/* Selection Glow */}
         <div className="absolute inset-0 bg-nexus-blue/5 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
      </button>
   );
};

// ... (Tree Graph Layout Remains the Same)
const DependencyGraphView: React.FC<{ agents: Agent[], onSelect: (id: string) => void }> = ({ agents, onSelect }) => {
   // 1. Build Tree Structure
   const roots = agents.filter(a => !a.dependencyId);
   
   // Calculate levels
   const getLevel = (id: string): number => {
      const agent = agents.find(a => a.id === id);
      if (!agent?.dependencyId) return 0;
      return getLevel(agent.dependencyId) + 1;
   };

   // Group by levels
   const levels: Record<number, Agent[]> = {};
   let maxLevel = 0;
   agents.forEach(a => {
      const lvl = getLevel(a.id);
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(a);
      if (lvl > maxLevel) maxLevel = lvl;
   });

   // SVG Dimensions
   const LEVEL_HEIGHT = 120;
   const width = Math.max(800, agents.length * 100);
   const height = Math.max(400, (maxLevel + 1) * LEVEL_HEIGHT + 100);
   
   // Calculate Node Positions
   const nodes: { id: string, x: number, y: number, data: Agent }[] = [];
   const links: { x1: number, y1: number, x2: number, y2: number }[] = [];

   Object.keys(levels).forEach(lvlStr => {
      const lvl = parseInt(lvlStr);
      const rowAgents = levels[lvl];
      const chunk = width / (rowAgents.length + 1);
      
      rowAgents.forEach((agent, idx) => {
         nodes.push({
            id: agent.id,
            x: chunk * (idx + 1),
            y: (lvl * LEVEL_HEIGHT) + 50,
            data: agent
         });
      });
   });

   // Build Links
   nodes.forEach(node => {
      if (node.data.dependencyId) {
         const parent = nodes.find(n => n.id === node.data.dependencyId);
         if (parent) {
            links.push({ x1: parent.x, y1: parent.y + 20, x2: node.x, y2: node.y - 20 });
         }
      }
   });

   return (
      <div className="bg-nexus-panel border border-white/10 rounded-xl overflow-x-auto relative min-h-[400px]">
         <svg width={width} height={height} className="mx-auto min-w-[800px]">
            {links.map((link, i) => (
               <path 
                  key={i} 
                  d={`M${link.x1},${link.y1} C${link.x1},${(link.y1+link.y2)/2} ${link.x2},${(link.y1+link.y2)/2} ${link.x2},${link.y2}`}
                  fill="none" 
                  stroke="#333" 
                  strokeWidth="2" 
               />
            ))}
            
            {nodes.map(node => (
               <g key={node.id} transform={`translate(${node.x}, ${node.y})`} onClick={() => onSelect(node.id)} className="cursor-pointer hover:opacity-80">
                  <rect x="-60" y="-25" width="120" height="50" rx="8" fill="#111" stroke={node.data.status === AgentStatus.WORKING ? '#0088ff' : '#333'} strokeWidth="2" />
                  <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{node.data.name}</text>
                  <text x="0" y="15" textAnchor="middle" fill="gray" fontSize="8">{node.data.status}</text>
               </g>
            ))}
         </svg>
      </div>
   );
};

const AgentMode: React.FC<Props> = ({ onBack, initialPrompt }) => {
  const [task, setTask] = useState(initialPrompt || '');
  const [viewMode, setViewMode] = useState<'kanban' | 'graph'>('kanban');
  const [chatInput, setChatInput] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { showToast } = useToast();

  const { agents, selectedAgent, loading, executionStarted, error, finalReport, isSynthesizing, chatHistory, isChatting, missionHistory, decompose, startExecution, selectAgent, updateAgentStatus, askSwarm, loadMission, deleteMission } = useOrchestrator(user?.id);

  useEffect(() => {
    if (initialPrompt && agents.length === 0 && !loading) {
      decompose(initialPrompt);
    }
  }, [initialPrompt]);

  const handleDecompose = () => { decompose(task); setTypingComplete(false); };
  const handleAskSwarm = () => { if (chatInput.trim()) { askSwarm(chatInput); setChatInput(''); } };
  
  const handleLoadMission = (mission: MissionArchive) => { 
    setTask(mission.task); 
    loadMission(mission); 
    setTypingComplete(true); 
    setShowHistory(false);
    showToast("Mission data restored", "info");
  };
  
  const handleShare = () => { 
    if (!task) return; 
    const url = `${window.location.origin}?mode=AGENTS&task=${encodeURIComponent(task)}`; 
    navigator.clipboard.writeText(url); 
    showToast("Deep link copied");
  };
  
  const handleDeleteMission = (e: React.MouseEvent, mission: MissionArchive) => { 
    e.stopPropagation(); 
    if(confirm("Delete this mission?")) {
        deleteMission(mission);
        showToast("Mission deleted from archive");
    }
  };

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isChatting]);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.QUEUED: return 'border-gray-700 text-gray-500';
      case AgentStatus.WORKING: return 'border-nexus-blue text-nexus-blue shadow-[0_0_10px_rgba(0,136,255,0.2)]';
      case AgentStatus.COMPLETE: return 'border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case AgentStatus.BLOCKED: return 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default: return 'border-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 relative pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-blue"><ArrowLeft size={24} /></button>
            <div className="flex items-center space-x-2 md:space-x-3"><Workflow className="text-nexus-blue" size={24} /><h2 className="text-xl md:text-3xl font-bold tracking-wider text-nexus-blue">THE SWARM</h2></div>
          </div>
          <p className="text-gray-400 text-xs md:text-sm font-mono tracking-wide ml-12 md:ml-14">Non-linear asynchronous task execution</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
           {agents.length > 0 && <button onClick={handleShare} className="p-2 text-nexus-blue hover:bg-nexus-blue/20 rounded-lg"><Share2 size={20} /></button>}
           <button onClick={() => setShowHistory(true)} className="flex items-center space-x-2 px-3 py-2 bg-nexus-panel border border-white/10 rounded-md hover:bg-white/5 transition-all text-gray-400 hover:text-white"><History size={16} /><span className="text-xs font-mono uppercase">History</span>{missionHistory.length > 0 && <span className="bg-nexus-blue text-black text-[10px] font-bold px-1.5 rounded-full">{missionHistory.length}</span>}</button>
           {agents.length > 0 && <div className="flex bg-nexus-panel rounded-lg p-1 border border-white/10"><button onClick={() => setViewMode('kanban')} className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-nexus-blue text-black font-bold shadow-neon-blue' : 'text-gray-400 hover:text-white'}`}><Layout size={16} /><span className="text-xs font-mono uppercase hidden sm:inline">Kanban</span></button><button onClick={() => setViewMode('graph')} className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all ${viewMode === 'graph' ? 'bg-nexus-blue text-black font-bold shadow-neon-blue' : 'text-gray-400 hover:text-white'}`}><Network size={16} /><span className="text-xs font-mono uppercase hidden sm:inline">Graph</span></button></div>}
        </div>
      </div>

      <div className="bg-nexus-panel border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a complex task..." className="w-full bg-black/50 text-white p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-blue resize-none h-32 font-sans text-sm md:text-lg" autoFocus />
            <div className="flex flex-wrap gap-2 pt-2">{EXAMPLE_MISSIONS.map((ex, idx) => (<button key={idx} onClick={() => setTask(ex.prompt)} className="flex items-center space-x-1 px-3 py-1 bg-white/5 hover:bg-nexus-blue/20 border border-white/10 hover:border-nexus-blue/50 rounded-full text-[10px] text-gray-300 hover:text-nexus-blue transition-all"><Sparkles size={10} /><span>{ex.label}</span></button>))}</div>
          </div>
          <div className="lg:w-64 flex flex-col justify-start space-y-3">
             <button onClick={handleDecompose} disabled={loading || !task.trim()} className={`w-full py-4 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-nexus-blue text-black hover:bg-blue-400 hover:shadow-neon-blue'}`}>{loading ? <><Loader2 size={20} className="animate-spin" /><span>DECOMPOSING...</span></> : <><Brain size={20} /><span>DECOMPOSE</span></>}</button>
             {agents.length > 0 && !executionStarted && <button onClick={startExecution} className="w-full py-4 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 hover:shadow-[0_0_15px_#22c55e] transition-all flex items-center justify-center space-x-2 animate-pulse"><Play size={20} /><span>EXECUTE SWARM</span></button>}
          </div>
        </div>
        {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2"><AlertCircle size={18} /><span className="text-sm">{error}</span></div>}
      </div>

      {(agents.length > 0 || finalReport) && (
        <div className="flex-1 space-y-8 pb-20">
          {agents.length > 0 && (
            viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* ... Kanban Columns ... */}
                 <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                    <h4 className="text-gray-400 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">Queued</h4>
                    {agents.filter(a => a.status === AgentStatus.QUEUED || a.status === AgentStatus.BLOCKED).map(agent => (
                       <AgentCard key={agent.id} agent={agent} onClick={() => selectAgent(agent.id)} getStatusColor={getStatusColor} />
                    ))}
                 </div>
                 <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                    <h4 className="text-gray-400 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">Working</h4>
                    {agents.filter(a => a.status === AgentStatus.WORKING).map(agent => (
                       <AgentCard key={agent.id} agent={agent} onClick={() => selectAgent(agent.id)} getStatusColor={getStatusColor} />
                    ))}
                 </div>
                 <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                    <h4 className="text-gray-400 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">Complete</h4>
                    {agents.filter(a => a.status === AgentStatus.COMPLETE).map(agent => (
                       <AgentCard key={agent.id} agent={agent} onClick={() => selectAgent(agent.id)} getStatusColor={getStatusColor} />
                    ))}
                 </div>
              </div>
            ) : (
               <DependencyGraphView agents={agents} onSelect={selectAgent} />
            )
          )}

          {(isSynthesizing || finalReport) && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-nexus-panel border-2 border-nexus-blue/50 rounded-xl p-4 md:p-6 min-h-[200px]">
                   <h3 className="text-nexus-blue font-bold mb-4 flex items-center gap-2"><FileText /> MISSION DEBRIEF</h3>
                   <div className="p-4 bg-black/50 rounded-lg">
                      {isSynthesizing ? <Loader2 className="animate-spin text-nexus-blue" /> : typingComplete ? <RichTextRenderer text={finalReport} /> : <TypewriterEffect text={finalReport} onComplete={() => setTypingComplete(true)} />}
                   </div>
                </div>

                {/* Swarm Memory Access / Chat - Visible once report exists */}
                {finalReport && (
                   <div className="bg-nexus-panel border border-white/10 rounded-xl p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                         <Database size={14} />
                         <span>Swarm Memory Access</span>
                      </h3>
                      
                      <div className="max-h-60 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                         {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-nexus-blue/20 text-blue-100 border border-nexus-blue/30' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                                  {msg.content}
                               </div>
                            </div>
                         ))}
                         {isChatting && (
                            <div className="flex justify-start">
                               <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin text-nexus-blue" />
                                  <span className="text-xs text-gray-500 font-mono">ACCESSING HIVE MIND...</span>
                               </div>
                            </div>
                         )}
                         <div ref={chatBottomRef} />
                      </div>

                      <div className="flex gap-2">
                         <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAskSwarm()}
                            placeholder="Ask the swarm about the mission details..."
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-nexus-blue/50 transition-colors text-white"
                         />
                         <button 
                            onClick={handleAskSwarm}
                            disabled={!chatInput.trim() || isChatting}
                            className="px-4 py-2 bg-nexus-blue text-black font-bold rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            <Send size={18} />
                         </button>
                      </div>
                   </div>
                )}
             </div>
          )}
        </div>
      )}
      
      {/* Modals remain mostly the same, ensuring responsiveness */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => selectAgent(null)}>
           <div className="bg-[#111] border border-white/20 rounded-xl w-[95%] max-w-lg shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-xl font-bold text-white">{selectedAgent.name}</h3>
                 <button onClick={() => selectAgent(null)}><X size={24} className="text-gray-500 hover:text-white" /></button>
              </div>
              <p className="text-gray-300 mb-4">{selectedAgent.role}</p>
              {selectedAgent.status === AgentStatus.WORKING && <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden"><div className="h-full bg-nexus-blue" style={{width: `${selectedAgent.progress}%`}}></div></div>}
              {selectedAgent.status === AgentStatus.COMPLETE && <div className="bg-green-900/20 text-green-400 p-3 rounded border border-green-500/30 text-xs mt-4 max-h-40 overflow-y-auto">{selectedAgent.result}</div>}
           </div>
        </div>
      )}

      {showHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowHistory(false)}>
            <div className="bg-nexus-panel border border-white/20 rounded-xl w-[95%] max-w-2xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                     <History className="text-nexus-blue" />
                     MISSION ARCHIVES
                  </h3>
                  <button onClick={() => setShowHistory(false)}><X size={24} className="text-gray-500 hover:text-white" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {missionHistory.length === 0 ? (
                     <div className="text-center text-gray-500 py-10 font-mono">NO MISSIONS LOGGED</div>
                  ) : (
                     missionHistory.map((mission, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-nexus-blue/30 transition-all group relative">
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                 <Clock size={12} />
                                 {new Date(mission.timestamp).toLocaleString()}
                              </span>
                              <div className="flex gap-2">
                                <button 
                                   onClick={() => handleLoadMission(mission)}
                                   className="text-xs bg-nexus-blue/10 text-nexus-blue px-3 py-1 rounded hover:bg-nexus-blue hover:text-black font-bold transition-colors"
                                >
                                   LOAD DATA
                                </button>
                                <button
                                   onClick={(e) => handleDeleteMission(e, mission)}
                                   className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded hover:bg-red-900/50 hover:text-red-400 transition-colors"
                                   title="Delete Mission"
                                >
                                   <Trash2 size={14} />
                                </button>
                              </div>
                           </div>
                           <h4 className="text-white font-bold mb-1 group-hover:text-nexus-blue transition-colors pr-12">{mission.task}</h4>
                           <p className="text-gray-400 text-xs line-clamp-2">{mission.report}</p>
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

export default AgentMode;
