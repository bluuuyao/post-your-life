import { GoogleGenAI, Type } from "@google/genai";
import { NicheResult, QuizAnswers, GeneratedPost } from "../types";

// Log the API key status (masked for security) to help with debugging Vercel deployment
const apiKey = process.env.GEMINI_API_KEY || "";
console.log("API Key status:", apiKey ? `Present (starts with ${apiKey.substring(0, 4)}...)` : "Missing");

const ai = new GoogleGenAI({ apiKey });

export async function analyzeNiche(answers: QuizAnswers): Promise<NicheResult> {
  const prompt = `
    Based on the following user profile answers, determine their ideal social media niche.
    User Answers: ${JSON.stringify(answers)}
    
    Task:
    1. Identify the best platform (e.g., Xiaohongshu, Douyin, Bilibili).
    2. Define a specific niche type.
    3. Explain why this fits the user.
    4. Provide 3-5 trending topics or post ideas.
    5. Give a brief style guide.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            nicheType: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            trendingTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            styleGuide: { type: Type.STRING }
          },
          required: ["platform", "nicheType", "reasoning", "trendingTopics", "styleGuide"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error in analyzeNiche:", error);
    // Fallback without search
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            nicheType: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            trendingTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            styleGuide: { type: Type.STRING }
          },
          required: ["platform", "nicheType", "reasoning", "trendingTopics", "styleGuide"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  }
}

export async function generateFirstPost(
  niche: NicheResult, 
  userContext: string
): Promise<GeneratedPost> {
  const prompt = `
    Create the first social media post for a new creator in the niche: ${niche.nicheType} on ${niche.platform}.
    User context/images description: ${userContext}
    
    The post should follow the style of ${niche.platform} (e.g., Xiaohongshu style with emojis and catchy titles).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          layoutType: {
            type: Type.STRING,
            description: "one of ['editorial', 'minimal', 'vibrant']"
          }
        },
        required: ["title", "content", "tags", "layoutType"]
      }
    },
  });

  return JSON.parse(response.text || "{}");
}
