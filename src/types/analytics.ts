export interface AIUsageSummary {
  user_id: string;
  date: string;
  model: string;
  request_count: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time_ms: number;
}

export interface AIRequestLog {
  id: string;
  user_id: string;
  model: string;
  prompt: string;
  response: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ModelUsage {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface AnalyticsData {
  summary: {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_response_time: number;
  };
  daily_usage: DailyUsage[];
  model_usage: ModelUsage[];
  recent_requests: AIRequestLog[];
}
