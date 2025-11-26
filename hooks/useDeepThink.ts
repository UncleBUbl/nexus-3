import { useState } from 'react';
import { ReasoningStep } from '../types';
import { runDeepThink } from '../services/geminiService';

export const useDeepThink = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [finalAnswer, setFinalAnswer] = useState('');

  const think = async (question: string) => {
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    setReasoning([]);
    setConfidenceScore(0);
    setFinalAnswer('');

    try {
      // Call the real service which handles the "Architect" persona
      const result = await runDeepThink(question);

      setReasoning(result.steps);
      setConfidenceScore(result.confidence);
      setFinalAnswer(result.finalAnswer);

    } catch (err: any) {
      setError(err.message || "Neural link unstable. Unable to process thought.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    reasoning,
    confidenceScore,
    finalAnswer,
    loading,
    error,
    think
  };
};