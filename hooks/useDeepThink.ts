
import { useState, useEffect, useRef } from 'react';
import { ReasoningStep, DeepThinkSession, DeepThinkInteraction } from '../types';
import { runDeepThink } from '../services/geminiService';

export const useDeepThink = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Active Thread State (Array of interactions)
  const [interactions, setInteractions] = useState<DeepThinkInteraction[]>([]);
  
  // History Storage (Saved Sessions)
  const [history, setHistory] = useState<DeepThinkSession[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_deep_think_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Persist history
  useEffect(() => {
    localStorage.setItem('nexus_deep_think_history_v2', JSON.stringify(history));
  }, [history]);

  // Load a past session into the active view
  const loadSession = (session: DeepThinkSession) => {
    setInteractions(session.interactions);
    setError('');
  };

  const clearSession = () => {
    setInteractions([]);
    setError('');
  };

  const deleteSession = (sessionId: string) => {
    setHistory(prev => prev.filter(s => s.id !== sessionId));
    // If we are currently viewing this session, clear the view
    if (interactions.length > 0 && interactions[0].id === sessionId) {
      clearSession();
    }
  };

  const think = async (question: string) => {
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    
    // Construct Context from ALL previous interactions in this thread
    let contextString = '';
    if (interactions.length > 0) {
      contextString = interactions.map((interaction, index) => `
TURN ${index + 1}:
User Question: "${interaction.question}"
Architect Final Answer: "${interaction.result.finalAnswer}"
Architect Reasoning Summary: ${interaction.result.steps.map(s => s.thought).join('; ')}
`).join('\n\n----------------\n\n');
    }

    try {
      // Call service with cumulative context
      const result = await runDeepThink(question, contextString);
      
      const newInteraction: DeepThinkInteraction = {
        id: Date.now().toString(),
        question: question,
        result: result,
        timestamp: Date.now()
      };

      // Update Active Thread
      const updatedInteractions = [...interactions, newInteraction];
      setInteractions(updatedInteractions);
      
      // Update History (Create new session or update existing one matching the thread ID?)
      // For simplicity, we treat the current 'interactions' array as the active session.
      // We will save/update this session in the history list.
      
      const sessionTitle = updatedInteractions[0].question;
      const sessionId = updatedInteractions[0].id; // Use ID of first interaction as Session ID

      setHistory(prev => {
        // Check if session exists
        const exists = prev.find(s => s.id === sessionId);
        if (exists) {
          return prev.map(s => s.id === sessionId ? { ...s, interactions: updatedInteractions, timestamp: Date.now() } : s);
        } else {
          // Create new session
          const newSession: DeepThinkSession = {
            id: sessionId,
            title: sessionTitle,
            interactions: updatedInteractions,
            timestamp: Date.now()
          };
          return [newSession, ...prev];
        }
      });

    } catch (err: any) {
      setError(err.message || "Neural link unstable. Unable to process thought.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    interactions,
    loading,
    error,
    history,
    hasContext: interactions.length > 0,
    think,
    loadSession,
    clearSession,
    deleteSession
  };
};