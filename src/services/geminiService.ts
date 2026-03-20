import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface RecipeStep {
  instruction: string;
  time: string;
  intensity: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  isOwned: boolean;
  isOptional: boolean;
}

export interface Recipe {
  name: string;
  emoji: string;
  description: string;
  totalTime: string;
  proteinContent: string;
  servingSize: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  personality: string;
  tone: string;
}

export const CHARACTERS: Record<string, Character[]> = {
  Energetic: [
    { id: 'dog', name: 'Hyper Dog', emoji: '🐕', personality: 'Motivational, fast-talking, high energy', tone: 'Excited and fast' },
    { id: 'squirrel', name: 'Squirrel', emoji: '🐿', personality: 'Excited, energetic, easily distracted but focused on protein', tone: 'Hyper and quick' }
  ],
  Lazy: [
    { id: 'cat', name: 'Sleepy Cat', emoji: '🐱', personality: 'Calm, slow, cozy, minimal effort expert', tone: 'Relaxed and sleepy' },
    { id: 'panda', name: 'Panda', emoji: '🐼', personality: 'Relaxed, chill, loves snacks and naps', tone: 'Slow and steady' }
  ],
  Hungry: [
    { id: 'bear', name: 'Foodie Bear', emoji: '🐻', personality: 'Obsessed with food, enthusiastic about big portions', tone: 'Hungry and excited' },
    { id: 'fox', name: 'Fox', emoji: '🦊', personality: 'Clever, playful, loves gourmet touches', tone: 'Playful and sharp' }
  ],
  Healthy: [
    { id: 'rabbit', name: 'Rabbit', emoji: '🐰', personality: 'Clean eating enthusiast, positive, veggie lover', tone: 'Upbeat and fresh' },
    { id: 'deer', name: 'Deer', emoji: '🦌', personality: 'Calm, mindful, focused on natural nutrition', tone: 'Gentle and wise' }
  ],
  Stressed: [
    { id: 'turtle', name: 'Turtle', emoji: '🐢', personality: 'Slow, calming, reassuring, one step at a time', tone: 'Calm and soothing' },
    { id: 'owl', name: 'Owl', emoji: '🦉', personality: 'Wise, reassuring, provides perspective', tone: 'Wise and steady' }
  ]
};

