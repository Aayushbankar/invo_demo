import { createAdminClient } from "@/lib/supabase/admin";
import type { InvoiceStatus, InvoiceWithItems } from "@/types/invoice";

function getSupabase() {
  return createAdminClient();
}

interface ListParams {
  user_id: string;
  search?: string;
  status?: InvoiceStatus[];
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function listInvoices(params: ListParams) {
  const {
    user_id,
    search,
    status,
    date_from,
    date_to,
    amount_min,
    amount_max,
    sort_by = "created_at",
    sort_order = "desc",
    page = 1,
    limit = 20,
  } = params;

  let query = getSupabase()
    .from("invoices")
    .select("*, items:invoice_items(*)", { count: "exact" })
    .eq("user_id", user_id);

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
  }

  if (status && status.length > 0) {
    query = query.in("status", status);
  }

  if (date_from) {
    query = query.gte("created_at", date_from);
  }
  if (date_to) {
    query = query.lte("created_at", date_to);
  }
  if (amount_min !== undefined) {
    query = query.gte("discount", 0); // We'll filter by computed total in post-processing
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order(sort_by, { ascending: sort_order === "asc" });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list invoices: ${error.message}`);
  }

  const invoices = (data ?? []) as InvoiceWithItems[];

  // Filter by computed amounts if needed
  let filtered = invoices;
  if (amount_min !== undefined || amount_max !== undefined) {
    filtered = invoices.filter((inv) => {
      const subtotal = inv.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const total = subtotal + subtotal * (inv.tax_rate / 100) - inv.discount;
      if (amount_min !== undefined && total < amount_min) return false;
      if (amount_max !== undefined && total > amount_max) return false;
      return true;
    });
  }

  return {
    invoices: filtered,
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getInvoice(userId: string, invoiceId: string) {
  const { data, error } = await getSupabase()
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to get invoice: ${error.message}`);
  }

  return data as InvoiceWithItems;
}

export async function createInvoice(
  userId: string,
  input: {
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
    items: { name: string; description?: string; quantity: number; unit_price: number }[];
  }
) {
  // Get next invoice number
  const { data: settings } = await getSupabase()
    .from("settings")
    .select("invoice_prefix, next_invoice_number")
    .eq("user_id", userId)
    .single();

  const prefix = settings?.invoice_prefix ?? "INV";
  const nextNum = settings?.next_invoice_number ?? 1;
  const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

  // Create invoice
  const { data: invoice, error: invoiceError } = await getSupabase()
    .from("invoices")
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      status: input.status ?? "draft",
      customer_name: input.customer_name,
      customer_email: input.customer_email || null,
      customer_phone: input.customer_phone || null,
      customer_address: input.customer_address || null,
      currency: input.currency ?? "INR",
      tax_rate: input.tax_rate ?? 0,
      discount: input.discount ?? 0,
      notes: input.notes || null,
      due_date: input.due_date || null,
    })
    .select()
    .single();

  if (invoiceError) {
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // Create items
  const items = input.items.map((item, index) => ({
    invoice_id: invoice.id,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }));

  const { error: itemsError } = await getSupabase().from("invoice_items").insert(items);

  if (itemsError) {
    throw new Error(`Failed to create invoice items: ${itemsError.message}`);
  }

  // Increment invoice number
  await getSupabase()
    .from("settings")
    .update({ next_invoice_number: nextNum + 1 })
    .eq("user_id", userId);

  return getInvoice(userId, invoice.id);
}

export async function updateInvoice(
  userId: string,
  invoiceId: string,
  input: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    currency?: string;
    tax_rate?: number;
    discount?: number;
    notes?: string;
    due_date?: string;
    status?: InvoiceStatus;
    items?: { name: string; description?: string; quantity: number; unit_price: number }[];
  }
) {
  const { items, ...invoiceData } = input;

  // Update invoice fields
  const cleanData: Record<string, unknown> = {};
  if (invoiceData.customer_name !== undefined) cleanData.customer_name = invoiceData.customer_name;
  if (invoiceData.customer_email !== undefined) cleanData.customer_email = invoiceData.customer_email || null;
  if (invoiceData.customer_phone !== undefined) cleanData.customer_phone = invoiceData.customer_phone || null;
  if (invoiceData.customer_address !== undefined) cleanData.customer_address = invoiceData.customer_address || null;
  if (invoiceData.currency !== undefined) cleanData.currency = invoiceData.currency;
  if (invoiceData.tax_rate !== undefined) cleanData.tax_rate = invoiceData.tax_rate;
  if (invoiceData.discount !== undefined) cleanData.discount = invoiceData.discount;
  if (invoiceData.notes !== undefined) cleanData.notes = invoiceData.notes || null;
  if (invoiceData.due_date !== undefined) cleanData.due_date = invoiceData.due_date || null;
  if (invoiceData.status !== undefined) cleanData.status = invoiceData.status;

  if (Object.keys(cleanData).length > 0) {
    const { error } = await getSupabase()
      .from("invoices")
      .update(cleanData)
      .eq("id", invoiceId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }
  }

  // Replace items if provided
  if (items) {
    await getSupabase().from("invoice_items").delete().eq("invoice_id", invoiceId);

    const newItems = items.map((item, index) => ({
      invoice_id: invoiceId,
      name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: index,
    }));

    const { error: itemsError } = await getSupabase().from("invoice_items").insert(newItems);
    if (itemsError) {
      throw new Error(`Failed to update invoice items: ${itemsError.message}`);
    }
  }

  return getInvoice(userId, invoiceId);
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const { error } = await getSupabase()
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete invoice: ${error.message}`);
  }
}

export async function getInvoiceStats(userId: string) {
  const { data: invoices, error } = await getSupabase()
    .from("invoices")
    .select("*, items:invoice_items(quantity, unit_price)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to get invoice stats: ${error.message}`);
  }

  let total_revenue = 0;
  let pending_amount = 0;
  let overdue_amount = 0;
  let paid_count = 0;
  let pending_count = 0;
  let overdue_count = 0;
  let draft_count = 0;
  let cancelled_count = 0;

  for (const inv of invoices ?? []) {
    const subtotal = inv.items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    );
    const total = subtotal + subtotal * ((inv.tax_rate ?? 0) / 100) - (inv.discount ?? 0);

    switch (inv.status) {
      case "paid":
        total_revenue += total;
        paid_count++;
        break;
      case "pending":
        pending_amount += total;
        pending_count++;
        break;
      case "overdue":
        overdue_amount += total;
        overdue_count++;
        break;
      case "draft":
        draft_count++;
        break;
      case "cancelled":
        cancelled_count++;
        break;
    }
  }

  return {
    total_invoices: invoices?.length ?? 0,
    total_revenue,
    pending_amount,
    overdue_amount,
    draft_count,
    paid_count,
    pending_count,
    overdue_count,
    cancelled_count,
  };
}

export async function logAIRequest(
  userId: string,
  data: {
    model: string;
    prompt: string;
    response: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number;
    response_time_ms: number;
    success: boolean;
    error_message?: string;
  }
) {
  const { error } = await getSupabase().from("ai_requests").insert({
    user_id: userId,
    ...data,
  });

  if (error) {
    console.error("Failed to log AI request:", error.message);
  }
}
