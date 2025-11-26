
const express = require('express');
const { GoogleGenAI, Type } = require("@google/genai");
const router = express.Router();

// Define the response schema for Vibe Analysis
const vibeSchema = {
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

// POST /api/vibe
router.post('/', async (req, res) => {
  try {
    const { image, vibeLevel } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Securely check for key
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("API Key missing on server");
      return res.status(500).json({ error: "Server configuration error: API Key missing" });
    }

    console.log(`[Vibe] Analyzing image at level ${vibeLevel}`);

    // Initialize Gemini Client per request to ensure secure key usage
    const ai = new GoogleGenAI({ apiKey });

    // Determine System Prompt based on Vibe Level
    let systemPrompt = "";
    switch (parseInt(vibeLevel)) {
      case 1: // LITERAL
        systemPrompt = "Analyze this image literally. Describe objects, colors, and spatial layout objectively.";
        break;
      case 2: // CONTEXTUAL
        systemPrompt = "Analyze the context of this image. What is happening? What is the function of this space or object?";
        break;
      case 3: // ABSTRACT
        systemPrompt = "Analyze the 'Vibe' and abstract energy of this image. Use poetic, emotional, and metaphorical language. Ignore literal details.";
        break;
      default:
        systemPrompt = "Analyze this image.";
    }

    // Call Gemini 3 Pro Vision
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } },
          { text: "Analyze this image based on the system configuration." }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: vibeSchema
      }
    });

    if (!response.text) {
      throw new Error("No text returned from Gemini API");
    }

    // Parse and return the JSON response
    const analysisResult = JSON.parse(response.text);
    
    console.log("[Vibe] Analysis complete");
    res.json(analysisResult);

  } catch (error) {
    console.error("[Vibe] Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
});

module.exports = router;
