"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { InvoiceWithItems } from "@/types/invoice";

export function RecentInvoices() {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*)")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setInvoices((data as InvoiceWithItems[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function getInvoiceTotal(inv: InvoiceWithItems) {
    const subtotal = inv.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    return subtotal + subtotal * ((inv.tax_rate ?? 0) / 100) - (inv.discount ?? 0);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Invoices</CardTitle>
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No invoices yet. Create your first one!
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.customer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(inv.status)} variant="secondary">
                    {inv.status}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(getInvoiceTotal(inv), inv.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
