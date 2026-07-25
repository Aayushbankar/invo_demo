import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listInvoices, createInvoice } from "@/services/invoice.service";
import { CreateInvoiceSchema, InvoiceFilterSchema } from "@/schemas/invoice";

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
    const filters = InvoiceFilterSchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status")?.split(","),
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      amount_min: searchParams.get("amount_min")
        ? Number(searchParams.get("amount_min"))
        : undefined,
      amount_max: searchParams.get("amount_max")
        ? Number(searchParams.get("amount_max"))
        : undefined,
      sort_by: searchParams.get("sort_by") ?? "created_at",
      sort_order: searchParams.get("sort_order") ?? "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    });

    if (!filters.success) {
      return NextResponse.json(
        { error: "Invalid filters", details: filters.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await listInvoices({ user_id: user.id, ...filters.data });
    return NextResponse.json(result);
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateInvoiceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const invoice = await createInvoice(user.id, {
      customer_name: validated.data.customer_name,
      customer_email: validated.data.customer_email || undefined,
      customer_phone: validated.data.customer_phone || undefined,
      customer_address: validated.data.customer_address || undefined,
      currency: validated.data.currency,
      tax_rate: validated.data.tax_rate,
      discount: validated.data.discount,
      notes: validated.data.notes || undefined,
      due_date: validated.data.due_date || undefined,
      status: validated.data.status,
      items: validated.data.items,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
