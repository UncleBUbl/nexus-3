
import { useState, useCallback, useEffect } from 'react';
import { orchestrateAgents, generateAgentResult, synthesizeSwarmResults } from '../services/geminiService';
import { Agent, AgentStatus } from '../types';

export const useOrchestrator = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [executionStarted, setExecutionStarted] = useState(false);
  const [taskContext, setTaskContext] = useState('');
  
  // Synthesis State
  const [finalReport, setFinalReport] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Derived selected agent
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  const selectAgent = (agentId: string | null) => {
    setSelectedAgentId(agentId);
  };

  const updateAgentStatus = (agentId: string, newStatus: AgentStatus, progress: number = 0) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: newStatus, progress } : a
    ));
  };

  // Execution Logic
  const runAgentSimulation = useCallback((agentId: string, context: string) => {
    // Set status to WORKING
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.WORKING, progress: 0 } : a));

    const interval = setInterval(() => {
      setAgents(prev => {
        const agent = prev.find(a => a.id === agentId);
        // Safety check
        if (!agent) {
          clearInterval(interval);
          return prev;
        }

        // If manually blocked or paused, stop incrementing
        if (agent.status === AgentStatus.BLOCKED) return prev;

        // Increment progress
        // Use a random small increment for natural feel
        const increment = Math.floor(Math.random() * 3) + 1;
        const nextProgress = Math.min(100, agent.progress + increment);

        if (nextProgress >= 100) {
          clearInterval(interval);
          
          // Call API to get the "Real" result text
          generateAgentResult(agent, context).then((resultText) => {
            setAgents(currentAgents => {
              const updatedAgents = currentAgents.map(a => 
                a.id === agentId 
                  ? { ...a, status: AgentStatus.COMPLETE, progress: 100, result: resultText } 
                  : a
              );
              
              // Find and trigger dependents
              const dependents = updatedAgents.filter(a => a.dependencyId === agentId);
              dependents.forEach(dep => {
                // Ensure the dependent isn't already running or complete
                if (dep.status === AgentStatus.QUEUED) {
                   setTimeout(() => runAgentSimulation(dep.id, context), 800);
                }
              });

              return updatedAgents;
            });
          });

          // While waiting for promise, return state with 100% progress
          return prev.map(a => a.id === agentId ? { ...a, progress: 100 } : a);
        }

        return prev.map(a => a.id === agentId ? { ...a, progress: nextProgress } : a);
      });
    }, 50); // 50ms interval for smooth bar animation
  }, []); 

  // Watch for completion to trigger synthesis
  useEffect(() => {
    const allComplete = agents.length > 0 && agents.every(a => a.status === AgentStatus.COMPLETE);
    
    // Trigger synthesis if all complete, execution started, and not already done/doing
    if (allComplete && executionStarted && !finalReport && !isSynthesizing) {
        setIsSynthesizing(true);
        synthesizeSwarmResults(taskContext, agents)
            .then(report => {
                setFinalReport(report);
            })
            .catch(err => {
                console.error("Synthesis failed", err);
                setError("Failed to synthesize final report.");
            })
            .finally(() => {
                setIsSynthesizing(false);
            });
    }
  }, [agents, executionStarted, finalReport, isSynthesizing, taskContext]);


  const decompose = async (userTask: string) => {
    if (!userTask.trim()) return;
    
    setLoading(true);
    setError('');
    setAgents([]);
    setFinalReport(''); // Clear previous report
    setIsSynthesizing(false);
    setExecutionStarted(false);
    setSelectedAgentId(null);
    setTaskContext(userTask);

    try {
      const plans = await orchestrateAgents(userTask);
      
      const newAgents: Agent[] = plans.map(p => ({
        id: p.id!,
        name: p.name!,
        role: p.role!,
        dependencyId: p.dependencyId || undefined,
        status: AgentStatus.QUEUED,
        progress: 0,
        result: ''
      }));
      
      setAgents(newAgents);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to orchestrate agents.");
    } finally {
      setLoading(false);
    }
  };

  const startExecution = () => {
    if (agents.length === 0) return;
    setExecutionStarted(true);
    setFinalReport('');
    
    // Find independent agents (roots) to start the chain
    const roots = agents.filter(a => !a.dependencyId);
    roots.forEach(a => runAgentSimulation(a.id, taskContext));
  };

  return {
    agents,
    selectedAgent,
    loading,
    error,
    executionStarted,
    finalReport,
    isSynthesizing,
    decompose,
    selectAgent,
    updateAgentStatus,
    startExecution
  };
};
