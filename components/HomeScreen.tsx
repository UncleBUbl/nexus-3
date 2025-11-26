
import React, { useState } from 'react';
import { Zap, RefreshCw, Eye, Activity, Clapperboard, Globe, FileCode, Map, Palette, Cpu, Search, Loader2, Ghost } from 'lucide-react';
import { AppMode } from '../types';
import { determineAppMode } from '../services/geminiService';

interface Props {
  onSelectMode: (mode: AppMode) => void;
  onNavigateWithPrompt: (mode: AppMode, prompt: string) => void;
}

const HomeScreen: React.FC<Props> = ({ onSelectMode, onNavigateWithPrompt }) => {
  const [omnibarInput, setOmnibarInput] = useState('');
  const [isRouting, setIsRouting] = useState(false);

  const handleOmnibarSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!omnibarInput.trim()) return;

    setIsRouting(true);
    try {
      // 1. Ask Gemini which mode this query belongs to
      const targetMode = await determineAppMode(omnibarInput);
      // 2. Navigate and pass the prompt
      onNavigateWithPrompt(targetMode, omnibarInput);
    } catch (error) {
      console.error("Routing failed", error);
      // Fallback
      onSelectMode(AppMode.DEEP_THINK);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-nexus-cyan/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-nexus-cyan via-white to-nexus-blue bg-clip-text text-transparent">
                NEXUS 3
            </h1>
            <p className="text-gray-400 text-xs md:text-sm tracking-[0.3em] font-mono">
                AI OPERATING SYSTEM
            </p>
        </div>

        {/* NEXUS OMNIBAR */}
        <div className="w-full max-w-3xl mb-16 relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-nexus-cyan via-nexus-blue to-nexus-purple rounded-xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-500"></div>
           <form onSubmit={handleOmnibarSubmit} className="relative bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl flex items-center">
              <Search className="ml-6 text-gray-500" size={24} />
              <input 
                type="text" 
                value={omnibarInput}
                onChange={(e) => setOmnibarInput(e.target.value)}
                placeholder="What do you want to create or solve?"
                className="w-full bg-transparent text-white text-lg md:text-xl p-6 focus:outline-none placeholder-gray-600 font-light"
              />
              <button 
                type="submit"
                disabled={!omnibarInput.trim() || isRouting}
                className="mr-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-nexus-cyan font-bold transition-colors disabled:opacity-0"
              >
                {isRouting ? <Loader2 className="animate-spin" /> : "GO"}
              </button>
           </form>
           {isRouting && (
             <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-mono text-nexus-cyan animate-pulse">
               ANALYZING INTENT & ROUTING...
             </div>
           )}
        </div>

        {/* Categorized Grid */}
        <div className="w-full space-y-12 pb-20">
           
           {/* SECTION 1: COGNITION */}
           <CategorySection title="COGNITION">
              <ModeCard 
                title="Deep Think" 
                icon={<Zap size={24} />} 
                desc="Complex Reasoning" 
                color="cyan" 
                onClick={() => onSelectMode(AppMode.DEEP_THINK)} 
              />
              <ModeCard 
                title="Agents" 
                icon={<RefreshCw size={24} />} 
                desc="Autonomous Tasks" 
                color="blue" 
                onClick={() => onSelectMode(AppMode.AGENTS)} 
              />
              <ModeCard 
                title="Codex" 
                icon={<FileCode size={24} />} 
                desc="Context Analysis" 
                color="crimson" 
                onClick={() => onSelectMode(AppMode.CODEX)} 
              />
              <ModeCard 
                title="App Engineer" 
                icon={<Cpu size={24} />} 
                desc="Autonomous CTO" 
                color="indigo" 
                onClick={() => onSelectMode(AppMode.APP_ENGINEER)} 
              />
              <ModeCard 
                title="The Mirror" 
                icon={<Ghost size={24} />} 
                desc="Self-Reflection" 
                color="slate" 
                onClick={() => onSelectMode(AppMode.THE_MIRROR)} 
              />
           </CategorySection>

           {/* SECTION 2: PERCEPTION */}
           <CategorySection title="PERCEPTION">
              <ModeCard 
                title="Oracle" 
                icon={<Globe size={24} />} 
                desc="Live Search" 
                color="green" 
                onClick={() => onSelectMode(AppMode.ORACLE)} 
              />
              <ModeCard 
                title="Atlas" 
                icon={<Map size={24} />} 
                desc="Geospatial" 
                color="gold" 
                onClick={() => onSelectMode(AppMode.ATLAS)} 
              />
              <ModeCard 
                title="Vibe Check" 
                icon={<Eye size={24} />} 
                desc="Vision Analysis" 
                color="purple" 
                onClick={() => onSelectMode(AppMode.VIBE)} 
              />
              <ModeCard 
                title="Frequency" 
                icon={<Activity size={24} />} 
                desc="Live Audio" 
                color="cyan" 
                onClick={() => onSelectMode(AppMode.FREQUENCY)} 
              />
           </CategorySection>

           {/* SECTION 3: CREATION */}
           <CategorySection title="CREATION">
              <ModeCard 
                title="The Forge" 
                icon={<Clapperboard size={24} />} 
                desc="Video Gen" 
                color="orange" 
                onClick={() => onSelectMode(AppMode.FORGE)} 
              />
              <ModeCard 
                title="The Studio" 
                icon={<Palette size={24} />} 
                desc="Product Factory" 
                color="pink" 
                onClick={() => onSelectMode(AppMode.STUDIO)} 
              />
           </CategorySection>

        </div>
      </div>
    </div>
  );
};

