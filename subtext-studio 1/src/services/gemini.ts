import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface Character {
  id: string;
  name: string;
  personality: string;
  relationship: string;
}

export interface SceneConfig {
  setting: string;
  mood: string;
  intensity: number; // 1-10
}

export interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  text: string;
  subtext: string;
  emotion: string;
  intent: string;
}

export interface LineFeedback {
  suggestions: string[];
  alternatives: {
    text: string;
    description: string;
  }[];
  critique: string;
}

export const generateNextDialogue = async (
  scene: SceneConfig,
  characters: Character[],
  history: DialogueLine[],
  count: number = 3
): Promise<DialogueLine[]> => {
  const historyText = history.map(h => `${h.characterName}: ${h.text}`).join('\n');
  const charactersText = characters.map(c => `${c.name} (${c.personality}, relationship to others: ${c.relationship})`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a world-class scriptwriter. Generate the next ${count} lines of dialogue for this scene.
    
    SCENE SETTING: ${scene.setting}
    MOOD: ${scene.mood}
    EMOTIONAL INTENSITY: ${scene.intensity}/10
    
    CHARACTERS:
    ${charactersText}
    
    PREVIOUS DIALOGUE:
    ${historyText || "None (Start of scene)"}
    
    For each line, provide:
    1. Character ID (from the provided list).
    2. Character Name.
    3. Explicit text (what they say).
    4. Subtext (what they really mean).
    5. Emotion (the dominant feeling).
    6. Intent (their goal with this line).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            characterId: { type: Type.STRING },
            characterName: { type: Type.STRING },
            text: { type: Type.STRING },
            subtext: { type: Type.STRING },
            emotion: { type: Type.STRING },
            intent: { type: Type.STRING },
          },
          required: ["characterId", "characterName", "text", "subtext", "emotion", "intent"],
        },
      },
    },
  });

  const lines = JSON.parse(response.text || "[]");
  return lines.map((l: any) => ({ ...l, id: Math.random().toString(36).substr(2, 9) }));
};

export const rewriteLine = async (
  line: DialogueLine,
  instruction: string,
  scene: SceneConfig,
  characters: Character[]
): Promise<DialogueLine> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Rewrite this specific line of dialogue based on the instruction: "${instruction}".
    
    ORIGINAL LINE:
    Character: ${line.characterName}
    Text: "${line.text}"
    Subtext: "${line.subtext}"
    Emotion: "${line.emotion}"
    Intent: "${line.intent}"
    
    SCENE CONTEXT: ${scene.setting}, Mood: ${scene.mood}, Intensity: ${scene.intensity}/10.
    
    Provide the updated line with the same structure.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterId: { type: Type.STRING },
          characterName: { type: Type.STRING },
          text: { type: Type.STRING },
          subtext: { type: Type.STRING },
          emotion: { type: Type.STRING },
          intent: { type: Type.STRING },
        },
        required: ["characterId", "characterName", "text", "subtext", "emotion", "intent"],
      },
    },
  });

  const updated = JSON.parse(response.text || "{}");
  return { ...updated, id: line.id };
};

export const getFeedback = async (
  line: DialogueLine,
  scene: SceneConfig,
  history: DialogueLine[]
): Promise<LineFeedback> => {
  const historyText = history.map(h => `${h.characterName}: ${h.text}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this specific line of dialogue and provide feedback for improvement.
    
    LINE TO ANALYZE:
    Character: ${line.characterName}
    Text: "${line.text}"
    Subtext: "${line.subtext}"
    Emotion: "${line.emotion}"
    Intent: "${line.intent}"
    
    SCENE CONTEXT: ${scene.setting}, Mood: ${scene.mood}.
    PREVIOUS LINES:
    ${historyText}
    
    Provide:
    1. A list of specific suggestions to improve tone, clarity, or depth.
    2. Three alternative variations of the line (e.g., more subtle, more aggressive, more vulnerable).
    3. A brief critique of the current line's effectiveness.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          critique: { type: Type.STRING },
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["text", "description"],
            },
          },
        },
        required: ["suggestions", "critique", "alternatives"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};
