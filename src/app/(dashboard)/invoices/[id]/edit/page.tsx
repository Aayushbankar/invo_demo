"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceWithItems, CreateInvoiceInput } from "@/types/invoice";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*)")
        .eq("id", params.id)
        .single();

      setInvoice(data as InvoiceWithItems | null);
      setLoading(false);
    }
    load();
  }, [params.id, supabase]);

  if (loading) {
    return <div className="h-96 rounded-lg bg-muted animate-pulse" />;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const inv = invoice;

  const initialData: CreateInvoiceInput = {
    customer_name: inv.customer_name,
    customer_email: inv.customer_email ?? "",
    customer_phone: inv.customer_phone ?? "",
    customer_address: inv.customer_address ?? "",
    currency: inv.currency,
    tax_rate: inv.tax_rate,
    discount: inv.discount ?? 0,
    notes: inv.notes ?? "",
    due_date: inv.due_date ?? "",
    status: inv.status,
    items: inv.items.map((item) => ({
      name: item.name,
      description: item.description ?? "",
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  };

  async function handleSave(data: CreateInvoiceInput) {
    setSaving(true);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Invoice updated!");
      router.push(`/invoices/${inv.id}`);
    } else {
      toast.error("Failed to update invoice");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice {inv.invoice_number}</h1>
      </div>
      <InvoiceForm
        initialData={initialData as never}
        onSave={handleSave}
        onCancel={() => router.back()}
        showCancel
        saving={saving}
      />
    </div>
  );
}
