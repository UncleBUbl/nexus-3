
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DeepThinkResult, VibeLevel, VibeAnalysis, Agent, ChatMessage, MissionArchive } from "../types";

// Helper to get a fresh client instance with the current key
const getClient = () => {
  // Support both standard API_KEY and requested GEMINI_API_KEY
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing. Please authorize or set GEMINI_API_KEY.");
  return new GoogleGenAI({ apiKey });
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

export const runDeepThink = async (prompt: string): Promise<DeepThinkResult> => {
  const ai = getClient();

  // Using Gemini 3 Pro for advanced reasoning capabilities and code execution
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
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
  return JSON.parse(response.text) as DeepThinkResult;
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

  // Construct context from previous missions
  const memoryContext = pastMissions.length > 0
    ? `
SWARM MEMORY (PREVIOUS MISSIONS):
${pastMissions.map((m, i) => `MISSION ${i+1}: "${m.task}"\nRESULT SUMMARY: ${m.report.substring(0, 300)}...`).join('\n\n')}

INSTRUCTION: Use the Swarm Memory above. If the new goal relates to previous work, assign agents to retrieve that data instead of re-doing work. Optimize the plan based on learned context.
`
    : "";

  // Using Gemini 3 Pro for complex task decomposition
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
  return data.agents;
};

// New function to simulate agent work
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

// Synthesize all agent outputs into a final report
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

// Query the swarm memory for follow-up questions
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

  // Using Gemini 3 Pro for high-quality multimodal analysis
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