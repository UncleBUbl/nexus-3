import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// --- Audio Helpers (Raw PCM Handling) ---

function b64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Float32 audio from AudioContext to PCM Int16 for Gemini
function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

export const useLiveAudio = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [error, setError] = useState('');
  
  // Refs for Audio Contexts and Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Playback state
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // API Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const cleanup = useCallback(() => {
    // Close session logic would go here if exposed by SDK, currently we just stop sending
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop all scheduled playback
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current = [];
    
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const connect = async () => {
    setError('');
    
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 }); // Output rate
      audioContextRef.current = ctx;

      // 2. Setup Analyser for Visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination); // Connect analyser to speaker
      analyserRef.current = analyser;

      // 3. Setup Input Stream (Microphone)
      // Input typically needs 16kHz for best compatibility, but we can downsample if needed.
      // For simplicity here we rely on the context or let the model handle it.
      // Ideally, input context should be 16kHz.
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputCtx.createMediaStreamSource(stream);
      
      // Script Processor for capturing raw PCM
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64Data = arrayBufferToBase64(pcm16);
        
        // Send to Gemini
        if (sessionPromiseRef.current) {
           sessionPromiseRef.current.then(session => {
              session.sendRealtimeInput({
                 media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Data
                 }
              });
           });
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination); // Mute input to speakers to prevent feedback loop? 
      // Actually script processor needs to connect to destination to fire, but we don't want to hear ourselves.
      // Usually creating a Gain(0) works.
      const muteNode = inputCtx.createGain();
      muteNode.gain.value = 0;
      processor.connect(muteNode);
      muteNode.connect(inputCtx.destination);

      inputSourceRef.current = source;
      processorRef.current = processor;

      // 4. Initialize Gemini Session
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Using specific model for Live API
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // 'Kore' has a nice sci-fi tone
          },
          systemInstruction: "You are NEXUS, a futuristic AI interface. Keep responses concise, precise, and spoken with a calm, slightly robotic but friendly cadence."
        },
        callbacks: {
          onopen: () => {
            console.log("Nexus Live Connection Established");
            setIsConnected(true);
            nextStartTimeRef.current = ctx.currentTime;
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Check for interruption
            const interrupted = msg.serverContent?.interrupted;
            if (interrupted) {
               console.log("Interrupted");
               scheduledSourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e){}
               });
               scheduledSourcesRef.current = [];
               nextStartTimeRef.current = ctx.currentTime;
               setIsSpeaking(false);
               return;
            }

            // Handle Audio Data
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              
              const pcmData = b64ToUint8Array(base64Audio);
              const pcm16 = new Int16Array(pcmData.buffer);
              
              // Convert PCM16 to Float32 for Web Audio API
              const float32 = new Float32Array(pcm16.length);
              for(let i=0; i<pcm16.length; i++) {
                 float32[i] = pcm16[i] / 32768.0;
              }

              const buffer = ctx.createBuffer(1, float32.length, 24000);
              buffer.getChannelData(0).set(float32);

              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = buffer;
              
              // Route through visualizer
              if (analyserRef.current) {
                 sourceNode.connect(analyserRef.current);
              } else {
                 sourceNode.connect(ctx.destination);
              }

              // Schedule playback
              // Ensure we don't schedule in the past
              const now = ctx.currentTime;
              const start = Math.max(now, nextStartTimeRef.current);
              sourceNode.start(start);
              nextStartTimeRef.current = start + buffer.duration;
              
              scheduledSourcesRef.current.push(sourceNode);
              
              sourceNode.onended = () => {
                 scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== sourceNode);
                 if (scheduledSourcesRef.current.length === 0) {
                    setIsSpeaking(false);
                 }
              };
            }
          },
          onclose: () => {
            console.log("Nexus Live Connection Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
             console.error("Nexus Live Error", err);
             setError("Connection disrupted.");
             setIsConnected(false);
          }
        }
      });

    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Failed to initialize neural link.";
      
      // Improve error message for permissions
      if (errMsg.includes("Permission denied") || errMsg.includes("NotAllowedError")) {
        errMsg = "Microphone access denied. Please enable permissions in your browser settings.";
      }
      
      setError(errMsg);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    cleanup();
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isConnected,
    isSpeaking,
    error,
    connect,
    disconnect,
    analyser: analyserRef.current
  };
};