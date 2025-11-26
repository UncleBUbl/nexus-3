import { useState } from 'react';
import { OracleResult } from '../types';
import { runAtlasQuery } from '../services/geminiService';

export const useAtlas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OracleResult | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await runAtlasQuery(query);
      setResult(data);
    } catch (err: any) {
      console.error("Atlas query failed:", err);
      setError(err.message || "Satellite uplink disrupted. Unable to acquire geospatial targets.");
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