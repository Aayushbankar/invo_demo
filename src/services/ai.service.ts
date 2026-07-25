import { getOpenAI, calculateOpenAICost } from "@/lib/openai";
import { AIInvoiceResponseSchema, type AIInvoiceResponse } from "@/schemas/ai";

interface GenerateInvoiceResult {
  data: AIInvoiceResponse;
  usage: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number;
    response_time_ms: number;
  };
}

export async function generateInvoiceFromPrompt(
  prompt: string,
  model: string = "gpt-4o-mini"
): Promise<GenerateInvoiceResult> {
  const startTime = Date.now();

  const response = await getOpenAI().responses.create({
    model,
    input: [
      {
        role: "system",
        content: `You are an expert invoice data extractor. Given a natural language description of an invoice, extract structured data. Always return valid JSON matching the exact schema provided. If information is not provided, use sensible defaults: tax 0%, currency INR, payment due in 30 days, quantity 1 for each item.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "invoice",
        schema: {
          type: "object",
          properties: {
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: ["string", "null"] },
                phone: { type: ["string", "null"] },
                address: { type: ["string", "null"] },
              },
              required: ["name", "email", "phone", "address"],
              additionalProperties: false,
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: ["string", "null"] },
                  price: { type: "number" },
                  quantity: { type: "number" },
                },
                required: ["name", "description", "price", "quantity"],
                additionalProperties: false,
              },
              minItems: 1,
            },
            tax: { type: "number", description: "Tax rate as percentage" },
            discount: { type: "number", description: "Discount amount" },
            currency: { type: "string", description: "ISO currency code" },
            payment_due_days: { type: "number", description: "Days until payment due" },
            notes: { type: ["string", "null"], description: "Additional notes" },
          },
          required: [
            "customer",
            "items",
            "tax",
            "discount",
            "currency",
            "payment_due_days",
            "notes",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const responseTimeMs = Date.now() - startTime;

  // Extract text from response output
  let outputText: string | null = null;
  for (const item of response.output) {
    if (item.type === "message" && "content" in item) {
      const content = (item as { content: Array<{ type: string; text?: string }> }).content;
      for (const part of content) {
        if (part.type === "output_text" && part.text) {
          outputText = part.text;
          break;
        }
      }
    }
    if (outputText) break;
  }

  if (!outputText) {
    throw new Error("No output text received from OpenAI");
  }

  const parsed = JSON.parse(outputText);
  const validated = AIInvoiceResponseSchema.parse(parsed);

  const usage = response.usage;
  const promptTokens = usage?.input_tokens ?? 0;
  const completionTokens = usage?.output_tokens ?? 0;
  const totalTokens = promptTokens + completionTokens;
  const estimatedCost = calculateOpenAICost(model, promptTokens, completionTokens);

  return {
    data: validated,
    usage: {
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost,
      response_time_ms: responseTimeMs,
    },
  };
}
