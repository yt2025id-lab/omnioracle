import type { GeminiLLM } from "@anthropic-ai/cre-sdk";

export async function askGeminiForResolution(
  gemini: GeminiLLM,
  question: string,
  pipelineContext: string
): Promise<{ outcome: number; confidence: number; evidence: string }> {
  const contextMap: Record<string, string> = {
    AI_GROUNDED: `You are an AI oracle for OmniOracle prediction markets. Use web search grounding to fact-check this claim. Provide a thoroughly researched answer.`,
    FUNCTIONS_API: `You are acting as a Chainlink Functions proxy for OmniOracle. Simulate an API call to resolve this market question. Be precise and data-driven.`,
    COMPOSITE: `You are one of multiple data sources in a composite oracle pipeline for OmniOracle. Provide your independent assessment. Other sources (Data Feeds, other AI) will also weigh in.`,
  };

  const systemContext = contextMap[pipelineContext] || contextMap.AI_GROUNDED;

  const prompt = `${systemContext}

Question: "${question}"

Determine the outcome of this prediction market question.

Rules:
- outcome: 0 = YES, 1 = NO, 2 = INVALID (only if truly unresolvable)
- confidence: 0-10000 (basis points, e.g., 8500 = 85%)
- Only return confidence > 6000 if you have strong evidence
- Provide specific evidence for your determination

Respond ONLY with JSON:
{
  "outcome": 0,
  "confidence": 8500,
  "evidence": "Brief factual evidence supporting this outcome"
}`;

  const response = await gemini.generate({
    prompt,
    temperature: 0.2,
    maxTokens: 400,
    searchGrounding: pipelineContext === "AI_GROUNDED" || pipelineContext === "COMPOSITE",
  });

  try {
    const text = response.text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      outcome: parsed.outcome ?? 2,
      confidence: Math.min(10000, Math.max(0, parsed.confidence ?? 5000)),
      evidence: parsed.evidence ?? "No evidence provided",
    };
  } catch {
    return {
      outcome: 2, // INVALID
      confidence: 3000,
      evidence: "Failed to parse AI response",
    };
  }
}
