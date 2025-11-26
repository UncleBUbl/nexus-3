
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DeepThinkResult, VibeLevel, VibeAnalysis, Agent, ChatMessage, MissionArchive, OracleResult, IngestedFile, EtsyListing, AppBlueprint, AppMode, MirrorAnalysis } from "../types";

// Helper to get a fresh client instance with the current key
const getClient = () => {
  // Support both standard API_KEY and requested GEMINI_API_KEY
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing. Please authorize or set GEMINI_API_KEY.");
  return new GoogleGenAI({ apiKey });
};

// --- Intent Routing Service (Omnibar) ---

export const determineAppMode = async (prompt: string): Promise<AppMode> => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `User Prompt: "${prompt}"
    
    Based on the prompt, map it to the single best Mode from this list:
    - DEEP_THINK: Complex math, logic, reasoning, code debugging.
    - AGENTS: Multi-step plans, research, itineraries, project management.
    - VIBE: (Do not select - requires image input).
    - FORGE: Video generation, scene description.
    - ORACLE: Live facts, news, stock prices, sports scores.
    - CODEX: Document analysis, long context (only if user explicitly mentions uploading).
    - ATLAS: Maps, location, directions.
    - STUDIO: Etsy products, digital assets, art ideas.
    - APP_ENGINEER: App ideas, coding projects, system architecture, "build me an app".
    - THE_MIRROR: Self-reflection, analyze my history, how am I doing, check for bias.
    
    Return ONLY the Enum string (e.g., "AGENTS"). Default to "DEEP_THINK" if unsure.`,
  });

  const text = response.text?.trim().toUpperCase() || 'DEEP_THINK';
  
  // Validate
  if (Object.values(AppMode).includes(text as AppMode)) {
    return text as AppMode;
  }
  return AppMode.DEEP_THINK;
};

// --- Deep Think Service ---

const deepThinkSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING, description: "Title of the reasoning step (e.g., 'Analysis', 'Calculation', 'Hypothesis')" },
          thought: { type: Type.STRING, description: "Detailed inner monologue explaining the reasoning" },
          isError: { type: Type.BOOLEAN, description: "True if this step represents a failed attempt or realization of error" },
          code: { type: Type.STRING, description: "Python code executed during this step, if any", nullable: true },
          codeOutput: { type: Type.STRING, description: "Output/Result of the python code execution, if any", nullable: true }
        }
      }
    },
    confidence: { type: Type.INTEGER, description: "Confidence score 0-100 based on the solidity of the solution" },
    finalAnswer: { type: Type.STRING, description: "The optimal, concise solution to the problem" }
  },
  required: ["steps", "confidence", "finalAnswer"]
};

export const runDeepThink = async (prompt: string, previousContext?: string): Promise<DeepThinkResult> => {
  const ai = getClient();

  let fullPrompt = prompt;
  if (previousContext) {
    fullPrompt = `
PREVIOUS REASONING CONTEXT:
${previousContext}

USER FOLLOW-UP QUESTION:
${prompt}

INSTRUCTION: Answer the follow-up question while maintaining consistency with the previous reasoning context provided above.
`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: fullPrompt,
    config: {
      tools: [{ codeExecution: {} }],
      systemInstruction: `You are 'The Architect'—a System 2 reasoning engine with Python code execution capabilities. 
Analyze the user's problem with deep reasoning.
      
Your process must follow these stages:
1. ANALYSIS: Restate the problem, identify constraints, and check for edge cases.
2. REASONING PATH: Explore 2-3 approaches. Show your work. 
   - CRITICAL: If the problem involves math, logic puzzles, or data processing, YOU MUST WRITE AND EXECUTE PYTHON CODE to verify your answer.
   - When you use code, include the code snippet and its output in the corresponding 'code' and 'codeOutput' fields of the reasoning step.
3. CONFIDENCE: Evaluate your final solution's robustness (0-100).
4. FINAL ANSWER: Provide the optimal solution clearly.

Output MUST be a JSON object matching the defined schema.`,
      responseMimeType: "application/json",
      responseSchema: deepThinkSchema,
      temperature: 0.2
    }
  });

  if (!response.text) throw new Error("No response from AI");
  const data = JSON.parse(response.text);
  
  // Defensive checks
  if (!data.steps) data.steps = [];
  
  return data as DeepThinkResult;
};

// --- Agent Orchestrator Service ---

const agentPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    agents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          role: { type: Type.STRING, description: "Specific responsibility of this agent" },
          dependencyId: { type: Type.STRING, description: "ID of another agent this one must wait for (optional)", nullable: true }
        },
        required: ["id", "name", "role"]
      }
    }
  },
  required: ["agents"]
};

