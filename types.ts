
export enum AppMode {
  HOME = 'HOME',
  DEEP_THINK = 'DEEP_THINK',
  AGENTS = 'AGENTS',
  VIBE = 'VIBE'
}

export interface ReasoningStep {
  step: string;
  thought: string;
  isError?: boolean;
  code?: string;
  codeOutput?: string;
}

export interface DeepThinkResult {
  steps: ReasoningStep[];
  confidence: number;
  finalAnswer: string;
}

export enum AgentStatus {
  QUEUED = 'QUEUED',
  WORKING = 'WORKING',
  BLOCKED = 'BLOCKED',
  COMPLETE = 'COMPLETE'
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number;
  result?: string;
  dependencyId?: string;
}

export enum VibeLevel {
  LITERAL = 1,
  CONTEXTUAL = 2,
  ABSTRACT = 3
}

export interface VibeAnalysis {
  description: string;
  interpretation: string;
  emotionalResonance: string;
  scores: {
    energy: number;
    mood: number;
    clarity: number;
  };
  suggestedAction: string;
}
