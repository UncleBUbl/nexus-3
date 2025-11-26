import { useState, useRef, useEffect } from 'react';
import { IngestedFile, ChatMessage } from '../types';
import { runCodexQuery, runCodeCompletion } from '../services/geminiService';

export const useCodex = () => {
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState('');
  
  // Editor State
  const [editorCode, setEditorCode] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  
  const ingestFile = (file: File) => {
    setIngesting(true);
    setError('');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setFiles(prev => [...prev, {
          name: file.name,
          content: content,
          size: file.size,
          type: file.type
        }]);
      }
      setIngesting(false);
    };

    reader.onerror = () => {
      setError("Failed to read file stream.");
      setIngesting(false);
    };

    reader.readAsText(file); // For demo, we assume text-based files. 
    // For PDFs in a real app, we'd need a parser or upload to File API.
  };

  const ask = async (question: string) => {
    if (!question.trim()) return;
    if (files.length === 0) {
      setError("No data ingested. Please upload a file first.");
      return;
    }

    const newMessage: ChatMessage = { role: 'user', content: question, timestamp: Date.now() };
    setHistory(prev => [...prev, newMessage]);
    setLoading(true);
    setError('');

    try {
      const answer = await runCodexQuery(files, history, question);
      setHistory(prev => [...prev, { role: 'assistant', content: answer, timestamp: Date.now() }]);
    } catch (err: any) {
      console.error("Codex error", err);
      setError(err.message || "Query failed.");
      setHistory(prev => [...prev, { role: 'assistant', content: "Error accessing data archives.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const completeCode = async () => {
    if (!editorCode.trim() || files.length === 0) return;
    
    setIsCompleting(true);
    setSuggestion('');
    setError('');

    try {
      const completion = await runCodeCompletion(files, editorCode);
      setSuggestion(completion);
    } catch (err: any) {
      console.error("Completion error", err);
      setError("Autocompletion failed.");
    } finally {
      setIsCompleting(false);
    }
  };

  const clearSession = () => {
    setFiles([]);
    setHistory([]);
    setEditorCode('');
    setSuggestion('');
    setError('');
  };

  return {
    files,
    history,
    loading,
    ingesting,
    error,
    editorCode,
    setEditorCode,
    suggestion,
    setSuggestion,
    isCompleting,
    completeCode,
    ingestFile,
    ask,
    clearSession
  };
};