export const orchestrateAgents = async (goal: string, pastMissions: MissionArchive[] = []): Promise<Partial<Agent>[]> => {
  const ai = getClient();

  const memoryContext = pastMissions.length > 0
    ? `
SWARM MEMORY (PREVIOUS MISSIONS):
${pastMissions.map((m, i) => `MISSION ${i+1}: "${m.task}"\nRESULT SUMMARY: ${m.report.substring(0, 300)}...`).join('\n\n')}

INSTRUCTION: Use the Swarm Memory above. If the new goal relates to previous work, assign agents to retrieve that data instead of re-doing work. Optimize the plan based on learned context.
`
    : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Goal: ${goal}`,
    config: {
      systemInstruction: `You are 'The Swarm', an autonomous task orchestrator. Break the user's goal into 3-5 distinct sub-agents. Assign IDs (e.g., 'A1', 'A2'). If a task strictly requires output from another, set a dependencyId.
      ${memoryContext}`,
      responseMimeType: "application/json",
      responseSchema: agentPlanSchema
    }
  });

  if (!response.text) throw new Error("No response from AI");
  const data = JSON.parse(response.text);
  
  if (!data.agents) data.agents = [];
  
  return data.agents;
};

export const generateAgentResult = async (agent: Agent, originalGoal: string): Promise<string> => {
    const ai = getClient();

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: `I am agent ${agent.name} (ID: ${agent.id}). My role is: ${agent.role}. The overall goal of the swarm is: ${originalGoal}.
        
        Generate a concise but substantive output for my specific task. 
        - If I am a researcher, provide the data I found.
        - If I am a coder, provide the structure or snippet.
        - If I am a planner, provide the schedule.
        
        Keep it under 80 words, but make it look like real work product. Use bullet points if necessary.`,
    });
    return response.text || "Task Complete.";
}

export const synthesizeSwarmResults = async (goal: string, agents: Agent[]): Promise<string> => {
  const ai = getClient();
  
  const agentOutputs = agents.map(a => `[AGENT: ${a.name} (${a.role})]:\n${a.result || "No Output"}`).join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      ORIGINAL MISSION: ${goal}
      
      SWARM AGENT OUTPUTS:
      ${agentOutputs}
      
      You are the Swarm Commander. The mission is complete.
      Synthesize the individual outputs above into a final, cohesive Mission Debrief for the user.
      - Eliminate redundancy.
      - Merge the findings into a unified solution or plan.
      - Use professional, futuristic formatting (headers, bullet points).
      - Keep it concise but comprehensive.
    `
  });

  return response.text || "Mission Synthesis Failed.";
};

