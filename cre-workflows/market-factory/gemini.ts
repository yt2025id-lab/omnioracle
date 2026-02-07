import type { GeminiLLM } from "@anthropic-ai/cre-sdk";

export async function validateMarketQuestion(
  gemini: GeminiLLM,
  question: string,
  category: string
): Promise<{ isValid: boolean; reason?: string; refinedQuestion?: string }> {
  const prompt = `You are a prediction market question validator for OmniOracle.

Evaluate this market question: "${question}"
Category: ${category}

Rules:
1. Must be a YES/NO question about a future or verifiable event
2. Must be specific enough to have a clear resolution criteria
3. Must not be offensive or illegal
4. Must be resolvable within a reasonable timeframe

Respond ONLY with JSON:
{
  "isValid": true/false,
  "reason": "explanation if invalid",
  "refinedQuestion": "improved version of the question if valid"
}`;

  const response = await gemini.generate({
    prompt,
    temperature: 0.3,
    maxTokens: 300,
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return { isValid: true, refinedQuestion: question };
  }
}

interface MarketIdea {
  question: string;
  category: string;
  pipelineType: string;
}

export async function generateMarketIdeas(
  gemini: GeminiLLM
): Promise<MarketIdea[]> {
  const prompt = `You are OmniOracle's autonomous market creator. Generate 3 trending prediction market questions.

For each question, choose the most appropriate oracle pipeline:
- PRICE_FEED: For crypto price threshold questions (e.g., "Will ETH exceed $X?")
- FUNCTIONS_API: For sports scores, weather, election results
- AI_GROUNDED: For general world events, politics, science

Respond ONLY with a JSON array:
[
  {
    "question": "Will ETH exceed $5000 by March 2026?",
    "category": "CRYPTO",
    "pipelineType": "PRICE_FEED"
  },
  ...
]`;

  const response = await gemini.generate({
    prompt,
    temperature: 0.8,
    maxTokens: 500,
    searchGrounding: true,
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return [
      {
        question: "Will Bitcoin exceed $150,000 by end of 2026?",
        category: "CRYPTO",
        pipelineType: "PRICE_FEED",
      },
    ];
  }
}
