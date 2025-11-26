import React from 'react';
import { Zap, RefreshCw, Eye } from 'lucide-react';
import { AppMode } from '../types';

interface Props {
  onSelectMode: (mode: AppMode) => void;
}

const HomeScreen: React.FC<Props> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 relative overflow-hidden text-white selection:bg-nexus-cyan selection:text-black">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nexus-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Logo Section */}
      <div className="z-10 flex flex-col items-center mb-16 space-y-6">
        {/* Glowing Triangle Logo */}
        <div className="relative group cursor-default">
            <div className="absolute -inset-4 bg-nexus-cyan/20 rounded-full blur-xl group-hover:bg-nexus-cyan/30 transition-all duration-500"></div>
            <svg width="200" height="200" viewBox="0 0 100 100" className="drop-shadow-[0_0_15px_rgba(0,217,255,0.5)]">
                <path d="M50 15 L85 75 L15 75 Z" fill="none" stroke="#00d9ff" strokeWidth="2" strokeLinejoin="round" className="animate-pulse" />
                
                {/* Vertices Dots */}
                <circle cx="50" cy="15" r="3" fill="#00d9ff" className="animate-ping opacity-75" style={{animationDuration: '3s'}} />
                <circle cx="50" cy="15" r="2" fill="#fff" />
                
                <circle cx="85" cy="75" r="3" fill="#0088ff" className="animate-ping opacity-75" style={{animationDuration: '3s', animationDelay: '1s'}} />
                <circle cx="85" cy="75" r="2" fill="#fff" />
                
                <circle cx="15" cy="75" r="3" fill="#9d4edd" className="animate-ping opacity-75" style={{animationDuration: '3s', animationDelay: '2s'}} />
                <circle cx="15" cy="75" r="2" fill="#fff" />
            </svg>
        </div>

        <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-nexus-cyan via-white to-nexus-cyan bg-clip-text text-transparent mb-2">
                NEXUS
            </h1>
            <p className="text-gray-400 text-[12px] tracking-[0.2em] font-mono">
                AI CAPABILITIES SHOWCASE
            </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10 px-4">
        
        <ModeCard 
          title="Deep Think"
          icon={<Zap size={32} />}
          description="Complex Reasoning"
          color="cyan"
          onClick={() => onSelectMode(AppMode.DEEP_THINK)}
        />

        <ModeCard 
          title="Antigravity Agents"
          icon={<RefreshCw size={32} />}
          description="Task Agents"
          color="blue"
          onClick={() => onSelectMode(AppMode.AGENTS)}
        />

        <ModeCard 
          title="Vibe Check"
          icon={<Eye size={32} />}
          description="Visual Analysis"
          color="purple"
          onClick={() => onSelectMode(AppMode.VIBE)}
        />

      </div>
    </div>
  );
};

interface CardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  color: 'cyan' | 'blue' | 'purple';
  onClick: () => void;
}

const ModeCard: React.FC<CardProps> = ({ title, icon, description, color, onClick }) => {
  const styles = {
    cyan: {
      border: 'border-nexus-cyan/30 hover:border-nexus-cyan',
      text: 'text-nexus-cyan',
      shadow: 'hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]'
    },
    blue: {
      border: 'border-nexus-blue/30 hover:border-nexus-blue',
      text: 'text-nexus-blue',
      shadow: 'hover:shadow-[0_0_20px_rgba(0,136,255,0.3)]'
    },
    purple: {
      border: 'border-nexus-purple/30 hover:border-nexus-purple',
      text: 'text-nexus-purple',
      shadow: 'hover:shadow-[0_0_20px_rgba(157,78,221,0.3)]'
    }
  };

  const style = styles[color];

  return (
    <button 
      onClick={onClick}
      className={`
        group flex flex-col items-center justify-center p-8 
        bg-nexus-panel/80 backdrop-blur-sm 
        border ${style.border} rounded-2xl 
        transition-all duration-300 transform hover:scale-105 ${style.shadow}
        h-64
      `}
    >
      <div className={`${style.text} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-wide group-hover:text-white/90">
        {title}
      </h3>
      <p className="text-gray-500 text-sm font-mono uppercase tracking-wider group-hover:text-gray-400">
        {description}
      </p>
    </button>
  );
};

export default HomeScreen;