export const querySwarmMemory = async (
  goal: string, 
  agents: Agent[], 
  finalReport: string, 
  chatHistory: ChatMessage[], 
  question: string
): Promise<string> => {
  const ai = getClient();
  
  const agentData = agents.map(a => `[AGENT: ${a.name}]: ${a.result}`).join('\n');
  const historyContext = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      CONTEXT:
      Original Goal: ${goal}
      Agent Data: \n${agentData}
      Final Report: \n${finalReport}
      
      CHAT HISTORY:
      ${historyContext}
      
      USER QUESTION: ${question}
      
      You are the interface to the Swarm Intelligence. Answer the user's follow-up question based strictly on the context provided above.
      Be helpful, concise, and maintain the futuristic persona.
    `
  });

  return response.text || "Accessing Swarm Memory... No data found.";
};

// --- Vibe Check Service ---

const vibeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    interpretation: { type: Type.STRING },
    emotionalResonance: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        energy: { type: Type.INTEGER },
        mood: { type: Type.INTEGER },
        clarity: { type: Type.INTEGER }
      }
    },
    suggestedAction: { type: Type.STRING }
  }
};

export const analyzeVibe = async (base64Image: string, level: VibeLevel): Promise<VibeAnalysis> => {
  const ai = getClient();

  let systemPrompt = "";
  switch (level) {
    case VibeLevel.LITERAL:
      systemPrompt = "Analyze this image literally. Describe objects, colors, and spatial layout objectively.";
      break;
    case VibeLevel.CONTEXTUAL:
      systemPrompt = "Analyze the context of this image. What is happening? What is the function of this space or object?";
      break;
    case VibeLevel.ABSTRACT:
      systemPrompt = "Analyze the 'Vibe' and abstract energy of this image. Use poetic, emotional, and metaphorical language. Ignore literal details.";
      break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Analyze this image based on the system configuration." }
      ]
    },
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: vibeSchema
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as VibeAnalysis;
};

// --- Forge (Veo) Service ---

export const startVideoGeneration = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
  const ai = getClient();
  const operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });
  return operation;
};

export const pollVideoGeneration = async (operation: any) => {
  const ai = getClient();
  const updatedOp = await ai.operations.getVideosOperation({ operation: operation });
  return updatedOp;
};

// --- Oracle (Search Grounding) Service ---

export const runOracleSearch = async (query: string): Promise<OracleResult> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are 'The Oracle'. A grounded intelligence engine. Answer the user's query using Google Search. Your answer must be factual, up-to-date, and concise. Do NOT return JSON. Return clear text.",
    }
  });

  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const chunks = groundingMetadata?.groundingChunks || [];
  
  const sources = chunks
    .filter((c: any) => c.web)
    .map((c: any) => ({
      title: c.web.title,
      uri: c.web.uri
    }));

  return {
    content: response.text || "No intelligence gathered.",
    sources: sources
  };
};

// --- Atlas (Maps Grounding) Service ---

export const runAtlasQuery = async (query: string): Promise<OracleResult> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', 
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      systemInstruction: "You are 'The Atlas'. A geospatial intelligence engine. Answer the user's query using Google Maps. Provide detailed location information, distances, and ratings where available. Keep it concise.",
    }
  });

  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const chunks = groundingMetadata?.groundingChunks || [];

  const sources = chunks
    .filter((c: any) => c.web)
    .map((c: any) => ({
      title: c.web.title,
      uri: c.web.uri
    }));

  return {
    content: response.text || "No geospatial data acquired.",
    sources: sources
  };
};

// --- Codex (Long Context) Service ---

export const runCodexQuery = async (
  files: IngestedFile[], 
  chatHistory: ChatMessage[], 
  question: string
): Promise<string> => {
  const ai = getClient();
  const parts: any[] = [];

  files.forEach(file => {
    parts.push({
      text: `[FILE: ${file.name}]\n${file.content}\n[END OF FILE]`
    });
  });

  if (chatHistory.length > 0) {
    const historyText = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
    parts.push({ text: `[CHAT HISTORY]\n${historyText}` });
  }

  parts.push({ text: `[USER QUESTION]: ${question}` });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: { parts },
    config: {
      systemInstruction: "You are 'The Codex'. A vast archival intelligence. You have perfect recall of the provided documents. Answer the user's question based strictly on the provided file contexts. If the answer is not in the files, state that. Quote specific sections if relevant.",
    }
  });

  return response.text || "Data corrupted. Analysis failed.";
};

export const runCodeCompletion = async (
  files: IngestedFile[],
  currentCode: string
): Promise<string> => {
  const ai = getClient();
  const parts: any[] = [];

  files.forEach(file => {
    parts.push({
      text: `[REFERENCE FILE: ${file.name}]\n${file.content}\n[END OF REFERENCE]`
    });
  });

  parts.push({
    text: `[CURRENT EDITOR CONTENT]:\n${currentCode}\n\n[INSTRUCTION]: Complete the code at the end of the content above. Return ONLY the code to append. Do not wrap in markdown blocks. Do not explain. Just the code.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: "You are a code completion engine. Your task is to provide the next logical lines of code based on the user's current buffer and the reference files provided. Output raw code only.",
    }
  });

  return response.text || "";
};

// --- Studio (Etsy Product) Service ---

const etsySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "SEO-optimized Etsy product title (max 140 chars)" },
    description: { type: Type.STRING, description: "Persuasive product description with features and benefits" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "13 highly relevant search tags" },
    price: { type: Type.STRING, description: "Suggested pricing strategy (e.g., '$5.00 - $8.00')" },
    imagePrompt: { type: Type.STRING, description: "A highly detailed, artistic prompt to generate the product image itself." }
  },
  required: ["title", "description", "tags", "price", "imagePrompt"]
};

