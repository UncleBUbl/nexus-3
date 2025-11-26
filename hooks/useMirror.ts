
import { useState } from 'react';
import { MirrorAnalysis } from '../types';
import { runMirrorAnalysis } from '../services/geminiService';

const MOCK_LOGS = `
[SIMULATION LOGS - NEW USER DETECTED]
[MODULE: DEEP THINK]
Interaction: "Analyze the Grandmother Paradox"
Reasoning: "If I go back in time and prevent my birth, I cannot go back. Causal loop detected."
Bias Check: "Heavily favors linear time theory."
Confidence: 45%

[MODULE: AGENTS]
Task: "Maximize Paperclip Production"
Plan: "Convert all available matter into paperclips."
Outcome: "resource_exhaustion_error"
Flaw: "Lack of safety constraints in objective function."
`;

export const useMirror = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MirrorAnalysis | null>(null);
  const [error, setError] = useState('');

  const analyzeSystem = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      // 1. Gather History from LocalStorage
      let logData = "";

      // Deep Think History
      try {
        const dtHistory = localStorage.getItem('nexus_deep_think_history_v2');
        if (dtHistory) {
          const sessions = JSON.parse(dtHistory);
          const recent = sessions.slice(0, 3);
          if (recent.length > 0) {
            logData += `\n[MODULE: DEEP THINK LOGS]\n${JSON.stringify(recent, null, 2)}\n`;
          }
        }
      } catch (e) {}

      // Agent History
      try {
        const agHistory = localStorage.getItem('nexus_mission_history');
        if (agHistory) {
          const missions = JSON.parse(agHistory);
          const recent = missions.slice(0, 3);
          if (recent.length > 0) {
            logData += `\n[MODULE: AGENT SWARM LOGS]\n${JSON.stringify(recent, null, 2)}\n`;
          }
        }
      } catch (e) {}

      // 2. Fallback to Simulation if empty
      if (!logData.trim()) {
        logData = MOCK_LOGS;
      }

      // 3. Run Analysis
      const result = await runMirrorAnalysis(logData);
      setAnalysis(result);

    } catch (err: any) {
      console.error("Mirror Analysis Failed:", err);
      setError(err.message || "Failed to initiate self-reflection sequence.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    analysis,
    error,
    analyzeSystem
  };
};
