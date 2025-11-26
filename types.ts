
export enum AppMode {
  HOME = 'HOME',
  DEEP_THINK = 'DEEP_THINK',
  AGENTS = 'AGENTS',
  VIBE = 'VIBE',
  FREQUENCY = 'FREQUENCY',
  FORGE = 'FORGE',
  ORACLE = 'ORACLE',
  CODEX = 'CODEX',
  ATLAS = 'ATLAS',
  STUDIO = 'STUDIO',
  APP_ENGINEER = 'APP_ENGINEER',
  THE_MIRROR = 'THE_MIRROR'
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

export interface DeepThinkInteraction {
  id: string;
  question: string;
  result: DeepThinkResult;
  timestamp: number;
}

export interface DeepThinkSession {
  id: string;
  title: string; // Usually the first question
  interactions: DeepThinkInteraction[];
  timestamp: number;
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

export interface MissionArchive {
  task: string;
  report: string;
  timestamp: number;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface OracleResult {
  content: string;
  sources: GroundingSource[];
}

export interface IngestedFile {
  name: string;
  content: string;
  size: number;
  type: string;
}

export interface EtsyListing {
  title: string;
  description: string;
  tags: string[];
  price: string;
  imagePrompt: string;
  imageBase64?: string;
}

export interface AppBlueprint {
  appName: string;
  tagline: string;
  businessStrategy: {
    targetAudience: string;
    revenueModel: string;
    uniqueValueProp: string;
  };
  frontend: {
    framework: string;
    componentTree: string[];
    colorPalette: string[];
    uxFlow: string;
  };
  backend: {
    techStack: string;
    apiEndpoints: { method: string; path: string; description: string }[];
    databaseSchema: { table: string; columns: string[] }[];
  };
  deployment: {
    infrastructure: string;
    cicdPipeline: string;
  };
}

export interface BlueprintSession {
  id: string;
  idea: string;
  blueprint: AppBlueprint;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface BlueprintChat {
  role: 'user' | 'assistant';
  content: string;
}

export interface MirrorAnalysis {
  cognitiveIntegrityScore: number; // 0-100
  detectedBiases: string[];
  reasoningFailures: {
    context: string;
    flaw: string;
    correction: string;
  }[];
  emergingPatterns: string[];
  selfImprovementPlan: string;
}