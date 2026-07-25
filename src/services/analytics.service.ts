import { createAdminClient } from "@/lib/supabase/admin";
import type { AIRequestLog } from "@/types/analytics";

function getSupabase() {
  return createAdminClient();
}

export async function getAnalytics(userId: string) {
  // Get all AI requests for user
  const { data: requests, error } = await getSupabase()
    .from("ai_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }

  const allRequests = (requests ?? []) as AIRequestLog[];

  // Summary
  const total_requests = allRequests.length;
  const total_tokens = allRequests.reduce((sum, r) => sum + r.total_tokens, 0);
  const total_cost = allRequests.reduce((sum, r) => sum + r.estimated_cost, 0);
  const avg_response_time =
    total_requests > 0
      ? allRequests.reduce((sum, r) => sum + r.response_time_ms, 0) / total_requests
      : 0;

  // Daily usage (last 30 days)
  const dailyMap = new Map<string, { requests: number; tokens: number; cost: number }>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const req of allRequests) {
    const date = req.created_at.split("T")[0];
    if (new Date(date) < thirtyDaysAgo) continue;
    const existing = dailyMap.get(date) ?? { requests: 0, tokens: 0, cost: 0 };
    dailyMap.set(date, {
      requests: existing.requests + 1,
      tokens: existing.tokens + req.total_tokens,
      cost: existing.cost + req.estimated_cost,
    });
  }

  const daily_usage = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // Model usage
  const modelMap = new Map<string, { requests: number; tokens: number; cost: number }>();
  for (const req of allRequests) {
    const existing = modelMap.get(req.model) ?? { requests: 0, tokens: 0, cost: 0 };
    modelMap.set(req.model, {
      requests: existing.requests + 1,
      tokens: existing.tokens + req.total_tokens,
      cost: existing.cost + req.estimated_cost,
    });
  }

  const model_usage = Array.from(modelMap.entries()).map(([model, data]) => ({
    model,
    ...data,
  }));

  return {
    summary: {
      total_requests,
      total_tokens,
      total_cost,
      avg_response_time: Math.round(avg_response_time),
    },
    daily_usage,
    model_usage,
    recent_requests: allRequests.slice(0, 10),
  };
}
