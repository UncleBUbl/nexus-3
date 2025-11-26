import { useState, useRef, useEffect } from 'react';
import { VibeLevel, VibeAnalysis } from '../types';
import { analyzeVibe as apiAnalyzeVibe } from '../services/geminiService';

export const useVibe = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [level, setLevel] = useState<VibeLevel>(VibeLevel.LITERAL);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VibeAnalysis | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      // Don't alert immediately, just log. UI handles inactive stream visual.
      setError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setAnalyzing(true);
    setResult(null);
    setError('');

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) throw new Error("Could not get canvas context");

      // Draw video frame to canvas
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Get Base64
      const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      // Call Real API
      const data = await apiAnalyzeVibe(base64Image, level);
      setResult(data);
    } catch (err: any) {
      console.error("Vibe analysis failed:", err);
      setError(err.message || "Failed to analyze vibe. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return {
    videoRef,
    canvasRef,
    streamActive,
    level,
    setLevel,
    analyzing,
    result,
    error,
    captureAndAnalyze
  };
};