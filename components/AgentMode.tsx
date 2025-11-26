
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Workflow, Check, Play, AlertCircle, X, Clock, Brain, UserCheck, Layout, Network, Sparkles, FileText, CheckCircle2, MessageSquare, Send, Database } from 'lucide-react';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { Agent, AgentStatus } from '../types';

interface Props {
  onBack: () => void;
}

const EXAMPLE_MISSIONS = [
  {
    label: "Plan Tokyo Trip",
    prompt: "Plan a 2-week trip to Tokyo for March. Budget: $5000. Interests: Anime, Sushi, and Cyberpunk aesthetics. Need flight, hotel in Shibuya, and daily itinerary."
  },
  {
    label: "Build E-Commerce App",
    prompt: "Outline the architecture for a futuristic e-commerce React app. Break down tasks for: Frontend UI design, Backend API setup, Database schema, and Stripe integration."
  },
  {
    label: "Quantum Research",
    prompt: "Research the current state of Quantum Computing. Summarize 3 major breakthroughs from the last year and predict 2 industries that will be disrupted first."
  }
];

// Simple Text Renderer for Markdown-like features
const RichTextRenderer: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
       {text}
    </div>
  );
};

const AgentMode: React.FC<Props> = ({ onBack }) => {
  const [task, setTask] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'graph'>('kanban');
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { 
    agents, 
    selectedAgent,
    loading, 
    executionStarted,
    error,
    finalReport,
    isSynthesizing,
    chatHistory,
    isChatting,
    missionHistory,
    decompose, 
    startExecution,
    selectAgent,
    updateAgentStatus,
    askSwarm
  } = useOrchestrator();

  const handleDecompose = () => {
    decompose(task);
  };

  const handleAskSwarm = () => {
    if (chatInput.trim()) {
      askSwarm(chatInput);
      setChatInput('');
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatting]);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.QUEUED: return 'border-gray-700 text-gray-500';
      case AgentStatus.WORKING: return 'border-nexus-blue text-nexus-blue shadow-[0_0_10px_rgba(0,136,255,0.2)]';
      case AgentStatus.COMPLETE: return 'border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case AgentStatus.BLOCKED: return 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default: return 'border-gray-700';
    }
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.QUEUED: return 'bg-gray-800 text-gray-400';
      case AgentStatus.WORKING: return 'bg-blue-900/50 text-nexus-blue border border-nexus-blue/30';
      case AgentStatus.COMPLETE: return 'bg-green-900/50 text-green-400 border border-green-500/30';
      case AgentStatus.BLOCKED: return 'bg-red-900/50 text-red-400 border border-red-500/30';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 relative pb-24">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-nexus-blue">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center space-x-3">
              <Workflow className="text-nexus-blue" size={28} />
              <h2 className="text-3xl font-bold tracking-wider text-nexus-blue">THE SWARM</h2>
            </div>
          </div>
          <p className="text-gray-400 text-sm font-mono tracking-wide ml-14">
            Non-linear asynchronous task execution
          </p>
        </div>

        {/* View Toggle */}
        {agents.length > 0 && (
          <div className="flex bg-nexus-panel rounded-lg p-1 border border-white/10 self-start md:self-end">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'kanban' ? 'bg-nexus-blue text-black font-bold shadow-neon-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layout size={18} />
              <span className="text-xs font-mono uppercase">Kanban</span>
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'graph' ? 'bg-nexus-blue text-black font-bold shadow-neon-blue' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Network size={18} />
              <span className="text-xs font-mono uppercase">Graph</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Input Section */}
      <div className="bg-nexus-panel border border-white/10 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-end">
               <label className="text-xs font-bold text-nexus-blue uppercase tracking-widest">Mission Directive</label>
               {missionHistory.length > 0 && (
                 <div className="flex items-center space-x-1 text-xs text-nexus-blue bg-blue-900/20 px-2 py-1 rounded border border-nexus-blue/30 animate-in fade-in">
                   <Database size={12} />
                   <span>SWARM MEMORY: {missionHistory.length} MISSIONS STORED</span>
                 </div>
               )}
            </div>
            
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe a complex task (e.g., 'Plan a trip to Tokyo' or 'Research and summarize quantum computing advancements')..."
              className="w-full bg-black/50 text-white p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-nexus-blue resize-none h-32 scrollbar-thin scrollbar-thumb-gray-700 font-sans text-lg"
            />
            
            {/* Quick Select Examples */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-gray-500 font-mono py-1">TRY:</span>
              {EXAMPLE_MISSIONS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setTask(ex.prompt)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/5 hover:bg-nexus-blue/20 border border-white/10 hover:border-nexus-blue/50 rounded-full text-xs text-gray-300 hover:text-nexus-blue transition-all"
                >
                  <Sparkles size={10} />
                  <span>{ex.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="lg:w-64 flex flex-col justify-start space-y-3 pt-6 lg:pt-0">
             <button
              onClick={handleDecompose}
              disabled={loading || !task.trim()}
              className={`w-full py-4 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center space-x-2 ${
                loading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-nexus-blue text-black hover:bg-blue-400 hover:shadow-neon-blue'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>DECOMPOSING...</span>
                </>
              ) : (
                <>
                  <Brain size={20} />
                  <span>DECOMPOSE</span>
                </>
              )}
            </button>

            {agents.length > 0 && !executionStarted && (
              <button
                onClick={startExecution}
                className="w-full py-4 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 hover:shadow-[0_0_15px_#22c55e] transition-all flex items-center justify-center space-x-2 animate-pulse"
              >
                <Play size={20} />
                <span>EXECUTE SWARM</span>
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center space-x-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* 3. Main Content Area */}
      {agents.length > 0 && (
        <div className="flex-1 space-y-8 pb-20">
          {viewMode === 'kanban' ? (
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[900px]">
                {/* Column: Queued */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h4 className="text-gray-400 font-mono text-sm uppercase tracking-widest">Queued</h4>
                    <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-mono">
                      {agents.filter(a => a.status === AgentStatus.QUEUED || a.status === AgentStatus.BLOCKED).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agents.filter(a => a.status === AgentStatus.QUEUED || a.status === AgentStatus.BLOCKED).map(agent => (
                      <AgentCard 
                       key={agent.id} 
                       agent={agent} 
                       color={getStatusColor(agent.status)} 
                       onClick={() => selectAgent(agent.id)} 
                      />
                    ))}
                  </div>
                </div>

                {/* Column: Working */}
                <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-500/20">
                    <h4 className="text-nexus-blue font-mono text-sm uppercase tracking-widest">Working</h4>
                    <span className="bg-blue-900/50 text-nexus-blue text-xs px-2 py-1 rounded-full font-mono border border-blue-500/30">
                      {agents.filter(a => a.status === AgentStatus.WORKING).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agents.filter(a => a.status === AgentStatus.WORKING).map(agent => (
                      <AgentCard 
                       key={agent.id} 
                       agent={agent} 
                       color={getStatusColor(agent.status)} 
                       onClick={() => selectAgent(agent.id)} 
                      />
                    ))}
                  </div>
                </div>

                {/* Column: Complete */}
                <div className="bg-green-900/10 rounded-xl p-4 border border-green-500/20 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-green-500/20">
                    <h4 className="text-green-500 font-mono text-sm uppercase tracking-widest">Complete</h4>
                    <span className="bg-green-900/50 text-green-500 text-xs px-2 py-1 rounded-full font-mono border border-green-500/30">
                      {agents.filter(a => a.status === AgentStatus.COMPLETE).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agents.filter(a => a.status === AgentStatus.COMPLETE).map(agent => (
                      <AgentCard 
                       key={agent.id} 
                       agent={agent} 
                       color={getStatusColor(agent.status)} 
                       onClick={() => selectAgent(agent.id)} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DependencyGraphView agents={agents} onSelectAgent={selectAgent} />
          )}

          {/* FINAL SYNTHESIS REPORT */}
          {(isSynthesizing || finalReport) && (
            <div className="animate-in slide-in-from-bottom-4 duration-700 space-y-6">
               <div className="relative bg-nexus-panel border-2 border-nexus-blue/50 rounded-xl shadow-[0_0_30px_rgba(0,136,255,0.15)] flex flex-col">
                  {/* Header */}
                  <div className="bg-nexus-blue/10 border-b border-nexus-blue/20 p-4 flex items-center justify-between rounded-t-xl">
                     <div className="flex items-center space-x-3">
                        <FileText className="text-nexus-blue" />
                        <h3 className="text-xl font-bold text-white tracking-widest">MISSION DEBRIEF</h3>
                     </div>
                     {isSynthesizing ? (
                        <div className="flex items-center space-x-2 text-nexus-blue animate-pulse">
                           <Loader2 size={16} className="animate-spin" />
                           <span className="text-xs font-mono uppercase">Synthesizing Swarm Intel...</span>
                        </div>
                     ) : (
                        <div className="flex items-center space-x-2 text-green-500">
                           <CheckCircle2 size={18} />
                           <span className="text-xs font-mono uppercase font-bold">Mission Complete</span>
                        </div>
                     )}
                  </div>
                  
                  {/* Content - auto expanding */}
                  <div className="p-8 bg-black/50 rounded-b-xl">
                     {isSynthesizing ? (
                        <div className="space-y-3 opacity-50">
                           <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                           <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
                           <div className="h-4 bg-gray-800 rounded w-5/6 animate-pulse"></div>
                        </div>
                     ) : (
                        <RichTextRenderer text={finalReport} className="text-gray-200 leading-relaxed" />
                     )}
                  </div>
               </div>

               {/* SWARM HISTORY / CHAT */}
               {!isSynthesizing && finalReport && (
                 <div className="bg-nexus-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center space-x-2">
                       <MessageSquare size={18} className="text-nexus-blue" />
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Swarm Memory Access</span>
                    </div>

                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 bg-black/30">
                        {chatHistory.length === 0 && (
                          <div className="text-center text-gray-600 text-sm font-mono py-4 italic">
                             Swarm memory active. Ask follow-up questions about the mission.
                          </div>
                        )}
                        {chatHistory.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
                                 msg.role === 'user' 
                                 ? 'bg-nexus-blue/20 text-blue-100 border border-nexus-blue/30 rounded-br-none' 
                                 : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                              }`}>
                                 <RichTextRenderer text={msg.content} />
                              </div>
                           </div>
                        ))}
                        {isChatting && (
                           <div className="flex justify-start">
                              <div className="bg-white/5 rounded-lg p-3 rounded-bl-none flex items-center space-x-2">
                                 <Loader2 size={14} className="animate-spin text-nexus-blue" />
                                 <span className="text-xs text-gray-400 font-mono">Accessing Swarm Memory...</span>
                              </div>
                           </div>
                        )}
                        <div ref={chatBottomRef} />
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5 flex space-x-2">
                       <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskSwarm()}
                          placeholder="Ask the swarm about the results..."
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-nexus-blue/50 focus:ring-1 focus:ring-nexus-blue/50"
                          disabled={isChatting}
                       />
                       <button 
                          onClick={handleAskSwarm}
                          disabled={isChatting || !chatInput.trim()}
                          className="bg-nexus-blue hover:bg-blue-400 text-black p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* 4. Agent Detail Modal Overlay */}
      {selectedAgent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => selectAgent(null)}
        >
          <div 
            className="bg-[#111] border border-white/20 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono text-nexus-blue bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/30">
                    ID: {selectedAgent.id}
                  </span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadge(selectedAgent.status)}`}>
                    {selectedAgent.status}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">{selectedAgent.name}</h3>
              </div>
              <button 
                onClick={() => selectAgent(null)} 
                className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Role Section */}
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Primary Directive</div>
                <div className="text-gray-300 bg-black/50 p-4 rounded-lg border border-white/10 leading-relaxed text-sm">
                  {selectedAgent.role}
                </div>
              </div>

              {/* Dependencies Section */}
              {selectedAgent.dependencyId && (
                <div>
                   <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Dependencies</div>
                   <div className="flex items-center space-x-2 text-yellow-500 bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20">
                     <Clock size={16} />
                     <span className="text-sm font-mono">AWAITING OUTPUT FROM: <span className="font-bold">{selectedAgent.dependencyId}</span></span>
                   </div>
                </div>
              )}

              {/* Live Progress Section */}
              {selectedAgent.status === AgentStatus.WORKING && (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-xs text-nexus-blue font-bold uppercase tracking-widest">Live Execution</div>
                    <div className="text-xs font-mono text-nexus-blue">{selectedAgent.progress}%</div>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-nexus-blue transition-all duration-300 shadow-[0_0_10px_#0088ff]" 
                      style={{ width: `${selectedAgent.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono animate-pulse">Processing sub-tasks...</p>
                </div>
              )}

               {/* Completion Result (Mock) */}
               {selectedAgent.status === AgentStatus.COMPLETE && (
                <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-500 mb-2">
                    <Check size={18} />
                    <span className="font-bold text-sm uppercase">Task Complete</span>
                  </div>
                  <div className="text-gray-300 text-xs font-mono bg-black/30 p-2 rounded border border-green-500/10 mt-2 whitespace-pre-wrap">
                    {selectedAgent.result || "Output data successfully integrated into swarm memory."}
                  </div>
                </div>
              )}

              {/* Blocked/Approval State (Mock) */}
              {selectedAgent.status === AgentStatus.BLOCKED && (
                <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-2 text-red-500 mb-2">
                    <UserCheck size={18} />
                    <span className="font-bold text-sm uppercase">Human Authorization Required</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">Critical decision point reached. Agent requires approval to proceed with high-value transaction.</p>
                  <button 
                    onClick={() => updateAgentStatus(selectedAgent.id, AgentStatus.WORKING, selectedAgent.progress)}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-sm transition-colors"
                  >
                    GRANT AUTHORIZATION
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AgentCardProps {
  agent: Agent;
  color: string;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left bg-[#0f0f0f] border ${color} rounded-lg p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-[#151515] group`}
  >
    <div className="flex justify-between items-start mb-3">
      <span className="font-mono text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 group-hover:border-gray-600 transition-colors">
        {agent.id}
      </span>
      {agent.dependencyId && (
        <span className="text-[10px] flex items-center space-x-1 text-yellow-600">
          <Clock size={10} />
          <span>WAIT</span>
        </span>
      )}
    </div>
    
    <h5 className="font-bold text-sm text-gray-200 mb-2 leading-tight group-hover:text-white">{agent.name}</h5>
    
    {/* Progress Bar */}
    {agent.status === AgentStatus.WORKING ? (
      <div className="mt-2 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-nexus-blue transition-all duration-300" 
          style={{ width: `${agent.progress}%` }}
        />
      </div>
    ) : (
       <div className="text-xs text-gray-600 line-clamp-2">{agent.role}</div>
    )}
    
    {agent.status === AgentStatus.COMPLETE && (
      <div className="absolute top-3 right-3 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">
        <Check size={16} />
      </div>
    )}

    {agent.status === AgentStatus.BLOCKED && (
      <div className="absolute top-3 right-3 text-red-500 animate-pulse">
        <AlertCircle size={16} />
      </div>
    )}
  </button>
);

// --- Dependency Graph Component ---

const DependencyGraphView: React.FC<{ agents: Agent[], onSelectAgent: (id: string) => void }> = ({ agents, onSelectAgent }) => {
  // Simple layout algorithm
  const layout = useMemo(() => {
    const levels: Record<string, number> = {};
    const nodes: { agent: Agent; x: number; y: number }[] = [];
    const edges: { source: { x: number; y: number }; target: { x: number; y: number }; active: boolean }[] = [];
    
    // 1. Calculate Levels (Depth)
    // Initialize agents with no deps at level 0
    let unprocessed = [...agents];
    let processing = true;
    let loopGuard = 0;

    // Default everyone to 0 first
    agents.forEach(a => levels[a.id] = 0);

    // Iteratively bump levels based on dependencies
    while (processing && loopGuard < 10) {
      processing = false;
      loopGuard++;
      unprocessed.forEach(agent => {
        if (agent.dependencyId) {
          const depLevel = levels[agent.dependencyId] || 0;
          if (levels[agent.id] <= depLevel) {
            levels[agent.id] = depLevel + 1;
            processing = true;
          }
        }
      });
    }

    // 2. Assign Coordinates
    const agentsByLevel: Record<number, Agent[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!agentsByLevel[lvl]) agentsByLevel[lvl] = [];
      const agent = agents.find(a => a.id === id);
      if (agent) agentsByLevel[lvl].push(agent);
    });

    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 100;
    const GAP_X = 100;
    const GAP_Y = 30;
    const START_X = 50;
    const START_Y = 50;

    Object.entries(agentsByLevel).forEach(([lvlStr, levelAgents]) => {
      const lvl = parseInt(lvlStr);
      levelAgents.forEach((agent, idx) => {
        const x = START_X + lvl * (NODE_WIDTH + GAP_X);
        const y = START_Y + idx * (NODE_HEIGHT + GAP_Y);
        nodes.push({ agent, x, y });
      });
    });

    // 3. Create Edges
    nodes.forEach(node => {
      if (node.agent.dependencyId) {
        const sourceNode = nodes.find(n => n.agent.id === node.agent.dependencyId);
        if (sourceNode) {
          edges.push({
            source: { x: sourceNode.x + NODE_WIDTH, y: sourceNode.y + NODE_HEIGHT / 2 },
            target: { x: node.x, y: node.y + NODE_HEIGHT / 2 },
            active: sourceNode.agent.status === AgentStatus.WORKING || node.agent.status === AgentStatus.WORKING
          });
        }
      }
    });

    return { nodes, edges, width: Math.max(...nodes.map(n => n.x)) + NODE_WIDTH + 50, height: Math.max(...nodes.map(n => n.y)) + NODE_HEIGHT + 50 };
  }, [agents]);

  return (
    <div className="w-full h-full bg-[#080808] rounded-xl border border-white/10 relative overflow-hidden overflow-x-auto">
      <div style={{ width: layout.width, height: layout.height, minHeight: '400px', minWidth: '100%' }} className="relative p-8">
        
        {/* SVG Layer for Connections */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <defs>
             <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
               <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
             </marker>
             <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
               <polygon points="0 0, 10 3.5, 0 7" fill="#0088ff" />
             </marker>
          </defs>
          {layout.edges.map((edge, i) => (
            <path
              key={i}
              d={`M ${edge.source.x} ${edge.source.y} C ${edge.source.x + 50} ${edge.source.y}, ${edge.target.x - 50} ${edge.target.y}, ${edge.target.x} ${edge.target.y}`}
              fill="none"
              stroke={edge.active ? "#0088ff" : "#333"}
              strokeWidth="2"
              markerEnd={edge.active ? "url(#arrowhead-active)" : "url(#arrowhead)"}
              className={edge.active ? "animate-pulse" : ""}
            />
          ))}
        </svg>

        {/* Nodes Layer */}
        {layout.nodes.map((node) => (
           <div
             key={node.agent.id}
             style={{ position: 'absolute', left: node.x, top: node.y, width: 260, height: 100 }}
             className="z-10"
           >
              <AgentGraphNode agent={node.agent} onClick={() => onSelectAgent(node.agent.id)} />
           </div>
        ))}

      </div>
    </div>
  );
};

const AgentGraphNode: React.FC<{ agent: Agent, onClick: () => void }> = ({ agent, onClick }) => {
  const getBorderColor = () => {
    switch (agent.status) {
      case AgentStatus.WORKING: return 'border-nexus-blue shadow-[0_0_15px_rgba(0,136,255,0.3)]';
      case AgentStatus.COMPLETE: return 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case AgentStatus.BLOCKED: return 'border-red-500 animate-pulse';
      default: return 'border-gray-700 hover:border-gray-500';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`w-full h-full bg-nexus-panel border ${getBorderColor()} rounded-lg p-3 cursor-pointer transition-all hover:scale-105 flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-gray-500 bg-black px-1.5 py-0.5 rounded">{agent.id}</span>
        {agent.status === AgentStatus.WORKING && <Loader2 size={12} className="text-nexus-blue animate-spin" />}
        {agent.status === AgentStatus.COMPLETE && <Check size={12} className="text-green-500" />}
      </div>
      
      <div className="font-bold text-sm text-gray-200 line-clamp-1">{agent.name}</div>
      <div className="text-[10px] text-gray-500 line-clamp-1">{agent.role}</div>
      
      {/* Mini Progress Bar */}
      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
         <div 
            className={`h-full transition-all duration-300 ${agent.status === AgentStatus.COMPLETE ? 'bg-green-500' : 'bg-nexus-blue'}`} 
            style={{ width: `${agent.progress}%` }} 
         />
      </div>
    </div>
  );
};

export default AgentMode;