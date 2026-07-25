"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, Download, Trash2, Eye, Filter } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceWithItems, InvoiceStatus } from "@/types/invoice";

const STATUS_OPTIONS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createClient();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    let query = supabase
      .from("invoices")
      .select("*, items:invoice_items(*)")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`
      );
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setInvoices((data as InvoiceWithItems[]) ?? []);
    setLoading(false);
  }, [search, statusFilter, supabase]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  function getInvoiceTotal(inv: InvoiceWithItems) {
    const subtotal = inv.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    return subtotal + subtotal * ((inv.tax_rate ?? 0) / 100) - (inv.discount ?? 0);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invoice deleted");
      loadInvoices();
    } else {
      toast.error("Failed to delete invoice");
    }
  }

  function handleExportCSV() {
    const headers = ["Invoice #", "Customer", "Date", "Due Date", "Status", "Total", "Currency"];
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      inv.customer_name,
      inv.created_at.split("T")[0],
      inv.due_date ?? "",
      inv.status,
      getInvoiceTotal(inv).toFixed(2),
      inv.currency,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    const data = invoices.map((inv) => ({
      ...inv,
      total: getInvoiceTotal(inv),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="mr-1 h-4 w-4" /> JSON
          </Button>
          <Link href="/invoices/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No invoices found</p>
            <Link href="/invoices/new">
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.customer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={getStatusColor(inv.status)} variant="secondary">
                    {inv.status}
                  </Badge>
                  <div className="text-right min-w-[100px]">
                    <p className="font-semibold">
                      {formatCurrency(getInvoiceTotal(inv), inv.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