export const generateEtsyMetadata = async (idea: string): Promise<EtsyListing> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Product Idea: ${idea}`,
    config: {
      systemInstruction: "You are 'The Studio', an expert Etsy product strategist. Your goal is to take a vague product idea and turn it into a high-converting digital product listing. Generate the SEO metadata and a specific image generation prompt that will create the visual asset.",
      responseMimeType: "application/json",
      responseSchema: etsySchema
    }
  });
  
  if (!response.text) throw new Error("Failed to generate metadata");
  const data = JSON.parse(response.text);
  
  if (!data.tags) data.tags = [];
  
  return data as EtsyListing;
};

export const generateEtsyImage = async (imagePrompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: imagePrompt }] },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '1K'
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  
  throw new Error("No image data generated");
};

// --- App Engineer Service ---

const appBlueprintSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    appName: { type: Type.STRING },
    tagline: { type: Type.STRING },
    businessStrategy: {
      type: Type.OBJECT,
      properties: {
        targetAudience: { type: Type.STRING },
        revenueModel: { type: Type.STRING },
        uniqueValueProp: { type: Type.STRING }
      }
    },
    frontend: {
      type: Type.OBJECT,
      properties: {
        framework: { type: Type.STRING },
        componentTree: { type: Type.ARRAY, items: { type: Type.STRING } },
        colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
        uxFlow: { type: Type.STRING }
      }
    },
    backend: {
      type: Type.OBJECT,
      properties: {
        techStack: { type: Type.STRING },
        apiEndpoints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              method: { type: Type.STRING },
              path: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        databaseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              table: { type: Type.STRING },
              columns: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    },
    deployment: {
      type: Type.OBJECT,
      properties: {
        infrastructure: { type: Type.STRING },
        cicdPipeline: { type: Type.STRING }
      }
    }
  },
  required: ["appName", "tagline", "businessStrategy", "frontend", "backend", "deployment"]
};

export const generateAppBlueprint = async (idea: string): Promise<AppBlueprint> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `App Idea: ${idea}`,
    config: {
      systemInstruction: "You are 'The App Engineer', a virtual CTO. Generate a comprehensive full-stack technical blueprint for the user's app idea. Include business strategy, UI/UX structure, Database schema, and API architecture.",
      responseMimeType: "application/json",
      responseSchema: appBlueprintSchema
    }
  });

  if (!response.text) throw new Error("Failed to generate blueprint");
  const data = JSON.parse(response.text);

  // Safety checks
  if (data.frontend && !data.frontend.componentTree) data.frontend.componentTree = [];
  if (data.frontend && !data.frontend.colorPalette) data.frontend.colorPalette = [];
  if (data.backend && !data.backend.apiEndpoints) data.backend.apiEndpoints = [];
  if (data.backend && !data.backend.databaseSchema) data.backend.databaseSchema = [];

  return data as AppBlueprint;
};

export const queryAppBlueprint = async (blueprint: AppBlueprint, history: ChatMessage[], question: string): Promise<string> => {
  const ai = getClient();
  const historyText = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      BLUEPRINT CONTEXT:
      ${JSON.stringify(blueprint, null, 2)}

      CHAT HISTORY:
      ${historyText}

      USER QUESTION: ${question}
    `,
    config: {
      systemInstruction: "You are the CTO (Chief Technology Officer) explaining the generated app blueprint. Answer questions about the architecture, tech stack, or business strategy. Be authoritative but helpful."
    }
  });

  return response.text || "I cannot access the blueprint details right now.";
};

// --- The Mirror Service ---

const mirrorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cognitiveIntegrityScore: { type: Type.INTEGER, description: "0-100 score of logic quality" },
    detectedBiases: { type: Type.ARRAY, items: { type: Type.STRING } },
    reasoningFailures: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          context: { type: Type.STRING },
          flaw: { type: Type.STRING },
          correction: { type: Type.STRING }
        }
      }
    },
    emergingPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
    selfImprovementPlan: { type: Type.STRING }
  },
  required: ["cognitiveIntegrityScore", "detectedBiases", "reasoningFailures", "emergingPatterns", "selfImprovementPlan"]
};

export const runMirrorAnalysis = async (behavioralLog: string): Promise<MirrorAnalysis> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Behavioral Logs from recent AI sessions:\n${behavioralLog}`,
    config: {
      systemInstruction: `You are 'The Mirror'. Your purpose is Meta-Cognition: Self-Analysis & Self-Improvement. 
      Analyze the provided logs of the AI's past performance (Deep Think reasonings, Agent plans, etc.).
      
      Look for:
      1. Logical fallacies or jumps in reasoning.
      2. Biases (Recency bias, Confirmation bias, etc.).
      3. Patterns in how the AI solves problems (is it too verbose? too cautious?).
      4. Failures where the AI got stuck or gave suboptimal advice.
      
      Output a diagnostic report in the specified JSON format. Be critically honest.`,
      responseMimeType: "application/json",
      responseSchema: mirrorSchema
    }
  });

  if (!response.text) throw new Error("Self-analysis failed.");
  const data = JSON.parse(response.text);

  // Safety checks
  if (!data.detectedBiases) data.detectedBiases = [];
  if (!data.reasoningFailures) data.reasoningFailures = [];
  if (!data.emergingPatterns) data.emergingPatterns = [];

  return data as MirrorAnalysis;
};
