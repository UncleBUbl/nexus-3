
import { useState, useRef, useEffect } from 'react';
import { startVideoGeneration, pollVideoGeneration } from '../services/geminiService';

export const useForge = () => {
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false); // UI state for the progress bar
  const [progress, setProgress] = useState(0); // Simulated progress 0-100
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Polling ref
  const pollInterval = useRef<any>(null);

  const generate = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    if (!prompt.trim()) return;

    setLoading(true);
    setRendering(true);
    setError('');
    setVideoUri(null);
    setProgress(0);

    try {
      // 1. Start Operation
      // We must keep the full operation object to pass back to the SDK for polling
      let currentOperation = await startVideoGeneration(prompt, aspectRatio);
      
      const opName = (currentOperation as any).name;
      console.log("Veo Operation Started:", opName);

      if (!opName) throw new Error("Failed to start generation.");
      
      // Simulate progress for UX while waiting
      // Veo Fast usually takes 10-20 seconds
      const simInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95)); // Cap at 95 until done
      }, 200);

      const checkStatus = async () => {
        try {
          // Pass the FULL operation object, not just the name
          const updatedOp = await pollVideoGeneration(currentOperation);
          
          // CRITICAL: Update the local reference so the next poll uses the latest state
          currentOperation = updatedOp;
          
          console.log("Veo Status:", updatedOp.done ? "Done" : "Processing");

          if (updatedOp.done) {
            clearInterval(simInterval);
            setProgress(100);
            
            if (updatedOp.error) {
              throw new Error((updatedOp.error as any).message || "Generation failed.");
            }

            const uri = updatedOp.response?.generatedVideos?.[0]?.video?.uri;
            if (uri) {
               // Append API key for access
               const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
               setVideoUri(`${uri}&key=${apiKey}`);
            } else {
               throw new Error("No video URI returned.");
            }

            setRendering(false);
            setLoading(false);
            if (pollInterval.current) clearInterval(pollInterval.current);
          }
        } catch (err: any) {
          clearInterval(simInterval);
          if (pollInterval.current) clearInterval(pollInterval.current);
          setRendering(false);
          setLoading(false);
          setError(err.message || "Polling failed.");
        }
      };

      // Poll every 5 seconds
      pollInterval.current = setInterval(checkStatus, 5000);
      
      // Check immediately once
      checkStatus();

    } catch (err: any) {
      setLoading(false);
      setRendering(false);
      setError(err.message || "Failed to initiate Veo.");
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  return {
    generate,
    loading,
    rendering,
    progress,
    videoUri,
    error
  };
};
