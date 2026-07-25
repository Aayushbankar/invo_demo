import { z } from "zod";

export const InvoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unit_price: z.number().min(0, "Price must be non-negative"),
});

export const CreateInvoiceSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_email: z.string().email("Invalid email").optional().or(z.literal("")),
  customer_phone: z.string().optional().or(z.literal("")),
  customer_address: z.string().optional().or(z.literal("")),
  currency: z.string().default("INR"),
  tax_rate: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "pending", "paid", "overdue", "cancelled"]).default("draft"),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required").optional(),
});

export const InvoiceFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(["draft", "pending", "paid", "overdue", "cancelled"])).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  amount_min: z.number().optional(),
  amount_max: z.number().optional(),
  sort_by: z.enum(["created_at", "amount", "customer_name", "due_date"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.output<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.output<typeof UpdateInvoiceSchema>;
export type InvoiceFilterInput = z.output<typeof InvoiceFilterSchema>;
