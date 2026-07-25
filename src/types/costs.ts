export interface CostBreakdown {
  ai: {
    cost_per_request: number;
    cost_per_month: number;
    cost_per_user: number;
    cost_per_invoice: number;
  };
  infrastructure: {
    monthly_server_cost: number;
    cost_per_user: number;
    cost_per_invoice: number;
  };
  total: {
    monthly: number;
    per_user: number;
    per_invoice: number;
  };
}

export interface CostCalculatorInput {
  server_yearly_cost: number;
  monthly_ai_requests: number;
  avg_tokens_per_request: number;
  num_users: number;
  invoices_per_month: number;
  selected_model: string;
}
