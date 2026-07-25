import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// OpenAI model pricing per 1M tokens (USD)
export const MODEL_PRICING: Record<string, { input: number; output: number }> =
  {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  };

export function calculateOpenAICost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING["gpt-4o"];
  return (
    (promptTokens * pricing.input + completionTokens * pricing.output) /
    1_000_000
  );
}
