import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCostBreakdown } from "@/services/cost.service";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const input = {
      server_yearly_cost: Number(searchParams.get("server_yearly_cost") ?? 13000),
      monthly_ai_requests: Number(searchParams.get("monthly_ai_requests") ?? 100),
      avg_tokens_per_request: Number(searchParams.get("avg_tokens_per_request") ?? 500),
      num_users: Number(searchParams.get("num_users") ?? 10),
      invoices_per_month: Number(searchParams.get("invoices_per_month") ?? 50),
      selected_model: searchParams.get("selected_model") ?? "gpt-4o-mini",
    };

    const breakdown = await getCostBreakdown(user.id, input);
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Cost calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate costs" },
      { status: 500 }
    );
  }
}
