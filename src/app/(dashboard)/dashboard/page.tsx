"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { UsageChart } from "@/components/dashboard/usage-chart";
import type { InvoiceStats } from "@/types/invoice";
import type { AnalyticsData } from "@/types/analytics";

export default function DashboardPage() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          supabase.rpc("get_invoice_stats" as never),
          fetch("/api/analytics"),
        ]);

        // Fallback: compute stats from invoices directly
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: invoices } = await supabase
            .from("invoices")
            .select("*, items:invoice_items(quantity, unit_price)")
            .eq("user_id", user.user.id)
            .order("created_at", { ascending: false });

          if (invoices) {
            let total_revenue = 0,
              pending_amount = 0,
              overdue_amount = 0;
            let paid_count = 0,
              pending_count = 0,
              overdue_count = 0,
              draft_count = 0;

            for (const inv of invoices) {
              const subtotal = (inv.items as { quantity: number; unit_price: number }[]).reduce(
                (s, i) => s + i.quantity * i.unit_price,
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
                default:
                  draft_count++;
              }
            }

            setStats({
              total_invoices: invoices.length,
              total_revenue,
              pending_amount,
              overdue_amount,
              draft_count,
              paid_count,
              pending_count,
              overdue_count: 0,
              cancelled_count: 0,
            });
          }
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your invoices and AI usage
        </p>
      </div>
      <StatsCards stats={stats} analytics={analytics} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInvoices />
        <UsageChart data={analytics?.daily_usage ?? []} />
      </div>
    </div>
  );
}
