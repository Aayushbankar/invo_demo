import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoiceFromPrompt } from "@/services/ai.service";
import { logAIRequest } from "@/services/invoice.service";
import { GenerateInvoicePromptSchema } from "@/schemas/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = GenerateInvoicePromptSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get user's preferred model
    const { data: settings } = await supabase
      .from("settings")
      .select("openai_model")
      .eq("user_id", user.id)
      .single();

    const model = settings?.openai_model ?? "gpt-4o-mini";

    const result = await generateInvoiceFromPrompt(validated.data.prompt, model);

    // Log the AI request
    await logAIRequest(user.id, {
      model: result.usage.model,
      prompt: validated.data.prompt,
      response: JSON.stringify(result.data),
      prompt_tokens: result.usage.prompt_tokens,
      completion_tokens: result.usage.completion_tokens,
      total_tokens: result.usage.total_tokens,
      estimated_cost: result.usage.estimated_cost,
      response_time_ms: result.usage.response_time_ms,
      success: true,
    });

    return NextResponse.json({
      data: result.data,
      usage: result.usage,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate invoice", details: errorMessage },
      { status: 500 }
    );
  }
}
