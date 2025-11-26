
import { GoogleGenAI } from "@google/genai";

interface GeminiOptions {
  enableCodeExecution?: boolean;
  temperature?: number;
  mimeType?: string;
}

export const callGemini = async (
  systemPrompt: string, 
  userPrompt: string, 
  options: GeminiOptions = {}
): Promise<string> => {
  
  // NOTE: This file is currently a mock/placeholder utility. 
  // Real application logic uses services/geminiService.ts
  
  console.log("Mock calling Gemini with:", { systemPrompt, userPrompt, options });
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate latency

  // Mock Response for Deep Think
  if (systemPrompt.includes('The Architect')) {
    return `\`\`\`json
{
  "reasoning": [
    {
      "step": "ANALYSIS",
      "thought": "The user is asking a complex question. I need to break this down into component parts and identify potential constraints.",
      "isError": false
    },
    {
      "step": "HYPOTHESIS 1",
      "thought": "Attempting to solve using linear progression. However, this fails to account for the variable time constraints mentioned.",
      "isError": true
    },
    {
      "step": "RE-EVALUATION",
      "thought": "Switching to a weighted matrix approach allows for multi-variable optimization. This seems much more promising.",
      "isError": false
    }
  ],
  "confidenceScore": 88,
  "finalAnswer": "Based on the weighted matrix analysis, the optimal solution is to prioritize tasks A and C first, which unlocks resource B for the final phase."
}
\`\`\``;
  }

  // Mock Response for Orchestrator
  if (systemPrompt.includes('The Swarm')) {
    return `\`\`\`json
{
  "agents": [
    {
      "id": "agent_alpha",
      "name": "Research Unit",
      "role": "Gather initial data requirements",
      "status": "queued",
      "progress": 0
    },
    {
      "id": "agent_beta",
      "name": "Synthesis Engine",
      "role": "Compile research into actionable format",
      "dependencyId": "agent_alpha",
      "status": "queued",
      "progress": 0
    },
    {
      "id": "agent_gamma",
      "name": "Quality Assurance",
      "role": "Verify constraints and finalize output",
      "dependencyId": "agent_beta",
      "status": "queued",
      "progress": 0
    }
  ]
}
\`\`\``;
  }

  // Mock Response for Vibe Check
  if (systemPrompt.includes('Vibe')) {
    return `\`\`\`json
{
  "objects": "Modern desk setup, mechanical keyboard, succulent plant, warm ambient lighting.",
  "scenario": "Late night coding session or intense creative workflow.",
  "emotion": "Determined, serene, high-focus atmosphere.",
  "vibe_scores": {
    "energy": 7,
    "mood": 8,
    "clarity": 9
  },
  "suggested_action": "Enable Focus Mode"
}
\`\`\``;
  }

  return "Error: Unknown prompt type for mock.";
};

// --- Parsers ---

export const parseThinkingResponse = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);
    return {
      reasoning: json.reasoning || [],
      confidenceScore: json.confidenceScore || 0,
      finalAnswer: json.finalAnswer || ""
    };
  } catch (e) {
    console.error("Failed to parse thinking response", e);
    return { reasoning: [], confidenceScore: 0, finalAnswer: "Parsing Error" };
  }
};

export const parseAgentResponse = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);
    return { agents: json.agents || [] };
  } catch (e) {
    console.error("Failed to parse agent response", e);
    return { agents: [] };
  }
};

export const parseVibeResponse = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);
    return {
      objects: json.objects || "",
      scenario: json.scenario || "",
      emotion: json.emotion || "",
      vibe_scores: json.vibe_scores || { energy: 0, mood: 0, clarity: 0 },
      suggested_action: json.suggested_action || ""
    };
  } catch (e) {
    console.error("Failed to parse vibe response", e);
    return {
      objects: "",
      scenario: "",
      emotion: "",
      vibe_scores: { energy: 0, mood: 0, clarity: 0 },
      suggested_action: ""
    };
  }
};
