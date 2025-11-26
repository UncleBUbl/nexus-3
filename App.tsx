
import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import HomeScreen from './components/HomeScreen';
import DeepThinkMode from './components/DeepThinkMode';
import AgentMode from './components/AgentMode';
import VibeMode from './components/VibeMode';
import { apiKeyService } from './services/apiKeyService';
import { ShieldCheck, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.HOME);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    setCheckingAuth(true);
    const hasKey = await apiKeyService.hasApiKey();
    setIsAuthorized(hasKey);
    setCheckingAuth(false);
  };

  const handleAuthorize = async () => {
    await apiKeyService.requestApiKey();
    // Re-check after attempting authorization
    // In some environments, the selection might be instant or async, 
    // but we rely on the prompt instructing us to assume success or re-prompt.
    await checkAuthorization();
  };

  const renderMode = () => {
    switch (activeMode) {
      case AppMode.DEEP_THINK:
        return <DeepThinkMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.AGENTS:
        return <AgentMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.VIBE:
        return <VibeMode onBack={() => setActiveMode(AppMode.HOME)} />;
      default:
        return <HomeScreen onSelectMode={setActiveMode} />;
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-nexus-black flex items-center justify-center text-nexus-cyan">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldCheck size={48} />
          <span className="font-mono tracking-widest">VERIFYING NEURAL LINK...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-nexus-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-nexus-panel border border-red-500/30 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <Lock size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wider">SYSTEM LOCKED</h1>
          <p className="text-gray-400 mb-8 font-mono text-sm">
            Valid API credentials required to access Nexus 3 capabilities. 
            Please select a paid API key to proceed.
          </p>
          
          <button 
            onClick={handleAuthorize}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} />
            <span>INITIALIZE AUTHORIZATION</span>
          </button>
          
          <div className="mt-6 text-xs text-gray-600">
            Nexus 3 Security Protocol v3.0.1
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-black text-white font-sans selection:bg-nexus-cyan selection:text-black">
      <main className="h-screen overflow-y-auto scrollbar-hide">
        {renderMode()}
      </main>
    </div>
  );
};

export default App;
