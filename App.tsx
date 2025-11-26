
import React, { useState, useEffect } from 'react';
import { AppMode, UserProfile } from './types';
import HomeScreen from './components/HomeScreen';
import DeepThinkMode from './components/DeepThinkMode';
import AgentMode from './components/AgentMode';
import VibeMode from './components/VibeMode';
import FrequencyMode from './components/FrequencyMode';
import ForgeMode from './components/ForgeMode';
import OracleMode from './components/OracleMode';
import CodexMode from './components/CodexMode';
import AtlasMode from './components/AtlasMode';
import StudioMode from './components/StudioMode';
import AppEngineerMode from './components/AppEngineerMode';
import MirrorMode from './components/MirrorMode';
import { apiKeyService } from './services/apiKeyService';
import { ShieldCheck, Lock, User, LogIn, Mail } from 'lucide-react';
import { ToastProvider, useToast } from './components/Toast';

// Simple Auth Context
const UserContext = React.createContext<{ user: UserProfile | null, signIn: (email: string) => void, signOut: () => void }>({
  user: null,
  signIn: () => {},
  signOut: () => {}
});

export const useUser = () => React.useContext(UserContext);

const AppContent: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.HOME);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nexus_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    // Check localStorage for last active mode
    const savedMode = localStorage.getItem('nexus_active_mode');
    if (savedMode && Object.values(AppMode).includes(savedMode as AppMode)) {
      if (savedMode !== AppMode.HOME) {
        setActiveMode(savedMode as AppMode);
      }
    }

    checkAuthorization();
    
    // Deep Link Parsing
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    
    // Parse prompt from various common keys (q, task, idea, prompt)
    const promptParam = params.get('q') || params.get('task') || params.get('idea') || params.get('prompt') || '';

    if (modeParam && Object.values(AppMode).includes(modeParam as AppMode)) {
      setActiveMode(modeParam as AppMode);
      if (promptParam) setInitialPrompt(promptParam);
    }
  }, []);

  // Persist Active Mode
  useEffect(() => {
    localStorage.setItem('nexus_active_mode', activeMode);
  }, [activeMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K -> Home
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveMode(AppMode.HOME);
        showToast("Returned to Nexus Home", "info");
      }
      // ESC -> Back (if not at Home)
      if (e.key === 'Escape' && activeMode !== AppMode.HOME) {
        // Only if no modals are likely open (simplification)
        setActiveMode(AppMode.HOME);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, showToast]);

  const checkAuthorization = async () => {
    setCheckingAuth(true);
    const hasKey = await apiKeyService.hasApiKey();
    setIsAuthorized(hasKey);
    setCheckingAuth(false);
  };

  const handleAuthorize = async () => {
    await apiKeyService.requestApiKey();
    await checkAuthorization();
  };

  const handleNavigateWithPrompt = (mode: AppMode, prompt: string) => {
    setInitialPrompt(prompt);
    setActiveMode(mode);
  };

  const signIn = (email: string) => {
    if (!email.trim()) return;
    const newUser = { id: email, email, name: email.split('@')[0] };
    setUser(newUser);
    localStorage.setItem('nexus_user_profile', JSON.stringify(newUser));
    setShowLogin(false);
    showToast(`Welcome back, ${newUser.name}`);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('nexus_user_profile');
    showToast("Logged out successfully");
  };

  const renderMode = () => {
    switch (activeMode) {
      case AppMode.DEEP_THINK:
        return <DeepThinkMode onBack={() => setActiveMode(AppMode.HOME)} initialPrompt={initialPrompt} />;
      case AppMode.AGENTS:
        return <AgentMode onBack={() => setActiveMode(AppMode.HOME)} initialPrompt={initialPrompt} />;
      case AppMode.VIBE:
        return <VibeMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.FREQUENCY:
        return <FrequencyMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.FORGE:
        return <ForgeMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.ORACLE:
        return <OracleMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.CODEX:
        return <CodexMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.ATLAS:
        return <AtlasMode onBack={() => setActiveMode(AppMode.HOME)} />;
      case AppMode.STUDIO:
        return <StudioMode onBack={() => setActiveMode(AppMode.HOME)} initialPrompt={initialPrompt} />;
      case AppMode.APP_ENGINEER:
        return <AppEngineerMode onBack={() => setActiveMode(AppMode.HOME)} initialPrompt={initialPrompt} />;
      case AppMode.THE_MIRROR:
        return <MirrorMode onBack={() => setActiveMode(AppMode.HOME)} />;
      default:
        return <HomeScreen onSelectMode={setActiveMode} onNavigateWithPrompt={handleNavigateWithPrompt} />;
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
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, signIn, signOut }}>
      <div className="min-h-screen bg-nexus-black text-white font-sans selection:bg-nexus-cyan selection:text-black relative">
        
        {/* Auth Header Overlay (Visible on Home) */}
        {activeMode === AppMode.HOME && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4">
            {user ? (
               <div className="flex items-center gap-4 bg-nexus-panel/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:border-nexus-cyan/50 transition-colors">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-nexus-cyan/20 flex items-center justify-center border border-nexus-cyan">
                        <User size={16} className="text-nexus-cyan" />
                     </div>
                     <span className="text-sm font-bold text-white">{user.name}</span>
                  </div>
                  <button 
                    onClick={signOut} 
                    className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-mono"
                  >
                    Log Out
                  </button>
               </div>
            ) : (
               <button 
                 onClick={() => setShowLogin(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-bold text-nexus-cyan"
               >
                 <LogIn size={16} />
                 <span>Sign In</span>
               </button>
            )}
          </div>
        )}

        {/* Login Modal */}
        {showLogin && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-nexus-panel border border-white/20 rounded-xl max-w-sm w-full p-8 shadow-2xl relative animate-in zoom-in-95">
                 <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                 <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-nexus-cyan/10 rounded-full flex items-center justify-center mb-4 text-nexus-cyan border border-nexus-cyan/30">
                       <User size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wider">USER IDENTITY</h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">Sign in to sync your history</p>
                 </div>
                 <div className="space-y-4">
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                       <input 
                         type="email" 
                         value={emailInput}
                         onChange={(e) => setEmailInput(e.target.value)}
                         placeholder="enter_email@nexus.sys"
                         className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-nexus-cyan focus:outline-none"
                         autoFocus
                         onKeyDown={(e) => e.key === 'Enter' && signIn(emailInput)}
                       />
                    </div>
                    <button 
                      onClick={() => signIn(emailInput)}
                      className="w-full py-3 bg-nexus-cyan text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-neon-cyan"
                    >
                      ESTABLISH LINK
                    </button>
                 </div>
              </div>
           </div>
        )}

        <main className="h-screen overflow-y-auto scrollbar-hide">
          {renderMode()}
        </main>
      </div>
    </UserContext.Provider>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
