import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoice } from "@/services/invoice.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoice(user.id, id);

    // Get user profile for company info
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Return invoice data for client-side PDF generation
    return NextResponse.json({
      invoice,
      company: {
        name: profile?.company_name ?? profile?.full_name ?? "Your Company",
        address: profile?.company_address ?? "",
        email: profile?.company_email ?? user.email,
        phone: profile?.company_phone ?? "",
        logo_url: profile?.company_logo_url ?? null,
        upi_vpa: profile?.upi_vpa ?? null,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    );
  }
}
