
import { useState, useEffect } from 'react';
import { AppBlueprint, ChatMessage, BlueprintSession } from '../types';
import { generateAppBlueprint, queryAppBlueprint } from '../services/geminiService';

export const useAppEngineer = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null);
  const [error, setError] = useState('');
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Session History
  const [history, setHistory] = useState<BlueprintSession[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_blueprint_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('nexus_blueprint_history', JSON.stringify(history));
  }, [history]);

  const generate = async (idea: string) => {
    if (!idea.trim()) return;
    
    setLoading(true);
    setError('');
    setBlueprint(null);
    setChatHistory([]); // Clear chat for new project

    try {
      const result = await generateAppBlueprint(idea);
      setBlueprint(result);
      
      // Save to history
      const newSession: BlueprintSession = {
        id: Date.now().toString(),
        idea,
        blueprint: result,
        timestamp: Date.now()
      };
      setHistory(prev => [newSession, ...prev]);

    } catch (err: any) {
      console.error("Blueprint generation failed:", err);
      setError(err.message || "Failed to engineer application blueprint.");
    } finally {
      setLoading(false);
    }
  };

  const askCTO = async (question: string) => {
    if (!blueprint || !question.trim()) return;
    
    const newMessage: ChatMessage = { role: 'user', content: question, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMessage]);
    setIsChatting(true);

    try {
      const answer = await queryAppBlueprint(blueprint, chatHistory, question);
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer, timestamp: Date.now() }]);
    } catch (err: any) {
      setError("CTO unavailable.");
    } finally {
      setIsChatting(false);
    }
  };

  const loadSession = (session: BlueprintSession) => {
    setBlueprint(session.blueprint);
    setChatHistory([]); 
    setError('');
  };

  const deleteSession = (sessionId: string) => {
    setHistory(prev => prev.filter(s => s.id !== sessionId));
    if (blueprint && history.find(s => s.id === sessionId)?.blueprint === blueprint) {
      setBlueprint(null);
    }
  };

  return {
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
  };
};