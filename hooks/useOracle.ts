import { useState } from 'react';
import { OracleResult } from '../types';
import { runOracleSearch } from '../services/geminiService';

export const useOracle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OracleResult | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await runOracleSearch(query);
      setResult(data);
    } catch (err: any) {
      console.error("Oracle search failed:", err);
      setError(err.message || "Uplink failed. Unable to retrieve grounded intelligence.");
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    loading,
    error,
    search
  };
};