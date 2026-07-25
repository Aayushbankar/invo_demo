export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_logo_url: string | null;
  default_currency: string;
  default_tax_rate: number;
  upi_vpa: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  currency: string;
  tax_rate: number;
  discount: number;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceItemInput {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceInput {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  currency?: string;
  tax_rate?: number;
  discount?: number;
  notes?: string;
  due_date?: string;
  status?: InvoiceStatus;
  items: InvoiceItemInput[];
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus[];
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_by?: "created_at" | "amount" | "customer_name" | "due_date";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  invoices: InvoiceWithItems[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface InvoiceStats {
  total_invoices: number;
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  draft_count: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  cancelled_count: number;
}

export function calculateInvoiceTotals(
  items: InvoiceItemInput[],
  taxRate: number = 0,
  discount: number = 0
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;

  return {
    subtotal,
    tax_amount: taxAmount,
    discount,
    total: Math.max(0, total),
  };
}
