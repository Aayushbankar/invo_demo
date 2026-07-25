import { z } from "zod";

export const CompanySettingsSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  company_name: z.string().optional().or(z.literal("")),
  company_address: z.string().optional().or(z.literal("")),
  company_phone: z.string().optional().or(z.literal("")),
  company_email: z.string().email("Invalid email").optional().or(z.literal("")),
  company_logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  upi_vpa: z.string().optional().or(z.literal("")),
  default_currency: z.string().default("INR"),
  default_tax_rate: z.number().min(0).max(100).default(18),
});

export const InvoiceDefaultsSchema = z.object({
  invoice_prefix: z.string().min(1).max(10).default("INV"),
  next_invoice_number: z.number().min(1).default(1),
});

export const AISettingsSchema = z.object({
  openai_model: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]).default("gpt-4o"),
});

export const CostSettingsSchema = z.object({
  server_yearly_cost: z.number().min(0).default(0),
});

export const AllSettingsSchema = CompanySettingsSchema.merge(
  InvoiceDefaultsSchema
).merge(AISettingsSchema).merge(CostSettingsSchema);

export type CompanySettingsInput = z.infer<typeof CompanySettingsSchema>;
export type AllSettingsInput = z.infer<typeof AllSettingsSchema>;
