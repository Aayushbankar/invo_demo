"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Clock, AlertTriangle, Sparkles, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceStats } from "@/types/invoice";
import type { AnalyticsData } from "@/types/analytics";

interface StatsCardsProps {
  stats: InvoiceStats | null;
  analytics: AnalyticsData | null;
}

export function StatsCards({ stats, analytics }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Invoices",
      value: stats?.total_invoices ?? 0,
      icon: FileText,
      description: `${stats?.paid_count ?? 0} paid`,
    },
    {
      title: "Revenue",
      value: formatCurrency(stats?.total_revenue ?? 0),
      icon: DollarSign,
      description: "From paid invoices",
    },
    {
      title: "Pending",
      value: formatCurrency(stats?.pending_amount ?? 0),
      icon: Clock,
      description: `${stats?.pending_count ?? 0} awaiting payment`,
    },
    {
      title: "Overdue",
      value: formatCurrency(stats?.overdue_amount ?? 0),
      icon: AlertTriangle,
      description: `${stats?.overdue_count ?? 0} overdue`,
    },
    {
      title: "AI Requests",
      value: analytics?.summary?.total_requests ?? 0,
      icon: Sparkles,
      description: `${(analytics?.summary?.total_tokens ?? 0).toLocaleString()} tokens`,
    },
    {
      title: "AI Cost",
      value: formatCurrency(analytics?.summary?.total_cost ?? 0, "USD"),
      icon: Coins,
      description: `Avg ${(analytics?.summary?.avg_response_time ?? 0).toFixed(0)}ms`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
