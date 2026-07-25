import { z } from "zod";

export const GenerateInvoicePromptSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(5000),
});

export const AIInvoiceItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  quantity: z.number(),
});

export const AIInvoiceCustomerSchema = z.object({
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

export const AIInvoiceResponseSchema = z.object({
  customer: AIInvoiceCustomerSchema,
  items: z.array(AIInvoiceItemSchema).min(1),
  tax: z.number().describe("Tax rate as percentage, e.g. 18 for 18%"),
  discount: z.number().describe("Discount amount, default 0"),
  currency: z.string().describe("ISO currency code, e.g. INR, USD"),
  payment_due_days: z.number().describe("Payment due in days"),
  notes: z.string().nullable().describe("Any additional notes"),
});

export type GenerateInvoicePromptInput = z.infer<typeof GenerateInvoicePromptSchema>;
export type AIInvoiceResponse = z.infer<typeof AIInvoiceResponseSchema>;
