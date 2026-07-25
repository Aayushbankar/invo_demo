"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { InvoiceWithItems } from "@/types/invoice";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*)")
        .eq("id", params.id)
        .single();

      setInvoice(data as InvoiceWithItems | null);

      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("company_logo_url")
          .eq("id", user.user.id)
          .single();
        setCompanyLogo(profile?.company_logo_url ?? null);
      }

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
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const inv = invoice;

  const subtotal = invoice!.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxAmount = subtotal * (((invoice!.tax_rate ?? 0) as number) / 100);
  const total = subtotal + taxAmount - ((invoice!.discount ?? 0) as number);

  // QR code data: invoice URL + UPI payment
  const invoiceUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invoices/${invoice!.id}`;

  async function handleDelete() {
    if (!confirm("Delete this invoice?")) return;
    const res = await fetch(`/api/invoices/${invoice!.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invoice deleted");
      router.push("/invoices");
    }
  }

  async function handleExportPDF() {
    const res = await fetch(`/api/invoices/${invoice!.id}/pdf`);
    if (res.ok) {
      toast.success("PDF data loaded - use Print to save as PDF");
      window.print();
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/${invoice!.id}/edit`)}>
            <Edit className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-1 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-12 mb-2 object-contain"
                />
              )}
              <h2 className="text-xl font-bold">Your Company</h2>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-lg mt-1">#{inv.invoice_number}</p>
              <Badge className={getStatusColor(inv.status)} variant="secondary">
                {inv.status}
              </Badge>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Bill To
              </h3>
              <p className="font-semibold">{inv.customer_name}</p>
              {inv.customer_email && (
                <p className="text-sm text-muted-foreground">{inv.customer_email}</p>
              )}
              {inv.customer_phone && (
                <p className="text-sm text-muted-foreground">{inv.customer_phone}</p>
              )}
              {inv.customer_address && (
                <p className="text-sm text-muted-foreground">{inv.customer_address}</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Invoice Date
              </h3>
              <p>{formatDate(inv.created_at)}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Due Date
              </h3>
              <p>{inv.due_date ? formatDate(inv.due_date) : "N/A"}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Item</th>
                  <th className="text-center p-3 font-semibold w-20">Qty</th>
                  <th className="text-right p-3 font-semibold w-28">Unit Price</th>
                  <th className="text-right p-3 font-semibold w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.unit_price, inv.currency)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(item.quantity * item.unit_price, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR */}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
              <QRCodeSVG
                value={invoiceUrl}
                size={100}
                level="M"
                includeMargin
              />
              <div className="text-xs text-muted-foreground">
                <p>Scan to view</p>
                <p>invoice</p>
              </div>
            </div>
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, inv.currency)}</span>
              </div>
              {inv.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({inv.tax_rate}%)</span>
                  <span>{formatCurrency(taxAmount, inv.currency)}</span>
                </div>
              )}
              {(inv.discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">
                    -{formatCurrency(inv.discount ?? 0, inv.currency)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(total, inv.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="mt-8 pt-4 border-t">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Notes
              </h3>
              <p className="text-sm">{inv.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