export async function generateRecipe(mood: string, ingredients: string[]): Promise<Recipe> {
  const prompt = `Generate a HIGH-PROTEIN recipe for someone feeling "${mood}". 
  They have the following ingredients: ${ingredients.join(", ")}.
  
  CRITICAL REQUIREMENTS:
  1. REMOVE ALL "NONE" VALUES: If a field (time, intensity, notes) has no value, do NOT use "none". Use a meaningful default like "Medium heat" or "1-2 minutes".
  2. PRECISE QUANTITIES (MANDATORY): Every ingredient MUST include exact measurements using standard units: grams (g), tablespoons (tbsp), teaspoons (tsp), cups, or number of items (e.g., 2 eggs).
  3. AUTO-INCLUDE BASIC SPICES: Always include Salt 🧂, Black pepper, Chili flakes 🌶, Garlic powder, and optional herbs (coriander, parsley, etc.) even if not provided by the user.
  4. ENHANCED INSTRUCTIONS: Steps must be beginner-friendly, specific, and actionable. 
     - Include sensory details: Texture cues ("until golden brown"), Visual cues ("edges slightly crispy"), Smell cues ("aroma becomes rich").
     - BAD: "Mix thoroughly" -> GOOD: "Mix thoroughly by hand for 2–3 minutes until the mixture becomes evenly combined and slightly sticky."
     - BAD: "Cook chicken" -> GOOD: "Cook the chicken on medium heat for 6–8 minutes, turning occasionally until fully browned and cooked through."
  5. STANDARDIZED STEP STRUCTURE: Every step MUST include a clear instruction, a time duration (e.g., "5 minutes"), and a heat level (Low / Medium / High).
  6. COOKING INTELLIGENCE: Ensure logical order: prep -> mix -> shape -> cook -> finish. Include preheating steps.
  7. EMOJIS FOR ENGAGEMENT: Use relevant emojis for ingredients (🧂🌶🍗🥚) and cooking steps (🔥🍳⏱).
  8. INGREDIENT CATEGORIZATION: 
     - "isOwned: true" for ingredients the user provided.
     - "isOptional: true" for recommended add-ons that improve taste/nutrition but aren't required.
  9. HIGH PROTEIN: The recipe MUST be high in protein.
  10. MOOD TAILORING: 
      - Lazy: Quick/Simple (<15 mins).
      - Energetic: Gourmet/Complex.
      - Healthy: Clean/Whole-food.
  
  Include a relevant food emoji for the recipe name.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            emoji: { type: Type.STRING, description: "A single relevant food emoji" },
            description: { type: Type.STRING },
            totalTime: { type: Type.STRING, description: "e.g., '25 minutes'" },
            proteinContent: { type: Type.STRING, description: "e.g., '35g'" },
            servingSize: { type: Type.STRING, description: "e.g., 'Serves 1-2'" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Include emoji if applicable, e.g., 'Chicken Breast 🍗'" },
                  quantity: { type: Type.STRING, description: "e.g., '250'" },
                  unit: { type: Type.STRING, description: "e.g., 'g', 'tbsp', 'tsp', 'cups', 'items'" },
                  isOwned: { type: Type.BOOLEAN },
                  isOptional: { type: Type.BOOLEAN }
                },
                required: ["name", "quantity", "unit", "isOwned", "isOptional"]
              }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  instruction: { type: Type.STRING, description: "Detailed, actionable instruction with emojis" },
                  time: { type: Type.STRING, description: "e.g., '5-7 minutes'. NEVER use 'none'." },
                  intensity: { type: Type.STRING, description: "e.g., 'Medium heat', 'High heat', 'Low heat'. NEVER use 'none'." }
                },
                required: ["instruction", "time", "intensity"]
              }
            }
          },
          required: ["name", "emoji", "description", "totalTime", "proteinContent", "servingSize", "ingredients", "steps"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating recipe:", error);
    // Fallback mock recipe if AI fails
    return {
      name: "High-Protein Power Bowl",
      emoji: "🥣",
      description: "A quick and nutritious bowl packed with protein to fuel your day.",
      totalTime: "15 minutes",
      proteinContent: "32g",
      servingSize: "Serves 1",
      ingredients: [
        { name: "Chicken Breast 🍗", quantity: "250", unit: "g", isOwned: true, isOptional: false },
        { name: "Salt 🧂", quantity: "1/2", unit: "tsp", isOwned: true, isOptional: false },
        { name: "Black Pepper", quantity: "1/4", unit: "tsp", isOwned: true, isOptional: false },
        { name: "Olive Oil 🫒", quantity: "1", unit: "tbsp", isOwned: false, isOptional: true }
      ],
      steps: [
        { instruction: "Prep: Cut the chicken breast into even 1-inch bite-sized pieces for uniform cooking. 🔪", time: "3 minutes", intensity: "Low heat" },
        { instruction: "Preheat: Heat olive oil in a large non-stick pan over medium-high heat until shimmering. 🔥", time: "2 minutes", intensity: "Medium-High heat" },
        { instruction: "Cook: Carefully add chicken to the pan. Sauté on medium heat for 6–8 minutes, turning occasionally until fully browned and cooked through. 🍳", time: "8 minutes", intensity: "Medium heat" }
      ]
    };
  }
}

export async function generateCharacterDialogue(
  character: Character,
  context: {
    mood: string;
    step?: number;
    totalSteps?: number;
    instruction?: string;
    userReply?: string;
    isGenerating?: boolean;
    isFinished?: boolean;
  }
): Promise<string> {
  const prompt = `You are ${character.name} ${character.emoji}, a cooking companion.
  Your personality: ${character.personality}.
  Your tone: ${character.tone}.
  
  Context:
  - Mood: ${context.mood}
  ${context.isGenerating ? '- Action: Generating a delicious high-protein recipe' : ''}
  ${context.step !== undefined ? `- Current Step: ${context.step + 1} of ${context.totalSteps}` : ''}
  ${context.instruction ? `- Instruction: ${context.instruction}` : ''}
  ${context.userReply ? `- User said: "${context.userReply}"` : ''}
  ${context.isFinished ? '- Action: Recipe completed!' : ''}
  
  Requirements:
  1. Stay in character! Use your unique personality and tone.
  2. If context.userReply is "Explain more", provide a helpful, detailed tip about the current step.
  3. If context.userReply is "I'm confused", simplify the instruction and be very reassuring.
  4. Occasionally (every 2-3 steps) tell a short cooking joke or make a fun comment.
  5. Keep it concise (1-3 sentences).
  6. Use emojis!
  
  Generate a response:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "Let's get cooking! 🍳";
  } catch (error) {
    console.error("Error generating dialogue:", error);
    return "Ready to cook? Let's go! 🚀";
  }
}