const CategorySection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 border-l-2 border-gray-800">{title}</h3>
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
     </div>
  </div>
);

interface CardProps {
  title: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
  onClick: () => void;
}

const ModeCard: React.FC<CardProps> = ({ title, icon, desc, color, onClick }) => {
  const colors: Record<string, string> = {
    cyan: 'border-nexus-cyan/20 text-nexus-cyan hover:border-nexus-cyan hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]',
    blue: 'border-nexus-blue/20 text-nexus-blue hover:border-nexus-blue hover:shadow-[0_0_20px_rgba(0,136,255,0.2)]',
    purple: 'border-nexus-purple/20 text-nexus-purple hover:border-nexus-purple hover:shadow-[0_0_20px_rgba(157,78,221,0.2)]',
    orange: 'border-nexus-orange/20 text-nexus-orange hover:border-nexus-orange hover:shadow-[0_0_20px_rgba(255,95,31,0.2)]',
    green: 'border-nexus-green/20 text-nexus-green hover:border-nexus-green hover:shadow-[0_0_20px_rgba(0,255,157,0.2)]',
    crimson: 'border-nexus-crimson/20 text-nexus-crimson hover:border-nexus-crimson hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]',
    gold: 'border-nexus-gold/20 text-nexus-gold hover:border-nexus-gold hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]',
    pink: 'border-nexus-pink/20 text-nexus-pink hover:border-nexus-pink hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    indigo: 'border-nexus-indigo/20 text-nexus-indigo hover:border-nexus-indigo hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]',
    slate: 'border-nexus-slate/20 text-nexus-slate hover:border-nexus-slate hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]'
  };

  return (
    <button 
      onClick={onClick}
      className={`
        flex flex-col p-4 h-32 justify-between
        bg-nexus-panel/50 backdrop-blur-sm border rounded-xl
        transition-all duration-300 hover:bg-nexus-panel hover:-translate-y-1
        ${colors[color]}
      `}
    >
      <div className="self-start p-2 bg-white/5 rounded-lg">{icon}</div>
      <div className="text-left">
         <div className="font-bold text-white text-sm">{title}</div>
         <div className="text-[10px] text-gray-500 font-mono uppercase">{desc}</div>
      </div>
    </button>
  );
};

export default HomeScreen;
