import { createAdminClient } from "@/lib/supabase/admin";
import { MODEL_PRICING } from "@/lib/openai";
import type { CostBreakdown, CostCalculatorInput } from "@/types/costs";

function getSupabase() {
  return createAdminClient();
}

export async function getCostBreakdown(
  userId: string,
  input: CostCalculatorInput
): Promise<CostBreakdown> {
  const pricing = MODEL_PRICING[input.selected_model] ?? MODEL_PRICING["gpt-4o"];

  // AI costs
  const costPerRequest =
    (input.avg_tokens_per_request * pricing.input +
      (input.avg_tokens_per_request * 0.3) * pricing.output) /
    1_000_000;
  const aiCostPerMonth = costPerRequest * input.monthly_ai_requests;
  const aiCostPerUser = input.num_users > 0 ? aiCostPerMonth / input.num_users : 0;
  const aiCostPerInvoice =
    input.invoices_per_month > 0 ? aiCostPerMonth / input.invoices_per_month : 0;

  // Infrastructure costs (amortized monthly)
  const monthlyServerCost = input.server_yearly_cost / 12;
  const infraCostPerUser =
    input.num_users > 0 ? monthlyServerCost / input.num_users : 0;
  const infraCostPerInvoice =
    input.invoices_per_month > 0 ? monthlyServerCost / input.invoices_per_month : 0;

  return {
    ai: {
      cost_per_request: costPerRequest,
      cost_per_month: aiCostPerMonth,
      cost_per_user: aiCostPerUser,
      cost_per_invoice: aiCostPerInvoice,
    },
    infrastructure: {
      monthly_server_cost: monthlyServerCost,
      cost_per_user: infraCostPerUser,
      cost_per_invoice: infraCostPerInvoice,
    },
    total: {
      monthly: aiCostPerMonth + monthlyServerCost,
      per_user: aiCostPerUser + infraCostPerUser,
      per_invoice: aiCostPerInvoice + infraCostPerInvoice,
    },
  };
}

export async function getCostSettings(userId: string) {
  const { data, error } = await getSupabase()
    .from("settings")
    .select("server_yearly_cost, openai_model")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to get cost settings: ${error.message}`);
  }

  return data;
}
